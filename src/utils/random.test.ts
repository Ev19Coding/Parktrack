import { describe, it, expect } from "vitest";
import { generateRandomUUID } from "./random";

describe("generateRandomUUID", () => {
	it("should generate valid UUID format", () => {
		const uuid = generateRandomUUID();

		// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		expect(uuid).toMatch(uuidRegex);
		expect(uuid).toHaveLength(36);
	});

	it("should generate unique UUIDs", () => {
		const uuid1 = generateRandomUUID();
		const uuid2 = generateRandomUUID();
		expect(uuid1).not.toBe(uuid2);
	});
});
