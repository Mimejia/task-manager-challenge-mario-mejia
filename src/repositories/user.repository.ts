import { prisma } from "../prisma";
import { users } from "@prisma/client";

export const findUserByEmail = (email: string) => {
    return prisma.users.findUnique({ where: { email } });
};

export const createLocalUser = (data: {
    email: string;
    fullName: string;
    passwordHash: string;
}): Promise<users> => {
    return prisma.users.create({
        data: {
            email: data.email,
            full_name: data.fullName,
            auth_provider: "local",
            password_hash: data.passwordHash,
        },
    });
};

export const findRoleByCode = (code: string) => {
    return prisma.roles.findUnique({ where: { code } });
};

export const ensureRole = async (code: string, name: string) => {
    const existing = await findRoleByCode(code);
    if (existing) return existing;
    return prisma.roles.create({ data: { code, name } });
};

export const assignRoleToUser = async (userId: bigint, roleId: bigint) => {
    return prisma.user_roles.create({
        data: {
            user_id: userId,
            role_id: roleId,
        },
    });
};
