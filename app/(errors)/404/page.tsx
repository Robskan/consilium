import { ErrorCard } from "@/components/error-card"
import {FileQuestionMark} from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <ErrorCard
                title="404 - Not Found"
                description="The requested resource was not found."
                icon={<FileQuestionMark />}
            />
        </div>
    )
}