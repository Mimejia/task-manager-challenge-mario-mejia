import type {
    Prisma,
    PrismaClient,
    workspace_invitations,
    workspace_members,
    workspaces,
} from "@prisma/client";
import { prisma } from "../../../prisma";
import type { IWorkspaceRepository } from "./IWorkspaceRepository";

export class PrismaWorkspaceRepository implements IWorkspaceRepository {
    constructor(private readonly client: PrismaClient | Prisma.TransactionClient = prisma) { }

    async findById(workspaceId: bigint): Promise<workspaces | null> {
        return this.client.workspaces.findUnique({ where: { id: workspaceId } });
    }

    async createDefault(userId: bigint): Promise<workspaces> {
        const workspace = await this.client.workspaces.create({
            data: {
                name: "Personal",
                owner_user_id: userId,
                created_by: userId,
                updated_by: userId,
            },
        });

        await this.client.workspace_members.create({
            data: {
                workspace_id: workspace.id,
                user_id: userId,
                can_view: true,
                can_create: true,
                can_edit: true,
                can_delete: true,
                invited_by: userId,
            },
        });

        return workspace;
    }

    async createWorkspace(name: string, ownerUserId: bigint): Promise<workspaces> {
        const workspace = await this.client.workspaces.create({
            data: {
                name,
                owner_user_id: ownerUserId,
                created_by: ownerUserId,
                updated_by: ownerUserId,
            },
        });

        await this.client.workspace_members.create({
            data: {
                workspace_id: workspace.id,
                user_id: ownerUserId,
                can_view: true,
                can_create: true,
                can_edit: true,
                can_delete: true,
                invited_by: ownerUserId,
            },
        });

        return workspace;
    }

    async findFirstWorkspaceIdForUser(userId: bigint): Promise<bigint | null> {
        const membership = await this.client.workspace_members.findFirst({
            where: { user_id: userId },
            select: { workspace_id: true },
        });

        return membership?.workspace_id ?? null;
    }

    async listWorkspaceIdsForUser(userId: bigint): Promise<bigint[]> {
        const memberships = await this.client.workspace_members.findMany({
            where: { user_id: userId },
            select: { workspace_id: true },
        });

        return memberships.map((m) => m.workspace_id);
    }

    async listWorkspacesForUser(userId: bigint): Promise<workspaces[]> {
        return this.client.workspaces.findMany({
            where: { workspace_members: { some: { user_id: userId } } },
            orderBy: { created_at: "desc" },
        });
    }

    async findMember(workspaceId: bigint, userId: bigint): Promise<workspace_members | null> {
        return this.client.workspace_members.findUnique({
            where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
        });
    }

    async addMember(data: {
        workspaceId: bigint;
        userId: bigint;
        invitedBy?: bigint | null;
        canView?: boolean;
        canCreate?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }): Promise<workspace_members> {
        return this.client.workspace_members.create({
            data: {
                workspace_id: data.workspaceId,
                user_id: data.userId,
                invited_by: data.invitedBy ?? null,
                can_view: data.canView ?? true,
                can_create: data.canCreate ?? false,
                can_edit: data.canEdit ?? false,
                can_delete: data.canDelete ?? false,
            },
        });
    }

    async createInvitation(data: {
        workspaceId: bigint;
        tokenHash: string;
        email?: string | null;
        expiresAt: Date;
        createdBy: bigint;
        canView?: boolean;
        canCreate?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }): Promise<workspace_invitations> {
        return this.client.workspace_invitations.create({
            data: {
                workspace_id: data.workspaceId,
                token_hash: data.tokenHash,
                email: data.email ?? null,
                expires_at: data.expiresAt,
                created_by: data.createdBy,
                can_view: data.canView ?? true,
                can_create: data.canCreate ?? false,
                can_edit: data.canEdit ?? false,
                can_delete: data.canDelete ?? false,
            },
        });
    }

    async findInvitationByTokenHash(tokenHash: string): Promise<workspace_invitations | null> {
        return this.client.workspace_invitations.findUnique({
            where: { token_hash: tokenHash },
        });
    }

    async acceptInvitation(invitationId: bigint): Promise<workspace_invitations> {
        return this.client.workspace_invitations.update({
            where: { id: invitationId },
            data: { status: "accepted" },
        });
    }
}
