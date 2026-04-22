import express, { Router } from "express";
import { RegularJobController } from "./regular-job.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

export class RegularJobRouter {
  private router: Router;

  constructor(private regularJobController: RegularJobController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.get("/", authenticate, this.regularJobController.getRegularJobs);
    this.router.post("/", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.createRegularJob);
    this.router.put("/:id", authenticate, authorize("MEMBER", "LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.updateRegularJob);
    this.router.post("/:id/tasks", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.createRegularTask);
    this.router.delete("/:id", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.deleteRegularJob);
  };

  getRouter = () => {
    return this.router;
  };
}
