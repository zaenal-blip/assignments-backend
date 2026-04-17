-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RegularCategory" AS ENUM ('SAFETY', 'QUALITY', 'MAINTENANCE', 'FIVE_S', 'ENVIRONMENT');

-- CreateEnum
CREATE TYPE "RegularFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "regular_jobs" ADD COLUMN     "category" "RegularCategory" NOT NULL DEFAULT 'SAFETY',
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "frequency" "RegularFrequency" NOT NULL DEFAULT 'DAILY',
ADD COLUMN     "startTime" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "date" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "startTime" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT;
