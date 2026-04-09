import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
export class EventRouter {
    eventController;
    router;
    constructor(eventController) {
        this.eventController = eventController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        // Basic routes for all users
        this.router.get("/", authenticate, this.eventController.getEvents);
        this.router.get("/:id", authenticate, this.eventController.getEventById);
        // Management routes (Leader, SPV, DPH only)
        this.router.post("/", authenticate, authorize("LEADER", "SPV", "DPH"), this.eventController.createEvent);
        this.router.put("/:id", authenticate, authorize("LEADER", "SPV", "DPH"), this.eventController.updateEvent);
        this.router.delete("/:id", authenticate, authorize("LEADER", "SPV", "DPH"), this.eventController.deleteEvent);
    };
    getRouter = () => {
        return this.router;
    };
}
