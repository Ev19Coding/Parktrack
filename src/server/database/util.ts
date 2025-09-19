"use server";
import { DuckDBInstance } from "@duckdb/node-api";

const DATABASE_NAME = "parktrack";

export async function getParkTrackDatabaseConnection() {
	return (await DuckDBInstance.create(`md:${DATABASE_NAME}`, {
		// biome-ignore lint/complexity/useLiteralKeys: <ts wants the index signature>
		motherduck_token: process.env["motherduck_token"] ?? "",
	})).connect();
}
