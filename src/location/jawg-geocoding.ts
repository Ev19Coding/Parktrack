"use server";

import * as v from "valibot";
import type { LocationApiResult } from "./types";

/**
 * Language information for the geocoding query
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const LanguageSchema = v.object({
	/** Full name of the language */
	name: v.string(),
	/** ISO 639-1 two-letter language code */
	iso6391: v.string(),
	/** ISO 639-3 three-letter language code */
	iso6393: v.string(),
	/** How the language was determined (e.g., "header") */
	via: v.string(),
	/** Whether the language was defaulted */
	defaulted: v.boolean(),
});

/**
 * Parsed components of the search text
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const ParsedTextSchema = v.object({
	/** The main subject of the search query */
	subject: v.optional(v.string()),
	/** Street name component if parsed */
	street: v.optional(v.string()),
});

/**
 * Query parameters and parsing information
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const QuerySchema = v.object({
	/** Original search text provided */
	text: v.string(),
	/** Number of results requested */
	size: v.number(),
	/** Administrative layers to include in search */
	layers: v.array(v.string()),
	/** Whether this was a private query */
	private: v.boolean(),
	/** Language information for the query */
	lang: LanguageSchema,
	/** Actual query size used */
	querySize: v.number(),
	/** Parser used for the query */
	parser: v.string(),
	/** Parsed components of the search text */
	parsed_text: ParsedTextSchema,
	/** Boundary circle radius in kilometers */
	"boundary.circle.radius": v.optional(v.number()),
	/** Boundary circle latitude */
	"boundary.circle.lat": v.optional(v.number()),
	/** Boundary circle longitude */
	"boundary.circle.lon": v.optional(v.number()),
	/** Boundary country codes */
	"boundary.country": v.optional(v.array(v.string())),
});

/**
 * Information about the geocoding engine
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const EngineSchema = v.object({
	/** Name of the geocoding engine */
	name: v.string(),
	/** Author of the engine */
	author: v.string(),
	/** Version of the engine */
	version: v.string(),
});

/**
 * Geocoding metadata for debugging purposes only
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const GeocodingSchema = v.object({
	/** API version */
	version: v.string(),
	/** Link to use for displaying data source licenses */
	attribution: v.string(),
	/** How the query was parsed - useful for debugging */
	query: QuerySchema,
	/** List of warning messages from automatic optimizations */
	warnings: v.array(v.string()),
	/** List of error messages - usually fatal errors */
	errors: v.optional(v.array(v.string())),
	/** Information about the Jawg Places API engine */
	engine: EngineSchema,
	/** Unix timestamp of the request */
	timestamp: v.number(),
});

/**
 * GeoJSON Point geometry with longitude, latitude coordinates
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const GeometrySchema = v.object({
	/** Always "Point" for geocoding results */
	type: v.literal("Point"),
	/** Coordinates in [longitude, latitude] order following GeoJSON spec */
	coordinates: v.tuple([v.number(), v.number()]),
});

/**
 * OpenStreetMap-specific metadata in the addendum
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const OsmAddendumSchema = v.object({
	/** Operator of the venue/location */
	operator: v.optional(v.string()),
	/** Website URL */
	website: v.optional(v.string()),
	/** Phone number */
	phone: v.optional(v.string()),
	/** Wikidata identifier */
	wikidata: v.optional(v.string()),
	/** Wheelchair accessibility */
	wheelchair: v.optional(v.string()),
	/** Opening hours */
	opening_hours: v.optional(v.string()),
});

/**
 * Geonames-specific metadata in the addendum
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const GeonamesAddendumSchema = v.object({
	/** Geonames feature code (e.g., "ADM1") */
	feature_code: v.optional(v.string()),
});

/**
 * Who's On First concordances for linking with other data sources
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const ConcordancesSchema = v.object({
	/** DBpedia identifier */
	"dbp:id": v.optional(v.string()),
	/** Freebase identifier */
	"fb:id": v.optional(v.string()),
	/** Factual identifier */
	"fct:id": v.optional(v.string()),
	/** Geonames identifier */
	"gn:id": v.optional(v.number()),
	/** GeoPlanet identifier */
	"gp:id": v.optional(v.number()),
	/** Library of Congress identifier */
	"loc:id": v.optional(v.string()),
	/** Natural Earth identifier */
	"ne:id": v.optional(v.number()),
	/** New York Times identifier */
	"nyt:id": v.optional(v.string()),
	/** Quattroshapes identifier */
	"qs:id": v.optional(v.number()),
	/** Quattroshapes polygon identifier */
	"qs_pg:id": v.optional(v.number()),
	/** Wikidata identifier */
	"wd:id": v.optional(v.string()),
	/** Wikipedia page title */
	"wk:page": v.optional(v.string()),
});

