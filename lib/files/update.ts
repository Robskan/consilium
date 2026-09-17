import {canAccessFile, requirePermission} from "@/lib/permissions";
import {Permission} from "@/generated/prisma/enums";
import semver from "semver";
import mime from "mime-types";
import {storage} from "@/lib/storage";
import {prisma} from "@/lib/prisma";

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
    await requirePermission([Permission.UPDATE]);

    if (!(await canAccessFile(null, input.id))) {
        throw new Error("File not found or you do not have permission to update it.");
    }

    const { id, name, description, requiredRoleIds } = input;
    return await prisma.file.update({
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
    });
}

export async function updateVersion(input: UpdateVersionInput) {
    await requirePermission([Permission.UPDATE]);

    const fileId = (await prisma.version.findUnique({
        where: {
            id: input.id,
        },
        select: {
            fileId: true,
        },
    }))?.fileId;

    if (!(await canAccessFile(null, fileId))) {
        throw new Error("File not found or you do not have permission to update it.");
    }

    const { id, notes, hidden } = input;
    return await prisma.version.update({
        where: {
            id: id,
        },
        data: {
            notes,
            hidden,
        },
    });
}