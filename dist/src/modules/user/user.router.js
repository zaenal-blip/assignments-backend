import express from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
const upload = multer({ storage: multer.memoryStorage() });
export class UserRouter {
    userController;
    router;
    constructor(userController) {
        this.userController = userController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        this.router.get("/me", authenticate, this.userController.getProfile);
        this.router.patch("/me", authenticate, upload.single("avatar"), this.userController.updateProfile);
        this.router.get("/", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.userController.getUsers);
        this.router.get("/:id", authenticate, authorize("LEADER", "SPV", "DPH", "TMMIN"), this.userController.getUser);
        this.router.post("/", authenticate, authorize("TMMIN"), this.userController.createUser);
        this.router.patch("/:id", authenticate, authorize("TMMIN"), this.userController.updateUser);
        this.router.delete("/:id", authenticate, authorize("TMMIN"), this.userController.deleteUser);
    };
    getRouter = () => {
        return this.router;
    };
}
