import { TransactionService } from "../modules/transaction/transaction.service.js";
import { PrismaClient } from "@prisma/client";

/**
 * Cron job functions for auto-expiring and auto-cancelling transactions
 * 
 * Usage:
 * - Set up a cron job (e.g., using node-cron) to call these functions periodically
 * - Example: Run expireTransactions() every 5 minutes
 * - Example: Run cancelTransactions() every hour
 */

export class TransactionJobs {
  private transactionService: TransactionService;

  constructor(prisma: PrismaClient) {
    this.transactionService = new TransactionService(prisma);
  }

  /**
   * Auto-expire transactions that haven't uploaded payment proof within 2 hours
   * Should be run every 5-10 minutes
   */
  expireTransactions = async () => {
    try {
      const count = await this.transactionService.expireTransactions();
      console.log(`[TransactionJobs] Expired ${count} transactions`);
      return count;
    } catch (error) {
      console.error("[TransactionJobs] Error expiring transactions:", error);
      throw error;
    }
  };

  /**
   * Auto-cancel transactions that haven't been confirmed/rejected within 3 days
   * Should be run every hour
   */
  cancelTransactions = async () => {
    try {
      const count = await this.transactionService.cancelTransactions();
      console.log(`[TransactionJobs] Cancelled ${count} transactions`);
      return count;
    } catch (error) {
      console.error("[TransactionJobs] Error cancelling transactions:", error);
      throw error;
    }
  };
}

// Example usage with node-cron (install: npm install node-cron @types/node-cron)
/*
import cron from "node-cron";
import { prisma } from "./lib/prisma.js";

const transactionJobs = new TransactionJobs(prisma);

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  await transactionJobs.expireTransactions();
});

// Run every hour
cron.schedule("0 * * * *", async () => {
  await transactionJobs.cancelTransactions();
});
*/
