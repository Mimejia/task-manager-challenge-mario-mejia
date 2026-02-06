import { tasks } from "@prisma/client";

export const toTaskSnapshot = (task: tasks) => ({
    id: task.id.toString(),
    client_id: task.client_id,
    client_rev: task.client_rev.toString(),
    workspace_id: task.workspace_id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    owner_user_id: task.owner_user_id.toString(),
    assigned_user_id: task.assigned_user_id?.toString() ?? null,
    is_deleted: task.is_deleted,
    deleted_at: task.deleted_at ? task.deleted_at.toISOString() : null,
    deleted_by: task.deleted_by?.toString() ?? null,
    version: task.version.toString(),
    last_modified_device_id: task.last_modified_device_id,
    last_modified_at: task.last_modified_at.toISOString(),
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
});