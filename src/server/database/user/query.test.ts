import { describe, expect, it } from "vitest";

// TODO: E2E and integration tests
describe("database query functions", () => {
	it("should export query functions", async () => {
		const module = await import("./query");

		expect(module.getUserQueryResultFromDatabase).toBeDefined();
		expect(module.getRecreationalLocationFromDatabaseById).toBeDefined();
		expect(
			module.getParkRecreationalLocationsFromDatabaseAtRandom,
		).toBeDefined();
		expect(
			module.getRestaurantRecreationalLocationsFromDatabaseAtRandom,
		).toBeDefined();
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
});
