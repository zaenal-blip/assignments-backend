import { PrismaClient, User } from "@prisma/client";
import { comparePassword, hashPassword } from "../../lib/argon.js";
import { ApiError } from "../../utils/api-error.js";
import jwt from "jsonwebtoken";
import { CreateUserBody } from "../../types/user.js";
import { normalizePhone } from "../../utils/phone-formatter.js";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  register = async (body: CreateUserBody) => {
    // Sanitize and normalize inputs
    const email = body.email.trim().toLowerCase();
    const noReg = body.noReg.trim();
    const name = body.name.trim();
    const noHp = normalizePhone(body.noHp.trim());

    // 1. Check uniqueness of email and noReg
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { noReg: noReg },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError("Email already exists", 400);
      }
      throw new ApiError("NoReg already exists", 400);
    }

    // 2. Format name to Uppercase
    const nameUppercase = name.toUpperCase();

    // 3. Hash Password
    const hashedPassword = await hashPassword(body.password);

    // 4. Create user
    const newUser = await this.prisma.user.create({
      data: {
        name: nameUppercase,
        noReg: noReg,
        email: email,
        noHp: noHp,
        role: body.role,
        password: hashedPassword,
      },
    });

    return { message: "Register success", userId: newUser.id };
  };

  login = async (body: { identifier: string; password: string }) => {
    // 1. Find user by Name (uppercase) or NoReg
    const user = await this.prisma.user.findUnique({
      where: {
        noReg: body.identifier,
      },
    });

    if (!user) {
      throw new ApiError("Invalid credentials", 400);
    }

    // 2. Compare Password
    const isPassMatch = await comparePassword(body.password, user.password);
    if (!isPassMatch) {
      throw new ApiError("Invalid credentials", 400);
    }

    // 3. Generate Token
    const payload = { id: user.id, role: user.role, name: user.name };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, accessToken };
  };
}
