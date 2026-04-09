import { Request, Response } from "express";
import { EventService } from "./event.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/api-error.js";

export class EventController {
  constructor(private eventService: EventService) {}

  getEvents = async (req: Request, res: Response) => {
    try {
      const query = {
        page: Number(req.query.page) || 1,
        take: Number(req.query.take) || 10,
        sortBy: (req.query.sortBy as string) || "startDate",
        sortOrder: (req.query.sortOrder as string) || "asc",
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await this.eventService.getEvents(query);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  getEventById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.eventService.getEventById(id);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  createEvent = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.eventService.createEvent(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  updateEvent = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.eventService.updateEvent(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  deleteEvent = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.eventService.deleteEvent(id);
      res.status(200).json({ message: "Event deleted successfully" });
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };
}
