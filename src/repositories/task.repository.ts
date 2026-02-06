import { Prisma, PrismaClient, tasks_status } from "@prisma/client";
import { prisma } from "../prisma";

const getClient = (tx?: Prisma.TransactionClient) => tx ?? prisma;

type DbClient = Prisma.TransactionClient | PrismaClient;

export const listTasksByUser = (userId: bigint, tx: DbClient = prisma) => {
  return tx.tasks.findMany({
    where: { owner_user_id: userId, is_deleted: false },
    orderBy: { updated_at: "desc" },
  });
};

export const listTasksByWorkspaceIds = (workspaceIds: bigint[], tx: DbClient = prisma) => {
  return tx.tasks.findMany({
    where: { workspace_id: { in: workspaceIds }, is_deleted: false },
    orderBy: { updated_at: "desc" },
  });
};

export const findTaskByIdForUser = (taskId: bigint, userId: bigint, tx: DbClient = prisma) => {
  return tx.tasks.findFirst({
    where: { id: taskId, owner_user_id: userId, is_deleted: false },
  });
};

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

export const createTask = async (data: CreateTaskData, tx: DbClient = prisma) => {
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

  return tx.tasks.create({ data: createData });
};

export const updateTaskById = async (taskId: bigint, data: UpdateTaskData, tx: DbClient = prisma) => {
  const updateData: Prisma.tasksUncheckedUpdateInput = {
    updated_by: data.updatedBy,
    updated_at: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.deviceId !== undefined) updateData.last_modified_device_id = data.deviceId;
  if (data.incrementVersion) updateData.version = { increment: 1 };

  return tx.tasks.update({
    where: { id: taskId },
    data: updateData,
  });
};

export const softDeleteTaskById = async (
  taskId: bigint,
  userId: bigint,
  deviceId?: string | null,
  tx: DbClient = prisma
) => {
  const updateData: Prisma.tasksUncheckedUpdateInput = {
    is_deleted: true,
    deleted_at: new Date(),
    deleted_by: userId,
    updated_by: userId,
    updated_at: new Date(),
    version: { increment: 1 },
  };

  if (deviceId !== undefined) updateData.last_modified_device_id = deviceId;

  return tx.tasks.update({
    where: { id: taskId },
    data: updateData,
  });
};
