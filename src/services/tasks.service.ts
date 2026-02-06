import { PrismaTaskRepository } from "../features/tasks/repositories/PrismaTaskRepository";
import { TaskService } from "../features/tasks/services/TaskService";
import { PrismaWorkspaceRepository } from "../features/workspaces/repositories/PrismaWorkspaceRepository";
import type { CreateUserTaskInput, UpdateUserTaskInput } from "../features/tasks/services/TaskService";

const taskService = new TaskService(new PrismaTaskRepository(), new PrismaWorkspaceRepository());

export type { CreateUserTaskInput, UpdateUserTaskInput };

export const listUserTasks = (userId: bigint) => taskService.listUserTasks(userId);

export const createUserTask = (input: CreateUserTaskInput) => taskService.createUserTask(input);

export const updateUserTask = (input: UpdateUserTaskInput) => taskService.updateUserTask(input);

export const deleteUserTask = (input: { userId: bigint; taskId: bigint; deviceId?: string }) =>
    taskService.deleteUserTask(input);
