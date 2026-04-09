import { Request, Response } from "express";
import { ProjectService } from "./project.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/api-error.js";

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  getProjects = async (req: Request, res: Response) => {
    try {
      const query = {
        page: Number(req.query.page) || 1,
        take: Number(req.query.take) || 10,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as string) || "desc",
      };

      const result = await this.projectService.getProjects(query);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  getProjectById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.projectService.getProjectById(id);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  createProject = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.projectService.createProject(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  updateProject = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.projectService.updateProject(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  deleteProject = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.projectService.deleteProject(id);
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };
}
