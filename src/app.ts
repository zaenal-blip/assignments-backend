import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import { ApiError } from "./utils/api-error.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { UserService } from "./modules/user/user.service.js";
import { EventService } from "./modules/event/event.service.js";
import { TransactionService } from "./modules/transaction/transaction.service.js";
import { ReviewService } from "./modules/review/review.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { UserController } from "./modules/user/user.controller.js";
import { EventController } from "./modules/event/event.controller.js";
import { TransactionController } from "./modules/transaction/transaction.controller.js";
import { ReviewController } from "./modules/review/review.controller.js";
import { AuthRouter } from "./modules/auth/auth.router.js";
import { UserRouter } from "./modules/user/user.router.js";
import { EventRouter } from "./modules/event/event.router.js";
import { TransactionRouter } from "./modules/transaction/transaction.router.js";
import { ReviewRouter } from "./modules/review/review.router.js";

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
    this.app.use(cors());
    this.app.use(express.json());
  };

  private registerModules = () => {
    // shared dependency
    const prismaClient = prisma;

    // services
    const authService = new AuthService(prismaClient);
    const userService = new UserService(prismaClient);
    const eventService = new EventService(prismaClient);
    const transactionService = new TransactionService(prismaClient);
    const reviewService = new ReviewService(prismaClient);

    // controllers
    const authController = new AuthController(authService);
    const userController = new UserController(userService);
    const eventController = new EventController(eventService);
    const transactionController = new TransactionController(transactionService);
    const reviewController = new ReviewController(reviewService);

    // routes
    const authRouter = new AuthRouter(authController);
    const userRouter = new UserRouter(userController);
    const eventRouter = new EventRouter(eventController);
    const transactionRouter = new TransactionRouter(transactionController);
    const reviewRouter = new ReviewRouter(reviewController);

    // entry point
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/users", userRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/", transactionRouter.getRouter()); // Transactions use root-level routes
    this.app.use("/", reviewRouter.getRouter()); // Reviews use root-level routes
  };

  private handleError = () => {
    this.app.use(
      (
        err: ApiError,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
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
