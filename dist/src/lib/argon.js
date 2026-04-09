import { hash, verify } from "argon2";
export const hashPassword = async (password) => {
    return await hash(password);
};
export const comparePassword = async (plainPassword, hashedPassword) => {
    return await verify(hashedPassword, plainPassword);
};
