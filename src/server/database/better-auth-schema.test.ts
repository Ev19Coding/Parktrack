import type { DuckDBConnection } from "@duckdb/node-api";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	BETTER_AUTH_TABLES,
	CREDENTIAL_PROVIDER,
	type CreateAccount,
	type CreateSession,
	type CreateUser,
	OAUTH_PROVIDERS,
	validateAccount,
	validateCreateAccount,
	validateCreateSession,
	validateCreateUser,
	validateCreateVerification,
	validateSession,
	validateUser,
	validateVerification,
} from "./better-auth-schema.js";
import { getParkTrackDatabaseConnection } from "./util.js";

describe("Better Auth Schema Integration Tests", () => {
	let connection: DuckDBConnection;
	const testTablePrefix = "test_better_auth_";

	beforeAll(async () => {
		connection = await getParkTrackDatabaseConnection();

		// Create test tables with same structure as Better Auth tables
		await connection.streamAndReadAll(`
			CREATE TABLE IF NOT EXISTS ${testTablePrefix}user (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL,
				email VARCHAR UNIQUE NOT NULL,
				emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
				image VARCHAR,
				favourites JSON DEFAULT '[]',
				type VARCHAR NOT NULL DEFAULT 'user',
				createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);

		await connection.streamAndReadAll(`
			CREATE TABLE IF NOT EXISTS ${testTablePrefix}session (
				id VARCHAR PRIMARY KEY,
				userId VARCHAR NOT NULL,
				token VARCHAR UNIQUE NOT NULL,
				expiresAt TIMESTAMP NOT NULL,
				ipAddress VARCHAR,
				userAgent VARCHAR,
				createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (userId) REFERENCES ${testTablePrefix}user (id)
			)
		`);

		await connection.streamAndReadAll(`
			CREATE TABLE IF NOT EXISTS ${testTablePrefix}account (
				id VARCHAR PRIMARY KEY,
				userId VARCHAR NOT NULL,
				accountId VARCHAR NOT NULL,
				providerId VARCHAR NOT NULL,
				accessToken VARCHAR,
				refreshToken VARCHAR,
				accessTokenExpiresAt TIMESTAMP,
				refreshTokenExpiresAt TIMESTAMP,
				scope VARCHAR,
				idToken VARCHAR,
				password VARCHAR,
				createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (userId) REFERENCES ${testTablePrefix}user (id)
			)
		`);

		await connection.streamAndReadAll(`
			CREATE TABLE IF NOT EXISTS ${testTablePrefix}verification (
				id VARCHAR PRIMARY KEY,
				identifier VARCHAR NOT NULL,
				value VARCHAR NOT NULL,
				expiresAt TIMESTAMP NOT NULL,
				createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);
	});

	afterAll(async () => {
		// Clean up test tables
		await connection.streamAndReadAll(
			`DROP TABLE IF EXISTS ${testTablePrefix}verification`,
		);
		await connection.streamAndReadAll(
			`DROP TABLE IF EXISTS ${testTablePrefix}account`,
		);
		await connection.streamAndReadAll(
			`DROP TABLE IF EXISTS ${testTablePrefix}session`,
		);
		await connection.streamAndReadAll(
			`DROP TABLE IF EXISTS ${testTablePrefix}user`,
		);
	});

	describe("Schema Constants", () => {
		it("should have correct table name constants", () => {
			expect(BETTER_AUTH_TABLES.USER).toBe("user");
			expect(BETTER_AUTH_TABLES.SESSION).toBe("session");
			expect(BETTER_AUTH_TABLES.ACCOUNT).toBe("account");
			expect(BETTER_AUTH_TABLES.VERIFICATION).toBe("verification");
		});

		it("should have OAuth provider constants", () => {
			expect(OAUTH_PROVIDERS.GOOGLE).toBe("google");
			expect(OAUTH_PROVIDERS.GITHUB).toBe("github");
			expect(OAUTH_PROVIDERS.DISCORD).toBe("discord");
			expect(CREDENTIAL_PROVIDER).toBe("credential");
		});
	});

	describe("User Schema Validation", () => {
		it("should validate correct user data", () => {
			const userData = {
				id: "user_001",
				name: "John Doe",
				email: "john@example.com",
				emailVerified: true,
				image: "https://example.com/avatar.jpg",
				favourites: ["location_1", "location_2"],
				type: "user" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedUser = validateUser(userData);
			expect(validatedUser.id).toBe(userData.id);
			expect(validatedUser.name).toBe(userData.name);
			expect(validatedUser.email).toBe(userData.email);
			expect(validatedUser.emailVerified).toBe(userData.emailVerified);
			expect(validatedUser.favourites).toEqual(userData.favourites);
			expect(validatedUser.type).toBe(userData.type);
		});

		it("should validate user creation data", () => {
			const createData = {
				name: "Jane Doe",
				email: "jane@example.com",
				emailVerified: false,
				favourites: ["location_3"],
				type: "owner" as const,
			};

			const validatedData = validateCreateUser(createData);
			expect(validatedData.name).toBe(createData.name);
			expect(validatedData.email).toBe(createData.email);
			expect(validatedData.emailVerified).toBe(createData.emailVerified);
			expect(validatedData.favourites).toEqual(createData.favourites);
			expect(validatedData.type).toBe(createData.type);
		});

		it("should reject invalid email format", () => {
			const userData = {
				id: "user_002",
				name: "Invalid User",
				email: "not-an-email",
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(() => validateUser(userData)).toThrow();
		});

		it("should handle optional fields", () => {
			const userWithDefaults = {
				id: "user_003",
				name: "Default User",
				email: "default@example.com",
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedUser = validateUser(userWithDefaults);
			expect(validatedUser.image).toBeUndefined();
			expect(validatedUser.favourites).toEqual([]);
			expect(validatedUser.type).toBe("user");
		});

		it("should validate different user types", () => {
			const userTypes = ["user", "owner"] as const;

			userTypes.forEach((type) => {
				const userData = {
					id: `${type}_001`,
					name: `${type} User`,
					email: `${type}@example.com`,
					emailVerified: true,
					type,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const validatedUser = validateUser(userData);
				expect(validatedUser.type).toBe(type);
			});
		});

		it("should validate favourites array", () => {
			const userData = {
				id: "user_fav_001",
				name: "Favourite User",
				email: "fav@example.com",
				emailVerified: true,
				favourites: ["loc_1", "loc_2", "loc_3", "loc_4"],
				type: "user" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedUser = validateUser(userData);
			expect(validatedUser.favourites).toHaveLength(4);
			expect(validatedUser.favourites).toContain("loc_1");
			expect(validatedUser.favourites).toContain("loc_4");
		});

		it("should reject invalid user type", () => {
			const userData = {
				id: "user_004",
				name: "Invalid User",
				email: "invalid@example.com",
				emailVerified: false,
				type: "invalid_type",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(() => validateUser(userData)).toThrow();
		});

		it("should reject invalid favourites format", () => {
			const userData = {
				id: "user_005",
				name: "Bad Favourites User",
				email: "badfav@example.com",
				emailVerified: false,
				favourites: "not_an_array",
				type: "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(() => validateUser(userData)).toThrow();
		});
	});

	describe("Session Schema Validation", () => {
		it("should validate correct session data", () => {
			const sessionData = {
				id: "session_001",
				userId: "user_001",
				token: "session_token_12345",
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedSession = validateSession(sessionData);
			expect(validatedSession.id).toBe(sessionData.id);
			expect(validatedSession.userId).toBe(sessionData.userId);
			expect(validatedSession.token).toBe(sessionData.token);
		});

		it("should validate session creation data", () => {
			const createData = {
				userId: "user_001",
				token: "new_session_token",
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				ipAddress: "10.0.0.1",
			};

			const validatedData = validateCreateSession(createData);
			expect(validatedData.userId).toBe(createData.userId);
			expect(validatedData.token).toBe(createData.token);
		});

		it("should handle optional session fields", () => {
			const minimalSession = {
				id: "session_002",
				userId: "user_001",
				token: "minimal_token",
				expiresAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedSession = validateSession(minimalSession);
			expect(validatedSession.ipAddress).toBeUndefined();
			expect(validatedSession.userAgent).toBeUndefined();
		});
	});

	describe("Account Schema Validation", () => {
		it("should validate OAuth account data", () => {
			const accountData = {
				id: "account_001",
				userId: "user_001",
				accountId: "github_12345",
				providerId: OAUTH_PROVIDERS.GITHUB,
				accessToken: "github_access_token",
				refreshToken: "github_refresh_token",
				scope: "user:email",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedAccount = validateAccount(accountData);
			expect(validatedAccount.providerId).toBe(OAUTH_PROVIDERS.GITHUB);
			expect(validatedAccount.accessToken).toBe(accountData.accessToken);
		});

		it("should validate credential account data", () => {
			const credentialData = {
				id: "account_002",
				userId: "user_002",
				accountId: "user_002",
				providerId: CREDENTIAL_PROVIDER,
				password: "hashed_password_12345",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedAccount = validateAccount(credentialData);
			expect(validatedAccount.providerId).toBe(CREDENTIAL_PROVIDER);
			expect(validatedAccount.password).toBe(credentialData.password);
		});

		it("should validate account creation data", () => {
			const createData = {
				userId: "user_003",
				accountId: "google_67890",
				providerId: OAUTH_PROVIDERS.GOOGLE,
				accessToken: "google_token",
			};

			const validatedData = validateCreateAccount(createData);
			expect(validatedData.providerId).toBe(OAUTH_PROVIDERS.GOOGLE);
		});
	});

	describe("Verification Schema Validation", () => {
		it("should validate verification data", () => {
			const verificationData = {
				id: "verification_001",
				identifier: "john@example.com",
				value: "verification_code_12345",
				expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const validatedVerification = validateVerification(verificationData);
			expect(validatedVerification.identifier).toBe(
				verificationData.identifier,
			);
			expect(validatedVerification.value).toBe(verificationData.value);
		});

		it("should validate verification creation data", () => {
			const createData = {
				identifier: "jane@example.com",
				value: "reset_token_67890",
				expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
			};

			const validatedData = validateCreateVerification(createData);
			expect(validatedData.identifier).toBe(createData.identifier);
			expect(validatedData.value).toBe(createData.value);
		});
	});

	describe("Database Integration Tests", () => {
		it("should insert and retrieve user data", async () => {
			const testUser: CreateUser = {
				id: "db_user_001",
				name: "Database Test User",
				email: "dbtest@example.com",
				emailVerified: true,
				favourites: [],
				type: "user",
			};

			// Insert user
			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}user (id, name, email, emailVerified, favourites, type, createdAt, updatedAt)
				VALUES (
					'${testUser.id}',
					'${testUser.name}',
					'${testUser.email}',
					${testUser.emailVerified},
					'[]',
					'user',
					CURRENT_TIMESTAMP,
					CURRENT_TIMESTAMP
				)
			`);

			// Retrieve and validate
			const result = await connection.streamAndReadAll(`
				SELECT * FROM ${testTablePrefix}user WHERE id = '${testUser.id}'
			`);

			const rows = result.getRowObjectsJS();
			expect(rows).toHaveLength(1);

			const row = rows[0];
			if (!row) throw new Error("Row not found");

			const retrievedUser = validateUser({
				...row,
				image: row["image"] || undefined,
				favourites: row["favourites"]
					? JSON.parse(row["favourites"] as string)
					: [],
				type: (row["type"] as string) || "user",
				createdAt: new Date(row["createdAt"] as string),
				updatedAt: new Date(row["updatedAt"] as string),
			});

			expect(retrievedUser.id).toBe(testUser.id);
			expect(retrievedUser.name).toBe(testUser.name);
			expect(retrievedUser.email).toBe(testUser.email);
			expect(retrievedUser.emailVerified).toBe(testUser.emailVerified);
		});

		it("should handle session relationships", async () => {
			const userId = "db_user_002";
			const sessionId = "db_session_001";

			// Create user first
			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}user (id, name, email, emailVerified, favourites, type, createdAt, updatedAt)
				VALUES ('${userId}', 'Session User', 'session@example.com', true, '[]', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`);

			// Create session
			const sessionData: CreateSession = {
				id: sessionId,
				userId: userId,
				token: "test_session_token",
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				ipAddress: "127.0.0.1",
				userAgent: "Test Agent",
			};

			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}session (id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt)
				VALUES (
					'${sessionData.id}',
					'${sessionData.userId}',
					'${sessionData.token}',
					'${sessionData.expiresAt.toISOString()}',
					'${sessionData.ipAddress}',
					'${sessionData.userAgent}',
					CURRENT_TIMESTAMP,
					CURRENT_TIMESTAMP
				)
			`);

			// Retrieve session with user data
			const result = await connection.streamAndReadAll(`
				SELECT
					s.*,
					u.name as userName,
					u.email as userEmail
				FROM ${testTablePrefix}session s
				JOIN ${testTablePrefix}user u ON s.userId = u.id
				WHERE s.id = '${sessionId}'
			`);

			const rows = result.getRowObjectsJS();
			expect(rows).toHaveLength(1);

			const sessionRow = rows[0];
			if (!sessionRow) throw new Error("Session row not found");

			const validatedSession = validateSession({
				id: sessionRow["id"],
				userId: sessionRow["userId"],
				token: sessionRow["token"],
				expiresAt: new Date(sessionRow["expiresAt"] as string),
				ipAddress: sessionRow["ipAddress"],
				userAgent: sessionRow["userAgent"],
				createdAt: new Date(sessionRow["createdAt"] as string),
				updatedAt: new Date(sessionRow["updatedAt"] as string),
			});

			expect(validatedSession.userId).toBe(userId);
			expect(sessionRow["userName"]).toBe("Session User");
			expect(sessionRow["userEmail"]).toBe("session@example.com");
		});

		it("should handle account provider types", async () => {
			const userId = "db_user_003";
			const accountId = "db_account_001";

			// Create user
			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}user (id, name, email, emailVerified, favourites, type, createdAt, updatedAt)
				VALUES ('${userId}', 'OAuth User', 'oauth@example.com', true, '[]', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`);

			// Create OAuth account
			const accountData: CreateAccount = {
				id: accountId,
				userId: userId,
				accountId: "github_123456",
				providerId: OAUTH_PROVIDERS.GITHUB,
				accessToken: "github_access_token_test",
				refreshToken: "github_refresh_token_test",
				scope: "user:email,repo",
			};

			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}account (id, userId, accountId, providerId, accessToken, refreshToken, scope, createdAt, updatedAt)
				VALUES (
					'${accountData.id}',
					'${accountData.userId}',
					'${accountData.accountId}',
					'${accountData.providerId}',
					'${accountData.accessToken}',
					'${accountData.refreshToken}',
					'${accountData.scope}',
					CURRENT_TIMESTAMP,
					CURRENT_TIMESTAMP
				)
			`);

			// Retrieve and validate
			const result = await connection.streamAndReadAll(`
				SELECT * FROM ${testTablePrefix}account WHERE id = '${accountId}'
			`);

			const rows = result.getRowObjectsJS();
			expect(rows).toHaveLength(1);

			const row = rows[0];
			if (!row) throw new Error("Account row not found");

			const validatedAccount = validateAccount({
				...row,
				accessTokenExpiresAt: row["accessTokenExpiresAt"]
					? new Date(row["accessTokenExpiresAt"] as string)
					: undefined,
				refreshTokenExpiresAt: row["refreshTokenExpiresAt"]
					? new Date(row["refreshTokenExpiresAt"] as string)
					: undefined,
				idToken: row["idToken"] || undefined,
				password: row["password"] || undefined,
				createdAt: new Date(row["createdAt"] as string),
				updatedAt: new Date(row["updatedAt"] as string),
			});

			expect(validatedAccount.providerId).toBe(OAUTH_PROVIDERS.GITHUB);
			expect(validatedAccount.accessToken).toBe(accountData.accessToken);
			expect(validatedAccount.scope).toBe(accountData.scope);
		});

		it("should handle verification token lifecycle", async () => {
			const verificationId = "db_verification_001";
			const identifier = "verify@example.com";
			const value = "verification_token_test";
			const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

			// Create verification
			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}verification (id, identifier, value, expiresAt, createdAt, updatedAt)
				VALUES (
					'${verificationId}',
					'${identifier}',
					'${value}',
					'${expiresAt.toISOString()}',
					CURRENT_TIMESTAMP,
					CURRENT_TIMESTAMP
				)
			`);

			// Retrieve and validate
			const result = await connection.streamAndReadAll(`
				SELECT * FROM ${testTablePrefix}verification WHERE identifier = '${identifier}'
			`);

			const rows = result.getRowObjectsJS();
			expect(rows).toHaveLength(1);

			const row = rows[0];
			if (!row) throw new Error("Verification row not found");

			const validatedVerification = validateVerification({
				...row,
				expiresAt: new Date(row["expiresAt"] as string),
				createdAt: new Date(row["createdAt"] as string),
				updatedAt: new Date(row["updatedAt"] as string),
			});

			expect(validatedVerification.identifier).toBe(identifier);
			expect(validatedVerification.value).toBe(value);
			expect(validatedVerification.expiresAt.getTime()).toBeCloseTo(
				expiresAt.getTime(),
				-3,
			);
		});
	});

	describe("Edge Cases and Error Handling", () => {
		it("should reject malformed data", () => {
			const malformedUser = {
				id: 123, // should be string
				name: null, // should be string
				email: "not-an-email",
				emailVerified: "true", // should be boolean
			};

			expect(() => validateUser(malformedUser)).toThrow();
		});

		it("should handle special characters in data", async () => {
			const specialUser = {
				id: "special_user_001",
				name: "User with 'quotes' and \"double quotes\"",
				email: "special@example.com",
				emailVerified: false,
			};

			// This should not throw when properly escaped
			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}user (id, name, email, emailVerified, favourites, type, createdAt, updatedAt)
				VALUES (
					'${specialUser.id}',
					'${specialUser.name.replace(/'/g, "''")}',
					'${specialUser.email}',
					${specialUser.emailVerified},
					'[]',
					'user',
					CURRENT_TIMESTAMP,
					CURRENT_TIMESTAMP
				)
			`);

			const result = await connection.streamAndReadAll(`
				SELECT * FROM ${testTablePrefix}user WHERE id = '${specialUser.id}'
			`);

			const rows = result.getRowObjectsJS();
			expect(rows).toHaveLength(1);

			const row = rows[0];
			if (!row) throw new Error("Special user row not found");

			expect(row["name"]).toBe(specialUser.name);
		});

		it("should handle unicode characters", async () => {
			const unicodeUser = {
				id: "unicode_user_001",
				name: "用户测试 🚀 émojis",
				email: "unicode@example.com", // Use valid ASCII email for schema validation
				emailVerified: true,
			};

			await connection.streamAndReadAll(`
				INSERT INTO ${testTablePrefix}user (id, name, email, emailVerified, favourites, type, createdAt, updatedAt)
				VALUES (
					'${unicodeUser.id}',
					'${unicodeUser.name}',
					'${unicodeUser.email}',
					${unicodeUser.emailVerified},
					'[]',
					'user',
					CURRENT_TIMESTAMP,
					CURRENT_TIMESTAMP
				)
			`);

			const result = await connection.streamAndReadAll(`
				SELECT * FROM ${testTablePrefix}user WHERE id = '${unicodeUser.id}'
			`);

			const rows = result.getRowObjectsJS();
			expect(rows).toHaveLength(1);

			const row = rows[0];
			if (!row) throw new Error("Unicode user row not found");

			const validatedUser = validateUser({
				...row,
				image: row["image"] || undefined,
				favourites: row["favourites"]
					? JSON.parse(row["favourites"] as string)
					: [],
				type: (row["type"] as string) || "user",
				createdAt: new Date(row["createdAt"] as string),
				updatedAt: new Date(row["updatedAt"] as string),
			});

			expect(validatedUser.name).toBe(unicodeUser.name);
			expect(validatedUser.email).toBe(unicodeUser.email);
		});
	});
});
