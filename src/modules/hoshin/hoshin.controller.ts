import { Request, Response } from "express";
import { HoshinService } from "./hoshin.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/api-error.js";

export class HoshinController {
  constructor(private hoshinService: HoshinService) {}

  getAll = async (_req: Request, res: Response) => {
    try {
      const result = await this.hoshinService.getAll();
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.hoshinService.getById(id);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const { code, cluster, subCluster, actionPlan, target } = req.body;
      if (!code || !cluster || !actionPlan) {
        throw new ApiError("code, cluster, and actionPlan are required", 400);
      }
      const result = await this.hoshinService.create({
        code,
        cluster,
        subCluster,
        actionPlan,
        target,
      });
      res.status(201).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.hoshinService.update(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.hoshinService.delete(id);
      res.status(200).json({ message: "KPI Hoshin deleted successfully" });
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      res.status(status).json({ message: error.message });
    }
  };
}
