import "server-only";

import {Permission} from "@/generated/prisma/enums";
import {prisma} from "@/lib/prisma";
import {canAccessFileWithAccess, requirePermissionWithAccess} from "@/lib/permissions";

function fileAccessWhere(roleIds: number[], readAll: boolean) {
    if (readAll) return {};

    return {
        OR: [
            {requiredRoles: {none: {}}},
            {requiredRoles: {some: {id: {in: roleIds}}}},
        ],
    };
}

export async function listReadableFiles() {
    const {access} = await requirePermissionWithAccess([Permission.READ]);
    const canReadAll = access.permissions.includes(Permission.READ_ALL);

    const files = await prisma.file.findMany({
        where: {
            deletedAt: null,
            ...fileAccessWhere(access.roleIds, canReadAll),
        },
        include: {
            requiredRoles: {select: {name: true}},
            versions: {
                where: {deletedAt: null, ...(canReadAll ? {} : {hidden: false})},
                orderBy: [{createdAt: "desc"}, {id: "desc"}],
                take: 1,
                select: {id: true, version: true, filename: true, createdAt: true},
            },
        },
        orderBy: {updatedAt: "desc"},
    });

    return {
        files,
        canCreate: access.permissions.includes(Permission.CREATE),
    };
}

export async function getAccessibleFileName(fileId: number) {
    const {access} = await requirePermissionWithAccess([Permission.READ]);
    const file = await prisma.file.findUnique({
        where: {id: fileId},
        include: {requiredRoles: {select: {id: true}}},
    });

    if (!file || !canAccessFileWithAccess(access, file)) return null;
    return file.name;
}

export async function getAccessibleFileDetails(fileId: number) {
    const {access} = await requirePermissionWithAccess([Permission.READ]);
    const file = await prisma.file.findUnique({
        where: {id: fileId},
        include: {
            requiredRoles: {select: {id: true, name: true}},
            versions: {
                where: {deletedAt: null},
                orderBy: [{createdAt: "desc"}, {id: "desc"}],
            },
        },
    });

    if (!file || !canAccessFileWithAccess(access, file)) return null;
    return {file, canReadAll: access.permissions.includes(Permission.READ_ALL)};
}

export async function getFileManagementData() {
    const {access} = await requirePermissionWithAccess([Permission.CREATE, Permission.UPDATE, Permission.DELETE]);
    const canCreate = access.permissions.includes(Permission.CREATE);
    const canUpdate = access.permissions.includes(Permission.UPDATE);
    const canDelete = access.permissions.includes(Permission.DELETE);

    const [files, roles] = await Promise.all([
        prisma.file.findMany({
            where: fileAccessWhere(access.roleIds, access.permissions.includes(Permission.READ_ALL)),
            include: {
                requiredRoles: {select: {id: true, name: true}},
                versions: {orderBy: [{createdAt: "desc"}, {id: "desc"}]},
            },
            orderBy: [{deletedAt: "asc"}, {updatedAt: "desc"}],
        }),
        canCreate || canUpdate
            ? prisma.role.findMany({select: {id: true, name: true}, orderBy: {name: "asc"}})
            : Promise.resolve([]),
    ]);

    return {files, roles, canCreate, canUpdate, canDelete};
}
