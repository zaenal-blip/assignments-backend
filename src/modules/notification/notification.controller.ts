import { Request, Response } from "express";
import { NotificationService } from "./notification.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/api-error.js";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const query = {
        page: Number(req.query.page) || 1,
        take: Number(req.query.take) || 10,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as string) || "desc",
        isRead: req.query.isRead === "true" ? true : req.query.isRead === "false" ? false : undefined,
      };
      const result = await this.notificationService.getNotifications(user.id, query);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  markAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const id = Number(req.params.id);
      const result = await this.notificationService.markAsRead(user.id, id);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const result = await this.notificationService.markAllAsRead(user.id);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };
}
