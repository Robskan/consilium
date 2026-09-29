import "server-only";

import {requirePermission} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";
import { audit, type AuditQuery } from "@/lib/audit/index";
import {AuditTrailAction, Permission} from "@/generated/prisma/enums";

export async function listAuditEvents(input: AuditQuery = {}) {
    const session = await requirePermission([Permission.AUDIT_VIEW]);

    const requestedPage = Number.isFinite(input.page) ? Math.floor(input.page!) : 1;
    const requestedPageSize = Number.isFinite(input.pageSize)
        ? Math.floor(input.pageSize!)
        : 50;
    const page = Math.max(requestedPage, 1);
    const pageSize = Math.min(Math.max(requestedPageSize, 1), 100);

    const where = {
        ...(input.userId && {
            userId: input.userId,
        }),

        ...(input.action && {
            action: input.action,
        }),

        ...(input.from || input.to
            ? {
                timestamp: {
                    ...(input.from && { gte: input.from }),
                    ...(input.to && { lte: input.to }),
                },
            }
            : {}),

        ...(input.targetType || input.targetId
            ? {
                auditTrailEffects: {
                    some: {
                        ...(input.targetType && {
                            targetType: input.targetType,
                        }),
                        ...(input.targetId && {
                            targetId: input.targetId,
                        }),
                    },
                },
            }
            : {}),
    };

    const {events, total} = await prisma.$transaction(async (tx) => {
        const events = await tx.auditTrailEvent.findMany({
            where,
            orderBy: [
                { timestamp: "desc" },
                { id: "desc" },
            ],
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        discordID: true,
                    },
                },
                auditTrailEffects: true,
            },
        });
        const total = await tx.auditTrailEvent.count({where});
        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.AUDIT_VIEWED,
            metadata: {
                filters: {
                    userId: input.userId,
                    action: input.action,
                    targetType: input.targetType,
                    targetId: input.targetId,
                    from: input.from?.toISOString(),
                    to: input.to?.toISOString(),
                },
            },
        });
        return {events, total};
    });

    return {
        events,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
