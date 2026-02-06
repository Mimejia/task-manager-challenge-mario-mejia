import { Prisma, sync_operations, sync_operations_result } from "@prisma/client";
import { prisma } from "../prisma";

export const findSyncOperation = (deviceId: string, opId: string) => {
    return prisma.sync_operations.findFirst({
        where: { device_id: deviceId, op_id: opId },
    });
};

export const createSyncOperation = (data: {
    userId: bigint;
    deviceId: string;
    opId: string;
    entityType: "task" | "workspace_member";
    entityClientId?: string | null;
    operation: "create" | "update" | "status" | "delete" | "restore" | "revert";
    payload: Prisma.InputJsonValue;
    baseVersion?: bigint | null;
    result: sync_operations_result;
}) => {
    return prisma.sync_operations.create({
        data: {
            user_id: data.userId,
            device_id: data.deviceId,
            op_id: data.opId,
            entity_type: data.entityType,
            entity_client_id: data.entityClientId ?? null,
            operation: data.operation,
            payload: data.payload,
            base_version: data.baseVersion ?? null,
            result: data.result,
        },
    });
};