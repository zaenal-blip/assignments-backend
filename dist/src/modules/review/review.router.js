import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
export class ReviewRouter {
    reviewController;
    router;
    constructor(reviewController) {
        this.reviewController = reviewController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        // Public routes
        this.router.get("/events/:eventId/reviews", this.reviewController.getEventReviews);
        this.router.get("/organizers/:organizerId/profile", this.reviewController.getOrganizerProfile);
        // Protected routes
        this.router.post("/events/:eventId/reviews", authenticate, this.reviewController.createReview);
    };
    getRouter = () => {
        return this.router;
    };
}
