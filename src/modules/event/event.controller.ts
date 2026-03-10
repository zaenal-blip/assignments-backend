import { Request, Response } from "express";
import { EventService } from "./event.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { GetEventsQuery } from "../../types/event.js";

export class EventController {
  constructor(private eventService: EventService) {}

  getEvents = async (req: Request<{}, {}, {}, GetEventsQuery>, res: Response) => {
    const query = {
      page: Number(req.query.page) || 1,
      take: Number(req.query.take) || 10,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      search: req.query.search,
      category: req.query.category,
      location: req.query.location,
      priceRange: req.query.priceRange,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await this.eventService.getEvents(query);
    res.status(200).send(result);
  };

  getEventById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.eventService.getEventById(id);
    res.status(200).send(result);
  };

  createEvent = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const result = await this.eventService.createEvent(req.user.id, req.body);
    res.status(201).send(result);
  };

  createVoucher = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const eventId = Number(req.params.eventId);
    const result = await this.eventService.createVoucher(eventId, req.user.id, req.body);
    res.status(201).send(result);
  };
}
