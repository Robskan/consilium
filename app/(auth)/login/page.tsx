import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginCard } from "@/components/auth/login-card";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
            <div className="absolute right-6 top-6">
                <ThemeToggle />
            </div>
            <LoginCard />
        </main>
    );
}