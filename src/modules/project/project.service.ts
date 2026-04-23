import { PrismaClient, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { CreateProjectBody, GetProjectsQuery } from "../../types/project.js";
import { sendEmailNotification } from "../../lib/mail.js";
import { NotificationService } from "../notification/email-notification.service.js";

export class ProjectService {
  constructor(private prisma: PrismaClient) {}

  getProjects = async (query: GetProjectsQuery) => {
    const { page, take, search } = query;

    const where: Prisma.ProjectWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const projects = await this.prisma.project.findMany({
      where,
      take,
      skip: (page - 1) * take,
      include: {
        pic: { select: { id: true, name: true, role: true } },
        hoshin: { select: { id: true, code: true, cluster: true, actionPlan: true } },
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

  getProjectById = async (id: number) => {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        pic: { select: { id: true, name: true } },
        hoshin: { select: { id: true, code: true, cluster: true, actionPlan: true } },
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

  createProject = async (body: CreateProjectBody, currentUserId: number) => {
    return await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
         data: {
          name: body.name,
          picId: body.picId,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          description: body.description,
          hoshinId: body.hoshinId || undefined,
          actionPlan: body.actionPlan || undefined,
          status: "ACTIVE"
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

      // Only send notification if PIC is someone else
      if (body.picId !== currentUserId) {
        const picUser = await tx.user.findUnique({ where: { id: body.picId } });
        if (picUser) {
          await tx.notification.create({
            data: {
              userId: picUser.id,
              message: `You have been assigned to project ${project.name}.`,
              type: "PROJECT_ASSIGNMENT",
              targetId: project.id,
              targetType: "PROJECT"
            }
          });

          // Decentralized Notification Trigger (Email active)
          await NotificationService.sendProjectAssignmentNotification(
            picUser as any,
            project
          );
        }
      }

      return project;
    });
  };

  updateProject = async (id: number, body: Partial<CreateProjectBody>, currentUserId: number) => {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        picId: body.picId,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        description: body.description,
        hoshinId: body.hoshinId !== undefined ? (body.hoshinId || null) : undefined,
        actionPlan: body.actionPlan !== undefined ? (body.actionPlan || null) : undefined,
      }
    });

    // Only send notification if PIC changed AND new PIC is not the current user
    if (body.picId && body.picId !== project.picId && body.picId !== currentUserId) {
      const picUser = await this.prisma.user.findUnique({ where: { id: body.picId } });
      if (picUser) {
        await this.prisma.notification.create({
          data: {
            userId: picUser.id,
            message: `You have been assigned to project ${updatedProject.name}.`,
            type: "PROJECT_ASSIGNMENT",
            targetId: updatedProject.id,
            targetType: "PROJECT"
          }
        });

        // Decentralized Notification Trigger (Email active)
        await NotificationService.sendProjectAssignmentNotification(
          picUser as any,
          updatedProject
        );
      }
    }

    return updatedProject;
  };

  deleteProject = async (id: number) => {
    return await this.prisma.project.delete({
      where: { id }
    });
  };
}
