import {requirePermission} from "@/lib/permissions";
import {Permission} from "@/generated/prisma/enums";
import {prisma} from "@/lib/prisma";

export async function deleteFile(id: number) {
    await requirePermission([Permission.DELETE]);

    return await prisma.file.update({
        where: {
            id: id,
        },
        data: {
            deletedAt: new Date().toISOString(),
        },
    });
}

export async function deleteVersion(id: number) {
    await requirePermission([Permission.DELETE]);

    return await prisma.version.update({
        where: {
            id: id,
        },
        data: {
            deletedAt: new Date().toISOString(),
        },
    });
}

export async function restoreFile(id: number) {
    await requirePermission([Permission.DELETE]);

    return await prisma.file.update({
        where: {
            id: id,
        },
        data: {
            deletedAt: null,
        },
    });
}

export async function restoreVersion(id: number) {
    await requirePermission([Permission.DELETE]);

    return await prisma.version.update({
        where: {
            id: id,
        },
        data: {
            deletedAt: null,
        },
    });
}