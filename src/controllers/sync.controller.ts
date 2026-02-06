import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../utils/http-error";
import { applySyncOperations } from "../services/sync.service";

export const syncOperations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const body = req.body as Record<string, unknown>;
        const deviceId = body["deviceId"];
        const operations = body["operations"];

        if (typeof deviceId !== "string" || deviceId.trim().length === 0) {
            throw new HttpError(400, "BAD_REQUEST", "deviceId is required");
        }
        if (!Array.isArray(operations)) {
            throw new HttpError(400, "BAD_REQUEST", "operations must be an array");
        }

        const normalized = operations.map((op) => ({
            opId: String((op as any).opId ?? ""),
            entityType: ((op as any).entityType ?? "task") as "task" | "workspace_member",
            operation: ((op as any).operation ?? "") as "create" | "update" | "status" | "delete" | "restore" | "revert",
            entityClientId: (op as any).entityClientId ?? null,
            payload: ((op as any).payload ?? {}) as Record<string, unknown>,
            baseVersion: (op as any).baseVersion ?? null,
        }));

        const results = await applySyncOperations({
            userId,
            deviceId,
            operations: normalized,
        });

        return res.json({ data: results });
    } catch (error) {
        return next(error);
    }
};