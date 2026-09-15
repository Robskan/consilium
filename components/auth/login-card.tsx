"use client"

import { useState } from "react"
import { flushSync } from "react-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DiscordIconIcon } from "@/components/icons/logos-discord-icon";
import { authClient } from "@/lib/auth-client";

export function LoginCard() {
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async () => {
        flushSync(() => {
            setIsLoading(true)
        })

        const { data, error } = await authClient.signIn.social({
            provider: "discord",
            callbackURL: "/login",
            disableRedirect: true,
        })

        if (error || !data?.url) {
            flushSync(() => {
                setIsLoading(false)
            })
            return
        }

        window.location.assign(data.url)
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>Sign in with Discord to access your files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleLogin}
                    disabled={isLoading}
                    aria-busy={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                    ) : (
                        <DiscordIconIcon className="size-4 shrink-0 fill-primary-foreground" />
                    )}
                    Sign in with Discord
                </Button>
                <div className="flex items-center gap-3">
                    <Separator className="flex-1" />

                    <span className="text-xs text-muted-foreground">
                        INTERNAL ACCESS
                    </span>

                    <Separator className="flex-1" />
                </div>

                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    Access is restricted to BotGhost Staff and Community Support only.
                </p>
            </CardContent>
        </Card>
    )
}