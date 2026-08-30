import { betterAuth } from "better-auth"
import {prismaAdapter} from "@better-auth/prisma-adapter";
import {prisma} from "./prisma";
import {syncUser} from "@/lib/sync";

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
                    syncUser(user.id).catch((err) => {
                        console.error("Error syncing user", err)
                    })
                },
            },
        },
    },
})