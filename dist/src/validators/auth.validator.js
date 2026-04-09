import { z } from "zod";
export const registerSchema = z.object({
    name: z.string().min(3),
    noReg: z.string().min(3),
    email: z.string().email(),
    noHp: z.string().regex(/^[0-9]+$/, { message: "No HP must contain only numbers" }).min(10),
    role: z.enum(["MEMBER", "LEADER", "SPV", "DPH"]),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export const loginSchema = z.object({
    identifier: z.string().min(3), // Nama or NoReg
    password: z.string().min(6),
});
