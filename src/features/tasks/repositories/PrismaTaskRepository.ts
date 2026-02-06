import type { Prisma, PrismaClient, tasks, task_events } from "@prisma/client";
import { prisma } from "../../../prisma";
import type {
    CreateTaskData,
    CreateTaskEventData,
    CreateTaskVersionData,
    ITaskRepository,
    UpdateTaskData,
} from "./ITaskRepository";

export class PrismaTaskRepository implements ITaskRepository {
    constructor(private readonly client: PrismaClient | Prisma.TransactionClient = prisma) { }

    async listByWorkspaceIds(workspaceIds: bigint[]): Promise<tasks[]> {
        return this.client.tasks.findMany({
            where: { workspace_id: { in: workspaceIds }, is_deleted: false },
            orderBy: { updated_at: "desc" },
        });
    }

    async findByIdForUser(taskId: bigint, userId: bigint): Promise<tasks | null> {
        return this.client.tasks.findFirst({
            where: { id: taskId, owner_user_id: userId, is_deleted: false },
        });
    }

    async create(data: CreateTaskData): Promise<tasks> {
        const createData: Prisma.tasksUncheckedCreateInput = {
            workspace_id: data.workspaceId,
            owner_user_id: data.ownerUserId,
            title: data.title,
            description: data.description ?? null,
            status: data.status ?? "pendiente",
            created_by: data.ownerUserId,
            updated_by: data.ownerUserId,
        };

        if (data.clientId !== undefined) createData.client_id = data.clientId;
        if (data.clientRev !== undefined && data.clientRev !== null) createData.client_rev = data.clientRev;
        if (data.deviceId !== undefined) createData.last_modified_device_id = data.deviceId;

        return this.client.tasks.create({ data: createData });
    }

    async updateById(taskId: bigint, data: UpdateTaskData): Promise<tasks> {
        const updateData: Prisma.tasksUncheckedUpdateInput = {
            updated_by: data.updatedBy,
            updated_at: new Date(),
        };

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.deviceId !== undefined) updateData.last_modified_device_id = data.deviceId;
        if (data.incrementVersion) updateData.version = { increment: 1 };

        return this.client.tasks.update({
            where: { id: taskId },
            data: updateData,
        });
    }

    async softDeleteById(taskId: bigint, userId: bigint, deviceId?: string | null): Promise<tasks> {
        const updateData: Prisma.tasksUncheckedUpdateInput = {
            is_deleted: true,
            deleted_at: new Date(),
            deleted_by: userId,
            updated_by: userId,
            updated_at: new Date(),
            version: { increment: 1 },
        };

        if (deviceId !== undefined) updateData.last_modified_device_id = deviceId;

        return this.client.tasks.update({
            where: { id: taskId },
            data: updateData,
        });
    }

    async createTaskEvent(data: CreateTaskEventData): Promise<task_events> {
        return this.client.task_events.create({
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
    }

    async createTaskVersion(data: CreateTaskVersionData): Promise<unknown> {
        return this.client.task_versions.create({
            data: {
                task_id: data.taskId,
                version: data.version,
                snapshot: data.snapshot,
                created_by: data.createdBy,
            },
        });
    }

    async withTransaction<T>(fn: (repo: ITaskRepository) => Promise<T>): Promise<T> {
        const clientWithTx = this.client as PrismaClient;
        if (typeof clientWithTx.$transaction === "function") {
            return clientWithTx.$transaction(async (tx) => fn(new PrismaTaskRepository(tx)));
        }

        return fn(this);
    }
}
