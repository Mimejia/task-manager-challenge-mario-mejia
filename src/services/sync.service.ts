import { PrismaSyncRepository } from "../features/sync/repositories/PrismaSyncRepository";
import { SyncService } from "../features/sync/services/SyncService";
import { PrismaTaskRepository } from "../features/tasks/repositories/PrismaTaskRepository";
import { TaskService } from "../features/tasks/services/TaskService";
import { PrismaWorkspaceRepository } from "../features/workspaces/repositories/PrismaWorkspaceRepository";

type SyncOperationInput = {
    opId: string;
    entityType: "task" | "workspace_member";
    operation: "create" | "update" | "status" | "delete" | "restore" | "revert";
    entityClientId?: string | null;
    payload: Record<string, unknown>;
    baseVersion?: number | null;
};

const syncService = new SyncService(
    new PrismaSyncRepository(),
    (tx) => new PrismaSyncRepository(tx as any),
    (tx) => new TaskService(new PrismaTaskRepository(tx as any), new PrismaWorkspaceRepository(tx as any))
);

export const applySyncOperations = (input: {
    userId: bigint;
    deviceId: string;
    operations: SyncOperationInput[];
}) => syncService.applySyncOperations(input);