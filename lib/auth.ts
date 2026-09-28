import { betterAuth } from "better-auth"
import {prismaAdapter} from "@better-auth/prisma-adapter";
import {prisma} from "./prisma";
import {syncUser} from "@/lib/sync";
import {audit} from "@/lib/audit";
import {AuditTargetType, AuditTrailAction} from "@/generated/prisma/enums";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    socialProviders: {
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
            scope: ["identify"],
            disableDefaultScope: true,

            mapProfileToUser: (profile) => {
                return {
                    username: profile.username,
                    discordID: profile.id,
                    email: `${profile.id}@discord.placeholder.invalid`, // We don't need emails here, so just use a placeholder since betterauth requires it
                    emailVerified: true,
                };
            },
        },
    },
    user: {
        additionalFields: {
            username: { type: "string", required: true },
            discordID: { type: "string", required: true },
        }
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    console.log("new user", user)
                    await audit(prisma, {
                        userId: "SYSTEM",
                        ip: null,
                        ua: null,
                        action: AuditTrailAction.USER_CREATED,
                        effects: [
                            {
                                targetType: AuditTargetType.USER,
                                targetId: user.id,
                                after: JSON.stringify(user),
                            },
                        ],
                    })
                    syncUser(user.id).catch((err) => {
                        console.error("Error syncing user", err)
                    })
                },
            },
            delete: {
                after: async (user) => {
                    console.log("delete", user)
                    await audit(prisma, {
                        userId: "SYSTEM",
                        ip: null,
                        ua: null,
                        action: AuditTrailAction.USER_DELETED,
                        effects: [
                            {
                                targetType: AuditTargetType.USER,
                                targetId: user.id,
                                before: JSON.stringify(user),
                            },
                        ],
                    })
                }
            }
        },
    },
})