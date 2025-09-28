import { afterEach, describe, expect, it, vi } from "vitest";
import { generateRandomUUID, getRandomElementInArray } from "./random";

describe("generateRandomUUID", () => {
	it("should generate valid UUID format", () => {
		const uuid = generateRandomUUID();
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		expect(uuid).toMatch(uuidRegex);
		expect(uuid).toHaveLength(36);
	});

	it("should generate unique UUIDs", () => {
		const uuid1 = generateRandomUUID();
		const uuid2 = generateRandomUUID();
		expect(uuid1).not.toBe(uuid2);
	});
});

describe("getRandomElementInArray", () => {
	afterEach(() => vi.restoreAllMocks());

	it("returns undefined for empty array", () => {
		expect(getRandomElementInArray([])).toBeUndefined();
	});

	it("returns the sole element for single-item array", () => {
		expect(getRandomElementInArray(["only"])).toBe("only");
	});

	it("selects expected indices based on Math.random", () => {
		const arr = ["a", "b", "c"];
		const spy = vi.spyOn(Math, "random");
		spy
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(0.5)
			.mockReturnValueOnce(0.999);

		expect(getRandomElementInArray(arr)).toBe("a"); // 0 -> index 0
		expect(getRandomElementInArray(arr)).toBe("b"); // 0.5 -> floor(0.5*3)=1
		expect(getRandomElementInArray(arr)).toBe("c"); // 0.999 -> floor(0.999*3)=2
	});
});
