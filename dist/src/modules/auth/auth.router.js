import express from "express";
import { validate } from "../../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "../../validators/auth.validator.js";
export class AuthRouter {
    authController;
    router;
    constructor(authController) {
        this.authController = authController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        this.router.post("/register", validate(registerSchema), this.authController.register);
        this.router.post("/login", validate(loginSchema), this.authController.login);
    };
    getRouter = () => {
        return this.router;
    };
}
