import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
export class TaskRouter {
    taskController;
    router;
    constructor(taskController) {
        this.taskController = taskController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        this.router.get("/", authenticate, this.taskController.getTasks);
        this.router.get("/:id", authenticate, this.taskController.getTaskById);
        // Update activity status (Only authenticated users, PIC check in service)
        this.router.patch("/:id/activities", authenticate, this.taskController.updateActivityStatus);
        // Assign task (Leader, SPV, DPH only)
        this.router.patch("/:id/assign", authenticate, authorize("LEADER", "SPV", "DPH"), this.taskController.assignTask);
        // Create a new general task (Leader, SPV, DPH only)
        this.router.post("/", authenticate, authorize("LEADER", "SPV", "DPH"), this.taskController.createTask);
    };
    getRouter = () => {
        return this.router;
    };
}
