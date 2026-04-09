import { ApiError } from "../../utils/api-error.js";
export class EventController {
    eventService;
    constructor(eventService) {
        this.eventService = eventService;
    }
    getEvents = async (req, res) => {
        try {
            const query = {
                page: Number(req.query.page) || 1,
                take: Number(req.query.take) || 10,
                sortBy: req.query.sortBy || "startDate",
                sortOrder: req.query.sortOrder || "asc",
                search: req.query.search,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await this.eventService.getEvents(query);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    getEventById = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const result = await this.eventService.getEventById(id);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    createEvent = async (req, res) => {
        try {
            const result = await this.eventService.createEvent(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    updateEvent = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const result = await this.eventService.updateEvent(id, req.body);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    deleteEvent = async (req, res) => {
        try {
            const id = Number(req.params.id);
            await this.eventService.deleteEvent(id);
            res.status(200).json({ message: "Event deleted successfully" });
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
}
