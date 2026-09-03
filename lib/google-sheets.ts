import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
    keyFile: "./credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({
    version: "v4",
    auth,
});

export async function getSheetValues(
    spreadsheetId: string,
    range: string,
): Promise<unknown[][]> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values ?? [];
}