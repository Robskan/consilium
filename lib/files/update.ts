import "server-only";

import {canAccessFileWithAccess, requirePermissionWithAccess} from "@/lib/permissions";
import {AuditTargetType, AuditTrailAction, Permission} from "@/generated/prisma/enums";
import {prisma} from "@/lib/prisma";
import {audit} from "@/lib/audit";

interface UpdateFileInput {
    id: number;
    name?: string;
    description?: string;
    requiredRoleIds?: number[];
}

interface UpdateVersionInput {
    id: number;
    notes?: string;
    hidden?: boolean;
}


export async function updateFile(input: UpdateFileInput) {
    const {session, access} = await requirePermissionWithAccess([Permission.UPDATE]);

    const { id, name, description, requiredRoleIds } = input;

    return prisma.$transaction(async (tx) => {
        const before = await tx.file.findUnique({
            where: {
                id: id,
            },
            include: {
                requiredRoles: true,
            },
        });

        if (!before || !canAccessFileWithAccess(access, before)) {
            throw new Error("File not found or you do not have permission to update it.");
        }

        const updated = await tx.file.update({
            where: {
                id: id,
            },
            data: {
                name,
                description,
                requiredRoles: {
                    set: requiredRoleIds?.map((id) => ({
                        id,
                    })),
                },
            },
            include: {
                requiredRoles: true,
            }
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.FILE_UPDATED,
            effects: [
                {
                    targetType: AuditTargetType.FILE,
                    targetId: String(id),

                    before: {
                        name: before.name,
                        description: before.description,
                        requiredRoles: before.requiredRoles.map(r => r.id),
                    },

                    after: {
                        name: updated.name,
                        description: updated.description,
                        requiredRoles: updated.requiredRoles.map(r => r.id),
                    },
                },
            ],
        });

        return updated;
    });
}

export async function updateVersion(input: UpdateVersionInput) {
    const {session, access} = await requirePermissionWithAccess([Permission.UPDATE]);

    const { id, notes, hidden } = input;

    return prisma.$transaction(async (tx) => {
        const before = (await tx.version.findUnique({
            where: {
                id: id,
            },
            include: {
                file: {
                    include: {
                        requiredRoles: true
                    }
                },
            }
        })) ?? null;

        if (!before || !canAccessFileWithAccess(access, before.file)) {
            throw new Error("File not found or you do not have permission to update it.");
        }

        const updated = await tx.version.update({
            where: {
                id: id,
            },
            data: {
                notes,
                hidden,
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.VERSION_UPDATED,
            effects: [
                {
                    targetType: AuditTargetType.VERSION,
                    targetId: String(id),

                    before: {
                        notes: before.notes,
                        hidden: before.hidden,
                    },

                    after: {
                        notes: updated.notes,
                        hidden: updated.hidden,
                    },
                },
            ],
        });
        return updated;
    });
}
