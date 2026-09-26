import { NextResponse } from 'next/server';
import {canAccessFile, hasPermission, requirePermission} from "@/lib/permissions";
import {prisma} from "@/lib/prisma";
import {storage} from "@/lib/storage";
import {AuditTargetType, AuditTrailAction, Permission} from "@/generated/prisma/enums";
import {audit} from "@/lib/audit";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ fileId: string; versionId: string }> }
) {
    const session = await requirePermission([Permission.READ]);
    const { fileId: fileIdRaw, versionId: versionIdRaw } = await params;

    // User isn't logged in
    if (!session) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const fileId = Number(fileIdRaw);
    const versionId = Number(versionIdRaw);

    if (!Number.isInteger(fileId)) {
        return NextResponse.json({error: 'Invalid file ID'}, {status: 400});
    }

    if (!Number.isInteger(versionId)) {
        return NextResponse.json({error: 'Invalid version ID'}, {status: 400});
    }

    // Check if the user has access to the file (and it exists)
    if (!(await canAccessFile(session.user.id, fileId))) {
        return NextResponse.json({error: 'File not found or you do not have permission to access it.'}, {status: 404})
    }

    // Check if the version exists, and serve it if it does
    const version = await prisma.version.findUnique({
        where: {
            id: versionId,
            fileId: fileId,
        },
    });

    if (!version) {
        return NextResponse.json({error: 'Version not found or you do not have permission to access it.'}, {status: 404})
    }

    if (version.deletedAt) {
        return NextResponse.json({ error: 'File version has been deleted. Please contact a CM+ if you believe this is an error.' }, { status: 410 });
    }

    // Checks if the version is hidden and if the user has permission to read hidden versions
    if (version.hidden && !(await hasPermission(session.user.id, [Permission.READ_ALL]))) {
        return NextResponse.json(
            { error: "Version not found" },
            { status: 404 }
        );
    }

    try {
        const fileBuffer = await storage.get(version.storageKey);

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

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Type': version.mimeType,
'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(version.filename).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)}`, 
            }
        });
    } catch (error) {
        console.error('Error reading file:', error);
        return NextResponse.json({error: 'Error retrieving file. Please contact a CM+'}, {status: 500});
    }
}