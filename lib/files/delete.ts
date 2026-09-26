import "server-only";

import {canAccessFileObject, requirePermission} from "@/lib/permissions";
import {AuditTargetType, AuditTrailAction, Permission} from "@/generated/prisma/enums";
import {prisma} from "@/lib/prisma";
import {audit} from "@/lib/audit";

export async function deleteFile(id: number) {
    const session = (await requirePermission([Permission.DELETE]));

    return prisma.$transaction(async (tx) => {
        const file = await tx.file.findUnique({
            where: {
                id: id,
            },
            include: {
                versions: true,
                requiredRoles: true,
            },
        });

        if(!(await canAccessFileObject(session.user.id, file))) {
            throw new Error("File not found or you do not have permission to delete it.");
        }

        const deleted = await tx.file.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date().toISOString(),
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.FILE_DELETED,
            effects: [
                {
                    targetType: AuditTargetType.FILE,
                    targetId: String(id),

                    before: {
                        name: file!.name,
                        description: file!.description,
                        requiredRoles: file!.requiredRoles.map(role => role.id),
                        versions: file!.versions.map(version => ({
                            id: version.id,
                            version: version.version,
                            filename: version.filename,
                            storageKey: version.storageKey,
                        })),
                    },

                    after: {
                        deletedAt: deleted.deletedAt?.toISOString()
                    },
                },
            ],
        });

        return deleted;
    });
}

export async function deleteVersion(id: number) {
    const session = await requirePermission([Permission.DELETE]);

    return prisma.$transaction(async (tx) => {
        const version = (await tx.version.findUnique({
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

        if (!(await canAccessFileObject(session.user.id, version?.file ?? null))) {
            throw new Error("File not found or you do not have permission to delete it.");
        }

        const deleted = await tx.version.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date().toISOString(),
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.VERSION_DELETED,
            effects: [
                {
                    targetType: AuditTargetType.VERSION,
                    targetId: String(id),

                    before: {
                        version: version!.version,
                        filename: version!.filename,
                        fileSize: version!.fileSize.toString(),
                        storageKey: version!.storageKey,
                        mimeType: version!.mimeType,
                        notes: version!.notes,
                    },

                    after: {
                        deletedAt: deleted.deletedAt?.toISOString()
                    },
                },
            ],
        });
        return deleted;
    });
}

export async function restoreFile(id: number) {
    const session = await requirePermission([Permission.DELETE]);

    return prisma.$transaction(async (tx) => {
        const file = await tx.file.findUnique({
            where: {
                id: id,
            },
            include: {
                versions: true,
                requiredRoles: true,
            },
        });

        if(!(await canAccessFileObject(session.user.id, file, true))) {
            throw new Error("File not found or you do not have permission to restore it.");
        }

        const undeleted = await tx.file.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: null,
            },
            include: {
                versions: true,
                requiredRoles: true,
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.FILE_UNDELETED,
            effects: [
                {
                    targetType: AuditTargetType.FILE,
                    targetId: String(id),

                    before: {
                        deletedAt: file!.deletedAt?.toISOString()
                    },

                    after: {
                        name: undeleted!.name,
                        description: undeleted!.description,
                        requiredRoles: undeleted!.requiredRoles.map(role => role.id),
                        versions: undeleted!.versions.map(version => ({
                            id: version.id,
                            version: version.version,
                            filename: version.filename,
                            storageKey: version.storageKey,
                        })),
                    },
                },
            ],
        });

        return undeleted;
    });
}

export async function restoreVersion(id: number) {
    const session = await requirePermission([Permission.DELETE]);

    return prisma.$transaction(async (tx) => {
        const version = (await tx.version.findUnique({
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

        if (!(await canAccessFileObject(session.user.id, version?.file ?? null, true))) {
            throw new Error("File not found or you do not have permission to restore it.");
        }

        const undeleted = await tx.version.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: null,
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.VERSION_UNDELETED,
            effects: [
                {
                    targetType: AuditTargetType.VERSION,
                    targetId: String(id),

                    before: {
                        deletedAt: version!.deletedAt?.toISOString()
                    },

                    after: {
                        version: undeleted!.version,
                        filename: undeleted!.filename,
                        fileSize: undeleted!.fileSize.toString(),
                        storageKey: undeleted!.storageKey,
                        mimeType: undeleted!.mimeType,
                        notes: undeleted!.notes,
                    },
                },
            ],
        });
        return undeleted;
    });
}