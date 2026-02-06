import { PrismaUserRepository } from "../features/auth/repositories/PrismaUserRepository";
import { AuthService } from "../features/auth/services/AuthService";
import { PrismaWorkspaceRepository } from "../features/workspaces/repositories/PrismaWorkspaceRepository";

const authService = new AuthService(new PrismaUserRepository(), new PrismaWorkspaceRepository());

export const registerUser = (input: { email: string; fullName: string; password: string }) =>
    authService.registerUser(input);

export const loginUser = (input: { email: string; password: string }) =>
    authService.loginUser(input);
