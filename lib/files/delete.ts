import "server-only";

import {canAccessFileWithAccess, requirePermissionWithAccess} from "@/lib/permissions";
import {AuditTargetType, AuditTrailAction, Permission} from "@/generated/prisma/enums";
import {prisma} from "@/lib/prisma";
import {audit} from "@/lib/audit";

function fileSnapshot(file: {
    name: string;
    description: string;
    requiredRoles: {id: number}[];
    versions: {id: number; version: string; filename: string; storageKey: string}[];
}) {
    return {
        name: file.name,
        description: file.description,
        requiredRoles: file.requiredRoles.map((role) => role.id),
        versions: file.versions.map(({id, version, filename, storageKey}) => ({id, version, filename, storageKey})),
    };
}

function versionSnapshot(version: {
    version: string;
    filename: string;
    fileSize: bigint;
    storageKey: string;
    mimeType: string;
    notes: string;
}) {
    return {
        version: version.version,
        filename: version.filename,
        fileSize: version.fileSize.toString(),
        storageKey: version.storageKey,
        mimeType: version.mimeType,
        notes: version.notes,
    };
}

export async function deleteFile(id: number) {
    const {session, access} = await requirePermissionWithAccess([Permission.DELETE]);

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

        if (!file || !canAccessFileWithAccess(access, file)) {
            throw new Error("File not found or you do not have permission to delete it.");
        }

        const deleted = await tx.file.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date(),
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

                before: fileSnapshot(file),

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
    const {session, access} = await requirePermissionWithAccess([Permission.DELETE]);

    return prisma.$transaction(async (tx) => {
        const version = await tx.version.findUnique({
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
        });

        if (!version || !canAccessFileWithAccess(access, version.file)) {
            throw new Error("File not found or you do not have permission to delete it.");
        }

        const deleted = await tx.version.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date(),
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

                    before: versionSnapshot(version),

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
    const {session, access} = await requirePermissionWithAccess([Permission.DELETE]);

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

        if (!file || !canAccessFileWithAccess(access, file, true)) {
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
                        deletedAt: file.deletedAt?.toISOString()
                    },

                    after: fileSnapshot(undeleted),
                },
            ],
        });

        return undeleted;
    });
}

export async function restoreVersion(id: number) {
    const {session, access} = await requirePermissionWithAccess([Permission.DELETE]);

    return prisma.$transaction(async (tx) => {
        const version = await tx.version.findUnique({
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
        });

        if (!version || !canAccessFileWithAccess(access, version.file, true)) {
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
                        deletedAt: version.deletedAt?.toISOString()
                    },

                    after: versionSnapshot(undeleted),
                },
            ],
        });
        return undeleted;
    });
}
