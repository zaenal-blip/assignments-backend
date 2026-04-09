import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
export class RegularJobRouter {
    regularJobController;
    router;
    constructor(regularJobController) {
        this.regularJobController = regularJobController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        this.router.get("/", authenticate, this.regularJobController.getRegularJobs);
        this.router.post("/", authenticate, this.regularJobController.createRegularJob);
        this.router.put("/:id", authenticate, this.regularJobController.updateRegularJob);
        this.router.post("/:id/tasks", authenticate, this.regularJobController.createRegularTask);
        this.router.delete("/:id", authenticate, this.regularJobController.deleteRegularJob);
    };
    getRouter = () => {
        return this.router;
    };
}
