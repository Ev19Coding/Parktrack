import { describe, it, expect } from "vitest";

describe("database query functions", () => {
	it("should export query functions", async () => {
		const module = await import("./query");

		expect(module.getUserQueryResultFromDatabase).toBeDefined();
		expect(module.getRecreationalLocationFromDatabaseById).toBeDefined();
		expect(module.getParkRecreationalLocationsFromDatabaseAtRandom).toBeDefined();
		expect(module.getRestaurantRecreationalLocationsFromDatabaseAtRandom).toBeDefined();
	});
});
