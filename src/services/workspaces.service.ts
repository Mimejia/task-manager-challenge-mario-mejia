import { PrismaWorkspaceRepository } from "../features/workspaces/repositories/PrismaWorkspaceRepository";
import { WorkspaceService } from "../features/workspaces/services/WorkspaceService";

const workspaceService = new WorkspaceService(new PrismaWorkspaceRepository());

export const listUserWorkspaces = (userId: bigint) => workspaceService.listUserWorkspaces(userId);

export const createUserWorkspace = (input: { userId: bigint; name: string }) =>
    workspaceService.createUserWorkspace(input);

export const createInvitation = (input: {
    userId: bigint;
    workspaceId: bigint;
    email?: string | null;
    expiresInHours?: number;
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}) => workspaceService.createInvitation(input);

export const acceptInvitationToken = (input: { userId: bigint; token: string }) =>
    workspaceService.acceptInvitationToken(input);
