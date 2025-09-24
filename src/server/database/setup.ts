import type { UserType } from "./better-auth-schema.js";
import {
	checkTablesExist,
	getMigrationStatus,
	runMigrations,
} from "./migrations/migrate.js";
import { getParkTrackDatabaseConnection } from "./util.js";

/**
 * Development database setup script
 * Sets up Better Auth tables and runs initial migrations
 */

export async function setupDevelopmentDatabase(): Promise<void> {
	console.log("🚀 Setting up development database for Better Auth");
	console.log("==================================================\n");

	try {
		// Test database connection
		console.log("1. Testing database connection...");
		const connection = await getParkTrackDatabaseConnection();
		console.log("✅ Database connection successful\n");

		// Check current table status
		console.log("2. Checking existing tables...");
		const tables = await checkTablesExist();

		const tableNames = Object.keys(tables) as Array<keyof typeof tables>;
		const existingTables = tableNames.filter((name) => tables[name]);
		const missingTables = tableNames.filter((name) => !tables[name]);

		if (existingTables.length > 0) {
			console.log("   Existing tables:");
			existingTables.forEach((table) => {
				console.log(`   ✅ ${table}`);
			});
		}

		if (missingTables.length > 0) {
			console.log("   Missing tables:");
			missingTables.forEach((table) => {
				console.log(`   ❌ ${table}`);
			});
		}

		console.log();

		// Get migration status
		console.log("3. Checking migration status...");
		const status = await getMigrationStatus();
		console.log(`   Total migrations: ${status.total}`);
		console.log(`   Applied: ${status.applied}`);
		console.log(`   Pending: ${status.pending}\n`);

		// Run migrations if needed
		if (status.pending > 0) {
			console.log("4. Running pending migrations...");
			await runMigrations();
		} else {
			console.log("4. No pending migrations found ✅\n");
		}

		// Verify setup
		console.log("5. Verifying setup...");
		const finalTables = await checkTablesExist();
		const allTablesExist = Object.values(finalTables).every((exists) => exists);

		if (allTablesExist) {
			console.log("✅ All Better Auth tables are present and ready!\n");

			// Show table summary
			console.log("📊 Database Schema Summary:");
			console.log("---------------------------");
			console.log("✅ user         - User accounts and profiles");
			console.log("✅ session      - User sessions and tokens");
			console.log("✅ account      - OAuth and credential accounts");
			console.log("✅ verification - Email verification and password reset");
			console.log();

			console.log("🎉 Development database setup completed successfully!");
			console.log("Your Better Auth instance is ready to use.");
		} else {
			throw new Error("Some tables are still missing after migration");
		}
	} catch (error) {
		console.error("\n❌ Database setup failed:");
		console.error(error instanceof Error ? error.message : String(error));

		console.log("\n🔧 Troubleshooting tips:");
		console.log("1. Ensure MotherDuck token is set in environment variables");
		console.log("2. Check database connection and permissions");
		console.log(
			"3. Verify migration files are present in src/server/database/migrations/",
		);
		console.log("4. Try running migrations manually: bun run migrate:up");

		throw error;
	}
}

/**
 * Quick database health check
 */
export async function checkDatabaseHealth(): Promise<{
	connected: boolean;
	tablesExist: boolean;
	migrationsApplied: boolean;
	details: {
		tables: Record<string, boolean>;
		migrationStatus: Awaited<ReturnType<typeof getMigrationStatus>>;
	};
}> {
	let connected = false;
	let tablesExist = false;
	let migrationsApplied = false;
	let tables: Record<string, boolean> = {};
	let migrationStatus: Awaited<ReturnType<typeof getMigrationStatus>>;

	try {
		// Test connection
		await getParkTrackDatabaseConnection();
		connected = true;

		// Check tables
		tables = await checkTablesExist();
		tablesExist = Object.values(tables).every((exists) => exists);

		// Check migrations
		migrationStatus = await getMigrationStatus();
		migrationsApplied = migrationStatus.pending === 0;
	} catch (error) {
		console.error("Database health check failed:", error);
		// Initialize default values for failed check
		migrationStatus = {
			total: 0,
			applied: 0,
			pending: 0,
			migrations: [],
		};
	}

	return {
		connected,
		tablesExist,
		migrationsApplied,
		details: {
			tables,
			migrationStatus,
		},
	};
}

