import type { Prisma, PrismaClient, sync_operations } from "@prisma/client";
import { prisma } from "../../../prisma";
import type { CreateSyncOperationData, ISyncRepository } from "./ISyncRepository";

export class PrismaSyncRepository implements ISyncRepository {
    constructor(private readonly client: PrismaClient | Prisma.TransactionClient = prisma) { }

    async findByDeviceAndOpId(deviceId: string, opId: string): Promise<sync_operations | null> {
        return this.client.sync_operations.findFirst({
            where: { device_id: deviceId, op_id: opId },
        });
    }

    async create(data: CreateSyncOperationData): Promise<sync_operations> {
        return this.client.sync_operations.create({
            data: {
                user_id: data.userId,
                device_id: data.deviceId,
                op_id: data.opId,
                entity_type: data.entityType,
                entity_client_id: data.entityClientId ?? null,
                operation: data.operation,
                payload: data.payload,
                base_version: data.baseVersion ?? null,
                result: data.result,
            },
        });
    }

    async withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        const clientWithTx = this.client as PrismaClient;
        if (typeof clientWithTx.$transaction === "function") {
            return clientWithTx.$transaction((tx) => fn(tx));
        }

        return fn(this.client as Prisma.TransactionClient);
    }
}
