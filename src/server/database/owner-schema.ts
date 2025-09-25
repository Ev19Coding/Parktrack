import * as v from "valibot";
import { RecreationalLocationSchema } from "./schema";

/**
 * Owner Schema for Future Implementation
 *
 * This schema defines the structure for a separate owners table that will
 * contain recreational location data owned by specific users.
 *
 * Eventually, this will replace the owner field in the recreational locations
 * and provide a proper relationship between users and their owned locations.
 */

// Owner type - extends user type but specifically for location owners
export const OwnerType = v.literal("owner");
export type OwnerType = v.InferOutput<typeof OwnerType>;

// Basic owner information (subset of user data)
export const OwnerInfoSchema = v.object({
	id: v.string(),
	name: v.string(),
	email: v.pipe(v.string(), v.email()),
	type: OwnerType,
	createdAt: v.date(),
	updatedAt: v.date(),
});

export type OwnerInfo = v.InferOutput<typeof OwnerInfoSchema>;

// Owner with their recreational location data
export const OwnerWithLocationSchema = v.object({
	// Owner information
	ownerId: v.string(),
	ownerName: v.string(),
	ownerEmail: v.pipe(v.string(), v.email()),

	// Location information (extends RecreationalLocationSchema)
	...RecreationalLocationSchema.entries,

	// Additional owner-specific fields
	isVerified: v.optional(v.boolean(), false),
	businessLicense: v.optional(v.string()),
	contactPhone: v.optional(v.string()),
	preferredContactMethod: v.optional(
		v.picklist(["email", "phone", "both"]),
		"email",
	),

	// Ownership metadata
	ownedSince: v.optional(v.date()),
	ownershipStatus: v.optional(
		v.picklist(["active", "pending", "suspended", "inactive"]),
		"active",
	),
});

export type OwnerWithLocation = v.InferOutput<typeof OwnerWithLocationSchema>;

// TODO: Delete this. Schema for creating a new owner-location relationship
export const CreateOwnerLocationSchema = v.object({
	ownerId: v.string(),
	locationData: RecreationalLocationSchema,
	isVerified: v.optional(v.boolean(), false),
	businessLicense: v.optional(v.string()),
	contactPhone: v.optional(v.string()),
	preferredContactMethod: v.optional(
		v.picklist(["email", "phone", "both"]),
		"email",
	),
});

export type CreateOwnerLocation = v.InferOutput<
	typeof CreateOwnerLocationSchema
>;

// Schema for updating owner-location data
export const UpdateOwnerLocationSchema = v.object({
	ownerId: v.string(),
	locationId: v.string(),
	locationData: v.optional(
		v.partial(v.object({ ...RecreationalLocationSchema.entries })),
	),
	isVerified: v.optional(v.boolean()),
	businessLicense: v.optional(v.string()),
	contactPhone: v.optional(v.string()),
	preferredContactMethod: v.optional(v.picklist(["email", "phone", "both"])),
	ownershipStatus: v.optional(
		v.picklist(["active", "pending", "suspended", "inactive"]),
	),
});

export type UpdateOwnerLocation = v.InferOutput<
	typeof UpdateOwnerLocationSchema
>;

// Validation functions
export function validateOwnerInfo(data: unknown): OwnerInfo {
	return v.parse(OwnerInfoSchema, data);
}

export function validateOwnerWithLocation(data: unknown): OwnerWithLocation {
	return v.parse(OwnerWithLocationSchema, data);
}

export function validateCreateOwnerLocation(
	data: unknown,
): CreateOwnerLocation {
	return v.parse(CreateOwnerLocationSchema, data);
}

export function validateUpdateOwnerLocation(
	data: unknown,
): UpdateOwnerLocation {
	return v.parse(UpdateOwnerLocationSchema, data);
}

// Table name constants for future migration
export const OWNER_TABLES = {
	OWNER_LOCATIONS: "owner_recreational_locations",
} as const;

