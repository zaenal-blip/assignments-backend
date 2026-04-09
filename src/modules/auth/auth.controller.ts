import { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { ApiError } from "../../utils/api-error.js";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 500;
      console.error("[Register Error]", error);
      res.status(status).json({ message: error.message || "Registration failed" });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error instanceof ApiError ? error.status : 401;
      res.status(status).json({ message: error.message });
    }
  };
}
