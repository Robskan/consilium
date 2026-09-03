import { syncDirectory } from "@/lib/sync";

// TODO: Add auth checks to this endpoint

export async function GET() {
    try {
        const result = await syncDirectory();

        return Response.json({
            success: true,
            result,
        });
    } catch (error) {
        console.error("Directory sync failed:", error);

        return Response.json(
            {
                success: false,
                error: "Directory sync failed",
            },
            { status: 500 },
        );
    }
}