/**
 * Item in the dedupe array showing merged documents
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const DedupeItemSchema = v.object({
	/** Geocoding identifier of the merged document */
	gid: v.string(),
	/** Source dataset name */
	source: v.string(),
	/** Administrative layer */
	layer: v.string(),
	/** Original identifier in the source dataset */
	id: v.string(),
});

/**
 * Additional arbitrary data alongside any document, namespaced to avoid collisions
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const AddendumSchema = v.object({
	/** OpenStreetMap-specific metadata */
	osm: v.optional(OsmAddendumSchema),
	/** Geonames-specific metadata */
	geonames: v.optional(GeonamesAddendumSchema),
	/** Who's On First concordances for linking with other sources */
	concordances: v.optional(ConcordancesSchema),
	/** Documents merged by the deduplication system */
	dedupe: v.optional(v.array(DedupeItemSchema)),
});

/**
 * Properties of a geocoded feature containing location information
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const FeaturePropertiesSchema = v.object({
	/** Location's identifier in its original dataset */
	id: v.string(),
	/** Geocoding Identifier consisting of source:layer:id */
	gid: v.string(),
	/** Name of the location's administrative layer (venue, address, country, etc.) */
	layer: v.string(),
	/** Name of the location's data source (openstreetmap, openaddresses, etc.) */
	source: v.string(),
	/** Location's original identifier from its source dataset */
	source_id: v.string(),
	/** ISO country code */
	country_code: v.string(),
	/** Short description of the location (business name, locality, address part) */
	name: v.string(),
	/** Estimation of how accurately this result matches the query (0.0 to 1.0) */
	confidence: v.optional(v.number()),
	/** Type of match: "exact", "interpolated", or "fallback" */
	match_type: v.optional(v.string()),
	/** Accuracy of the lat/lng point: "point", "centroid", or "source" */
	accuracy: v.string(),
	/** Full country name */
	country: v.string(),
	/** Geocoding identifier for the country */
	country_gid: v.string(),
	/** Country abbreviation */
	country_a: v.string(),
	/** Region/state name */
	region: v.optional(v.string()),
	/** Geocoding identifier for the region */
	region_gid: v.optional(v.string()),
	/** Region abbreviation */
	region_a: v.optional(v.string()),
	/** Continent name */
	continent: v.optional(v.string()),
	/** Geocoding identifier for the continent */
	continent_gid: v.optional(v.string()),
	/** Human-friendly complete representation ready for display */
	label: v.string(),

	// Optional hierarchy and address properties
	/** Street name */
	street: v.optional(v.string()),
	/** Postal/ZIP code */
	postalcode: v.optional(v.string()),
	/** Geocoding identifier for the postal code */
	postalcode_gid: v.optional(v.string()),
	/** County name */
	county: v.optional(v.string()),
	/** Geocoding identifier for the county */
	county_gid: v.optional(v.string()),
	/** County abbreviation */
	county_a: v.optional(v.string()),
	/** City/locality name */
	locality: v.optional(v.string()),
	/** Geocoding identifier for the locality */
	locality_gid: v.optional(v.string()),
	/** Locality abbreviation */
	locality_a: v.optional(v.string()),
	/** Borough name */
	borough: v.optional(v.string()),
	/** Geocoding identifier for the borough */
	borough_gid: v.optional(v.string()),
	/** Neighbourhood name */
	neighbourhood: v.optional(v.string()),
	/** Geocoding identifier for the neighbourhood */
	neighbourhood_gid: v.optional(v.string()),
	/** House/building number */
	housenumber: v.optional(v.string()),
	/** Macroregion name */
	macroregion: v.optional(v.string()),
	/** Geocoding identifier for the macroregion */
	macroregion_gid: v.optional(v.string()),
	/** Distance in meters from query point (reverse geocoding) */
	distance: v.optional(v.number()),
	/** Macrocounty name */
	macrocounty: v.optional(v.string()),
	/** Geocoding identifier for the macrocounty */
	macrocounty_gid: v.optional(v.string()),
	/** Microhood name */
	microhood: v.optional(v.string()),
	/** Geocoding identifier for the microhood */
	microhood_gid: v.optional(v.string()),
	/** Macrohood name */
	macrohood: v.optional(v.string()),
	/** Geocoding identifier for the macrohood */
	macrohood_gid: v.optional(v.string()),
	/** Additional namespaced metadata */
	addendum: v.optional(AddendumSchema),
});

