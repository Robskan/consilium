import "server-only";

import {prisma} from "@/lib/prisma";
import {storage} from "@/lib/storage";
import {Permission} from "@/generated/prisma/enums";
import {canAccessFile, requirePermission} from "@/lib/permissions";
import semver from "semver";
import mime from 'mime-types';
import {audit} from "@/lib/audit";

interface CreateFileInput {
    name: string;
    description: string;
    requiredRoleIds: number[];

    version: string;
    filename: string;
    data: Buffer;
    mimeType: string;
    notes: string;
}

interface CreateVersionInput {
    fileId: number;
    version: string;
    filename: string;
    data: Buffer;
    notes: string;
}

export async function createFile(input: CreateFileInput) {
    const session = await requirePermission([Permission.CREATE]);

    const { name, description, filename, data, mimeType, notes } = input;
    const requiredRoleIds = [...new Set(input.requiredRoleIds)];
    const version = semver.valid(semver.coerce(input.version));
    if (!version) {
        throw new Error(`Invalid version`);
    }

    const roles = await prisma.role.findMany({
        where: {
            id: {
                in: requiredRoleIds,
            },
        },
        select: {
            id: true,
        },
    });

    if (roles.length !== requiredRoleIds.length) {
        throw new Error("One or more selected roles do not exist");
    }

    const stored = await storage.save(data, filename);

    try {
        return await prisma.$transaction(async (tx) => {
            const record = await tx.file.create({
                data: {
                    name,
                    description,

                    requiredRoles: {
                        connect: roles.map(role => ({ id: role.id })),
                    },

                    versions: {
                        create: {
                            version: version,
                            filename,
                            fileSize: stored.fileSize,
                            storageKey: stored.storageKey,
                            mimeType,
                            notes,
                        },
                    },
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
                action: "FILE_CREATED",
                effects: [
                    {
                        targetType: "FILE",
                        targetId: String(record.id),
                        after: {
                            name: record.name,
                            description: record.description,
                            requiredRoles: record.requiredRoles.map(role => role.id),
                            version: record.versions[0].version,
                        },
                    },
                    {
                        targetType: "VERSION",
                        targetId: String(record.versions[0].id),
                        after: {
                            version: record.versions[0].version,
                            filename: record.versions[0].filename,
                            fileSize: record.versions[0].fileSize.toString(),
                            storageKey: record.versions[0].storageKey,
                            mimeType: record.versions[0].mimeType,
                            notes: record.versions[0].notes,
                        }
                    }
                ],
            });

            return record;
        });
    } catch (error) {
        // Database creation failed, so don't leave an orphaned file.
        await storage.delete(stored.storageKey);

        throw error;
    }
}

export async function createVersion(input: CreateVersionInput) {
    const session = await requirePermission([Permission.CREATE]);

    const { fileId, filename, data, notes } = input;
    const version = semver.valid(semver.coerce(input.version));

    if (!version) {
        throw new Error(`Invalid version`);
    }

    if (!(await canAccessFile(null, fileId))) {
        throw new Error("File not found or you do not have permission to access it.");
    }

    const mimeType = mime.lookup(filename) || "application/octet-stream";

    const stored = await storage.save(
        data,
        filename,
    );

    try {
        return await prisma.$transaction(async (tx) => {
            const record = await tx.version.create({
                data: {
                    fileId,
                    version,
                    filename,
                    fileSize: stored.fileSize,
                    storageKey: stored.storageKey,
                    mimeType,
                    notes: notes,
                },
            });

            await audit(tx, {
                userId: session.user.id,
                ip: session.session.ipAddress ?? null,
                ua: session.session.userAgent ?? null,
                action: "VERSION_CREATED",
                effects: [
                    {
                        targetType: "VERSION",
                        targetId: String(record.id),
                        after: {
                            version: record.version,
                            filename: record.filename,
                            fileSize: record.fileSize.toString(),
                            storageKey: record.storageKey,
                            mimeType: record.mimeType,
                            notes: record.notes,
                        }
                    }
                ],
            });
            return record;
        });
    } catch (error) {
        await storage.delete(stored.storageKey);
        throw error;
    }
}