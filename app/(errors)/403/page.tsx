import { ErrorCard } from "@/components/error-card"
import {ShieldX} from "lucide-react";

export default function ForbiddenPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <ErrorCard
                title="403 - Forbidden"
                description="You do not have permission to access this resource."
                icon={<ShieldX />}
            />
        </div>
    )
}