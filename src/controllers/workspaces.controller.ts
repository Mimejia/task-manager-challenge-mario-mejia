import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../utils/http-error";
import { toWorkspaceDTO } from "../dtos/workspace.dto";
import {
    acceptInvitationToken,
    createInvitation,
    createUserWorkspace,
    listUserWorkspaces,
} from "../services/workspaces.service";

export const listWorkspaces = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const workspaces = await listUserWorkspaces(userId);
        return res.json({ data: workspaces.map(toWorkspaceDTO) });
    } catch (error) {
        return next(error);
    }
};

export const createWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const name = req.body?.name;
        if (typeof name !== "string" || name.trim().length === 0) {
            throw new HttpError(400, "BAD_REQUEST", "Workspace name is required");
        }
        const workspace = await createUserWorkspace({ userId, name });
        return res.status(201).json({ data: toWorkspaceDTO(workspace) });
    } catch (error) {
        return next(error);
    }
};

export const inviteToWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const workspaceId = BigInt(req.params.id as string);
        const { email, canView, canCreate, canEdit, canDelete, expiresInHours } = req.body ?? {};

        const result = await createInvitation({
            userId,
            workspaceId,
            email: typeof email === "string" ? email : null,
            canView: typeof canView === "boolean" ? canView : undefined,
            canCreate: typeof canCreate === "boolean" ? canCreate : undefined,
            canEdit: typeof canEdit === "boolean" ? canEdit : undefined,
            canDelete: typeof canDelete === "boolean" ? canDelete : undefined,
            expiresInHours: typeof expiresInHours === "number" ? expiresInHours : undefined,
        });

        return res.status(201).json({ data: result });
    } catch (error) {
        return next(error);
    }
};

export const acceptWorkspaceInvitation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const token = req.body?.token;
        if (typeof token !== "string" || token.trim().length === 0) {
            throw new HttpError(400, "BAD_REQUEST", "Token is required");
        }

        const result = await acceptInvitationToken({ userId, token });
        return res.json({ data: result });
    } catch (error) {
        return next(error);
    }
};
