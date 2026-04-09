import express from "express";
import cors from "cors";
import path from "path";
import { prisma } from "./lib/prisma.js";
import { ApiError } from "./utils/api-error.js";
import { authenticate } from "./middleware/auth.middleware.js";

// Import New Modules
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthRouter } from "./modules/auth/auth.router.js";

import { EventService } from "./modules/event/event.service.js";
import { EventController } from "./modules/event/event.controller.js";
import { EventRouter } from "./modules/event/event.router.js";

import { ProjectService } from "./modules/project/project.service.js";
import { ProjectController } from "./modules/project/project.controller.js";
import { ProjectRouter } from "./modules/project/project.router.js";

import { UserService } from "./modules/user/user.service.js";
import { UserController } from "./modules/user/user.controller.js";
import { UserRouter } from "./modules/user/user.router.js";

import { TaskService } from "./modules/task/task.service.js";
import { TaskController } from "./modules/task/task.controller.js";
import { TaskRouter } from "./modules/task/task.router.js";

import { RegularJobService } from "./modules/regular-job/regular-job.service.js";
import { RegularJobController } from "./modules/regular-job/regular-job.controller.js";
import { RegularJobRouter } from "./modules/regular-job/regular-job.router.js";
import { NotificationService } from "./modules/notification/notification.service.js";
import { NotificationController } from "./modules/notification/notification.controller.js";
import { NotificationRouter } from "./modules/notification/notification.router.js";

import { PersonalJobController } from "./modules/task/personal-job.controller.js";

const PORT = 8000;

export class App {
  app: express.Express;

  constructor() {
    this.app = express();
    this.configure();
    this.registerModules();
    this.handleError();
  }

  private configure = () => {
    // 1. CORS MUST BE FIRST
    const corsOptions = {
      origin: [
        "https://assignment-tps.tmmin.online",
        "http://localhost:5173",
        "http://localhost:3000"
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204
    };

    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions)); // Explicitly handle OPTIONS for all routes

    this.app.use(express.json());
    this.app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  };

  private registerModules = () => {
    const prismaClient = prisma;

    // Services
    const authService = new AuthService(prismaClient);
    const eventService = new EventService(prismaClient);
    const projectService = new ProjectService(prismaClient);
    const taskService = new TaskService(prismaClient);
    const regularJobService = new RegularJobService(prismaClient);
    const notificationService = new NotificationService(prismaClient);

    // Controllers
    const authController = new AuthController(authService);
    const eventController = new EventController(eventService);
    const projectController = new ProjectController(projectService);
    const taskController = new TaskController(taskService);
    const regularJobController = new RegularJobController(regularJobService);
    const notificationController = new NotificationController(notificationService);
    const personalJobController = new PersonalJobController(taskService);

    const userService = new UserService(prismaClient);
    const userController = new UserController(userService);
    const userRouter = new UserRouter(userController);

    // Routers
    const authRouter = new AuthRouter(authController);
    const eventRouter = new EventRouter(eventController);
    const projectRouter = new ProjectRouter(projectController);
    const taskRouter = new TaskRouter(taskController);
    const regularJobRouter = new RegularJobRouter(regularJobController);
    const notificationRouter = new NotificationRouter(notificationController);

    // Manual Personal Job Router Setup (Simplification)
    const personalJobRouter = express.Router();
    personalJobRouter.use(authenticate);
    personalJobRouter.get("/", (req, res) => personalJobController.getPersonalJobs(req as any, res));
    personalJobRouter.post("/", (req, res) => personalJobController.createPersonalJob(req as any, res));
    personalJobRouter.put("/:id", (req, res) => personalJobController.updatePersonalJob(req as any, res));
    personalJobRouter.delete("/:id", (req, res) => personalJobController.deletePersonalJob(req as any, res));

    // Mounting
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/projects", projectRouter.getRouter());
    this.app.use("/tasks", taskRouter.getRouter());
    this.app.use("/regular-jobs", regularJobRouter.getRouter());
    this.app.use("/notifications", notificationRouter.getRouter());
    this.app.use("/users", userRouter.getRouter());
    this.app.use("/personal-jobs", personalJobRouter);
  };

  private handleError = () => {
    this.app.use(
      (
        err: ApiError,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        console.error("[Global Error Handler]", err);
        const message = err.message || "Something went wrong!";
        const status = err.status || 500;
        res.status(status).send({ message });
      },
    );

    this.app.use((req: express.Request, res: express.Response) => {
      res.status(404).send({ message: "Route not found" });
    });
  };

  start() {
    this.app.listen(PORT, () => {
      console.log(`Server running on port : ${PORT}`);
    });
  }
}
