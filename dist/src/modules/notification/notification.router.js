import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
export class NotificationRouter {
    notificationController;
    router;
    constructor(notificationController) {
        this.notificationController = notificationController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        this.router.get("/", authenticate, this.notificationController.getNotifications);
        this.router.patch("/:id/read", authenticate, this.notificationController.markAsRead);
        this.router.patch("/read-all", authenticate, this.notificationController.markAllAsRead);
    };
    getRouter = () => {
        return this.router;
    };
}
