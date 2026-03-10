import express, { Router } from "express";
import { TransactionController } from "./transaction.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

export class TransactionRouter {
  private router: Router;

  constructor(private transactionController: TransactionController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // Customer routes
    this.router.post(
      "/events/:eventId/transactions",
      authenticate,
      this.transactionController.createTransaction
    );
    this.router.get(
      "/me/transactions",
      authenticate,
      this.transactionController.getMyTransactions
    );
    this.router.get(
      "/transactions/:id",
      authenticate,
      this.transactionController.getTransactionById
    );
    this.router.put(
      "/transactions/:id/payment-proof",
      authenticate,
      this.transactionController.uploadPaymentProof
    );

    // Organizer routes
    this.router.put(
      "/transactions/:id/confirm",
      authenticate,
      authorize("ORGANIZER"),
      this.transactionController.confirmTransaction
    );
    this.router.put(
      "/transactions/:id/reject",
      authenticate,
      authorize("ORGANIZER"),
      this.transactionController.rejectTransaction
    );
  };

  getRouter = () => {
    return this.router;
  };
}
