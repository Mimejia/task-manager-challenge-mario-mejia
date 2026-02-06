import type { task_events_event_type, tasks_status } from "@prisma/client";
import { HttpError } from "../../../utils/http-error";
import { toTaskSnapshot } from "../../../utils/task-snapshot";
import type { CreateTaskData } from "../repositories/ITaskRepository";
import type { ITaskRepository } from "../repositories/ITaskRepository";
import type { IWorkspaceRepository } from "../../workspaces/repositories/IWorkspaceRepository";

export type CreateUserTaskInput = {
    userId: bigint;
    title: string;
    description?: string | undefined | null;
    status?: tasks_status | undefined | null;
    workspaceId: bigint | null;
    clientId?: string | null | undefined;
    clientRev?: bigint | null | undefined;
    deviceId?: string | null | undefined;
};

export type UpdateUserTaskInput = {
    userId: bigint;
    taskId: bigint;
    title?: string | undefined | null;
    description?: string | undefined | null;
    status?: tasks_status | undefined | null;
    baseVersion?: bigint | null | undefined;
    deviceId?: string | null | undefined;
};

export class TaskService {
    constructor(
        private readonly taskRepository: ITaskRepository,
        private readonly workspaceRepository: IWorkspaceRepository
    ) { }

    async listUserTasks(userId: bigint) {
        const workspaceIds = await this.workspaceRepository.listWorkspaceIdsForUser(userId);
        if (workspaceIds.length === 0) return [];
        return this.taskRepository.listByWorkspaceIds(workspaceIds);
    }

    async createUserTask(input: CreateUserTaskInput) {
        const resolvedWorkspaceId =
            (input.workspaceId ?? undefined) ??
            (await this.workspaceRepository.findFirstWorkspaceIdForUser(input.userId)) ??
            (await this.workspaceRepository.createDefault(input.userId)).id;

        const description: string | null =
            typeof input.description === "string" ? input.description : null;

        const status: tasks_status = input.status ?? "pendiente";

        const workspace = await this.workspaceRepository.findById(resolvedWorkspaceId);
        if (!workspace) {
            throw new HttpError(404, "NOT_FOUND", "Workspace not found");
        }

        const member = await this.workspaceRepository.findMember(resolvedWorkspaceId, input.userId);
        const isOwner = workspace.owner_user_id === input.userId;
        if (!member && !isOwner) {
            throw new HttpError(403, "FORBIDDEN", "No workspace access");
        }
        if (member && !member.can_create && !isOwner) {
            throw new HttpError(403, "FORBIDDEN", "No create permission");
        }

        const taskData: CreateTaskData = {
            workspaceId: resolvedWorkspaceId,
            ownerUserId: input.userId,
            title: input.title,
            description,
            status,
            clientId: input.clientId ?? null,
            clientRev: input.clientRev ?? null,
            deviceId: input.deviceId ?? null,
        };

        return this.taskRepository.withTransaction(async (repo) => {
            const task = await repo.create(taskData);

            await repo.createTaskVersion({
                taskId: task.id,
                version: task.version,
                snapshot: toTaskSnapshot(task),
                createdBy: input.userId,
            });

            await repo.createTaskEvent({
                taskId: task.id,
                eventType: "created",
                performedBy: input.userId,
                result: "applied",
                deviceId: input.deviceId ?? null,
            });

            return task;
        });
    }

    async updateUserTask(input: UpdateUserTaskInput) {
        return this.taskRepository.withTransaction(async (repo) => {
            const existing = await repo.findByIdForUser(input.taskId, input.userId);
            if (!existing) {
                throw new HttpError(404, "NOT_FOUND", "Task not found");
            }

            const workspace = await this.workspaceRepository.findById(existing.workspace_id);
            if (!workspace) {
                throw new HttpError(404, "NOT_FOUND", "Workspace not found");
            }
            const member = await this.workspaceRepository.findMember(existing.workspace_id, input.userId);
            const isOwner = workspace.owner_user_id === input.userId;
            if (!member && !isOwner) {
                throw new HttpError(403, "FORBIDDEN", "No workspace access");
            }
            if (member && !member.can_edit && !isOwner) {
                throw new HttpError(403, "FORBIDDEN", "No edit permission");
            }
            if (
                input.baseVersion !== undefined &&
                input.baseVersion !== null &&
                existing.version !== input.baseVersion
            ) {
                await repo.createTaskEvent({
                    taskId: existing.id,
                    eventType: "updated",
                    performedBy: input.userId,
                    baseVersion: input.baseVersion ?? null,
                    result: "conflict",
                    deviceId: input.deviceId ?? null,
                    details: { server_version: existing.version.toString() },
                });
                throw new HttpError(409, "CONFLICT", "Version conflict");
            }

            const updateData: Parameters<typeof repo.updateById>[1] = {
                updatedBy: input.userId,
                incrementVersion: true,
            };

            if (typeof input.title === "string") {
                updateData.title = input.title;
            }
            if (typeof input.description === "string") {
                updateData.description = input.description;
            }
            if (typeof input.status === "string") {
                updateData.status = input.status;
            }
            if (typeof input.deviceId === "string") {
                updateData.deviceId = input.deviceId;
            }

            const updated = await repo.updateById(input.taskId, updateData);

            const eventType: task_events_event_type =
                input.status && input.status !== existing.status ? "status_changed" : "updated";

            await repo.createTaskEvent({
                taskId: updated.id,
                eventType,
                performedBy: input.userId,
                fromStatus: existing.status,
                toStatus: updated.status,
                baseVersion: input.baseVersion ?? null,
                result: "applied",
                deviceId: input.deviceId ?? null,
            });

            await repo.createTaskVersion({
                taskId: updated.id,
                version: updated.version,
                snapshot: toTaskSnapshot(updated),
                createdBy: input.userId,
            });

            return updated;
        });
    }

    async deleteUserTask(input: { userId: bigint; taskId: bigint; deviceId?: string }) {
        return this.taskRepository.withTransaction(async (repo) => {
            const existing = await repo.findByIdForUser(input.taskId, input.userId);
            if (!existing) {
                throw new HttpError(404, "NOT_FOUND", "Task not found");
            }

            const workspace = await this.workspaceRepository.findById(existing.workspace_id);
            if (!workspace) {
                throw new HttpError(404, "NOT_FOUND", "Workspace not found");
            }
            const member = await this.workspaceRepository.findMember(existing.workspace_id, input.userId);
            const isOwner = workspace.owner_user_id === input.userId;
            if (!member && !isOwner) {
                throw new HttpError(403, "FORBIDDEN", "No workspace access");
            }
            if (member && !member.can_delete && !isOwner) {
                throw new HttpError(403, "FORBIDDEN", "No delete permission");
            }

            const deleted = await repo.softDeleteById(
                input.taskId,
                input.userId,
                input.deviceId
            );

            await repo.createTaskEvent({
                taskId: deleted.id,
                eventType: "moved_to_trash",
                performedBy: input.userId,
                result: "applied",
                deviceId: input.deviceId ?? null,
            });

            await repo.createTaskVersion({
                taskId: deleted.id,
                version: deleted.version,
                snapshot: toTaskSnapshot(deleted),
                createdBy: input.userId,
            });
        });
    }
}
