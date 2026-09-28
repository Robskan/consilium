import { syncDirectory } from "@/lib/sync";
import {NextResponse, NextRequest} from "next/server";

// TODO: Add auth checks to this endpoint

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const result = await syncDirectory();

        return NextResponse.json({
            success: true,
            result,
        });
    } catch (error) {
        console.error("Directory sync failed:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Directory sync failed",
            },
            { status: 500 },
        );
    }
}