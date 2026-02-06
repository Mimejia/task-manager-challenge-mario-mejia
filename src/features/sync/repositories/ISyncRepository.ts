import type { Prisma, sync_operations, sync_operations_result } from "@prisma/client";

export type CreateSyncOperationData = {
    userId: bigint;
    deviceId: string;
    opId: string;
    entityType: "task" | "workspace_member";
    entityClientId?: string | null;
    operation: "create" | "update" | "status" | "delete" | "restore" | "revert";
    payload: Prisma.InputJsonValue;
    baseVersion?: bigint | null;
    result: sync_operations_result;
};

export interface ISyncRepository {
    findByDeviceAndOpId(deviceId: string, opId: string): Promise<sync_operations | null>;
    create(data: CreateSyncOperationData): Promise<sync_operations>;
    withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}
