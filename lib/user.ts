import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import {Prisma} from "@/generated/prisma/client";

export async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    })
}

export async function getSystemUser(tx: Prisma.TransactionClient) {
    const systemUser = await tx.user.findUnique({
        where: {
            id: "SYSTEM",
        },
    });

    if (!systemUser) {
        throw new Error("SYSTEM user does not exist. Please run `npm run db:seed`.");
    }

    return systemUser;
}