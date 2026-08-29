"use client"

import * as React from "react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {Files, ShieldUser} from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "Lordseriouspig",
    role: "Community Manager",
    avatar: "https://cdn.discordapp.com/avatars/961416958027386890/1b7c171232b2e3f310688b979615421f.webp", },
  navMain: [
    {
      title: "Files",
      url: "/dashboard/files",
      icon: (
        <Files
        />
      ),
    },
    {
      title: "Admin",
      url: "/dashboard/admin",
      icon: (
        <ShieldUser
        />
      ),
      items: [
        {
          title: "Audit Log",
          url: "/dashboard/admin/audit-log",
        },
        {
          title: "Manage Files",
          url: "/dashboard/admin/manage-files",
        },
        {
          title: "Manage Roles",
          url: "/dashboard/admin/manage-roles",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                render={<a href="/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                <img src="https://botghost.com/img/logo-red.png" alt="BotGhost Logo" className="size-full object-contain" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  BotGhost
                </span>

                <span className="truncate text-xs">
                  Consilium
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
