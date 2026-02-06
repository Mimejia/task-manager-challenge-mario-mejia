import { HttpError } from "../utils/http-error";
import { createSyncOperation, findSyncOperation } from "../repositories/sync.repository";
import { createUserTask, deleteUserTask, updateUserTask } from "./tasks.service";

type SyncOperationInput = {
    opId: string;
    entityType: "task" | "workspace_member";
    operation: "create" | "update" | "status" | "delete" | "restore" | "revert";
    entityClientId?: string | null;
    payload: Record<string, unknown>;
    baseVersion?: number | null;
};

export const applySyncOperations = async (input: {
    userId: bigint;
    deviceId: string;
    operations: SyncOperationInput[];
}) => {
    const results = [] as Array<{ opId: string; result: "applied" | "conflict" | "rejected" }>;

    for (const op of input.operations) {
        const existing = await findSyncOperation(input.deviceId, op.opId);
        if (existing) {
            results.push({ opId: op.opId, result: existing.result });
            continue;
        }

        try {
            if (op.entityType !== "task") {
                throw new HttpError(400, "BAD_REQUEST", "Unsupported entity type");
            }

            if (op.operation === "create") {
                await createUserTask({
                    userId: input.userId,
                    title: String(op.payload.title ?? ""),
                    description: typeof op.payload.description === "string" ? op.payload.description : undefined,
                    status: typeof op.payload.status === "string" ? (op.payload.status as any) : undefined,
                    workspaceId: op.payload.workspaceId ? BigInt(op.payload.workspaceId as any) : null,
                    clientId: typeof op.payload.clientId === "string" ? op.payload.clientId : null,
                    clientRev: typeof op.payload.clientRev === "number" ? BigInt(op.payload.clientRev) : null,
                    deviceId: input.deviceId,
                });
            }

            if (op.operation === "update" || op.operation === "status") {
                const taskId = op.payload.taskId;
                if (taskId === undefined || taskId === null) {
                    throw new HttpError(400, "BAD_REQUEST", "taskId is required");
                }

                await updateUserTask({
                    userId: input.userId,
                    taskId: BigInt(taskId as any),
                    title: typeof op.payload.title === "string" ? op.payload.title : undefined,
                    description: typeof op.payload.description === "string" ? op.payload.description : undefined,
                    status: typeof op.payload.status === "string" ? (op.payload.status as any) : undefined,
                    baseVersion: typeof op.baseVersion === "number" ? BigInt(op.baseVersion) : null,
                    deviceId: input.deviceId,
                });
            }

            if (op.operation === "delete") {
                const taskId = op.payload.taskId;
                if (taskId === undefined || taskId === null) {
                    throw new HttpError(400, "BAD_REQUEST", "taskId is required");
                }

                await deleteUserTask({
                    userId: input.userId,
                    taskId: BigInt(taskId as any),
                    deviceId: input.deviceId,
                });
            }

            const payload = JSON.parse(JSON.stringify(op.payload)) as any;

            await createSyncOperation({
                userId: input.userId,
                deviceId: input.deviceId,
                opId: op.opId,
                entityType: op.entityType,
                entityClientId: op.entityClientId ?? null,
                operation: op.operation,
                payload,
                baseVersion: typeof op.baseVersion === "number" ? BigInt(op.baseVersion) : null,
                result: "applied",
            });

            results.push({ opId: op.opId, result: "applied" });
        } catch (error) {
            const result = error instanceof HttpError && error.code === "CONFLICT" ? "conflict" : "rejected";

            const payload = JSON.parse(JSON.stringify(op.payload)) as any;

            await createSyncOperation({
                userId: input.userId,
                deviceId: input.deviceId,
                opId: op.opId,
                entityType: op.entityType,
                entityClientId: op.entityClientId ?? null,
                operation: op.operation,
                payload,
                baseVersion: typeof op.baseVersion === "number" ? BigInt(op.baseVersion) : null,
                result,
            });

            results.push({ opId: op.opId, result });
        }
    }

    return results;
};