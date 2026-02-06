import { HttpError } from "../../../utils/http-error";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { signAccessToken } from "../../../utils/token";
import type { IUserRepository } from "../repositories/IUserRepository";
import type { IWorkspaceRepository } from "../../workspaces/repositories/IWorkspaceRepository";

export class AuthService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly workspaceRepository: IWorkspaceRepository
    ) { }

    async registerUser(input: { email: string; fullName: string; password: string }) {
        const existing = await this.userRepository.findByEmail(input.email);
        if (existing) {
            throw new HttpError(409, "EMAIL_TAKEN", "Email already exists");
        }

        const passwordHash = await hashPassword(input.password);
        const user = await this.userRepository.createLocalUser({
            email: input.email,
            fullName: input.fullName,
            passwordHash,
        });

        const role = await this.userRepository.ensureRole("user", "Usuario");
        await this.userRepository.assignRoleToUser(user.id, role.id);

        await this.workspaceRepository.createDefault(user.id);

        return { user };
    }

    async loginUser(input: { email: string; password: string }) {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user || !user.password_hash) {
            throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid credentials");
        }

        const ok = await verifyPassword(input.password, user.password_hash);
        if (!ok) {
            throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid credentials");
        }

        const accessToken = signAccessToken({ userId: Number(user.id) });

        return { user, accessToken };
    }
}
