import crypto from "node:crypto";
import { HttpError } from "../utils/http-error";
import {
    acceptInvitation,
    addWorkspaceMember,
    createWorkspace,
    createWorkspaceInvitation,
    findInvitationByTokenHash,
    findWorkspaceById,
    findWorkspaceMember,
    listWorkspacesForUser,
} from "../repositories/workspace.repository";
import { hashToken } from "../utils/token-hash";

export const listUserWorkspaces = async (userId: bigint) => {
    return listWorkspacesForUser(userId);
};

export const createUserWorkspace = async (input: { userId: bigint; name: string }) => {
    if (!input.name || input.name.trim().length === 0) {
        throw new HttpError(400, "BAD_REQUEST", "Workspace name is required");
    }

    return createWorkspace({ name: input.name.trim(), ownerUserId: input.userId });
};

export const createInvitation = async (input: {
    userId: bigint;
    workspaceId: bigint;
    email?: string | null;
    expiresInHours?: number;
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}) => {
    const workspace = await findWorkspaceById(input.workspaceId);
    if (!workspace) {
        throw new HttpError(404, "NOT_FOUND", "Workspace not found");
    }

    const isOwner = workspace.owner_user_id === input.userId;
    const member = await findWorkspaceMember(input.workspaceId, input.userId);
    if (!isOwner && !member) {
        throw new HttpError(403, "FORBIDDEN", "No workspace access");
    }

    const token = crypto.randomBytes(24).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + (input.expiresInHours ?? 72) * 60 * 60 * 1000);

    await createWorkspaceInvitation({
        workspaceId: input.workspaceId,
        tokenHash,
        email: input.email ?? null,
        expiresAt,
        createdBy: input.userId,
        canView: input.canView,
        canCreate: input.canCreate,
        canEdit: input.canEdit,
        canDelete: input.canDelete,
    });

    return { token, expiresAt };
};

export const acceptInvitationToken = async (input: { userId: bigint; token: string }) => {
    const tokenHash = hashToken(input.token);
    const invitation = await findInvitationByTokenHash(tokenHash);
    if (!invitation) {
        throw new HttpError(404, "NOT_FOUND", "Invitation not found");
    }
    if (invitation.status !== "pending") {
        throw new HttpError(400, "BAD_REQUEST", "Invitation is not active");
    }
    if (invitation.expires_at < new Date()) {
        throw new HttpError(400, "BAD_REQUEST", "Invitation expired");
    }

    await addWorkspaceMember({
        workspaceId: invitation.workspace_id,
        userId: input.userId,
        invitedBy: invitation.created_by ?? null,
        canView: invitation.can_view,
        canCreate: invitation.can_create,
        canEdit: invitation.can_edit,
        canDelete: invitation.can_delete,
    });

    await acceptInvitation(invitation.id);

    return { workspaceId: invitation.workspace_id };
};
