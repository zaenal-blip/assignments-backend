import { PrismaClient, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { CreateEventBody, GetEventsQuery } from "../../types/event.js";
import { sendEmailNotification } from "../../lib/mail.js";

export class EventService {
  constructor(private prisma: PrismaClient) {}

  getEvents = async (query: GetEventsQuery) => {
    const { page, take, search, startDate, endDate } = query;

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.startDate = {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      };
    }

    const events = await this.prisma.event.findMany({
      where,
      take,
      skip: (page - 1) * take,
      include: {
        pic: {
          select: { id: true, name: true }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { startDate: "asc" }
    });

    const total = await this.prisma.event.count({ where });

    return {
      data: events,
      meta: { page, take, total }
    };
  };

  getEventById = async (id: number) => {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        pic: { select: { id: true, name: true } },
        tasks: {
          include: {
            pic: { select: { id: true, name: true } },
            activities: true,
          }
        }
      }
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    // Process event details (tasks completed, remaining, issues, etc.)
    const completedTasks = event.tasks.filter((t: any) => t.status === "DONE").length;
    const remainingTasks = event.tasks.length - completedTasks;
    
    // In a real scenario, "issues" might be a separate field or derived from task notes. 
    // For now, we'll return the summary as requested.
    return {
      ...event,
      summary: {
        completedTasks,
        remainingTasks,
        issues: "None reported", // Placeholder as per design requirements
      }
    };
  };

  createEvent = async (body: CreateEventBody) => {
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const event = await tx.event.create({
        data: {
          name: body.name,
          picId: body.picId,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
        }
      });

      if (body.tasks && body.tasks.length > 0) {
        for (const taskData of body.tasks) {
          await tx.task.create({
            data: {
              name: taskData.name,
              picId: taskData.picId,
              sourceType: "EVENT",
              eventId: event.id,
              activities: {
                create: taskData.activities.map((name) => ({ name }))
              }
            }
          });
        }
      }

      const picUser = await tx.user.findUnique({
        where: { id: body.picId }
      });

      if (picUser?.email) {
        const subject = `Assigned to Event: ${event.name}`;
        const message = `You have been assigned as PIC for the event ${event.name}. Please check the system for details.`;
        await sendEmailNotification(picUser.email, subject, message);
        await tx.notification.create({
          data: {
            userId: picUser.id,
            message: `You have been assigned to event ${event.name}.`,
            type: "EVENT_ASSIGNMENT"
          }
        });
      }

      return event;
    });
  };

  updateEvent = async (id: number, body: Partial<CreateEventBody>) => {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        name: body.name,
        picId: body.picId,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      }
    });

    if (body.picId && body.picId !== event.picId) {
      const picUser = await this.prisma.user.findUnique({ where: { id: body.picId } });
      if (picUser?.email) {
        const subject = `Assigned to Event: ${updatedEvent.name}`;
        const message = `You have been assigned as PIC for the event ${updatedEvent.name}. Please check the system for details.`;
        await sendEmailNotification(picUser.email, subject, message);
        await this.prisma.notification.create({
          data: {
            userId: picUser.id,
            message: `You have been assigned to event ${updatedEvent.name}.`,
            type: "EVENT_ASSIGNMENT"
          }
        });
      }
    }

    return updatedEvent;
  };

  deleteEvent = async (id: number) => {
    return await this.prisma.event.delete({
      where: { id }
    });
  };
}
