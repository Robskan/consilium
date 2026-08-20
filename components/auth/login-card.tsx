import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {DiscordIconIcon} from "@/components/icons/logos-discord-icon";

export function LoginCard() {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>Sign in with Discord to access your files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Button className="w-full" size="lg">
                    <DiscordIconIcon className="fill-primary-foreground"></DiscordIconIcon>
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