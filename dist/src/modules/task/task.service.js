import { ApiError } from "../../utils/api-error.js";
import { NotificationService } from "../notification/email-notification.service.js";
export class TaskService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getTasks = async (query) => {
        const { page, take, sourceType, picId } = query;
        const where = {};
        if (sourceType)
            where.sourceType = sourceType;
        if (picId)
            where.picId = picId;
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
        const tasksWithProgress = tasks.map((task) => {
            const totalActivities = task.activities.length;
            const completedActivities = task.activities.filter((a) => a.completed).length;
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
    getTaskById = async (id) => {
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
        const completedActivities = task.activities.filter((a) => a.completed).length;
        const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
        return {
            ...task,
            progress: Math.round(progress),
        };
    };
    updateActivityStatus = async (taskId, picId, userRole, body) => {
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
        const activity = task.activities.find((a) => a.id === body.activityId);
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
        const completedActivities = updatedTask?.activities.filter((a) => a.completed).length ?? 0;
        const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
        const allCompleted = updatedTask?.activities.every((a) => a.completed);
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
    assignTask = async (taskId, body, currentUserId) => {
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
                await NotificationService.sendTaskAssignmentNotification(task.pic, task, task.project || task.event || null, "Supervisor");
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
    createTask = async (body, currentUserId) => {
        const task = await this.prisma.task.create({
            data: {
                name: body.name,
                picId: body.picId,
                sourceType: body.sourceType, // EVENT | PROJECT
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                eventId: body.eventId ? Number(body.eventId) : undefined,
                projectId: body.projectId ? Number(body.projectId) : undefined,
                activities: {
                    create: body.activities ? body.activities.map((name) => ({ name })) : []
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
                await NotificationService.sendTaskAssignmentNotification(task.pic, task, task.project || task.event || null, "Supervisor");
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
