import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {Permission, PrismaClient} from "@/generated/prisma/client";
import '@dotenvx/dotenvx/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...")

    // Create the SYSTEM user
    await prisma.user.upsert({
        where: {
            discordID: "SYSTEM",
        },
        update: {},
        create: {
            id: "SYSTEM",
            name: "SYSTEM",
            username: "SYSTEM",
            discordID: "SYSTEM",
            email: "system@placeholder.invalid",
            emailVerified: true,
        },
    })

    // Create roles
    const roles = [
        {
            name: "Admin",
            permissions: [
                Permission.ACCESS,
                Permission.CREATE,
                Permission.READ,
                Permission.UPDATE,
                Permission.DELETE,
                Permission.READ_ALL,
                Permission.AUDIT_VIEW,
                Permission.ADMINISTRATOR,
            ],
            sheetsTriggers: [
                "Founder",
                "Lead Operations",
                "Staff Team",
            ],
        },
        {
            name: "Lead Community Manager",
            permissions: [
                Permission.ACCESS,
                Permission.CREATE,
                Permission.READ,
                Permission.UPDATE,
                Permission.DELETE,
                Permission.READ_ALL,
                Permission.AUDIT_VIEW,
            ],
            sheetsTriggers: [
                "Lead Community Manager",
            ],
        },
        {
            name: "Community Manager",
            permissions: [
                Permission.ACCESS,
                Permission.CREATE,
                Permission.READ,
                Permission.UPDATE,
                Permission.DELETE,
                Permission.READ_ALL,
            ],
            sheetsTriggers: [
                "Lead Community Manager",
                "Community Manager",
            ],
        },
        {
            name: "Senior Moderator",
            permissions: [
                Permission.ACCESS,
                Permission.READ,
            ],
            sheetsTriggers: [
                "Senior Moderator",
                "Senior Mod + Writer",
            ],
        },
        {
            name: "Moderator",
            permissions: [
                Permission.ACCESS,
                Permission.READ,
            ],
            sheetsTriggers: [
                "Senior Moderator",
                "Senior Mod + Writer",
                "Moderator",
                "Moderator + Writer",
                "Trial Moderator",
                "Trial Mod + Writer",
            ],
        },
        {
            name: "Writer",
            permissions: [
                Permission.ACCESS,
                Permission.READ,
            ],
            sheetsTriggers: [
                "Senior Mod + Writer",
                "Moderator + Writer",
                "Trial Mod + Writer",
                "Writer (CS)",
            ],
        },
        {
            name: "Community Support",
            permissions: [
                Permission.ACCESS,
                Permission.READ,
            ],
            sheetsTriggers: [
                "Community Support",
                "Community Support of the Month",
                "Writer (CS)",
            ],
        },
    ]

    for (const role of roles) {
        await prisma.role.upsert({
            where: {
                name: role.name,
            },
            update: {
                permissions: role.permissions,
                sheetsTriggers: role.sheetsTriggers,
            },
            create: {
                name: role.name,
                permissions: role.permissions,
                sheetsTriggers: role.sheetsTriggers,
            },
        })
    }

    console.log("Database seeded! Please hit the CRON endpoint to sync the directory and assign roles to users.")
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })