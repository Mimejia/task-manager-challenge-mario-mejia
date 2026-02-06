import { task_events_event_type, tasks_status } from "@prisma/client";
import { HttpError } from "../utils/http-error";
import {
    createTask,
    findTaskByIdForUser,
    listTasksByWorkspaceIds,
    softDeleteTaskById,
    updateTaskById,
} from "../repositories/task.repository";
import {
    createDefaultWorkspace,
    findFirstWorkspaceIdForUser,
    findWorkspaceById,
    findWorkspaceMember,
    listWorkspaceIdsForUser,
} from "../repositories/workspace.repository";
import { prisma } from "../prisma";
import { createTaskEvent, createTaskVersion } from "../repositories/task-history.repository";
import { toTaskSnapshot } from "../utils/task-snapshot";

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

export const listUserTasks = async (userId: bigint) => {
    const workspaceIds = await listWorkspaceIdsForUser(userId);
    if (workspaceIds.length === 0) return [];
    return listTasksByWorkspaceIds(workspaceIds);
};

export const createUserTask = async (input: CreateUserTaskInput) => {
    const resolvedWorkspaceId =
        (input.workspaceId ?? undefined) ??
        (await findFirstWorkspaceIdForUser(input.userId)) ??
        (await createDefaultWorkspace(input.userId)).id;

    const description: string | null =
        typeof input.description === "string" ? input.description : null;

    const status: tasks_status =
        input.status ?? "pendiente";

    const workspace = await findWorkspaceById(resolvedWorkspaceId);
    if (!workspace) {
        throw new HttpError(404, "NOT_FOUND", "Workspace not found");
    }

    const member = await findWorkspaceMember(resolvedWorkspaceId, input.userId);
    const isOwner = workspace.owner_user_id === input.userId;
    if (!member && !isOwner) {
        throw new HttpError(403, "FORBIDDEN", "No workspace access");
    }
    if (member && !member.can_create && !isOwner) {
        throw new HttpError(403, "FORBIDDEN", "No create permission");
    }

    const taskData: Parameters<typeof createTask>[0] = {
        workspaceId: resolvedWorkspaceId,
        ownerUserId: input.userId,
        title: input.title,
        description,
        status,
        clientId: input.clientId ?? null,
        clientRev: input.clientRev ?? null,
        deviceId: input.deviceId ?? null,
    };

    return prisma.$transaction(async (tx) => {
        const task = await createTask(taskData, tx);

        await createTaskVersion(
            {
                taskId: task.id,
                version: task.version,
                snapshot: toTaskSnapshot(task),
                createdBy: input.userId,
            },
            tx
        );

        await createTaskEvent(
            {
                taskId: task.id,
                eventType: "created",
                performedBy: input.userId,
                result: "applied",
                deviceId: input.deviceId ?? null,
            },
            tx
        );

        return task;
    });
};

export const updateUserTask = async (input: UpdateUserTaskInput) => {
    return prisma.$transaction(async (tx) => {
        const existing = await findTaskByIdForUser(input.taskId, input.userId, tx);
        if (!existing) {
            throw new HttpError(404, "NOT_FOUND", "Task not found");
        }

        const workspace = await findWorkspaceById(existing.workspace_id);
        if (!workspace) {
            throw new HttpError(404, "NOT_FOUND", "Workspace not found");
        }
        const member = await findWorkspaceMember(existing.workspace_id, input.userId);
        const isOwner = workspace.owner_user_id === input.userId;
        if (!member && !isOwner) {
            throw new HttpError(403, "FORBIDDEN", "No workspace access");
        }
        if (member && !member.can_edit && !isOwner) {
            throw new HttpError(403, "FORBIDDEN", "No edit permission");
        }
        if (input.baseVersion !== undefined && input.baseVersion !== null && existing.version !== input.baseVersion) {
            await createTaskEvent(
                {
                    taskId: existing.id,
                    eventType: "updated",
                    performedBy: input.userId,
                    baseVersion: input.baseVersion ?? null,
                    result: "conflict",
                    deviceId: input.deviceId ?? null,
                    details: { server_version: existing.version.toString() },
                },
                tx
            );
            throw new HttpError(409, "CONFLICT", "Version conflict");
        }

        const updateData: Parameters<typeof updateTaskById>[1] = {
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

        const updated = await updateTaskById(input.taskId, updateData, tx);

        const eventType: task_events_event_type =
            input.status && input.status !== existing.status ? "status_changed" : "updated";

        await createTaskEvent(
            {
                taskId: updated.id,
                eventType,
                performedBy: input.userId,
                fromStatus: existing.status,
                toStatus: updated.status,
                baseVersion: input.baseVersion ?? null,
                result: "applied",
                deviceId: input.deviceId ?? null,
            },
            tx
        );

        await createTaskVersion(
            {
                taskId: updated.id,
                version: updated.version,
                snapshot: toTaskSnapshot(updated),
                createdBy: input.userId,
            },
            tx
        );

        return updated;
    });
};

export const deleteUserTask = async (input: { userId: bigint; taskId: bigint; deviceId?: string }) => {
    return prisma.$transaction(async (tx) => {
        const existing = await findTaskByIdForUser(input.taskId, input.userId, tx);
        if (!existing) {
            throw new HttpError(404, "NOT_FOUND", "Task not found");
        }

        const workspace = await findWorkspaceById(existing.workspace_id);
        if (!workspace) {
            throw new HttpError(404, "NOT_FOUND", "Workspace not found");
        }
        const member = await findWorkspaceMember(existing.workspace_id, input.userId);
        const isOwner = workspace.owner_user_id === input.userId;
        if (!member && !isOwner) {
            throw new HttpError(403, "FORBIDDEN", "No workspace access");
        }
        if (member && !member.can_delete && !isOwner) {
            throw new HttpError(403, "FORBIDDEN", "No delete permission");
        }

        const deleted = await softDeleteTaskById(input.taskId, input.userId, input.deviceId, tx);

        await createTaskEvent(
            {
                taskId: deleted.id,
                eventType: "moved_to_trash",
                performedBy: input.userId,
                result: "applied",
                deviceId: input.deviceId ?? null,
            },
            tx
        );

        await createTaskVersion(
            {
                taskId: deleted.id,
                version: deleted.version,
                snapshot: toTaskSnapshot(deleted),
                createdBy: input.userId,
            },
            tx
        );
    });
};
