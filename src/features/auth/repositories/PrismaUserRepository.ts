import type { roles, user_roles, users } from "@prisma/client";
import { prisma } from "../../../prisma";
import type { CreateLocalUserInput, IUserRepository } from "./IUserRepository";

export class PrismaUserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<users | null> {
        return prisma.users.findUnique({ where: { email } });
    }

    async createLocalUser(data: CreateLocalUserInput): Promise<users> {
        return prisma.users.create({
            data: {
                email: data.email,
                full_name: data.fullName,
                auth_provider: "local",
                password_hash: data.passwordHash,
            },
        });
    }

    async ensureRole(code: string, name: string): Promise<roles> {
        const existing = await prisma.roles.findUnique({ where: { code } });
        if (existing) return existing;
        return prisma.roles.create({ data: { code, name } });
    }

    async assignRoleToUser(userId: bigint, roleId: bigint): Promise<user_roles> {
        return prisma.user_roles.create({
            data: {
                user_id: userId,
                role_id: roleId,
            },
        });
    }
}
