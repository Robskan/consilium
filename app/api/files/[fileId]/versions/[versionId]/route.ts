import {NextResponse} from "next/server";
import {downloadVersion} from "@/lib/files/download";

export const dynamic = "force-dynamic";

export async function GET(
    _request: Request,
    {params}: {params: Promise<{fileId: string; versionId: string}>},
) {
    const {fileId: rawFileId, versionId: rawVersionId} = await params;
    const fileId = Number(rawFileId);
    const versionId = Number(rawVersionId);

    if (!Number.isInteger(fileId) || fileId < 1) {
        return NextResponse.json({error: "Invalid file ID"}, {status: 400});
    }
    if (!Number.isInteger(versionId) || versionId < 1) {
        return NextResponse.json({error: "Invalid version ID"}, {status: 400});
    }

    try {
        const result = await downloadVersion(fileId, versionId);
        if (!result.ok) {
            return NextResponse.json({error: result.error}, {status: result.status});
        }

        const filename = encodeURIComponent(result.filename).replace(/[!'()*]/g, (character) =>
            `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
        );
        return new NextResponse(new Uint8Array(result.data), {
            headers: {
                "Content-Type": result.mimeType,
                "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
            },
        });
    } catch (error) {
        console.error("Error reading file:", error);
        return NextResponse.json({error: "Error retrieving file. Please contact a CM+"}, {status: 500});
    }
}
