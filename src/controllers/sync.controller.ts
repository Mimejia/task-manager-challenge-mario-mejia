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

        const normalized = operations.map((op, index) => {
            const opId = String((op as any).opId ?? "").trim();
            if (!opId) {
                throw new HttpError(400, "BAD_REQUEST", `opId is required at index ${index}`);
            }

            const entityType = ((op as any).entityType ?? "task") as "task" | "workspace_member";
            if (entityType !== "task" && entityType !== "workspace_member") {
                throw new HttpError(400, "BAD_REQUEST", `Invalid entityType at index ${index}`);
            }

            const operation = ((op as any).operation ?? "") as
                | "create"
                | "update"
                | "status"
                | "delete"
                | "restore"
                | "revert";
            const allowedOps = ["create", "update", "status", "delete", "restore", "revert"];
            if (!allowedOps.includes(operation)) {
                throw new HttpError(400, "BAD_REQUEST", `Invalid operation at index ${index}`);
            }

            const payload = ((op as any).payload ?? {}) as Record<string, unknown>;
            if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
                throw new HttpError(400, "BAD_REQUEST", `Invalid payload at index ${index}`);
            }

            const baseVersion = (op as any).baseVersion ?? null;
            if (baseVersion !== null && typeof baseVersion !== "number") {
                throw new HttpError(400, "BAD_REQUEST", `Invalid baseVersion at index ${index}`);
            }

            return {
                opId,
                entityType,
                operation,
                entityClientId: (op as any).entityClientId ?? null,
                payload,
                baseVersion,
            };
        });

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