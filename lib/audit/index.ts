import {
    AuditTargetType,
    AuditTrailAction,
} from "@/generated/prisma/enums";
import type { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";
import type { Prisma } from "@/generated/prisma/client";

interface AuditEffect {
    targetType: AuditTargetType;
    targetId: string;
    before?: InputJsonValue;
    after?: InputJsonValue;
}

interface AuditInput {
    userId: string;
    ip: string | null;
    ua: string | null;
    action: AuditTrailAction;
    effects?: AuditEffect[];
    metadata?: InputJsonValue;
}

export interface AuditQuery {
    page?: number;
    pageSize?: number;

    userId?: string;
    action?: AuditTrailAction;
    targetType?: AuditTargetType;
    targetId?: string;

    from?: Date;
    to?: Date;
}

export async function audit(
    tx: Prisma.TransactionClient,
    input: AuditInput,
) {
    return tx.auditTrailEvent.create({
        data: {
            userId: input.userId,
            ip: input.ip,
            ua: input.ua,
            action: input.action,
            auditTrailEffects: {
                create: input.effects ?? [],
            },
            metadata: input.metadata ?? undefined,
        },
    });
}