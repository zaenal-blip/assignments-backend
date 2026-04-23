import { PrismaClient, TaskPriority } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";

export class RegularJobService {
  constructor(private prisma: PrismaClient) {}

  getRegularJobs = async (picId?: number) => {
    const jobs = await this.prisma.regularJob.findMany({
      where: picId ? { picId } : {},
      include: {
        pic: { select: { id: true, name: true } },
        tasks: {
          include: { pic: { select: { id: true, name: true } }, activities: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Run self-reset check for each job
    return await this.checkAndResetJobs(jobs);
  };

  /**
   * Checks if jobs need to be reset based on their frequency and last update time.
   * This ensures that "Daily" tasks show as Pending if they haven't been touched today.
   */
  private checkAndResetJobs = async (jobs: any[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of week (Sunday)
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    
    // Start of month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const resetPromises = jobs.map(async (job) => {
      let shouldReset = false;
      const lastUpdate = new Date(job.updatedAt);

      if (job.frequency === "DAILY" && lastUpdate < todayStart) {
        shouldReset = true;
      } else if (job.frequency === "WEEKLY" && lastUpdate < weekStart) {
        shouldReset = true;
      } else if (job.frequency === "MONTHLY" && lastUpdate < monthStart) {
        shouldReset = true;
      }

      if (shouldReset && job.progress > 0) {
        // Reset job progress
        await this.prisma.regularJob.update({
          where: { id: job.id },
          data: { progress: 0 }
        });

        // Reset all associated tasks and activities
        const tasks = await this.prisma.task.findMany({
          where: { regularJobId: job.id },
          select: { id: true }
        });

        const taskIds = tasks.map(t => t.id);

        if (taskIds.length > 0) {
          // Reset tasks
          await this.prisma.task.updateMany({
            where: { id: { in: taskIds } },
            data: { status: "TODO", progress: 0 }
          });

          // Reset activities
          await this.prisma.activity.updateMany({
            where: { taskId: { in: taskIds } },
            data: { completed: false }
          });
        }

        // Return updated job object for the response
        return {
          ...job,
          progress: 0,
          tasks: job.tasks.map((t: any) => ({
            ...t,
            status: "TODO",
            progress: 0,
            activities: t.activities.map((a: any) => ({ ...a, completed: false }))
          }))
        };
      }
      return job;
    });

    return await Promise.all(resetPromises);
  };

  getRegularJobById = async (id: number) => {
    const job = await this.prisma.regularJob.findUnique({
      where: { id },
      include: { pic: true, tasks: { include: { activities: true } } }
    });
    if (!job) throw new ApiError("Regular activity not found", 404);
    
    // Check if single job needs reset
    const [checkedJob] = await this.checkAndResetJobs([job]);
    return checkedJob;
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
      include: { tasks: { include: { activities: true } } }
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
      
      // If progress is reset to 0, reset all activities
      if (data.progress === 0) {
        const tasks = await this.prisma.task.findMany({
          where: { regularJobId: id },
          select: { id: true }
        });
        const taskIds = tasks.map(t => t.id);
        if (taskIds.length > 0) {
          await this.prisma.activity.updateMany({
            where: { taskId: { in: taskIds } },
            data: { completed: false }
          });
        }
      }
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
      where: { frequency: "DAILY", progress: { gt: 0 } },
      data: { progress: 0 }
    });
    
    // Also reset all regular tasks belonging to DAILY jobs
    const dailyJobs = await this.prisma.regularJob.findMany({
      where: { frequency: "DAILY" },
      select: { id: true }
    });
    const dailyJobIds = dailyJobs.map(j => j.id);

    if (dailyJobIds.length > 0) {
      await this.prisma.task.updateMany({
        where: { regularJobId: { in: dailyJobIds } },
        data: { status: "TODO", progress: 0 }
      });

      const dailyTasks = await this.prisma.task.findMany({
        where: { regularJobId: { in: dailyJobIds } },
        select: { id: true }
      });
      const dailyTaskIds = dailyTasks.map(t => t.id);

      if (dailyTaskIds.length > 0) {
        await this.prisma.activity.updateMany({
          where: { taskId: { in: dailyTaskIds } },
          data: { completed: false }
        });
      }
    }

    return jobs.count;
  };
}
