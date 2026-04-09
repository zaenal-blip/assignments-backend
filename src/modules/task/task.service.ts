import { PrismaClient, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { UpdateTaskProgressBody, AssignTaskBody, GetTasksQuery } from "../../types/task.js";
import { sendEmailNotification } from "../../lib/mail.js";

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
        regularJob: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Calculate progress for each task
    const tasksWithProgress = tasks.map((task: any) => {
      const totalActivities = task.activities.length;
      const completedActivities = task.activities.filter((a: any) => a.completed).length;
      const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

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
    const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

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

    const canUpdate = task.picId === picId || ["LEADER", "SPV", "DPH"].includes(userRole);
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
      
      if (superiors.length > 0) {
        await this.prisma.notification.createMany({
          data: superiors.map(sup => ({
            userId: sup.id,
            message: `Task "${task.name}" has been fully completed by ${task.pic?.name || "Member"}.`,
            type: "TASK_COMPLETION"
          }))
        });
      }
    }

    return { message: "Task progress updated successfully", progress: Math.round(progress) };
  };

  assignTask = async (taskId: number, body: AssignTaskBody) => {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { picId: body.picId },
      include: {
        pic: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } }
      }
    });

    const subject = `Task Assignment: ${task.name}`;
    const sourceName = task.project?.name ?? task.event?.name ?? "Personal/Regular Task";
    const bodyMessage = `You have been assigned to task ${task.name} from ${sourceName}. Please check the system for details.`;

    if (task.pic.email) {
      await sendEmailNotification(task.pic.email, subject, bodyMessage);
    }

    await this.prisma.notification.create({
      data: {
        userId: task.picId,
        message: `You have been assigned to task ${task.name} (${sourceName}).`,
        type: "TASK_ASSIGNMENT"
      }
    });

    return { message: "Task assigned successfully", task };
  };

  createTask = async (body: any) => {
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
        pic: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } }
      }
    });

    const subject = `New Task Assignment: ${task.name}`;
    const sourceName = task.project?.name ?? task.event?.name ?? "General Task";
    const bodyMessage = `You have been assigned to task ${task.name} from ${sourceName}. Please check the system for details.`;

    if (task.pic.email) {
      await sendEmailNotification(task.pic.email, subject, bodyMessage);
    }

    await this.prisma.notification.create({
      data: {
        userId: task.picId,
        message: `You have been assigned to task ${task.name} (${sourceName}).`,
        type: "TASK_ASSIGNMENT"
      }
    });

    return task;
  };
}
