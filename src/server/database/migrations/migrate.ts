import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getParkTrackDatabaseConnection } from "../util.js";

/**
 * Database migration utility for Better Auth schema
 * Provides functions to run migrations and manage schema changes
 */

export interface Migration {
	id: string;
	name: string;
	filePath: string;
	sql: string;
	timestamp: Date;
}

export interface MigrationRecord {
	id: string;
	name: string;
	appliedAt: Date;
	checksum: string;
}

/**
 * Creates the migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(): Promise<void> {
	const connection = await getParkTrackDatabaseConnection();

	await connection.streamAndReadAll(`
		CREATE TABLE IF NOT EXISTS "_migrations" (
			id VARCHAR PRIMARY KEY,
			name VARCHAR NOT NULL,
			appliedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			checksum VARCHAR NOT NULL
		)
	`);
}

/**
 * Generate a simple checksum for migration content
 */
function generateChecksum(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(16);
}

/**
 * Load all migration files from the migrations directory
 */
export async function loadMigrations(): Promise<Migration[]> {
	const migrationsDir = path.join(
		process.cwd(),
		"src/server/database/migrations",
	);

	try {
		const files = await fs.readdir(migrationsDir);
		const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

		const migrations: Migration[] = [];

		for (const file of sqlFiles) {
			const filePath = path.join(migrationsDir, file);
			const sql = await fs.readFile(filePath, "utf-8");

			// Extract migration ID from filename (e.g., "001_better_auth_core_schema.sql" -> "001")
			const id = file.split("_")[0] ?? "";
			const name = file.replace(/^\d+_/, "").replace(/\.sql$/, "");

			migrations.push({
				id,
				name,
				filePath,
				sql: sql.trim(),
				timestamp: new Date(),
			});
		}

		return migrations;
	} catch (error) {
		console.error("Failed to load migrations:", error);
		throw new Error("Could not load migration files");
	}
}

/**
 * Get applied migrations from the database
 */
export async function getAppliedMigrations(): Promise<MigrationRecord[]> {
	await ensureMigrationsTable();

	const connection = await getParkTrackDatabaseConnection();
	const result = await connection.streamAndReadAll(`
		SELECT id, name, appliedAt, checksum
		FROM "_migrations"
		ORDER BY id ASC
	`);

	return result.getRowObjectsJS().map((row) => ({
		id: row["id"] as string,
		name: row["name"] as string,
		appliedAt: new Date(row["appliedAt"] as string),
		checksum: row["checksum"] as string,
	}));
}

/**
 * Record a migration as applied
 */
async function recordMigration(migration: Migration): Promise<void> {
	const connection = await getParkTrackDatabaseConnection();
	const checksum = generateChecksum(migration.sql);

	await connection.streamAndReadAll(`
		INSERT INTO "_migrations" (id, name, appliedAt, checksum)
		VALUES ('${migration.id}', '${migration.name}', CURRENT_TIMESTAMP, '${checksum}')
	`);
}

/**
 * Run a single migration
 */
async function runMigration(migration: Migration): Promise<void> {
	const connection = await getParkTrackDatabaseConnection();

	console.log(`Running migration ${migration.id}: ${migration.name}`);

	try {
		// Split SQL by semicolons and execute each statement
		const statements = migration.sql
			.split(";")
			.map((stmt) => stmt.trim())
			.filter((stmt) => stmt.length > 0);

		for (const statement of statements) {
			await connection.streamAndReadAll(statement);
		}

		await recordMigration(migration);
		console.log(`✓ Migration ${migration.id} completed successfully`);
	} catch (error) {
		console.error(`✗ Migration ${migration.id} failed:`, error);
		throw error;
	}
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
	console.log("Starting database migrations...");

	const [allMigrations, appliedMigrations] = await Promise.all([
		loadMigrations(),
		getAppliedMigrations(),
	]);

	const appliedIds = new Set(appliedMigrations.map((m) => m.id));
	const pendingMigrations = allMigrations.filter((m) => !appliedIds.has(m.id));

	if (pendingMigrations.length === 0) {
		console.log("✓ No pending migrations found. Database is up to date.");
		return;
	}

	console.log(`Found ${pendingMigrations.length} pending migration(s):`);
	pendingMigrations.forEach((m) => {
		console.log(`  - ${m.id}: ${m.name}`);
	});

	for (const migration of pendingMigrations) {
		await runMigration(migration);
	}

	console.log("✓ All migrations completed successfully!");
}

