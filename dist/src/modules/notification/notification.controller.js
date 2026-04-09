import { ApiError } from "../../utils/api-error.js";
export class NotificationController {
    notificationService;
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    getNotifications = async (req, res) => {
        try {
            const user = req.user;
            const query = {
                page: Number(req.query.page) || 1,
                take: Number(req.query.take) || 10,
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "desc",
                isRead: req.query.isRead === "true" ? true : req.query.isRead === "false" ? false : undefined,
            };
            const result = await this.notificationService.getNotifications(user.id, query);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    markAsRead = async (req, res) => {
        try {
            const user = req.user;
            const id = Number(req.params.id);
            const result = await this.notificationService.markAsRead(user.id, id);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    markAllAsRead = async (req, res) => {
        try {
            const user = req.user;
            const result = await this.notificationService.markAllAsRead(user.id);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
}