/**
 * GeoJSON Feature representing a single geocoded location
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const FeatureSchema = v.object({
	/** Always "Feature" for GeoJSON features */
	type: v.literal("Feature"),
	/** Point geometry with coordinates */
	geometry: GeometrySchema,
	/** Location properties and metadata */
	properties: FeaturePropertiesSchema,
	/** Geographic extent of the location [minLng, minLat, maxLng, maxLat] */
	bbox: v.optional(v.tuple([v.number(), v.number(), v.number(), v.number()])),
});

/**
 * Complete geocoding API response in GeoJSON FeatureCollection format
 * @see https://www.jawg.io/docs/apidocs/places/api-responses
 */
const GeocodingResponseSchema = v.object({
	/** Debugging metadata about the geocoding request */
	geocoding: v.optional(GeocodingSchema),
	/** Always "FeatureCollection" for GeoJSON feature collections */
	type: v.literal("FeatureCollection"),
	/** Array of geocoded location features matching the query */
	features: v.array(FeatureSchema),
	/** Bounding box computed from all results [minLng, minLat, maxLng, maxLat] */
	bbox: v.optional(v.tuple([v.number(), v.number(), v.number(), v.number()])),
});

/** Inferred TypeScript type for the complete geocoding response */
type GeocodingResponse = v.InferInput<typeof GeocodingResponseSchema>;

/** Inferred TypeScript type for a single geocoded feature */
// type Feature = v.InferInput<typeof FeatureSchema>;

// /** Inferred TypeScript type for feature properties */
// type FeatureProperties = v.InferInput<typeof FeaturePropertiesSchema>;

// /** Inferred TypeScript type for point geometry */
// type Geometry = v.InferInput<typeof GeometrySchema>;

type JawgsRequestParam = {
	/** Text to geocode for location results */
	query: string;

	/** User's latitude */
	latitude: number;

	/** User's longitude */
	longitude: number;

	/** Distance in km to limit results */
	distance: number;
};

async function fetchJawgsResponse(
	arg: JawgsRequestParam,
): Promise<Readonly<GeocodingResponse>> {
	const { distance, latitude, longitude, query } = arg,
		urlParams = new URLSearchParams();

	urlParams.append("text", query);
	urlParams.append("access-token", process.env.JAWS_API_TOKEN ?? "");
	urlParams.append("boundary.circle.lat", `${latitude}`);
	urlParams.append("boundary.circle.lon", `${longitude}`);
	// Get results within a 500km radius
	urlParams.append("boundary.circle.radius", `${distance}`);
	urlParams.append("boundary.country", "NG");
	// Return a max of 25 results
	urlParams.append("size", "25");

	const url = new URL(
		`https://api.jawg.io/places/v1/autocomplete?${urlParams}`,
	);

	const fetchedJson = await (await fetch(url)).json();

	return v.parse(GeocodingResponseSchema, fetchedJson);
}

export type JawgsLocationResult = {
	name: string;
	/** Similar to it's address */
	label: string;
	longitude: number;
	latitude: number;
};

function extractRelevantDataFromJawgsResponse(
	response: GeocodingResponse,
): ReadonlyArray<LocationApiResult> {
	return response.features.map((feature) => {
		const {
			geometry: {
				coordinates: [longitude, latitude],
			},
			properties: { label, name },
		} = feature;

		return { api: "jawg", latitude, label, longitude, name };
	});
}

export async function getRelevantDataFromJawgsApi(
	arg: JawgsRequestParam,
): Promise<ReadonlyArray<LocationApiResult>> {
	try {
		if (!arg.query) throw Error("Empty query");

		return extractRelevantDataFromJawgsResponse(await fetchJawgsResponse(arg));
	} catch (e) {
		console.log("Error. :/", e, "Defaulting to an empty result");

		return [];
	}
}
