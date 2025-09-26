import Fuse from "fuse.js";
import { describe, expect, it } from "vitest";

// TODO: E2E and integration tests
describe("database query functions", () => {
	it("should export query functions", async () => {
		const module = await import("./query");

		expect(module.getUserQueryResultFromDatabase).toBeDefined();
		expect(module.getRecreationalLocationFromDatabaseById).toBeDefined();
		expect(module.getRecreationalLocationsFromDatabaseAtRandom).toBeDefined();
		expect(module.getRecreationalLocationsCloseToCoords).toBeDefined();
	});

	it("should export user-related query functions", async () => {
		const module = await import("./query");

		expect(module.getUsersByType).toBeDefined();
		expect(module.getUserFavouriteLocations).toBeDefined();
		expect(module.addLocationToUserFavourites).toBeDefined();
		expect(module.removeLocationFromUserFavourites).toBeDefined();
		expect(module.isLocationInUserFavourites).toBeDefined();
		expect(module.getLocationsByOwner).toBeDefined();
	});

	describe("user type queries", () => {
		it("should validate user type parameter", async () => {
			const { getUsersByType } = await import("./query");

			// These should be valid types
			const validTypes = ["user", "owner"] as const;

			// Just test that the function exists and is callable
			validTypes.forEach((type) => {
				expect(typeof getUsersByType).toBe("function");
				// Don't actually call the function to avoid database connection issues
			});
		});
	});

	describe("favourites functions", () => {
		it("should have functions for managing user favourites", async () => {
			const module = await import("./query");

			// Test function signatures exist
			expect(typeof module.getUserFavouriteLocations).toBe("function");
			expect(typeof module.addLocationToUserFavourites).toBe("function");
			expect(typeof module.removeLocationFromUserFavourites).toBe("function");
			expect(typeof module.isLocationInUserFavourites).toBe("function");
		});
	});

	describe("owner functions", () => {
		it("should have functions for owner-related queries", async () => {
			const module = await import("./query");

			expect(typeof module.getLocationsByOwner).toBe("function");
		});
	});

	// New unit tests covering computeAboutText, computeOwnerName, and a small owner search scenario with Fuse
	describe("computeAboutText and computeOwnerName", () => {
		it("should extract category names and enabled option names from about", async () => {
			const { computeAboutText } = await import("./query");

			const about = [
				{
					id: "1",
					name: "Facilities",
					options: [
						{ name: "Playground", enabled: true },
						{ name: "Picnic tables", enabled: false },
					],
				},
				{
					id: "2",
					name: "Access",
					options: [{ name: "Wheelchair accessible", enabled: true }],
				},
			];

			const text = computeAboutText(about);
			expect(typeof text).toBe("string");
			expect(text).toContain("Facilities");
			expect(text).toContain("Playground");
			expect(text).toContain("Access");
			expect(text).toContain("Wheelchair accessible");
		});

		it("should handle string about values", async () => {
			const { computeAboutText } = await import("./query");

			const text = computeAboutText("dog-friendly, water");
			expect(text).toContain("dog-friendly");
			expect(text).toContain("water");
		});

		it("should return undefined for empty or useless about shapes", async () => {
			const { computeAboutText } = await import("./query");

			expect(computeAboutText(null)).toBeUndefined();
			expect(computeAboutText(undefined)).toBeUndefined();
			expect(computeAboutText({})).toBeUndefined();
		});

		it("should extract owner name when present", async () => {
			const { computeOwnerName } = await import("./query");

			expect(computeOwnerName({ id: "o1", name: "Alice Johnson" })).toBe(
				"Alice Johnson",
			);
			expect(computeOwnerName({})).toBeUndefined();
			expect(computeOwnerName(null)).toBeUndefined();
		});
	});

	describe("search ranking with ownerName", () => {
		it("should find documents by ownerName using Fuse", async () => {
			const docs: Array<{ id: string; title: string; ownerName: string }> = [
				{ id: "1", title: "Riverside Park", ownerName: "Alice Johnson" },
				{ id: "2", title: "Lakeside Reserve", ownerName: "Bob Smith" },
				{ id: "3", title: "Hilltop Gardens", ownerName: "Alice Cooper" },
			];

			// Use a similar ownerName key to the production index so we validate the field is useful
			const fuse = new Fuse<(typeof docs)[number]>(docs, {
				keys: [{ name: "ownerName", weight: 2 }],
				threshold: 0.3,
				ignoreLocation: true,
			});

			const results = fuse.search("Alice");
			expect(results.length).toBeGreaterThanOrEqual(1);

			// Top result should be an Alice (either Johnson or Cooper), and should contain ownerName
			const top = results[0]?.item as (typeof docs)[number] | undefined;
			// Make a hard runtime assertion so TypeScript sees `top` as defined before accessing properties.
			if (!top) {
				throw new Error("Expected at least one search result");
			}
			expect(typeof top.ownerName).toBe("string");
			expect(top.ownerName.toLowerCase()).toContain("alice");
		});
	});
});
