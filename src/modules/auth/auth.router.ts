import { AuthController } from "./auth.controller.js";
import express, { Router } from "express";
import { validate } from "../../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "../../validators/auth.validator.js";

export class AuthRouter {
  private router: Router;
  constructor(private authController: AuthController) {
    this.router = express.Router();
    this.initRoutes();
  }
  private initRoutes = () => {
    this.router.post("/register", validate(registerSchema), this.authController.register);
    this.router.post("/login", validate(loginSchema), this.authController.login);
  };
  getRouter = () => {
    return this.router;
  };
}
