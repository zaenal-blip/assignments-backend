import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
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
        this.router.post("/", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.createRegularJob);
        this.router.put("/:id", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.updateRegularJob);
        this.router.post("/:id/tasks", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.createRegularTask);
        this.router.delete("/:id", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.regularJobController.deleteRegularJob);
    };
    getRouter = () => {
        return this.router;
    };
}
