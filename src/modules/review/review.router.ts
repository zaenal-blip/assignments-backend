import express, { Router } from "express";
import { ReviewController } from "./review.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

export class ReviewRouter {
  private router: Router;

  constructor(private reviewController: ReviewController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // Public routes
    this.router.get(
      "/events/:eventId/reviews",
      this.reviewController.getEventReviews
    );
    this.router.get(
      "/organizers/:organizerId/profile",
      this.reviewController.getOrganizerProfile
    );

    // Protected routes
    this.router.post(
      "/events/:eventId/reviews",
      authenticate,
      this.reviewController.createReview
    );
  };

  getRouter = () => {
    return this.router;
  };
}
