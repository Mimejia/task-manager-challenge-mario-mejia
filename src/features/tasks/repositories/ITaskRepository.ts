import type {
    Prisma,
    task_events_event_type,
    task_events_result,
    tasks,
    tasks_status,
} from "@prisma/client";

export type CreateTaskData = {
    workspaceId: bigint;
    ownerUserId: bigint;
    title: string;
    description: string | null;
    status: tasks_status;
    clientId?: string | null;
    clientRev?: bigint | null;
    deviceId?: string | null;
};

export type UpdateTaskData = {
    title?: string;
    description?: string | null;
    status?: tasks_status;
    updatedBy: bigint;
    deviceId?: string | null;
    incrementVersion?: boolean;
};

export type CreateTaskEventData = {
    taskId: bigint;
    eventType: task_events_event_type;
    performedBy: bigint;
    fromStatus?: tasks_status | null;
    toStatus?: tasks_status | null;
    details?: Prisma.InputJsonValue;
    baseVersion?: bigint | null;
    result?: task_events_result;
    deviceId?: string | null;
};

export type CreateTaskVersionData = {
    taskId: bigint;
    version: bigint;
    snapshot: Prisma.InputJsonValue;
    createdBy: bigint;
};

export interface ITaskRepository {
    listByWorkspaceIds(workspaceIds: bigint[]): Promise<tasks[]>;
    findByIdForUser(taskId: bigint, userId: bigint): Promise<tasks | null>;
    create(data: CreateTaskData): Promise<tasks>;
    updateById(taskId: bigint, data: UpdateTaskData): Promise<tasks>;
    softDeleteById(taskId: bigint, userId: bigint, deviceId?: string | null): Promise<tasks>;
    createTaskEvent(data: CreateTaskEventData): Promise<unknown>;
    createTaskVersion(data: CreateTaskVersionData): Promise<unknown>;
    withTransaction<T>(fn: (repo: ITaskRepository) => Promise<T>): Promise<T>;
}
