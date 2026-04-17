import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pkg from "pg";
const { Pool } = pkg;

const connectionString = `${process.env.DATABASE_URL}`;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

export { prisma };
