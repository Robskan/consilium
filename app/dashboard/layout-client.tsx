"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import Link from "next/link"
import type { Tabs } from "@/components/layout/sidebar-data"

export default function AppLayoutClient({
                                            children,
    data,
                                        }: {
    children: React.ReactNode
    data: Tabs
}) {
    const pathname = usePathname()

    const segments = pathname.split("/").filter(Boolean)

    return (
        <SidebarProvider>
            <AppSidebar data={data} />

            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />

                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />

                        <Breadcrumb>
                            <BreadcrumbList>
                                {segments.map((segment, index) => {
                                    const isLast =
                                        index === segments.length - 1

                                    const href =
                                        "/" +
                                        segments
                                            .slice(0, index + 1)
                                            .join("/")

                                    const label = decodeURIComponent(segment)
                                        .replace(/[-_]/g, " ")
                                        .replace(/\b\w/g, (char) =>
                                            char.toUpperCase()
                                        )

                                    return (
                                        <div
                                            key={href}
                                            className="flex items-center gap-2"
                                        >
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage>
                                                        {label}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink
                                                        render={
                                                            <Link href={href} />
                                                        }
                                                    >
                                                        {label}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>

                                            {!isLast && (
                                                <BreadcrumbSeparator />
                                            )}
                                        </div>
                                    )
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}