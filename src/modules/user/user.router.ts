import express, { Router } from "express";
import multer from "multer";
import path from "path";
import { UserController } from "./user.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage() });

export class UserRouter {
  private router: Router;

  constructor(private userController: UserController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.get("/me", authenticate, this.userController.getProfile as any);
    this.router.patch("/me", authenticate, upload.single("avatar"), this.userController.updateProfile as any);
    this.router.get("/", this.userController.getUsers);
    this.router.get("/:id", this.userController.getUser);
    this.router.post("/", this.userController.createUser);
    this.router.patch("/:id", this.userController.updateUser);
    this.router.delete("/:id", this.userController.deleteUser);
  };

  getRouter = () => {
    return this.router;
  };
}