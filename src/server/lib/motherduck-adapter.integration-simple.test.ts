import type { DuckDBConnection } from "@duckdb/node-api";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getParkTrackDatabaseConnection } from "../database/util.js";

interface TestRecord {
	id: string;
	name: string;
	email: string;
	active: boolean;
	score?: number;
	metadata?: Record<string, unknown>;
	createdAt?: Date;
	updatedAt?: Date;
}

interface WhereCondition {
	field: string;
	value: unknown;
	operator?: string;
}

describe("MotherDuck Adapter Direct Integration Tests", () => {
	let connection: DuckDBConnection;
	const testTable = "test_adapter_direct";

	// Helper functions that mirror the adapter's internal logic
	const escapeValue = (value: unknown): string => {
		if (value === null || value === undefined) {
			return "NULL";
		}
		if (typeof value === "string") {
			return `'${value.replace(/'/g, "''")}'`;
		}
		if (typeof value === "number" || typeof value === "boolean") {
			return String(value);
		}
		if (value instanceof Date) {
			return `'${value.toISOString()}'`;
		}
		if (typeof value === "object") {
			return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
		}
		return `'${String(value).replace(/'/g, "''")}'`;
	};

	const buildWhereClause = (where: WhereCondition[]): string => {
		if (!where || where.length === 0) return "";

		const conditions = where
			.map(({ field, value, operator = "=" }) => {
				if (value === null) {
					return `${field} IS NULL`;
				}
				return `${field} ${operator} ${escapeValue(value)}`;
			})
			.join(" AND ");

		return `WHERE ${conditions}`;
	};

	const buildSetClause = (update: Record<string, unknown>): string => {
		return Object.entries(update)
			.map(([key, value]) => `${key} = ${escapeValue(value)}`)
			.join(", ");
	};

	const buildInsertValues = (data: Record<string, unknown>) => {
		const columns = Object.keys(data).join(", ");
		const values = Object.values(data).map(escapeValue).join(", ");
		return { columns, values };
	};

	beforeAll(async () => {
		connection = await getParkTrackDatabaseConnection();

		// Create test table
		await connection.streamAndReadAll(`
			CREATE TABLE IF NOT EXISTS ${testTable} (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL,
				email VARCHAR UNIQUE NOT NULL,
				active BOOLEAN DEFAULT TRUE,
				score DOUBLE,
				metadata JSON,
				createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);
	});

	afterAll(async () => {
		// Clean up test table
		await connection?.streamAndReadAll(`DROP TABLE IF EXISTS ${testTable}`);
	});

	describe("CREATE operations", () => {
		it("should insert a new record with all data types", async () => {
			const testData = {
				id: "test_001",
				name: "John Doe",
				email: "john@example.com",
				active: true,
				score: 95.5,
				metadata: { role: "owner", permissions: ["read", "write"] },
				createdAt: new Date("2024-01-01T10:00:00Z"),
				updatedAt: new Date("2024-01-01T10:00:00Z"),
			} as const satisfies TestRecord;

			const { columns, values } = buildInsertValues(testData);
			const query = `INSERT INTO ${testTable} (${columns}) VALUES (${values}) RETURNING *`;

			const result = await connection.streamAndReadAll(query);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const inserted = rows[0] as Record<string, unknown>;
			expect(inserted["id"]).toBe(testData.id);
			expect(inserted["name"]).toBe(testData.name);
			expect(inserted["email"]).toBe(testData.email);
			expect(inserted["active"]).toBe(testData.active);
			expect(inserted["score"]).toBe(testData.score);
		});

		it("should handle null values correctly", async () => {
			const testData = {
				id: "test_null_001",
				name: "Null Test",
				email: "null_test@example.com",
				active: false,
				score: null,
				metadata: null,
			};

			const { columns, values } = buildInsertValues(testData);
			const query = `INSERT INTO ${testTable} (${columns}) VALUES (${values}) RETURNING *`;

			const result = await connection.streamAndReadAll(query);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const inserted = rows[0] as Record<string, unknown>;
			expect(inserted["score"]).toBeNull();
			expect(inserted["metadata"]).toBeNull();
		});

		it("should escape SQL injection attempts", async () => {
			const maliciousData = {
				id: "test_injection_001",
				name: "'; DROP TABLE users; --",
				email: "injection@example.com",
				active: true,
			};

			const { columns, values } = buildInsertValues(maliciousData);
			const query = `INSERT INTO ${testTable} (${columns}) VALUES (${values}) RETURNING *`;

			const result = await connection.streamAndReadAll(query);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const inserted = rows[0] as Record<string, unknown>;
			expect(inserted["name"]).toBe("'; DROP TABLE users; --");

			// Verify table still exists
			const tableCheck = await connection.streamAndReadAll(
				`SELECT COUNT(*) as count FROM ${testTable}`,
			);
			const countRows = tableCheck.getRowObjectsJS();
			expect(Number(countRows[0]?.["count"])).toBeGreaterThan(0);
		});
	});

	describe("UPDATE operations", () => {
		it("should update existing records", async () => {
			// First insert a record
			const originalData = {
				id: "test_update_001",
				name: "Original Name",
				email: "update_test@example.com",
				active: false,
				score: 50,
			};

			const { columns, values } = buildInsertValues(originalData);
			await connection.streamAndReadAll(
				`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
			);

			// Update the record
			const updateData = {
				name: "Updated Name",
				active: true,
				score: 95,
				updatedAt: new Date(),
			};

			const setClause = buildSetClause(updateData);
			const whereClause = buildWhereClause([
				{ field: "id", value: "test_update_001" },
			]);

			const updateQuery = `UPDATE ${testTable} SET ${setClause} ${whereClause} RETURNING *`;
			const result = await connection.streamAndReadAll(updateQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const updated = rows[0] as Record<string, unknown>;
			expect(updated["name"]).toBe("Updated Name");
			expect(updated["active"]).toBe(true);
			expect(updated["score"]).toBe(95);
			expect(updated["email"]).toBe(originalData.email); // Should remain unchanged
		});

		it("should handle multiple where conditions", async () => {
			const testData = {
				id: "test_multi_where_001",
				name: "Multi Where Test",
				email: "multi_where@example.com",
				active: true,
			};

			const { columns, values } = buildInsertValues(testData);
			await connection.streamAndReadAll(
				`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
			);

			const updateData = { name: "Updated Multi Where" };
			const setClause = buildSetClause(updateData);
			const whereClause = buildWhereClause([
				{ field: "id", value: "test_multi_where_001" },
				{ field: "active", value: true },
			]);

			const updateQuery = `UPDATE ${testTable} SET ${setClause} ${whereClause} RETURNING *`;
			const result = await connection.streamAndReadAll(updateQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			expect(rows[0]?.["name"]).toBe("Updated Multi Where");
		});
	});

	describe("SELECT operations", () => {
		it("should find records with where conditions", async () => {
			// Insert test data
			const testRecords = [
				{
					id: "find_001",
					name: "Find Test 1",
					email: "find1@example.com",
					active: true,
					score: 80,
				},
				{
					id: "find_002",
					name: "Find Test 2",
					email: "find2@example.com",
					active: false,
					score: 60,
				},
			];

			for (const record of testRecords) {
				const { columns, values } = buildInsertValues(record);
				await connection.streamAndReadAll(
					`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
				);
			}

			// Find active records
			const whereClause = buildWhereClause([{ field: "active", value: true }]);
			const selectQuery = `SELECT * FROM ${testTable} ${whereClause}`;

			const result = await connection.streamAndReadAll(selectQuery);
			const rows = result.getRowObjectsJS();

			const activeRecords = rows.filter((row) => row["active"] === true);
			expect(activeRecords.length).toBeGreaterThanOrEqual(1);
		});

		it("should handle LIKE operators", async () => {
			const testData = {
				id: "like_test_001",
				name: "LIKE Test User",
				email: "like_test@example.com",
				active: true,
			};

			const { columns, values } = buildInsertValues(testData);
			await connection.streamAndReadAll(
				`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
			);

			const whereClause = buildWhereClause([
				{ field: "name", value: "LIKE Test%", operator: "LIKE" },
			]);
			const selectQuery = `SELECT * FROM ${testTable} ${whereClause}`;

			const result = await connection.streamAndReadAll(selectQuery);
			const rows = result.getRowObjectsJS();

			expect(rows.length).toBeGreaterThanOrEqual(1);
			expect(rows[0]?.["name"]).toBe("LIKE Test User");
		});

		it("should handle ordering and limits", async () => {
			// Insert multiple records for sorting
			const testRecords = [
				{
					id: "sort_c",
					name: "Charlie",
					email: "charlie@example.com",
					active: true,
					score: 70,
				},
				{
					id: "sort_a",
					name: "Alice",
					email: "alice@example.com",
					active: true,
					score: 90,
				},
				{
					id: "sort_b",
					name: "Bob",
					email: "bob@example.com",
					active: true,
					score: 80,
				},
			];

			for (const record of testRecords) {
				const { columns, values } = buildInsertValues(record);
				await connection.streamAndReadAll(
					`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
				);
			}

			// Test sorting by name ASC with limit
			const selectQuery = `SELECT * FROM ${testTable} WHERE name IN ('Alice', 'Bob', 'Charlie') ORDER BY name ASC LIMIT 2`;

			const result = await connection.streamAndReadAll(selectQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(2);
			expect(rows[0]?.["name"]).toBe("Alice");
			expect(rows[1]?.["name"]).toBe("Bob");
		});
	});

	describe("DELETE operations", () => {
		it("should delete single record", async () => {
			const testData = {
				id: "delete_test_001",
				name: "Delete Test",
				email: "delete_test@example.com",
				active: true,
			};

			const { columns, values } = buildInsertValues(testData);
			await connection.streamAndReadAll(
				`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
			);

			// Delete the record
			const whereClause = buildWhereClause([
				{ field: "id", value: "delete_test_001" },
			]);
			const deleteQuery = `DELETE FROM ${testTable} ${whereClause}`;

			await connection.streamAndReadAll(deleteQuery);

			// Verify deletion
			const selectQuery = `SELECT * FROM ${testTable} ${whereClause}`;
			const result = await connection.streamAndReadAll(selectQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(0);
		});

		it("should delete multiple records", async () => {
			// Insert test records
			const testRecords = [
				{
					id: "batch_delete_001",
					name: "Batch Delete 1",
					email: "batch1@example.com",
					active: false,
				},
				{
					id: "batch_delete_002",
					name: "Batch Delete 2",
					email: "batch2@example.com",
					active: false,
				},
			];

			for (const record of testRecords) {
				const { columns, values } = buildInsertValues(record);
				await connection.streamAndReadAll(
					`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
				);
			}

			// Delete all inactive records
			const whereClause = buildWhereClause([
				{ field: "active", value: false },
				{ field: "name", value: "Batch Delete%", operator: "LIKE" },
			]);
			const deleteQuery = `DELETE FROM ${testTable} ${whereClause}`;

			await connection.streamAndReadAll(deleteQuery);

			// Verify deletions
			const selectQuery = `SELECT * FROM ${testTable} WHERE name LIKE 'Batch Delete%'`;
			const result = await connection.streamAndReadAll(selectQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(0);
		});
	});

	describe("COUNT operations", () => {
		it("should count records correctly", async () => {
			// Insert test records
			const testRecords = [
				{
					id: "count_001",
					name: "Count Test 1",
					email: "count1@example.com",
					active: true,
				},
				{
					id: "count_002",
					name: "Count Test 2",
					email: "count2@example.com",
					active: true,
				},
				{
					id: "count_003",
					name: "Count Test 3",
					email: "count3@example.com",
					active: false,
				},
			];

			for (const record of testRecords) {
				const { columns, values } = buildInsertValues(record);
				await connection.streamAndReadAll(
					`INSERT INTO ${testTable} (${columns}) VALUES (${values})`,
				);
			}

			// Count all records
			const totalCountQuery = `SELECT COUNT(*) as count FROM ${testTable}`;
			const totalResult = await connection.streamAndReadAll(totalCountQuery);
			const totalRows = totalResult.getRowObjectsJS();
			const totalCount = Number(totalRows[0]?.["count"]);

			expect(totalCount).toBeGreaterThanOrEqual(3);

			// Count active records
			const whereClause = buildWhereClause([{ field: "active", value: true }]);
			const activeCountQuery = `SELECT COUNT(*) as count FROM ${testTable} ${whereClause}`;
			const activeResult = await connection.streamAndReadAll(activeCountQuery);
			const activeRows = activeResult.getRowObjectsJS();
			const activeCount = Number(activeRows[0]?.["count"]);

			expect(activeCount).toBeGreaterThanOrEqual(2);
			expect(activeCount).toBeLessThanOrEqual(totalCount);
		});
	});

	describe("JSON and complex data types", () => {
		it("should handle complex JSON structures", async () => {
			const complexMetadata = {
				user_preferences: {
					theme: "dark",
					notifications: {
						email: true,
						push: false,
						frequency: "daily",
					},
				},
				permissions: ["read", "write"],
				stats: {
					login_count: 25,
					last_login: "2024-01-01T10:00:00Z",
				},
			};

			const testData = {
				id: "json_test_001",
				name: "JSON Test User",
				email: "json_test@example.com",
				active: true,
				metadata: complexMetadata,
			};

			const { columns, values } = buildInsertValues(testData);
			const insertQuery = `INSERT INTO ${testTable} (${columns}) VALUES (${values}) RETURNING *`;

			const result = await connection.streamAndReadAll(insertQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const inserted = rows[0] as Record<string, unknown>;

			// Note: DuckDB stores JSON as strings, which is expected behavior
			expect(inserted["metadata"]).toBeDefined();

			// If stored as string, it should be valid JSON
			if (typeof inserted["metadata"] === "string") {
				const parsedMetadata = JSON.parse(inserted["metadata"] as string);
				expect(parsedMetadata).toEqual(complexMetadata);
			} else {
				// If stored as object, verify structure
				expect(inserted["metadata"]).toEqual(complexMetadata);
			}
		});

		it("should handle Date objects", async () => {
			const testDate = new Date("2024-12-01T15:30:00Z");
			const testData = {
				id: "date_test_001",
				name: "Date Test User",
				email: "date_test@example.com",
				active: true,
				createdAt: testDate,
				updatedAt: testDate,
			};

			const { columns, values } = buildInsertValues(testData);
			const insertQuery = `INSERT INTO ${testTable} (${columns}) VALUES (${values}) RETURNING *`;

			const result = await connection.streamAndReadAll(insertQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const inserted = rows[0] as Record<string, unknown>;

			// Dates should be stored and retrievable
			expect(inserted["createdAt"]).toBeDefined();
			expect(inserted["updatedAt"]).toBeDefined();
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle empty strings and special characters", async () => {
			const testData = {
				id: "special_chars_001",
				name: "User with 'quotes' and \"double quotes\"",
				email: "special@example.com",
				active: true,
				metadata: {
					description:
						"Contains 'quotes', \"double quotes\", and\nnewlines\ttabs",
					symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
				},
			};

			const { columns, values } = buildInsertValues(testData);
			const insertQuery = `INSERT INTO ${testTable} (${columns}) VALUES (${values}) RETURNING *`;

			const result = await connection.streamAndReadAll(insertQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const inserted = rows[0] as Record<string, unknown>;
			expect(inserted["name"]).toBe(testData.name);
		});

		it("should handle unicode characters", async () => {
			const testData = {
				id: "unicode_001",
				name: "用户测试 🚀 émojis ñoño",
				email: "unicode@测试.com",
				active: true,
				metadata: {
					languages: ["English", "中文", "Español", "العربية", "русский"],
					emoji: "🎉🔥💎🚀🌟⭐🎯💡🔑🏆",
				},
			};

			const { columns, values } = buildInsertValues(testData);
			const insertQuery = `INSERT INTO ${testTable} (${columns}) VALUES (${values}) RETURNING *`;

			const result = await connection.streamAndReadAll(insertQuery);
			const rows = result.getRowObjectsJS();

			expect(rows).toHaveLength(1);
			const inserted = rows[0] as Record<string, unknown>;
			expect(inserted["name"]).toBe(testData.name);
			expect(inserted["email"]).toBe(testData.email);
		});
	});
});
