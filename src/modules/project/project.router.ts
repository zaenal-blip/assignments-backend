import express, { Router } from "express";
import { ProjectController } from "./project.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

export class ProjectRouter {
  private router: Router;

  constructor(private projectController: ProjectController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // All roles can CRUD projects
    this.router.get("/", authenticate, this.projectController.getProjects);
    this.router.get("/:id", authenticate, this.projectController.getProjectById);
    this.router.post(
      "/",
      authenticate,
      authorize("LEADER", "SPV", "DPH", "TMMIN"),
      this.projectController.createProject
    );
    this.router.put(
      "/:id",
      authenticate,
      authorize("LEADER", "SPV", "DPH", "TMMIN"),
      this.projectController.updateProject
    );
    this.router.delete(
      "/:id",
      authenticate,
      authorize("LEADER", "SPV", "DPH", "TMMIN"),
      this.projectController.deleteProject
    );
  };

  getRouter = () => {
    return this.router;
  };
}
