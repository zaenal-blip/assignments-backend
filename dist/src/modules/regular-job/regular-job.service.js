import { ApiError } from "../../utils/api-error.js";
export class RegularJobService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getRegularJobs = async (picId) => {
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
    getRegularJobById = async (id) => {
        const job = await this.prisma.regularJob.findUnique({
            where: { id },
            include: { pic: true }
        });
        if (!job)
            throw new ApiError("Regular activity not found", 404);
        return job;
    };
    createRegularJob = async (name, picId, category, frequency, date, startTime, endTime) => {
        return await this.prisma.regularJob.create({
            data: {
                name,
                picId,
                category,
                frequency,
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
                            priority: "LOW"
                        }]
                }
            },
            include: { tasks: true }
        });
    };
    updateRegularJob = async (id, data) => {
        return await this.prisma.regularJob.update({
            where: { id },
            data
        });
    };
    createRegularTask = async (regularJobId, body) => {
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
                    create: body.activities.map((name) => ({ name }))
                }
            }
        });
    };
    deleteRegularJob = async (id) => {
        return await this.prisma.regularJob.delete({
            where: { id }
        });
    };
    /**
     * Daily reset: set all RegularJob progress back to 0 (Pending).
     * Called by the cron job at midnight every day.
     */
    resetAllDailyProgress = async () => {
        const result = await this.prisma.regularJob.updateMany({
            where: { progress: { gt: 0 } },
            data: { progress: 0 }
        });
        return result.count;
    };
}
