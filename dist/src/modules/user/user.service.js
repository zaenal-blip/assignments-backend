import { ApiError } from "../../utils/api-error.js";
import { hashPassword } from "../../lib/argon.js";
export class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getUsers = async (query) => {
        const { page, sortBy, sortOrder, take, search } = query;
        const whereClause = {};
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
            where: { id },
            omit: { password: true },
        });
        if (!user)
            throw new ApiError("User not found", 404);
        return user;
    };
    createUser = async (body) => {
        const hashedPassword = await hashPassword(body.password);
        await this.prisma.user.create({
            data: {
                name: body.name.toUpperCase(),
                noReg: body.noReg,
                email: body.email,
                noHp: body.noHp,
                password: hashedPassword,
                role: body.role,
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
        if (body.name) {
            body.name = body.name.toUpperCase();
        }
        await this.prisma.user.update({
            where: { id },
            data: body,
        });
        return { message: "update user success" };
    };
    updateProfile = async (id, body) => {
        await this.getUser(id);
        const updateData = { ...body };
        if (body.email) {
            const existingUser = await this.prisma.user.findFirst({
                where: { email: body.email, NOT: { id } },
            });
            if (existingUser)
                throw new ApiError("Email already in use", 400);
        }
        if (body.password) {
            updateData.password = await hashPassword(body.password);
        }
        if (body.name) {
            updateData.name = body.name.toUpperCase();
        }
        await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
        return { message: "Profile updated successfully" };
    };
    deleteUser = async (id) => {
        await this.getUser(id);
        await this.prisma.user.delete({
            where: { id },
        });
        return { message: "delete user success" };
    };
}
