import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import {Prisma} from "@/generated/prisma/client";

export async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    })
}

