import { PrismaClient, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { GetNotificationsQuery } from "../../types/notification.js";

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  getNotifications = async (userId: number, query: GetNotificationsQuery) => {
    const { page, take, isRead } = query;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (typeof isRead === "boolean") {
      where.isRead = isRead;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      take,
      skip: (page - 1) * take,
      orderBy: { createdAt: "desc" },
    });

    const total = await this.prisma.notification.count({ where });

    return {
      data: notifications,
      meta: { page, take, total },
    };
  };

  markAsRead = async (userId: number, notificationId: number) => {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new ApiError("Notification not found", 404);
    }

    return await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  };

  markAllAsRead = async (userId: number) => {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: "All notifications marked as read" };
  };
}
