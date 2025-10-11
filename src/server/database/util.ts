"use server";
import { DuckDBInstance } from "@duckdb/node-api";

const DATABASE_NAME = "parktrack";

export async function getParkTrackDatabaseConnection() {
	const connection = (
		await DuckDBInstance.fromCache(`md:${DATABASE_NAME}`, {
			// biome-ignore lint/complexity/useLiteralKeys: <ts wants the index signature>
			motherduck_token: process.env["motherduck_token"] ?? "",
		})
	).connect();

	// Set timezone to UTC to fix the 1-hour offset issue
	try {
		await (await connection).streamAndReadAll(`
		INSTALL icu;
		LOAD icu;
		SET TimeZone = 'UTC'`);
	} catch (error) {
		// If setting timezone fails, continue anyway
		console.warn("Could not set UTC timezone:", error);
	}

	return connection;
}
