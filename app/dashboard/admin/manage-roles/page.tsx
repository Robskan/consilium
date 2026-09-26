import {requirePermission} from "@/lib/permissions";
import {Permission} from "@/generated/prisma/enums";

export default async function AdminManageRolesPage() {
    // Check if the user can access audit logs
    await requirePermission([Permission.ADMINISTRATOR]);
    return (
        <>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
            </div>

            <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </>
    )
}