export class RegularJobService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getRegularJobs = async () => {
        return await this.prisma.regularJob.findMany({
            include: {
                pic: { select: { id: true, name: true } },
                tasks: {
                    include: { pic: { select: { id: true, name: true } }, activities: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    };
    createRegularJob = async (name, picId) => {
        return await this.prisma.regularJob.create({
            data: { name, picId }
        });
    };
    updateRegularJob = async (id, name) => {
        return await this.prisma.regularJob.update({
            where: { id },
            data: { name }
        });
    };
    createRegularTask = async (regularJobId, body) => {
        return await this.prisma.task.create({
            data: {
                name: body.name,
                picId: body.picId,
                sourceType: "REGULAR",
                regularJobId,
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
}
