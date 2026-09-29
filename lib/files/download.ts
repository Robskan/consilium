import "server-only";

import {AuditTrailAction, Permission} from "@/generated/prisma/enums";
import {audit} from "@/lib/audit";
import {canAccessFileWithAccess, requirePermissionWithAccess} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";
import {storage} from "@/lib/storage";

export type VersionDownloadResult =
    | {ok: true; filename: string; mimeType: string; data: Buffer}
    | {ok: false; status: 404 | 410; error: string};

export async function downloadVersion(fileId: number, versionId: number): Promise<VersionDownloadResult> {
    const {session, access} = await requirePermissionWithAccess([Permission.READ]);
    const version = await prisma.version.findUnique({
            where: {id: versionId, fileId},
            include: {file: {include: {requiredRoles: {select: {id: true}}}}},
        });

    if (!version || !canAccessFileWithAccess(access, version.file)) {
        return {ok: false, status: 404, error: "Version not found or you do not have permission to access it."};
    }
    if (version.deletedAt) {
        return {ok: false, status: 410, error: "File version has been deleted. Please contact a CM+ if you believe this is an error."};
    }
    if (version.hidden && !access.permissions.includes(Permission.READ_ALL)) {
        return {ok: false, status: 404, error: "Version not found"};
    }

    const data = await storage.get(version.storageKey);
    await audit(prisma, {
        userId: session.user.id,
        ip: session.session.ipAddress ?? null,
        ua: session.session.userAgent ?? null,
        action: AuditTrailAction.VERSION_DOWNLOADED,
        metadata: {
            fileId,
            versionId,
            filename: version.filename,
        },
    });

    return {ok: true, filename: version.filename, mimeType: version.mimeType, data};
}