/**
 * Validate migration integrity by checking checksums
 */
export async function validateMigrations(): Promise<boolean> {
	const [allMigrations, appliedMigrations] = await Promise.all([
		loadMigrations(),
		getAppliedMigrations(),
	]);

	const migrationMap = new Map(allMigrations.map((m) => [m.id, m]));
	let isValid = true;

	for (const applied of appliedMigrations) {
		const migration = migrationMap.get(applied.id);

		if (!migration) {
			console.error(
				`✗ Applied migration ${applied.id} not found in migration files`,
			);
			isValid = false;
			continue;
		}

		const currentChecksum = generateChecksum(migration.sql);
		if (currentChecksum !== applied.checksum) {
			console.error(
				`✗ Migration ${applied.id} checksum mismatch. Migration file may have been modified after being applied.`,
			);
			isValid = false;
		}
	}

	if (isValid) {
		console.log("✓ All applied migrations are valid");
	}

	return isValid;
}

/**
 * Get migration status information
 */
export async function getMigrationStatus(): Promise<{
	total: number;
	applied: number;
	pending: number;
	migrations: Array<{
		id: string;
		name: string;
		status: "applied" | "pending";
		appliedAt?: Date;
	}>;
}> {
	const [allMigrations, appliedMigrations] = await Promise.all([
		loadMigrations(),
		getAppliedMigrations(),
	]);

	const appliedMap = new Map(appliedMigrations.map((m) => [m.id, m]));

	const migrations = allMigrations.map((migration) => {
		const applied = appliedMap.get(migration.id);
		return {
			id: migration.id,
			name: migration.name,
			status: applied ? ("applied" as const) : ("pending" as const),
			appliedAt: applied?.appliedAt ?? new Date(0),
		};
	});

	return {
		total: allMigrations.length,
		applied: appliedMigrations.length,
		pending: allMigrations.length - appliedMigrations.length,
		migrations,
	};
}

/**
 * Reset database by dropping all Better Auth tables and re-running migrations
 * WARNING: This will delete all auth data!
 */
export async function resetDatabase(): Promise<void> {
	console.log("⚠️  WARNING: This will delete all authentication data!");
	console.log("Dropping Better Auth tables...");

	const connection = await getParkTrackDatabaseConnection();

	// Drop tables in reverse order to handle foreign key constraints
	const tablesToDrop = [
		"verification",
		"account",
		"session",
		"user",
		"_migrations",
	];

	for (const table of tablesToDrop) {
		try {
			await connection.streamAndReadAll(`DROP TABLE IF EXISTS "${table}"`);
			console.log(`✓ Dropped table: ${table}`);
		} catch (error) {
			console.error(`✗ Failed to drop table ${table}:`, error);
		}
	}

	console.log("Re-running all migrations...");
	await runMigrations();
	console.log("✓ Database reset completed!");
}

/**
 * Check if Better Auth tables exist in the database
 */
export async function checkTablesExist(): Promise<{
	user: boolean;
	session: boolean;
	account: boolean;
	verification: boolean;
}> {
	const connection = await getParkTrackDatabaseConnection();

	const tables = ["user", "session", "account", "verification"];
	const results: Record<string, boolean> = {};

	for (const table of tables) {
		try {
			await connection.streamAndReadAll(`SELECT 1 FROM "${table}" LIMIT 1`);
			results[table] = true;
		} catch {
			results[table] = false;
		}
	}

	return results as {
		user: boolean;
		session: boolean;
		account: boolean;
		verification: boolean;
	};
}

/**
 * Create a new migration file
 */
export async function createMigration(
	name: string,
	sql: string,
): Promise<string> {
	const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
	const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, "_")}.sql`;
	const filePath = path.join(
		process.cwd(),
		"src/server/database/migrations",
		filename,
	);

	const migrationContent = `-- Migration: ${filename}
-- Description: ${name}
-- Created: ${new Date().toISOString()}

${sql}
`;

	await fs.writeFile(filePath, migrationContent, "utf-8");
	console.log(`✓ Created migration file: ${filename}`);

	return filePath;
}
