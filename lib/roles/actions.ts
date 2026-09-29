"use server";

import {revalidatePath} from "next/cache";
import { Permission } from "@/generated/prisma/enums";
import { createRole, deleteRole, updateRole } from "@/lib/roles/index";

function parsePermissions(raw: FormDataEntryValue[]): Permission[] {
    return raw.map((entry) => {
        if (typeof entry !== "string") {
            throw new Error("Invalid permission");
        }

        if (!(entry in Permission)) {
            throw new Error("Invalid permission");
        }

        return Permission[entry as keyof typeof Permission];
    });
}

function parseSheetsTriggers(raw: FormDataEntryValue[]): string[] {
    return raw.map((entry) => {
        if (typeof entry !== "string") {
            throw new Error("Invalid sheets trigger");
        }

        return entry;
    }).flatMap((entry) => entry.split(/\r?\n/).map((trigger) => trigger.trim()).filter(Boolean));
}

export async function createRoleAction(formData: FormData) {
    const name = formData.get("name");
    const permissionEntries = formData.getAll("permissions");
    const sheetsTriggerEntries = formData.getAll("sheetsTriggers");

    if (typeof name !== "string") {
        throw new Error("Role name is required");
    }

    await createRole({
        name,
        permissions: parsePermissions(permissionEntries),
        sheetsTriggers: parseSheetsTriggers(sheetsTriggerEntries),
    });
    revalidatePath("/dashboard/admin/manage-roles");
    revalidatePath("/dashboard/admin");
}

export async function updateRoleAction(formData: FormData) {
    const id = Number(formData.get("roleId"));
    const name = formData.get("name");
    const permissionEntries = formData.getAll("permissions");
    const sheetsTriggerEntries = formData.getAll("sheetsTriggers");

    if (!Number.isInteger(id)) {
        throw new Error("Invalid role ID");
    }

    await updateRole({
        id,
        name: typeof name === "string" ? name : undefined,
        permissions: parsePermissions(permissionEntries),
        sheetsTriggers: parseSheetsTriggers(sheetsTriggerEntries),
    });
    revalidatePath("/dashboard/admin/manage-roles");
    revalidatePath("/dashboard/admin");
}

export async function deleteRoleAction(formData: FormData) {
    const id = Number(formData.get("roleId"));

    if (!Number.isInteger(id)) {
        throw new Error("Invalid role ID");
    }

    await deleteRole(id);
    revalidatePath("/dashboard/admin/manage-roles");
    revalidatePath("/dashboard/admin");
}