// Future migration SQL template
export const FUTURE_OWNER_MIGRATION_SQL = `
-- Future migration to create separate owner-location table
-- This will be used when we want to separate owner data from the main recreational locations table

CREATE TABLE IF NOT EXISTS "owner_recreational_locations" (
	-- Owner-specific fields
	owner_id VARCHAR NOT NULL,
	location_id VARCHAR PRIMARY KEY,
	is_verified BOOLEAN DEFAULT FALSE,
	business_license VARCHAR,
	contact_phone VARCHAR,
	preferred_contact_method VARCHAR DEFAULT 'email',
	owned_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	ownership_status VARCHAR DEFAULT 'active',

	-- All recreational location fields (same as RecreationalLocationSchema)
	title VARCHAR NOT NULL,
	category VARCHAR NOT NULL,
	address VARCHAR NOT NULL,
	link VARCHAR NOT NULL,
	latitude DOUBLE NOT NULL,
	longitude DOUBLE NOT NULL,
	thumbnail VARCHAR,
	images JSON DEFAULT '[]',
	open_hours JSON DEFAULT '{}',
	popular_times JSON DEFAULT '{}',
	description VARCHAR,
	phone VARCHAR,
	website VARCHAR,
	emails JSON,
	rating DOUBLE,
	review_rating DOUBLE,
	review_count INTEGER,
	reviews_breakdown JSON,
	reviews_per_rating JSON,
	price_range VARCHAR,
	timezone VARCHAR,
	plus_code VARCHAR,
	data_id VARCHAR,
	reviews_link VARCHAR,
	reservations JSON,
	order_online JSON,
	menu JSON,
	owner JSON, -- Will be deprecated in favor of owner_id relationship
	about JSON,
	user_reviews JSON,
	user_reviews_extended JSON,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	is_active BOOLEAN DEFAULT TRUE,

	-- Foreign key constraints
	FOREIGN KEY (owner_id) REFERENCES "user" (id),

	-- Indexes
	INDEX idx_owner_locations_owner_id (owner_id),
	INDEX idx_owner_locations_category (category),
	INDEX idx_owner_locations_active (is_active),
	INDEX idx_owner_locations_status (ownership_status),
	INDEX idx_owner_locations_location (latitude, longitude)
);

-- Migration to move existing data from recreational_locations to owner_locations
-- This would be run when we're ready to separate the tables
/*
INSERT INTO "owner_recreational_locations" (
	owner_id, location_id, title, category, address, link, latitude, longitude,
	thumbnail, images, open_hours, popular_times, description, phone, website,
	emails, rating, review_rating, review_count, reviews_breakdown, reviews_per_rating,
	price_range, timezone, plus_code, data_id, reviews_link, reservations, order_online,
	menu, owner, about, user_reviews, user_reviews_extended, created_at, updated_at, is_active
)
SELECT
	owner->>'id' as owner_id,
	id as location_id,
	title, category, address, link, latitude, longitude,
	thumbnail, images, open_hours, popular_times, description, phone, website,
	emails, rating, review_rating, review_count, reviews_breakdown, reviews_per_rating,
	price_range, timezone, plus_code, data_id, reviews_link, reservations, order_online,
	menu, owner, about, user_reviews, user_reviews_extended, created_at, updated_at, is_active
FROM "user_recreational_locations"
WHERE owner IS NOT NULL AND owner->>'id' IS NOT NULL;
*/
` as const;

// Helper functions for future implementation

/**
 * Check if a user is an owner of any locations
 */
export function isUserOwner(userType: string): boolean {
	return userType === "owner";
}

/**
 * Get the ownership status display text
 */
export function getOwnershipStatusDisplay(status: string): string {
	const statusMap = {
		active: "Active",
		pending: "Pending Verification",
		suspended: "Suspended",
		inactive: "Inactive",
	};
	return statusMap[status as keyof typeof statusMap] || "Unknown";
}

/**
 * Get the contact method display text
 */
export function getContactMethodDisplay(method: string): string {
	const methodMap = {
		email: "Email Only",
		phone: "Phone Only",
		both: "Email & Phone",
	};
	return methodMap[method as keyof typeof methodMap] || "Email Only";
}

/**
 * Future query functions (templates for when the separate table is implemented)
 */
export const FUTURE_OWNER_QUERIES = {
	// Get all locations owned by a specific owner
	GET_OWNER_LOCATIONS: `
		SELECT * FROM "owner_recreational_locations"
		WHERE owner_id = ? AND ownership_status = 'active'
		ORDER BY created_at DESC
	`,

	// Get owner info with location count
	GET_OWNER_WITH_STATS: `
		SELECT
			u.id, u.name, u.email, u.type,
			COUNT(orl.location_id) as location_count,
			COUNT(CASE WHEN orl.is_verified = true THEN 1 END) as verified_count
		FROM "user" u
		LEFT JOIN "owner_recreational_locations" orl ON u.id = orl.owner_id
		WHERE u.type = 'owner' AND u.id = ?
		GROUP BY u.id, u.name, u.email, u.type
	`,

	// Get all owners with their location counts
	GET_ALL_OWNERS_WITH_STATS: `
		SELECT
			u.id, u.name, u.email, u.created_at,
			COUNT(orl.location_id) as location_count,
			COUNT(CASE WHEN orl.is_verified = true THEN 1 END) as verified_count,
			COUNT(CASE WHEN orl.ownership_status = 'active' THEN 1 END) as active_count
		FROM "user" u
		LEFT JOIN "owner_recreational_locations" orl ON u.id = orl.owner_id
		WHERE u.type = 'owner'
		GROUP BY u.id, u.name, u.email, u.created_at
		ORDER BY location_count DESC
	`,

	// Find locations by area that need owner verification
	GET_PENDING_VERIFICATIONS: `
		SELECT * FROM "owner_recreational_locations"
		WHERE is_verified = false AND ownership_status = 'pending'
		ORDER BY owned_since ASC
	`,
} as const;
