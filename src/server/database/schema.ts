"use server";
import * as v from "valibot";

const UrlSchema = v.pipe(v.string(), v.url());

const ImageSchema = v.pipe(
	v.object({
		title: v.string(),
		image: UrlSchema,
	}),
	v.readonly(),
);

const OpenHoursSchema = v.pipe(
	v.record(v.string(), v.array(v.string())), // e.g., { "Monday": ["8 am–2 am"], "Sunday": ["Closed"] }
	v.readonly(),
);

const PopularTimesSchema = v.pipe(
	v.record(v.string(), v.record(v.string(), v.number())), // e.g., { "Monday": { "0": 38, "1": 21, ... } }
	v.readonly(),
);

const ReviewsBreakdownSchema = v.pipe(
	v.object({
		"1": v.number(),
		"2": v.number(),
		"3": v.number(),
		"4": v.number(),
		"5": v.number(),
	}),
	v.readonly(),
);

const ExternalLinkSchema = v.pipe(
	v.object({
		link: UrlSchema,
		source: v.string(),
	}),
	v.readonly(),
);

const MenuSchema = v.pipe(
	v.object({
		link: v.string(), // Can be empty string
		source: v.string(), // Can be empty string
	}),
	v.readonly(),
);

const OwnerSchema = v.pipe(
	v.object({
		id: v.string(),
		name: v.string(),
		link: UrlSchema,
	}),
	v.readonly(),
);

const CompleteAddressSchema = v.pipe(
	v.object({
		borough: v.optional(v.string()),
		street: v.optional(v.string()),
		city: v.string(),
		postal_code: v.optional(v.string()),
		state: v.string(),
		country: v.string(),
	}),
	v.readonly(),
);

const AboutOptionSchema = v.pipe(
	v.object({
		name: v.string(),
		enabled: v.boolean(),
	}),
	v.readonly(),
);

const AboutCategorySchema = v.pipe(
	v.object({
		id: v.string(),
		name: v.string(),
		options: v.pipe(v.array(AboutOptionSchema), v.readonly()),
	}),
	v.readonly(),
);

const LocationSchema = v.pipe(
	v.object({
		/** Google's unique business ID (cid from the data) */
		id: v.union([v.string(), v.number(), v.bigint()]),

		/** Business name */
		name: v.string(),

		/** Primary category */
		category: v.string(),

		/** All categories this business belongs to */
		categories: v.pipe(v.array(v.string()), v.readonly()),

		/** Full address string */
		address: v.string(),

		/** Detailed address breakdown */
		completeAddress: CompleteAddressSchema,

		/** Direct URL to the business listing on Google Maps */
		googleMapLink: UrlSchema,

		/** Latitude coordinate */
		latitude: v.number(),

		/** Longitude coordinate */
		longitude: v.number(),

		/** Main thumbnail image URL */
		thumbnail: UrlSchema,

		/** Array of categorized images */
		images: v.pipe(v.array(ImageSchema), v.readonly()),

		/** Operating hours by day e.g., { "Monday": ["8 am–2 am"], "Sunday": ["Closed"] } */
		openHours: OpenHoursSchema,

		/** Popular times data by day and hour e.g. { "Monday": { "0": 38, "1": 21, ... } } */
		popularTimes: PopularTimesSchema,

		/** Current business status */
		status: v.string(),

		/** Business description */
		description: v.optional(v.string()),

		/** Phone number */
		phone: v.optional(v.string()),

		/** Website URL */
		website: v.optional(v.string()), // Can be empty string in data

		/** Email addresses */
		emails: v.optional(v.nullable(v.array(v.pipe(v.string(), v.email())))),

		/** Average rating (1-5 stars) */
		rating: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(5))),

		/** Total number of reviews */
		reviewCount: v.optional(v.pipe(v.number(), v.minValue(0))),

		/** Breakdown of reviews by star rating */
		reviewsBreakdown: v.optional(ReviewsBreakdownSchema),

		/** Price range as text (e.g., "₦₦₦", "₦25,000–30,000") */
		priceRange: v.optional(v.string()),

		/** Timezone */
		timezone: v.optional(v.string()),

		/** Google Plus Code */
		plusCode: v.optional(v.string()),

		/** Google's internal data ID */
		dataId: v.optional(v.string()),

		/** Link to reviews */
		reviewsLink: v.optional(UrlSchema),

		/** Reservation links */
		reservations: v.optional(v.nullable(v.array(ExternalLinkSchema))),

		/** Online ordering links */
		orderOnline: v.optional(v.nullable(v.array(ExternalLinkSchema))),

		/** Menu information */
		menu: v.optional(MenuSchema),

		/** Business owner information */
		owner: v.optional(OwnerSchema),

		/** Detailed business features and amenities */
		about: v.optional(v.pipe(v.array(AboutCategorySchema), v.readonly())),

		/** TODO: User reviews array */
		userReviews: v.optional(v.array(v.any())),

		/** TODO: Extended user reviews */
		userReviewsExtended: v.optional(v.nullable(v.any())),

		/** Input ID from scraping process */
		inputId: v.optional(v.string()),

		/** Date when location was created in our system */
		createdAt: v.optional(v.date()),

		/** Date when location was last updated in our system */
		updatedAt: v.optional(v.date()),

		/** Whether the location is currently active in our system */
		isActive: v.optional(v.boolean(), true),
	}),
	v.readonly(),
);

type LocationSchema = v.InferOutput<typeof LocationSchema>;
