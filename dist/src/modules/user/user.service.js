import { ApiError } from "../../utils/api-error.js";
export class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getUsers = async (query) => {
        const { page, sortBy, sortOrder, take, search } = query;
        const whereClause = {
            deletedAt: null,
        };
        if (search) {
            whereClause.name = { contains: search, mode: "insensitive" };
        }
        const users = await this.prisma.user.findMany({
            where: whereClause,
            take: take,
            skip: (page - 1) * take,
            orderBy: { [sortBy]: sortOrder },
            omit: { password: true },
        });
        const total = await this.prisma.user.count({ where: whereClause });
        return {
            data: users,
            meta: { page, take, total },
        };
    };
    getUser = async (id) => {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
            omit: { password: true },
        });
        if (!user)
            throw new ApiError("User not found", 404);
        return user;
    };
    createUser = async (body) => {
        await this.prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: body.password,
                role: body.role,
                referralCode: body.referralCode,
                point: body.point,
                avatar: body.avatar,
            },
        });
        return { message: "create user success" };
    };
    updateUser = async (id, body) => {
        await this.getUser(id);
        if (body.email) {
            const userEmail = await this.prisma.user.findUnique({
                where: { email: body.email },
            });
            if (userEmail)
                throw new ApiError("email already exist", 400);
        }
        await this.prisma.user.update({
            where: { id },
            data: body,
        });
        return { message: "update user success" };
    };
    deleteUser = async (id) => {
        await this.getUser(id);
        await this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return { message: "delete user success" };
    };
}
