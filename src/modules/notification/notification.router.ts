import express, { Router } from "express";
import { NotificationController } from "./notification.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

export class NotificationRouter {
  private router: Router;

  constructor(private notificationController: NotificationController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.get("/", authenticate, this.notificationController.getNotifications);
    this.router.patch("/:id/read", authenticate, this.notificationController.markAsRead);
    this.router.patch("/read-all", authenticate, this.notificationController.markAllAsRead);
  };

  getRouter = () => {
    return this.router;
  };
}
