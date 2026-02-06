import { prisma } from "../prisma";

export const findWorkspaceById = (workspaceId: bigint) => {
    return prisma.workspaces.findUnique({ where: { id: workspaceId } });
};

export const createDefaultWorkspace = async (userId: bigint) => {
    const workspace = await prisma.workspaces.create({
        data: {
            name: "Personal",
            owner_user_id: userId,
            created_by: userId,
            updated_by: userId,
        },
    });

    await prisma.workspace_members.create({
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
};

export const createWorkspace = async (data: { name: string; ownerUserId: bigint }) => {
    const workspace = await prisma.workspaces.create({
        data: {
            name: data.name,
            owner_user_id: data.ownerUserId,
            created_by: data.ownerUserId,
            updated_by: data.ownerUserId,
        },
    });

    await prisma.workspace_members.create({
        data: {
            workspace_id: workspace.id,
            user_id: data.ownerUserId,
            can_view: true,
            can_create: true,
            can_edit: true,
            can_delete: true,
            invited_by: data.ownerUserId,
        },
    });

    return workspace;
};

export const findFirstWorkspaceIdForUser = async (userId: bigint) => {
    const membership = await prisma.workspace_members.findFirst({
        where: { user_id: userId },
        select: { workspace_id: true },
    });

    return membership?.workspace_id ?? null;
};

export const listWorkspaceIdsForUser = async (userId: bigint) => {
    const memberships = await prisma.workspace_members.findMany({
        where: { user_id: userId },
        select: { workspace_id: true },
    });

    return memberships.map((m) => m.workspace_id);
};

export const listWorkspacesForUser = async (userId: bigint) => {
    return prisma.workspaces.findMany({
        where: { workspace_members: { some: { user_id: userId } } },
        orderBy: { created_at: "desc" },
    });
};

export const findWorkspaceMember = (workspaceId: bigint, userId: bigint) => {
    return prisma.workspace_members.findUnique({
        where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
    });
};

export const addWorkspaceMember = async (data: {
    workspaceId: bigint;
    userId: bigint;
    invitedBy?: bigint | null;
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}) => {
    return prisma.workspace_members.create({
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
};

export const createWorkspaceInvitation = async (data: {
    workspaceId: bigint;
    tokenHash: string;
    email?: string | null;
    expiresAt: Date;
    createdBy: bigint;
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}) => {
    return prisma.workspace_invitations.create({
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
};

export const findInvitationByTokenHash = (tokenHash: string) => {
    return prisma.workspace_invitations.findUnique({
        where: { token_hash: tokenHash },
    });
};

export const acceptInvitation = async (invitationId: bigint) => {
    return prisma.workspace_invitations.update({
        where: { id: invitationId },
        data: { status: "accepted" },
    });
};
