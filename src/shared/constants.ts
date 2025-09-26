import type { RecreationalLocationSchema } from "~/server/database/schema";

export const DEFAULTS = {
	STRING: "???",
	URL: "https://localhost:3000",
	NUMBER: -1,
} as const;

const { NUMBER, STRING, URL } = DEFAULTS;

/** Placeholder image in the `public` folder */
export const PLACEHOLDER_IMG = "/images/placeholder.webp";

export const DUMMY_RECREATIONAL_LOCATION_DATA = {
	address: STRING,
	category: STRING,
	id: STRING,
	title: STRING,
	latitude: NUMBER,
	longitude: NUMBER,
	link: URL,
	thumbnail: URL,
	images: [],
	openHours: {},
	popularTimes: {},
	isActive: true,
} as const satisfies RecreationalLocationSchema;
