import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    })
}

export async function getUserNavigationProfile(userId: string) {
    return prisma.user.findUnique({
        where: {id: userId},
        select: {
            name: true,
            image: true,
            roles: {
                select: {
                    name: true,
                    permissions: true,
                },
            },
        },
    });
}
