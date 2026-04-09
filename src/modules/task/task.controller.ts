import { Request, Response } from "express";
import { TaskService } from "./task.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/api-error.js";

export class TaskController {
  constructor(private taskService: TaskService) {}

  getTasks = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const sourceType = req.query.sourceType as any;
      let picId = req.query.picId ? Number(req.query.picId) : undefined;

      // Force filter for members on certain source types
      if (user.role === "MEMBER" && (sourceType === "REGULAR" || sourceType === "PERSONAL")) {
        picId = user.id;
      }

      const query = {
        page: Number(req.query.page) || 1,
        take: Number(req.query.take) || 10,
        sourceType,
        picId,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as string) || "desc",
      };

      const result = await this.taskService.getTasks(query);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  getTaskById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.taskService.getTaskById(id);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  updateActivityStatus = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const picId = req.user!.id;
      const role = req.user!.role;
      const result = await this.taskService.updateActivityStatus(id, picId, role, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  assignTask = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.taskService.assignTask(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  createTask = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.taskService.createTask(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };
}
