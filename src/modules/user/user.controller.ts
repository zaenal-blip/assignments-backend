import { Request, Response } from "express";
import fs from "fs";
import { UserService } from "./user.service.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { cloudinaryUpload } from "../../lib/cloudinary.js";

export class UserController {
  constructor(private userService: UserService) {}

  getUsers = async (req: Request, res: Response) => {
    const query = {
      page: parseInt(req.query.page as string) || 1,
      take: parseInt(req.query.take as string) || 3,
      sortOrder: (req.query.sortOrder as string) || "desc",
      sortBy: (req.query.sortBy as string) || "createdAt",
      search: (req.query.search as string) || "",
    };
    const result = await this.userService.getUsers(query);
    res.status(200).send(result);
  };

  getUser = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.userService.getUser(id);
    res.status(200).send(result);
  };

  createUser = async (req: Request, res: Response) => {
    const body = req.body;
    const result = await this.userService.createUser(body);
    res.status(200).send(result);
  };

  updateUser = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const body = req.body;
    const result = await this.userService.updateUser(id, body);
    res.status(200).send(result);
  };

  deleteUser = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.userService.deleteUser(id);
    res.status(200).send(result);
  };

  getProfile = async (req: AuthRequest, res: Response) => {
    const id = req.user!.id;
    const result = await this.userService.getUser(id);
    res.status(200).send(result);
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    const id = req.user!.id;
    const body = { ...req.body };

    console.log("[UpdateProfile] Request for user ID:", id);
    if (req.file) {
      console.log("[UpdateProfile] File received:", req.file);
      try {
        console.log("[UpdateProfile] Uploading to Cloudinary...");
        const imageUrl = await cloudinaryUpload(req.file.path);
        console.log("[UpdateProfile] Cloudinary upload success:", imageUrl);
        body.avatar = imageUrl;

        // Delete local temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("[UpdateProfile] Local temp file deleted");
        }
      } catch (error: any) {
        console.error("[UpdateProfile] Cloudinary error:", error);
        // Still clean up if upload fails
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("[UpdateProfile] Local temp file cleaned up after error");
        }
        throw error;
      }
    }

    try {
      console.log("[UpdateProfile] Updating user in DB with data:", body);
      const result = await this.userService.updateProfile(id, body);
      console.log("[UpdateProfile] DB update success");
      res.status(200).send(result);
    } catch (error: any) {
      console.error("[UpdateProfile] DB error:", error);
      throw error;
    }
  };
}