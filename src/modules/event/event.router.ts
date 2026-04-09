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
    // Basic routes for all users
    this.router.get("/", authenticate, this.eventController.getEvents);
    this.router.get("/:id", authenticate, this.eventController.getEventById);

    // Management routes (Leader, SPV, DPH only)
    this.router.post(
      "/",
      authenticate,
      authorize("LEADER", "SPV", "DPH"),
      this.eventController.createEvent
    );
    this.router.put(
      "/:id",
      authenticate,
      authorize("LEADER", "SPV", "DPH"),
      this.eventController.updateEvent
    );
    this.router.delete(
      "/:id",
      authenticate,
      authorize("LEADER", "SPV", "DPH"),
      this.eventController.deleteEvent
    );
  };

  getRouter = () => {
    return this.router;
  };
}
