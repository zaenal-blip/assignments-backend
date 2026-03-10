import { PrismaClient, User } from "@prisma/client";
import { comparePassword, hashPassword } from "../../lib/argon.js";
import { ApiError } from "../../utils/api-error.js";
import jwt from "jsonwebtoken";
import { CreateUserBody } from "../../types/user.js";

export class AuthService {
  //   prisma: PrismaClient;
  constructor(private prisma: PrismaClient) {
    // this.prisma = prisma;
  }

  register = async (body: CreateUserBody) => {
    //1. Cek avaibilitas email
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    //2. Kalau sudah dipakai throw error
    if (user) {
      throw new ApiError("Email Already Exist", 400);
    }
    //3. Kalo belum, Hash Password dari body.password
    const hashedPassword = await hashPassword(body.password);

    //4. Create user baru berdasarkan body dan hashed password
    await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role,
        referralCode: body.referralCode,
        point: body.point,
        avatar: body.avatar,
      },
    });

    //5. Returm Message Register Success
    return { message: "Register Success" };
  };

  login = async (body: Pick<User, "email" | "password">) => {
    //1. Cek Emailnya ada ga
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    //2. Kalo ga ada, throw error
    if (!user) {
      throw new ApiError("Invalid Credential", 400);
    }
    //3. Cek Passwordnya ada ga
    const isPassMatch = await comparePassword(body.password, user.password);
    //4. Kalo ga ada, throw error
    if (!isPassMatch) {
      throw new ApiError("Invalid Credential", 400);
    }
    //5. Generate Token dengan jwt->jsonwebtoken
    const payload = { id: user.id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "2h",
    });
    //6. Return data usernya
    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, accessToken };
  };
}
