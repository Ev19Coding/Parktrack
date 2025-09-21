#!/usr/bin/env node

import { program } from "commander";
import {
	runMigrations,
	validateMigrations,
	getMigrationStatus,
	resetDatabase,
	checkTablesExist,
	createMigration,
} from "./migrate.js";

/**
 * Better Auth Migration CLI
 * Command-line interface for managing Better Auth database schema
 */

program
	.name("better-auth-migrate")
	.description("Better Auth database migration CLI for MotherDuck/DuckDB")
	.version("1.0.0");

// Run migrations command
program
	.command("migrate")
	.alias("up")
	.description("Run all pending migrations")
	.option("-v, --verbose", "Show verbose output")
	.action(async (options) => {
		try {
			console.log("🚀 Better Auth Migration CLI");
			console.log("================================\n");

			if (options.verbose) {
				console.log("Checking database connection...");
			}

			await runMigrations();

			console.log("\n✅ Migration process completed successfully!");
			process.exit(0);
		} catch (error) {
			console.error("\n❌ Migration failed:");
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

// Check migration status
program
	.command("status")
	.description("Show migration status")
	.action(async () => {
		try {
			console.log("📊 Migration Status");
			console.log("==================\n");

			const status = await getMigrationStatus();

			console.log(`Total migrations: ${status.total}`);
			console.log(`Applied: ${status.applied}`);
			console.log(`Pending: ${status.pending}\n`);

			if (status.migrations.length > 0) {
				console.log("Migration Details:");
				console.log("------------------");

				status.migrations.forEach((migration) => {
					const statusIcon = migration.status === "applied" ? "✅" : "⏳";
					const appliedText = migration.appliedAt
						? ` (applied: ${migration.appliedAt.toISOString().split("T")[0]})`
						: "";

					console.log(
						`${statusIcon} ${migration.id}: ${migration.name}${appliedText}`,
					);
				});
			}

			if (status.pending > 0) {
				console.log(
					`\n💡 Run 'bun run migrate up' to apply ${status.pending} pending migration(s)`,
				);
			} else {
				console.log("\n✨ Database is up to date!");
			}

			process.exit(0);
		} catch (error) {
			console.error("❌ Failed to get migration status:");
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

// Validate migrations
program
	.command("validate")
	.description("Validate migration integrity")
	.action(async () => {
		try {
			console.log("🔍 Validating Migrations");
			console.log("========================\n");

			const isValid = await validateMigrations();

			if (isValid) {
				console.log("\n✅ All migrations are valid!");
				process.exit(0);
			} else {
				console.log("\n❌ Migration validation failed!");
				process.exit(1);
			}
		} catch (error) {
			console.error("❌ Validation failed:");
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

// Check tables
program
	.command("check")
	.description("Check if Better Auth tables exist")
	.action(async () => {
		try {
			console.log("🔍 Checking Better Auth Tables");
			console.log("==============================\n");

			const tables = await checkTablesExist();

			const tableNames = Object.keys(tables) as Array<keyof typeof tables>;

			tableNames.forEach((tableName) => {
				const exists = tables[tableName];
				const icon = exists ? "✅" : "❌";
				const status = exists ? "EXISTS" : "MISSING";
				console.log(`${icon} ${tableName} table: ${status}`);
			});

			const allExist = Object.values(tables).every((exists) => exists);

			if (allExist) {
				console.log("\n✅ All Better Auth tables are present!");
			} else {
				console.log(
					"\n⚠️  Some tables are missing. Run 'bun run migrate up' to create them.",
				);
			}

			process.exit(0);
		} catch (error) {
			console.error("❌ Failed to check tables:");
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

// Reset database (dangerous operation)
program
	.command("reset")
	.description("Reset database - DANGER: This will delete all auth data!")
	.option("--force", "Skip confirmation prompt")
	.action(async (options) => {
		try {
			if (!options.force) {
				console.log("⚠️  WARNING: This will delete ALL authentication data!");
				console.log("This action cannot be undone.\n");

				// In a real CLI, you'd want to use a proper prompt library
				// For now, we'll just require the --force flag
				console.log(
					"To confirm this action, run the command with --force flag:",
				);
				console.log("bun run migrate reset --force");
				process.exit(1);
			}

			console.log("🗑️  Resetting Database");
			console.log("======================\n");

			await resetDatabase();

			console.log("\n✅ Database reset completed!");
			process.exit(0);
		} catch (error) {
			console.error("❌ Reset failed:");
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

// Create new migration
program
	.command("create <name>")
	.description("Create a new migration file")
	.option("-s, --sql <sql>", "SQL content for the migration")
	.action(async (name, options) => {
		try {
			console.log("📝 Creating New Migration");
			console.log("=========================\n");

			const sql =
				options.sql ||
				`-- Add your SQL here
-- Example:
-- ALTER TABLE "user" ADD COLUMN newField VARCHAR;
`;

			const filePath = await createMigration(name, sql);

			console.log(`\n✅ Migration created: ${filePath}`);
			console.log(
				"\n💡 Edit the file to add your SQL, then run 'bun run migrate up'",
			);

			process.exit(0);
		} catch (error) {
			console.error("❌ Failed to create migration:");
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

// Help command
program
	.command("help")
	.description("Show help information")
	.action(() => {
		console.log("🚀 Better Auth Migration CLI");
		console.log("============================\n");

		console.log("Available commands:");
		console.log("  migrate, up     Run all pending migrations");
		console.log("  status          Show migration status");
		console.log("  validate        Validate migration integrity");
		console.log("  check           Check if Better Auth tables exist");
		console.log("  reset --force   Reset database (DANGER!)");
		console.log("  create <name>   Create a new migration file");
		console.log("  help            Show this help message\n");

		console.log("Examples:");
		console.log("  bun run migrate up");
		console.log("  bun run migrate status");
		console.log("  bun run migrate create 'add user role field'");
		console.log("  bun run migrate reset --force\n");

		console.log("For more help on a specific command, use:");
		console.log("  bun run migrate <command> --help");
	});

// Error handling for unknown commands
program.on("command:*", () => {
	console.error("❌ Unknown command: %s", program.args.join(" "));
	console.log("Run 'bun run migrate help' for available commands");
	process.exit(1);
});

// Parse command line arguments
if (process.argv.length <= 2) {
	// No arguments provided, show help
	program.outputHelp();
	process.exit(1);
}

program.parse(process.argv);
