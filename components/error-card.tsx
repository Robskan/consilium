import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {CircleX} from "lucide-react";
import React from "react";

interface ErrorCardProps {
    title?: string
    description?: string
    icon?: React.ReactNode
    action?: React.ReactNode
}

export function ErrorCard({
                              title = "Something went wrong",
                              description = "An unexpected error occurred. Please try again later.",
                              icon = <CircleX className="size-5" />,
                              action,
                          }: ErrorCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="text-destructive">
                        {icon}
                    </div>
                    <CardTitle>{title}</CardTitle>
                </div>
            </CardHeader>

            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>

                {action && (
                    <div className="mt-4">
                        {action}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}