import * as v from "valibot";

/**
 * Better Auth Core Schema Definitions for TypeScript
 * These schemas match the database tables and provide type safety
 */

// User type enum for role-based access
export const UserType = v.picklist(["user", "owner", "admin"]);
export type UserType = v.InferOutput<typeof UserType>;

// User schema - matches the user table
export const UserSchema = v.object({
	id: v.string(),
	name: v.string(),
	email: v.pipe(v.string(), v.email()),
	emailVerified: v.boolean(),
	image: v.optional(v.pipe(v.string(), v.url())),
	favourites: v.optional(v.array(v.string()), []), // Array of recreational location IDs
	type: v.optional(UserType, "user"), // User role: user, owner, or admin
	createdAt: v.date(),
	updatedAt: v.date(),
});

export type User = v.InferOutput<typeof UserSchema>;

// Session schema - matches the session table
export const SessionSchema = v.object({
	id: v.string(),
	userId: v.string(),
	token: v.string(),
	expiresAt: v.date(),
	ipAddress: v.optional(v.string()),
	userAgent: v.optional(v.string()),
	createdAt: v.date(),
	updatedAt: v.date(),
});

export type Session = v.InferOutput<typeof SessionSchema>;

// Account schema - matches the account table
export const AccountSchema = v.object({
	id: v.string(),
	userId: v.string(),
	accountId: v.string(),
	providerId: v.string(),
	accessToken: v.optional(v.string()),
	refreshToken: v.optional(v.string()),
	accessTokenExpiresAt: v.optional(v.date()),
	refreshTokenExpiresAt: v.optional(v.date()),
	scope: v.optional(v.string()),
	idToken: v.optional(v.string()),
	password: v.optional(v.string()),
	createdAt: v.date(),
	updatedAt: v.date(),
});

export type Account = v.InferOutput<typeof AccountSchema>;

// Verification schema - matches the verification table
export const VerificationSchema = v.object({
	id: v.string(),
	identifier: v.string(),
	value: v.string(),
	expiresAt: v.date(),
	createdAt: v.date(),
	updatedAt: v.date(),
});

export type Verification = v.InferOutput<typeof VerificationSchema>;

// Database insert types (without auto-generated fields)
export const CreateUserSchema = v.object({
	id: v.optional(v.string()),
	name: v.string(),
	email: v.pipe(v.string(), v.email()),
	emailVerified: v.optional(v.boolean()),
	image: v.optional(v.pipe(v.string(), v.url())),
	favourites: v.optional(v.array(v.string()), []),
	type: v.optional(UserType, "user"),
});

export type CreateUser = v.InferOutput<typeof CreateUserSchema>;

export const CreateSessionSchema = v.object({
	id: v.optional(v.string()),
	userId: v.string(),
	token: v.string(),
	expiresAt: v.date(),
	ipAddress: v.optional(v.string()),
	userAgent: v.optional(v.string()),
});

export type CreateSession = v.InferOutput<typeof CreateSessionSchema>;

export const CreateAccountSchema = v.object({
	id: v.optional(v.string()),
	userId: v.string(),
	accountId: v.string(),
	providerId: v.string(),
	accessToken: v.optional(v.string()),
	refreshToken: v.optional(v.string()),
	accessTokenExpiresAt: v.optional(v.date()),
	refreshTokenExpiresAt: v.optional(v.date()),
	scope: v.optional(v.string()),
	idToken: v.optional(v.string()),
	password: v.optional(v.string()),
});

export type CreateAccount = v.InferOutput<typeof CreateAccountSchema>;

export const CreateVerificationSchema = v.object({
	id: v.optional(v.string()),
	identifier: v.string(),
	value: v.string(),
	expiresAt: v.date(),
});

export type CreateVerification = v.InferOutput<typeof CreateVerificationSchema>;

// Update types (all fields optional except id)
export const UpdateUserSchema = v.object({
	id: v.string(),
	name: v.optional(v.string()),
	email: v.optional(v.pipe(v.string(), v.email())),
	emailVerified: v.optional(v.boolean()),
	image: v.optional(v.pipe(v.string(), v.url())),
	favourites: v.optional(v.array(v.string())),
	type: v.optional(UserType),
});

export type UpdateUser = v.InferOutput<typeof UpdateUserSchema>;

export const UpdateSessionSchema = v.object({
	id: v.string(),
	userId: v.optional(v.string()),
	token: v.optional(v.string()),
	expiresAt: v.optional(v.date()),
	ipAddress: v.optional(v.string()),
	userAgent: v.optional(v.string()),
});

export type UpdateSession = v.InferOutput<typeof UpdateSessionSchema>;

export const UpdateAccountSchema = v.object({
	id: v.string(),
	userId: v.optional(v.string()),
	accountId: v.optional(v.string()),
	providerId: v.optional(v.string()),
	accessToken: v.optional(v.string()),
	refreshToken: v.optional(v.string()),
	accessTokenExpiresAt: v.optional(v.date()),
	refreshTokenExpiresAt: v.optional(v.date()),
	scope: v.optional(v.string()),
	idToken: v.optional(v.string()),
	password: v.optional(v.string()),
});

export type UpdateAccount = v.InferOutput<typeof UpdateAccountSchema>;

// Database table names as constants
export const BETTER_AUTH_TABLES = {
	USER: "user",
	SESSION: "session",
	ACCOUNT: "account",
	VERIFICATION: "verification",
} as const;

// Helper function to validate data against schemas
export function validateUser(data: unknown): User {
	return v.parse(UserSchema, data);
}

export function validateSession(data: unknown): Session {
	return v.parse(SessionSchema, data);
}

export function validateAccount(data: unknown): Account {
	return v.parse(AccountSchema, data);
}

export function validateVerification(data: unknown): Verification {
	return v.parse(VerificationSchema, data);
}

// Helper function to validate create data
export function validateCreateUser(data: unknown): CreateUser {
	return v.parse(CreateUserSchema, data);
}

export function validateCreateSession(data: unknown): CreateSession {
	return v.parse(CreateSessionSchema, data);
}

export function validateCreateAccount(data: unknown): CreateAccount {
	return v.parse(CreateAccountSchema, data);
}

export function validateCreateVerification(data: unknown): CreateVerification {
	return v.parse(CreateVerificationSchema, data);
}

// Provider types for OAuth
export const OAUTH_PROVIDERS = {
	GOOGLE: "google",
	GITHUB: "github",
	DISCORD: "discord",
	FACEBOOK: "facebook",
	TWITTER: "twitter",
	MICROSOFT: "microsoft",
	APPLE: "apple",
} as const;

export type OAuthProvider =
	(typeof OAUTH_PROVIDERS)[keyof typeof OAUTH_PROVIDERS];

// Credential provider for email/password
export const CREDENTIAL_PROVIDER = "credential" as const;

export type Provider = OAuthProvider | typeof CREDENTIAL_PROVIDER;

// Better Auth error types
export interface BetterAuthError {
	code: string;
	message: string;
	status?: number;
}

// Session with user data (common pattern)
export interface SessionWithUser {
	session: Session;
	user: User;
}

// Extended user type for additional fields (can be extended by applications)
export interface ExtendedUser extends User {
	[key: string]: unknown;
}

// Extended session type for additional fields
export interface ExtendedSession extends Session {
	[key: string]: unknown;
}
