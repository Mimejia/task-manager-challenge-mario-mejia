import crypto from "node:crypto";
import { HttpError } from "../../../utils/http-error";
import { hashToken } from "../../../utils/token-hash";
import type { IWorkspaceRepository } from "../repositories/IWorkspaceRepository";

export class WorkspaceService {
    constructor(private readonly workspaceRepository: IWorkspaceRepository) { }

    async listUserWorkspaces(userId: bigint) {
        return this.workspaceRepository.listWorkspacesForUser(userId);
    }

    async createUserWorkspace(input: { userId: bigint; name: string }) {
        if (!input.name || input.name.trim().length === 0) {
            throw new HttpError(400, "BAD_REQUEST", "Workspace name is required");
        }

        return this.workspaceRepository.createWorkspace(input.name.trim(), input.userId);
    }

    async createInvitation(input: {
        userId: bigint;
        workspaceId: bigint;
        email?: string | null;
        expiresInHours?: number;
        canView?: boolean;
        canCreate?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }) {
        const workspace = await this.workspaceRepository.findById(input.workspaceId);
        if (!workspace) {
            throw new HttpError(404, "NOT_FOUND", "Workspace not found");
        }

        const isOwner = workspace.owner_user_id === input.userId;
        const member = await this.workspaceRepository.findMember(input.workspaceId, input.userId);
        if (!isOwner && !member) {
            throw new HttpError(403, "FORBIDDEN", "No workspace access");
        }

        const token = crypto.randomBytes(24).toString("hex");
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + (input.expiresInHours ?? 72) * 60 * 60 * 1000);

        await this.workspaceRepository.createInvitation({
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
    }

    async acceptInvitationToken(input: { userId: bigint; token: string }) {
        const tokenHash = hashToken(input.token);
        const invitation = await this.workspaceRepository.findInvitationByTokenHash(tokenHash);
        if (!invitation) {
            throw new HttpError(404, "NOT_FOUND", "Invitation not found");
        }
        if (invitation.status !== "pending") {
            throw new HttpError(400, "BAD_REQUEST", "Invitation is not active");
        }
        if (invitation.expires_at < new Date()) {
            throw new HttpError(400, "BAD_REQUEST", "Invitation expired");
        }

        await this.workspaceRepository.addMember({
            workspaceId: invitation.workspace_id,
            userId: input.userId,
            invitedBy: invitation.created_by ?? null,
            canView: invitation.can_view,
            canCreate: invitation.can_create,
            canEdit: invitation.can_edit,
            canDelete: invitation.can_delete,
        });

        await this.workspaceRepository.acceptInvitation(invitation.id);

        return { workspaceId: invitation.workspace_id };
    }
}
