import { ApiError } from "../../utils/api-error.js";
import { sendEmailNotification } from "../../lib/mail.js";
export class ProjectService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getProjects = async (query) => {
        const { page, take, search } = query;
        const where = {};
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }
        const projects = await this.prisma.project.findMany({
            where,
            take,
            skip: (page - 1) * take,
            include: {
                pic: { select: { id: true, name: true } },
                _count: { select: { tasks: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        const total = await this.prisma.project.count({ where });
        return {
            data: projects,
            meta: { page, take, total }
        };
    };
    getProjectById = async (id) => {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                pic: { select: { id: true, name: true } },
                tasks: {
                    include: {
                        pic: { select: { id: true, name: true } },
                        activities: true,
                    }
                }
            }
        });
        if (!project) {
            throw new ApiError("Project not found", 404);
        }
        const completedTasks = project.tasks.filter((t) => t.status === "DONE").length;
        const remainingTasks = project.tasks.length - completedTasks;
        return {
            ...project,
            summary: {
                completedTasks,
                remainingTasks,
                issues: "None reported",
            }
        };
    };
    createProject = async (body) => {
        return await this.prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    name: body.name,
                    picId: body.picId,
                }
            });
            if (body.tasks && body.tasks.length > 0) {
                for (const taskData of body.tasks) {
                    await tx.task.create({
                        data: {
                            name: taskData.name,
                            picId: taskData.picId,
                            sourceType: "PROJECT",
                            projectId: project.id,
                            activities: {
                                create: taskData.activities.map((name) => ({ name }))
                            }
                        }
                    });
                }
            }
            const picUser = await tx.user.findUnique({ where: { id: body.picId } });
            if (picUser?.email) {
                const subject = `Assigned to Project: ${project.name}`;
                const message = `You have been assigned as PIC for the project ${project.name}. Please check the system for details.`;
                await sendEmailNotification(picUser.email, subject, message);
                await tx.notification.create({
                    data: {
                        userId: picUser.id,
                        message: `You have been assigned to project ${project.name}.`,
                        type: "PROJECT_ASSIGNMENT"
                    }
                });
            }
            return project;
        });
    };
    updateProject = async (id, body) => {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) {
            throw new ApiError("Project not found", 404);
        }
        const updatedProject = await this.prisma.project.update({
            where: { id },
            data: {
                name: body.name,
                picId: body.picId,
            }
        });
        if (body.picId && body.picId !== project.picId) {
            const picUser = await this.prisma.user.findUnique({ where: { id: body.picId } });
            if (picUser?.email) {
                const subject = `Assigned to Project: ${updatedProject.name}`;
                const message = `You have been assigned as PIC for the project ${updatedProject.name}. Please check the system for details.`;
                await sendEmailNotification(picUser.email, subject, message);
                await this.prisma.notification.create({
                    data: {
                        userId: picUser.id,
                        message: `You have been assigned to project ${updatedProject.name}.`,
                        type: "PROJECT_ASSIGNMENT"
                    }
                });
            }
        }
        return updatedProject;
    };
    deleteProject = async (id) => {
        return await this.prisma.project.delete({
            where: { id }
        });
    };
}
