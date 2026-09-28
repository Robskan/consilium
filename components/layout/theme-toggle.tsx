"use client"

import * as React from "react"
import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => setMounted(true), [])

    const CurrentIcon = mounted && resolvedTheme === "dark" ? Moon : Sun
    const currentTheme = mounted ? theme : undefined

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="self-start aria-label='Select theme'"/>}>
                {mounted && currentTheme === "system" ? <Monitor className="size-4" /> : <CurrentIcon className="size-4" />}
                <span className="sr-only">
                    Current theme: {currentTheme ?? "loading"}. Choose theme
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun />
                    Light
                    {mounted && currentTheme === "light" && <Check className="ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon />
                    Dark
                    {mounted && currentTheme === "dark" && <Check className="ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor />
                    System
                    {mounted && currentTheme === "system" && <Check className="ml-auto" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
