import type { roles, user_roles, users } from "@prisma/client";

export type CreateLocalUserInput = {
    email: string;
    fullName: string;
    passwordHash: string;
};

export interface IUserRepository {
    findByEmail(email: string): Promise<users | null>;
    createLocalUser(data: CreateLocalUserInput): Promise<users>;
    ensureRole(code: string, name: string): Promise<roles>;
    assignRoleToUser(userId: bigint, roleId: bigint): Promise<user_roles>;
}
