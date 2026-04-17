import { PrismaClient, TaskPriority } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";

export class RegularJobService {
  constructor(private prisma: PrismaClient) {}

  getRegularJobs = async (picId?: number) => {
    return await this.prisma.regularJob.findMany({
      where: picId ? { picId } : {},
      include: {
        pic: { select: { id: true, name: true } },
        tasks: {
          include: { pic: { select: { id: true, name: true } }, activities: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  };

  getRegularJobById = async (id: number) => {
    const job = await this.prisma.regularJob.findUnique({
      where: { id },
      include: { pic: true }
    });
    if (!job) throw new ApiError("Regular activity not found", 404);
    return job;
  };

  createRegularJob = async (name: string, picId: number, category: any, frequency: any, priority: TaskPriority, date: string | null, startTime: string, endTime: string) => {
    return await this.prisma.regularJob.create({
      data: { 
        name, 
        picId, 
        category, 
        frequency,
        priority,
        startTime,
        endTime,
        tasks: {
          create: [{
            name,
            picId,
            sourceType: "REGULAR",
            date,
            startTime,
            endTime,
            priority: priority,
          }]
        }
      },
      include: { tasks: true }
    });
  };

  updateRegularJob = async (id: number, data: any) => {
    const updatedJob = await this.prisma.regularJob.update({
      where: { id },
      data
    });

    // If progress is updated, sync the associated task status
    if (data.progress !== undefined) {
      const taskStatus = data.progress >= 100 ? "DONE" : "TODO";
      await this.prisma.task.updateMany({
        where: { regularJobId: id },
        data: { status: taskStatus, progress: data.progress }
      });
    }

    return updatedJob;
  };

  createRegularTask = async (regularJobId: number, body: any) => {
    return await this.prisma.task.create({
      data: {
        name: body.name,
        picId: body.picId,
        sourceType: "REGULAR",
        regularJobId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        priority: body.priority || "LOW",
        activities: {
          create: body.activities ? body.activities.map((name: string) => ({ name })) : []
        }
      }
    });
  };

  deleteRegularJob = async (id: number) => {
    return await this.prisma.regularJob.delete({
      where: { id }
    });
  };

  /**
   * Daily reset: set all RegularJob progress back to 0 (Pending).
   * Called by the cron job at midnight every day.
   */
  resetAllDailyProgress = async () => {
    const jobs = await this.prisma.regularJob.updateMany({
      where: { progress: { gt: 0 } },
      data: { progress: 0 }
    });
    
    // Also reset all regular tasks to TODO status and 0 progress
    await this.prisma.task.updateMany({
      where: { sourceType: "REGULAR" },
      data: { status: "TODO", progress: 0 }
    });

    return jobs.count;
  };
}
