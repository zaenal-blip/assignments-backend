import express, { Router } from "express";
import { EventController } from "./event.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

export class EventRouter {
  private router: Router;

  constructor(private eventController: EventController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // Public routes
    this.router.get("/", this.eventController.getEvents);
    this.router.get("/:id", this.eventController.getEventById);

    // Protected routes (organizer only)
    this.router.post(
      "/",
      authenticate,
      authorize("ORGANIZER"),
      this.eventController.createEvent
    );
    this.router.post(
      "/:eventId/vouchers",
      authenticate,
      authorize("ORGANIZER"),
      this.eventController.createVoucher
    );
  };

  getRouter = () => {
    return this.router;
  };
}
