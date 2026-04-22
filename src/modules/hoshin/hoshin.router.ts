import express, { Router } from "express";
import { HoshinController } from "./hoshin.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

export class HoshinRouter {
  private router: Router;

  constructor(private hoshinController: HoshinController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // GET — all authenticated users (for dropdown lookup)
    this.router.get("/", authenticate, this.hoshinController.getAll);
    this.router.get("/:id", authenticate, this.hoshinController.getById);

    // CUD — TMMIN (super admin) only
    this.router.post(
      "/",
      authenticate,
      authorize("TMMIN"),
      this.hoshinController.create
    );
    this.router.put(
      "/:id",
      authenticate,
      authorize("TMMIN"),
      this.hoshinController.update
    );
    this.router.delete(
      "/:id",
      authenticate,
      authorize("TMMIN"),
      this.hoshinController.delete
    );
  };

  getRouter = () => {
    return this.router;
  };
}