/**
 * Initialize Better Auth schema for production
 */
export async function initializeProductionSchema(): Promise<void> {
	console.log("🏭 Initializing production database schema");
	console.log("==========================================\n");

	const health = await checkDatabaseHealth();

	if (!health.connected) {
		throw new Error("Cannot connect to database. Check connection settings.");
	}

	if (!health.tablesExist || !health.migrationsApplied) {
		console.log("Setting up required database schema...");
		await runMigrations();
		console.log("✅ Production schema initialized successfully");
	} else {
		console.log("✅ Production schema is already up to date");
	}
}

/**
 * Create sample data for development
 */
export async function createSampleData(): Promise<void> {
	console.log("🧪 Creating sample development data...");

	const connection = await getParkTrackDatabaseConnection();

	// Check if sample data already exists
	const existingUsers = await connection.streamAndReadAll(`
		SELECT COUNT(*) as count FROM "user" WHERE email LIKE '%@example.com'
	`);

	const userCount = existingUsers.getRowObjects()[0]?.["count"] as number;

	if (userCount > 0) {
		console.log("✅ Sample data already exists (found test users)");
		return;
	}

	// Create sample users for development
	const sampleUsers = [
		{
			id: "dev_user_001",
			name: "John Developer",
			email: "john@example.com",
			emailVerified: true,
			favourites: [],
			type: "user",
		},
		{
			id: "dev_user_002",
			name: "Jane Tester",
			email: "jane@example.com",
			emailVerified: false,
			favourites: [],
			type: "owner",
		},
	] as const satisfies Array<{
		id: string;
		name: string;
		email: string;
		emailVerified: boolean;
		type?: UserType;
		favourites: Array<string>;
	}>;

	console.log("Creating sample users...");
	for (const user of sampleUsers) {
		await connection.streamAndReadAll(`
			INSERT INTO "user" (id, name, email, emailVerified, favourites, type, createdAt, updatedAt)
			VALUES (
				'${user.id}',
				'${user.name}',
				'${user.email}',
				${user.emailVerified},
				'${user.favourites}',
				'${(user).type ?? "user"}',
				CURRENT_TIMESTAMP,
				CURRENT_TIMESTAMP
			)
		`);
		console.log(`✅ Created user: ${user.name} (${user.email})`);
	}

	console.log("\n🎉 Sample development data created successfully!");
	console.log("You can now test authentication with the sample users.");
}

/**
 * Development setup entry point
 * Run this script to set up everything needed for development
 */
export async function runDevelopmentSetup(): Promise<void> {
	try {
		await setupDevelopmentDatabase();

		// Optionally create sample data
		console.log("\n📝 Would you like to create sample development data?");
		console.log("(This creates test users for development purposes)");
		console.log("Run: bun run dev:sample-data");
	} catch (error) {
		console.error("Development setup failed:", error);
		process.exit(1);
	}
}

// CLI usage when run directly
if (import.meta.main) {
	const command = process.argv[2];

	switch (command) {
		case "setup":
			await runDevelopmentSetup();
			break;
		case "health": {
			const health = await checkDatabaseHealth();
			console.log("Database Health Check:");
			console.log("=====================");
			console.log(`Connected: ${health.connected ? "✅" : "❌"}`);
			console.log(`Tables Exist: ${health.tablesExist ? "✅" : "❌"}`);
			console.log(
				`Migrations Applied: ${health.migrationsApplied ? "✅" : "❌"}`,
			);
			break;
		}
		case "sample-data":
			await createSampleData();
			break;
		case "production":
			await initializeProductionSchema();
			break;
		default:
			console.log(
				"Usage: bun run setup.ts [setup|health|sample-data|production]",
			);
			console.log("  setup        - Full development setup");
			console.log("  health       - Check database health");
			console.log("  sample-data  - Create sample development data");
			console.log("  production   - Initialize production schema");
	}
}
