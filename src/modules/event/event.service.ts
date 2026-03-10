import { PrismaClient, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { CreateEventBody, GetEventsQuery, CreateVoucherBody } from "../../types/event.js";

export class EventService {
  constructor(private prisma: PrismaClient) {}

  getEvents = async (query: GetEventsQuery) => {
    const { page, take, sortBy, sortOrder, search, category, location, priceRange, startDate, endDate } = query;

    const whereClause: Prisma.EventWhereInput = {
      status: "PUBLISHED",
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category) {
      whereClause.category = category;
    }

    // Location filter
    if (location) {
      whereClause.location = location;
    }

    // Price range filter (free/paid)
    if (priceRange === "free") {
      whereClause.ticketTypes = {
        some: {
          price: 0,
        },
      };
    } else if (priceRange === "paid") {
      whereClause.ticketTypes = {
        some: {
          price: { gt: 0 },
        },
      };
    }

    // Date filters
    if (startDate) {
      whereClause.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      whereClause.endDate = { lte: new Date(endDate) };
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      include: {
        organizer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        ticketTypes: true,
        vouchers: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            usedCount: { lt: Prisma.sql`usage_limit` },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: take,
      skip: (page - 1) * take,
      orderBy: { [sortBy]: sortOrder },
    });

    // Calculate organizer rating from reviews
    const eventsWithRating = await Promise.all(
      events.map(async (event) => {
        const reviews = await this.prisma.review.findMany({
          where: { eventId: event.id },
          select: { rating: true },
        });

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          ...event,
          organizer: {
            ...event.organizer,
            rating: avgRating,
            totalReviews: reviews.length,
          },
        };
      })
    );

    const total = await this.prisma.event.count({ where: whereClause });

    return {
      data: eventsWithRating,
      meta: { page, take, total },
    };
  };

  getEventById = async (id: number) => {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        ticketTypes: true,
        vouchers: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            usedCount: { lt: Prisma.sql`usage_limit` },
          },
        },
      },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    // Calculate organizer rating
    const reviews = await this.prisma.review.findMany({
      where: { eventId: event.id },
      select: { rating: true },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      ...event,
      organizer: {
        ...event.organizer,
        rating: avgRating,
        totalReviews: reviews.length,
      },
    };
  };

  createEvent = async (organizerId: number, body: CreateEventBody) => {
    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (endDate < startDate) {
      throw new ApiError("End date must be after start date", 400);
    }

    if (startDate < new Date()) {
      throw new ApiError("Start date must be in the future", 400);
    }

    // Find organizer
    const organizer = await this.prisma.organizer.findUnique({
      where: { userId: organizerId },
    });

    if (!organizer) {
      throw new ApiError("Organizer not found", 404);
    }

    // Create event with ticket types in transaction
    const event = await this.prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          organizerId: organizer.id,
          title: body.title,
          description: body.description,
          image: body.image,
          category: body.category,
          location: body.location,
          venue: body.venue,
          startDate,
          endDate,
          status: "DRAFT",
          ticketTypes: {
            create: body.ticketTypes.map((tt) => ({
              name: tt.name,
              description: tt.description,
              price: tt.price,
              totalSeat: tt.totalSeat,
              availableSeat: tt.totalSeat,
            })),
          },
        },
        include: {
          ticketTypes: true,
        },
      });

      // Update organizer totalEvents
      await tx.organizer.update({
        where: { id: organizer.id },
        data: {
          totalEvents: { increment: 1 },
        },
      });

      return newEvent;
    });

    return event;
  };

  createVoucher = async (eventId: number, organizerId: number, body: CreateVoucherBody) => {
    // Verify event belongs to organizer
    const organizer = await this.prisma.organizer.findUnique({
      where: { userId: organizerId },
    });

    if (!organizer) {
      throw new ApiError("Organizer not found", 404);
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    if (event.organizerId !== organizer.id) {
      throw new ApiError("You don't have permission to create voucher for this event", 403);
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (endDate < startDate) {
      throw new ApiError("End date must be after start date", 400);
    }

    // Check if voucher code already exists for this event
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: {
        eventId_code: {
          eventId,
          code: body.code,
        },
      },
    });

    if (existingVoucher) {
      throw new ApiError("Voucher code already exists for this event", 400);
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        eventId,
        code: body.code,
        discountAmount: body.discountAmount,
        discountType: body.discountType,
        startDate,
        endDate,
        usageLimit: body.usageLimit,
      },
    });

    return voucher;
  };
}
