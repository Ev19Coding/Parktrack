import { describe, it, expect } from "vitest";
import { tryParseObject } from "./parse";

describe("tryParseObject", () => {
	it("should parse JSON strings and leave other values unchanged", () => {
		const input = {
			jsonString: '{"nested": "value"}',
			numberString: "123",
			regularString: "hello",
			actualNumber: 42,
			actualObject: { key: "value" },
		};

		const result = tryParseObject(input);

		expect(result["jsonString"]).toEqual({ nested: "value" });
		expect(result["numberString"]).toBe(123);
		expect(result["regularString"]).toBe("hello");
		expect(result["actualNumber"]).toBe(42);
		expect(result["actualObject"]).toEqual({ key: "value" });
	});

	it("should leave invalid JSON as strings", () => {
		const input = {
			invalidJson: "{ invalid json }",
			malformedJson: '{"unclosed": "object"',
		};

		const result = tryParseObject(input);

		expect(result["invalidJson"]).toBe("{ invalid json }");
		expect(result["malformedJson"]).toBe('{"unclosed": "object"');
	});

	it("should modify the original object", () => {
		const input = { jsonString: '{"test": "value"}' };
		const result = tryParseObject(input);

		expect(result).toBe(input);
		expect(input["jsonString"]).toEqual({ test: "value" });
	});
});
