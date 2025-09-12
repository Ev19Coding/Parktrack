"use server";
import { DuckDBInstance } from "@duckdb/node-api";

const DATABASE_NAME = "parktrack";

export async function getParkTrackDatabaseConnection() {
	return (await DuckDBInstance.fromCache(`md:${DATABASE_NAME}`)).connect();
}
