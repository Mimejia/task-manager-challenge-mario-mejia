import { tasks } from "@prisma/client";

export const toTaskDTO = (task: tasks) => ({
  id: Number(task.id),
  title: task.title,
  description: task.description,
  status: task.status,
  user_id: Number(task.owner_user_id),
  workspace_id: Number(task.workspace_id),
  client_id: task.client_id,
  client_rev: Number(task.client_rev),
  version: Number(task.version),
  last_modified_at: task.last_modified_at,
  last_modified_device_id: task.last_modified_device_id,
  created_at: task.created_at,
  updated_at: task.updated_at,
});
