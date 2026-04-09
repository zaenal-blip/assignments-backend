import { ApiError } from "../../utils/api-error.js";
import { prisma } from "../../lib/prisma.js";
export class PersonalJobController {
    taskService;
    constructor(taskService) {
        this.taskService = taskService;
    }
    getPersonalJobs = async (req, res) => {
        try {
            const user = req.user;
            const query = {
                page: Number(req.query.page) || 1,
                take: Number(req.query.take) || 10,
                sourceType: "PERSONAL",
            };
            if (user.role === "MEMBER") {
                query.picId = user.id;
            }
            else {
                query.picId = req.query.picId ? Number(req.query.picId) : undefined;
            }
            const result = await this.taskService.getTasks(query);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    createPersonalJob = async (req, res) => {
        try {
            const user = req.user;
            const { name, activities } = req.body;
            const result = await prisma.task.create({
                data: {
                    name,
                    picId: user.id,
                    sourceType: "PERSONAL",
                    activities: {
                        create: activities.map((name) => ({ name }))
                    }
                },
                include: { activities: true }
            });
            res.status(201).json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    };
    updatePersonalJob = async (req, res) => {
        try {
            const user = req.user;
            const id = Number(req.params.id);
            const { name, activities } = req.body;
            const existingTask = await prisma.task.findUnique({
                where: { id },
                include: { activities: true }
            });
            if (!existingTask) {
                throw new ApiError("Personal job not found", 404);
            }
            if (existingTask.sourceType !== "PERSONAL") {
                throw new ApiError("Task is not a personal job", 400);
            }
            if (user.role === "MEMBER" && existingTask.picId !== user.id) {
                throw new ApiError("Unauthorized to update this personal job", 403);
            }
            const updateData = {};
            if (name !== undefined) {
                updateData.name = name;
            }
            if (activities) {
                updateData.activities = {
                    deleteMany: {},
                    create: activities.map((name) => ({ name }))
                };
            }
            const result = await prisma.task.update({
                where: { id },
                data: updateData,
                include: { activities: true }
            });
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    deletePersonalJob = async (req, res) => {
        try {
            const user = req.user;
            const id = Number(req.params.id);
            const existingTask = await prisma.task.findUnique({
                where: { id }
            });
            if (!existingTask) {
                throw new ApiError("Personal job not found", 404);
            }
            if (existingTask.sourceType !== "PERSONAL") {
                throw new ApiError("Task is not a personal job", 400);
            }
            if (user.role === "MEMBER" && existingTask.picId !== user.id) {
                throw new ApiError("Unauthorized to delete this personal job", 403);
            }
            await prisma.task.delete({ where: { id } });
            res.status(200).json({ message: "Personal job deleted" });
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
}
