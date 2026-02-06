import { HttpError } from "../../../utils/http-error";
import type { ISyncRepository } from "../repositories/ISyncRepository";
import type { TaskService } from "../../tasks/services/TaskService";

export type SyncOperationInput = {
    opId: string;
    entityType: "task" | "workspace_member";
    operation: "create" | "update" | "status" | "delete" | "restore" | "revert";
    entityClientId?: string | null;
    payload: Record<string, unknown>;
    baseVersion?: number | null;
};

export class SyncService {
    constructor(
        private readonly syncRepository: ISyncRepository,
        private readonly syncRepositoryFactory: (tx: unknown) => ISyncRepository,
        private readonly taskServiceFactory: (tx: unknown) => TaskService
    ) { }

    async applySyncOperations(input: {
        userId: bigint;
        deviceId: string;
        operations: SyncOperationInput[];
    }) {
        type SyncResult = "applied" | "conflict" | "rejected";
        const results = [] as Array<{ opId: string; result: SyncResult }>;

        for (const op of input.operations) {
            const result: { opId: string; result: SyncResult } =
                await this.syncRepository.withTransaction(async (tx) => {
                    const txSyncRepository = this.syncRepositoryFactory(tx);
                    const existing = await txSyncRepository.findByDeviceAndOpId(input.deviceId, op.opId);
                    if (existing) {
                        return { opId: op.opId, result: existing.result as SyncResult };
                    }

                    const taskService = this.taskServiceFactory(tx);

                    try {
                        if (op.entityType !== "task") {
                            throw new HttpError(400, "BAD_REQUEST", "Unsupported entity type");
                        }

                        if (op.operation === "create") {
                            await taskService.createUserTask({
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

                            await taskService.updateUserTask({
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

                            await taskService.deleteUserTask({
                                userId: input.userId,
                                taskId: BigInt(taskId as any),
                                deviceId: input.deviceId,
                            });
                        }

                        const payload = JSON.parse(JSON.stringify(op.payload)) as any;

                        await txSyncRepository.create({
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

                        return { opId: op.opId, result: "applied" };
                    } catch (error) {
                        const result: SyncResult =
                            error instanceof HttpError && error.code === "CONFLICT" ? "conflict" : "rejected";
                        const payload = JSON.parse(JSON.stringify(op.payload)) as any;

                        await txSyncRepository.create({
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

                        return { opId: op.opId, result };
                    }
                });

            results.push(result);
        }

        return results;
    }
}
