import express, { Router } from "express";
import multer from "multer";
import path from "path";
import { UserController } from "./user.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("[Multer] Uploading file to destination: uploads/");
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fname = file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
    console.log("[Multer] Generated filename:", fname);
    cb(null, fname);
  },
});

const upload = multer({ storage });

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