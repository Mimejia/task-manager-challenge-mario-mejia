import type { workspace_invitations, workspace_members, workspaces } from "@prisma/client";

export interface IWorkspaceRepository {
    findById(workspaceId: bigint): Promise<workspaces | null>;
    createDefault(userId: bigint): Promise<workspaces>;
    createWorkspace(name: string, ownerUserId: bigint): Promise<workspaces>;
    findFirstWorkspaceIdForUser(userId: bigint): Promise<bigint | null>;
    listWorkspaceIdsForUser(userId: bigint): Promise<bigint[]>;
    listWorkspacesForUser(userId: bigint): Promise<workspaces[]>;
    findMember(workspaceId: bigint, userId: bigint): Promise<workspace_members | null>;
    addMember(data: {
        workspaceId: bigint;
        userId: bigint;
        invitedBy?: bigint | null;
        canView?: boolean;
        canCreate?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }): Promise<workspace_members>;
    createInvitation(data: {
        workspaceId: bigint;
        tokenHash: string;
        email?: string | null;
        expiresAt: Date;
        createdBy: bigint;
        canView?: boolean;
        canCreate?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }): Promise<workspace_invitations>;
    findInvitationByTokenHash(tokenHash: string): Promise<workspace_invitations | null>;
    acceptInvitation(invitationId: bigint): Promise<workspace_invitations>;
}
