import { existsSync } from "fs";
import path from "path";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

function resolveKeyFile(): string {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }

    return path.resolve(process.cwd(), "credentials.json");
}

function createAuth() {
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (json) {
        return new google.auth.GoogleAuth({
            credentials: JSON.parse(json),
            scopes: SCOPES,
        });
    }

    const keyFile = resolveKeyFile();
    if (!existsSync(keyFile)) {
        throw new Error(
            `Google Sheets credentials not found at ${keyFile}. Add a service account key as credentials.json at the project root, or set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON.`,
        );
    }

    return new google.auth.GoogleAuth({
        keyFile,
        scopes: SCOPES,
    });
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
    if (!sheetsClient) {
        sheetsClient = google.sheets({
            version: "v4",
            auth: createAuth(),
        });
    }

    return sheetsClient;
}

export async function getSheetValues(
    spreadsheetId: string,
    range: string,
): Promise<unknown[][]> {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values ?? [];
}
