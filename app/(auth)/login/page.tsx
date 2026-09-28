import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginCard } from "@/components/auth/login-card";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Login",
};

export default async function LoginPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (session) {
        redirect("/dashboard");
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
            <div className="absolute right-6 top-6">
                <ThemeToggle />
            </div>
            <LoginCard />
        </main>
    );
}