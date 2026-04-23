import { PrismaClient, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { UpdateTaskProgressBody, AssignTaskBody, GetTasksQuery } from "../../types/task.js";
import { sendEmailNotification } from "../../lib/mail.js";
import { NotificationService } from "../notification/email-notification.service.js";

export class TaskService {
  constructor(private prisma: PrismaClient) {}

  getTasks = async (query: GetTasksQuery) => {
    const { page, take, sourceType, picId } = query;

    const where: Prisma.TaskWhereInput = {};
    if (sourceType) where.sourceType = sourceType;
    if (picId) where.picId = picId;

    const tasks = await this.prisma.task.findMany({
      where,
      take,
      skip: (page - 1) * take,
      include: {
        pic: { select: { id: true, name: true } },
        activities: true,
        event: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        regularJob: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Run self-reset check for regular tasks
    const checkedTasks = await this.checkAndResetTasks(tasks);

    // Calculate progress for each task
    const tasksWithProgress = checkedTasks.map((task: any) => {
      const totalActivities = task.activities.length;
      const completedActivities = task.activities.filter((a: any) => a.completed).length;
      const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : (task.progress || 0);

      return {
        ...task,
        progress: Math.round(progress),
      };
    });

    const total = await this.prisma.task.count({ where });

    return {
      data: tasksWithProgress,
      meta: { page, take, total }
    };
  };

  /**
   * Specifically for regular tasks, check if they need reset based on frequency
   */
  private checkAndResetTasks = async (tasks: any[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const resetPromises = tasks.map(async (task) => {
      if (task.sourceType !== "REGULAR" || !task.regularJob) return task;

      const job = task.regularJob;
      let shouldReset = false;
      const lastUpdate = new Date(task.updatedAt);

      if (job.frequency === "DAILY" && lastUpdate < todayStart) {
        shouldReset = true;
      } else if (job.frequency === "WEEKLY" && lastUpdate < weekStart) {
        shouldReset = true;
      } else if (job.frequency === "MONTHLY" && lastUpdate < monthStart) {
        shouldReset = true;
      }

      if (shouldReset && (task.progress > 0 || task.status !== "TODO")) {
        // Reset task in DB
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: "TODO", progress: 0 }
        });

        // Reset activities in DB
        await this.prisma.activity.updateMany({
          where: { taskId: task.id },
          data: { completed: false }
        });

        // Update parent job progress if all its tasks were reset (optional but good for consistency)
        // For now, just return reset task object
        return {
          ...task,
          status: "TODO",
          progress: 0,
          activities: task.activities.map((a: any) => ({ ...a, completed: false }))
        };
      }
      return task;
    });

    return await Promise.all(resetPromises);
  };

  getTaskById = async (id: number) => {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        pic: { select: { id: true, name: true } },
        activities: true,
        event: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        regularJob: { select: { id: true, name: true } }
      }
    });

    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    const totalActivities = task.activities.length;
    const completedActivities = task.activities.filter((a: any) => a.completed).length;
    const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : (task.progress || 0);

    return {
      ...task,
      progress: Math.round(progress),
    };
  };

  updateActivityStatus = async (
    taskId: number,
    picId: number,
    userRole: string,
    body: UpdateTaskProgressBody
  ) => {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { activities: true, pic: true }
    });

    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    const canUpdate = task.picId === picId || ["LEADER", "SPV", "DPH", "TMMIN"].includes(userRole);
    if (!canUpdate) {
      throw new ApiError("You are not allowed to update this task", 403);
    }

    const activity = task.activities.find((a: any) => a.id === body.activityId);
    if (!activity) {
      throw new ApiError("Activity not found for this task", 404);
    }

    await this.prisma.activity.update({
      where: { id: body.activityId },
      data: { completed: body.isCompleted }
    });

    const updatedTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { activities: true }
    });

    const totalActivities = updatedTask?.activities.length ?? 0;
    const completedActivities = updatedTask?.activities.filter((a: any) => a.completed).length ?? 0;
    const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    const allCompleted = updatedTask?.activities.every((a: any) => a.completed);
    const nextStatus = allCompleted ? "DONE" : "IN_PROGRESS";
    const previousStatus = task.status;

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: nextStatus,
        progress: Math.round(progress)
      }
    });

    if (nextStatus === "DONE" && previousStatus !== "DONE") {
      const superiors = await this.prisma.user.findMany({
        where: { role: { in: ["LEADER", "SPV", "DPH"] } }
      });
      
      // Exclude the user who completed the task from the broadcast
      const recipients = superiors.filter(sup => sup.id !== picId);

      if (recipients.length > 0) {
        await this.prisma.notification.createMany({
          data: recipients.map(sup => ({
            userId: sup.id,
            message: `Task "${task.name}" has been fully completed by ${task.pic?.name || "Member"}.`,
            type: "TASK_COMPLETION",
            targetId: taskId,
            targetType: "TASK"
          }))
        });
      }
    }

    return { message: "Task progress updated successfully", progress: Math.round(progress) };
  };

  assignTask = async (taskId: number, body: AssignTaskBody, currentUserId: number) => {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { picId: body.picId },
      include: {
        pic: { select: { id: true, name: true, email: true, noHp: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } }
      }
    });

    // Only send notifications if assigning to someone else
    if (task.picId !== currentUserId) {
      // Decentralized Notification Trigger (Email active)
      if (task.pic) {
        await NotificationService.sendTaskAssignmentNotification(
          task.pic as any,
          task,
          task.project || task.event || null,
          "Supervisor"
        );
      }

      const sourceName = task.project?.name ?? task.event?.name ?? "Personal/Regular Task";

      await this.prisma.notification.create({
        data: {
          userId: task.picId,
          message: `You have been assigned to task ${task.name} (${sourceName}).`,
          type: "TASK_ASSIGNMENT",
          targetId: task.id,
          targetType: "TASK"
        }
      });
    }

    return { message: "Task assigned successfully", task };
  };

  createTask = async (body: any, currentUserId: number) => {
    const task = await this.prisma.task.create({
      data: {
        name: body.name,
        picId: body.picId,
        sourceType: body.sourceType, // EVENT | PROJECT
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        eventId: body.eventId ? Number(body.eventId) : undefined,
        projectId: body.projectId ? Number(body.projectId) : undefined,
        activities: {
          create: body.activities ? body.activities.map((name: string) => ({ name })) : []
        }
      },
      include: {
        pic: { select: { id: true, name: true, email: true, noHp: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } }
      }
    });

    // Only send notifications if assigning to someone else
    if (task.picId !== currentUserId) {
      const sourceName = task.project?.name ?? task.event?.name ?? "General Task";

      // Decentralized Notification Trigger (Email active)
      if (task.pic) {
        await NotificationService.sendTaskAssignmentNotification(
          task.pic as any,
          task,
          task.project || task.event || null,
          "Supervisor"
        );
      }

      await this.prisma.notification.create({
        data: {
          userId: task.picId,
          message: `You have been assigned to task ${task.name} (${sourceName}).`,
          type: "TASK_ASSIGNMENT",
          targetId: task.id,
          targetType: "TASK"
        }
      });
    }

    return task;
  };
}
