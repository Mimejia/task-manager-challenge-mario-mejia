import { Prisma, task_events_event_type, task_events_result, tasks_status } from "@prisma/client";
import { prisma } from "../prisma";

const getClient = (tx?: Prisma.TransactionClient) => tx ?? prisma;

export const createTaskEvent = (data: {
    taskId: bigint;
    eventType: task_events_event_type;
    performedBy: bigint;
    fromStatus?: tasks_status | null;
    toStatus?: tasks_status | null;
    details?: Prisma.InputJsonValue;
    baseVersion?: bigint | null;
    result?: task_events_result;
    deviceId?: string | null;
}, tx?: Prisma.TransactionClient) => {
    return getClient(tx).task_events.create({
        data: {
            task_id: data.taskId,
            event_type: data.eventType,
            performed_by: data.performedBy,
            from_status: data.fromStatus ?? null,
            to_status: data.toStatus ?? null,
            details: data.details,
            base_version: data.baseVersion ?? null,
            result: data.result ?? "applied",
            device_id: data.deviceId ?? null,
        },
    });
};

export const createTaskVersion = (data: {
    taskId: bigint;
    version: bigint;
    snapshot: Prisma.InputJsonValue;
    createdBy: bigint;
}, tx?: Prisma.TransactionClient) => {
    return getClient(tx).task_versions.create({
        data: {
            task_id: data.taskId,
            version: data.version,
            snapshot: data.snapshot,
            created_by: data.createdBy,
        },
    });
};