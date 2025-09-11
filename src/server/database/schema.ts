"use server";
import * as v from "valibot";

const WorkHoursSchema = v.pipe(
	v.object({
		/** A number in minutes i.e. 360 == 6:00 AM, 1020 == 5:00 PM */
		open: v.number(),

		/** A number in minutes i.e. 360 == 6:00 AM, 1020 == 5:00 PM */
		close: v.number(),
	}),
	v.readonly(),
);

const LocationSchema = v.pipe(
	v.object({
		id: v.string(),

		address: v.string(),

		name: v.string(),

		type: v.picklist([
			"park",
			"restaurant",
			"cafe",
			"store",
			"hotel",
			"museum",
			"gym",
			"hospital",
			"school",
			"library",
		]),

		latitude: v.number(),

		longitude: v.number(),

		/** An array containing image urls or base64 encoded data  */
		img: v.pipe(
			v.array(
				v.union(
					[v.pipe(v.string(), v.url()), v.pipe(v.string(), v.base64())],
					"The data is badly encoded or not a valid url.",
				),
			),
			v.readonly(),
		),

		/** When the business opens and closes */
		workHours: WorkHoursSchema,

		/** Description of the location */
		description: v.optional(v.string()),

		/** Phone number for the location */
		phone: v.optional(v.string()),

		/** Website URL */
		website: v.optional(v.pipe(v.string(), v.url())),

		/** Email address */
		email: v.optional(v.pipe(v.string(), v.email())),

		/** Average rating (1-5 stars) */
		rating: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(5))),

		/** Number of reviews */
		reviewCount: v.optional(v.pipe(v.number(), v.minValue(0))),

		/** Price level (1-4, $ to $$$$) */
		priceLevel: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(4))),

		/** Tags/categories for the location */
		tags: v.optional(v.pipe(v.array(v.string()), v.readonly())),

		/** Amenities available */
		amenities: v.optional(
			v.pipe(
				v.array(
					v.picklist([
						"wifi",
						"parking",
						"wheelchair_accessible",
						"outdoor_seating",
						"pet_friendly",
						"delivery",
						"takeout",
						"reservations",
						"credit_cards",
					]),
				),
				v.readonly(),
			),
		),

		/** Social media links */
		socialMedia: v.optional(
			v.pipe(
				v.object({
					facebook: v.optional(v.pipe(v.string(), v.url())),
					instagram: v.optional(v.pipe(v.string(), v.url())),
					twitter: v.optional(v.pipe(v.string(), v.url())),
				}),
				v.readonly(),
			),
		),

		/** Date when location was created */
		createdAt: v.optional(v.date()),

		/** Date when location was last updated */
		updatedAt: v.optional(v.date()),

		/** Whether the location is currently active/open */
		isActive: v.optional(v.boolean()),

		/** Special notes or announcements */
		notes: v.optional(v.string()),
	}),
	v.readonly(),
);

type LocationSchema = v.InferOutput<typeof LocationSchema>;
