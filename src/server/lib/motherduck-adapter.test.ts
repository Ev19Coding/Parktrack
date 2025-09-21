import { describe, expect, it } from "vitest";
import { motherDuckAdapter } from "./motherduck-adapter.js";

describe("MotherDuck Adapter Configuration Tests", () => {
	describe("adapter factory", () => {
		it("should create adapter with default configuration", () => {
			const adapter = motherDuckAdapter();
			expect(adapter).toBeDefined();
			expect(typeof adapter).toBe("function");
		});

		it("should create adapter with custom configuration", () => {
			const adapter = motherDuckAdapter({
				debugLogs: true,
				usePlural: true,
			});
			expect(adapter).toBeDefined();
			expect(typeof adapter).toBe("function");
		});

		it("should create adapter with partial configuration", () => {
			const adapter = motherDuckAdapter({
				debugLogs: false,
			});
			expect(adapter).toBeDefined();
			expect(typeof adapter).toBe("function");
		});

		it("should create adapter with empty configuration object", () => {
			const adapter = motherDuckAdapter({});
			expect(adapter).toBeDefined();
			expect(typeof adapter).toBe("function");
		});
	});

	describe("configuration validation", () => {
		it("should handle boolean debugLogs option", () => {
			const adapterTrue = motherDuckAdapter({ debugLogs: true });
			const adapterFalse = motherDuckAdapter({ debugLogs: false });

			expect(adapterTrue).toBeDefined();
			expect(adapterFalse).toBeDefined();
		});

		it("should handle boolean usePlural option", () => {
			const adapterTrue = motherDuckAdapter({ usePlural: true });
			const adapterFalse = motherDuckAdapter({ usePlural: false });

			expect(adapterTrue).toBeDefined();
			expect(adapterFalse).toBeDefined();
		});

		it("should handle undefined configuration values", () => {
			const adapter = motherDuckAdapter({});

			expect(adapter).toBeDefined();
		});
	});

	describe("adapter interface", () => {
		it("should be a function that returns an adapter configuration", () => {
			const adapterFactory = motherDuckAdapter();
			expect(typeof adapterFactory).toBe("function");
		});

		it("should maintain consistent interface across different configs", () => {
			const adapter1 = motherDuckAdapter();
			const adapter2 = motherDuckAdapter({ debugLogs: true });
			const adapter3 = motherDuckAdapter({ usePlural: true });

			expect(typeof adapter1).toBe(typeof adapter2);
			expect(typeof adapter2).toBe(typeof adapter3);
		});
	});

	describe("type safety", () => {
		it("should accept valid configuration types", () => {
			// These should not throw TypeScript errors
			const configs = [
				{},
				{ debugLogs: true },
				{ debugLogs: false },
				{ usePlural: true },
				{ usePlural: false },
				{ debugLogs: true, usePlural: false },
				{ debugLogs: false, usePlural: true },
			];

			configs.forEach((config, index) => {
				const adapter = motherDuckAdapter(config);
				expect(adapter).toBeDefined();
				expect(typeof adapter).toBe("function");
			});
		});
	});

	describe("configuration defaults", () => {
		it("should work with no parameters", () => {
			const adapter = motherDuckAdapter();
			expect(adapter).toBeDefined();
		});

		it("should work with null/undefined parameters", () => {
			const adapterNull = motherDuckAdapter(null);
			expect(adapterNull).toBeDefined();

			const adapterUndefined = motherDuckAdapter(undefined);
			expect(adapterUndefined).toBeDefined();
		});
	});

	describe("factory consistency", () => {
		it("should create independent adapter instances", () => {
			const adapter1 = motherDuckAdapter({ debugLogs: true });
			const adapter2 = motherDuckAdapter({ debugLogs: false });

			// Both should be functions but potentially with different internal state
			expect(typeof adapter1).toBe("function");
			expect(typeof adapter2).toBe("function");

			// They should be different function instances
			expect(adapter1).not.toBe(adapter2);
		});

		it("should handle multiple instantiations", () => {
			const adapters = Array.from({ length: 10 }, (_, i) =>
				motherDuckAdapter({ debugLogs: i % 2 === 0 }),
			);

			adapters.forEach((adapter) => {
				expect(adapter).toBeDefined();
				expect(typeof adapter).toBe("function");
			});
		});
	});

	describe("configuration immutability", () => {
		it("should not modify the input configuration object", () => {
			const config = { debugLogs: true, usePlural: false };
			const originalConfig = { ...config };

			motherDuckAdapter(config);

			expect(config).toEqual(originalConfig);
		});

		it("should work with frozen configuration objects", () => {
			const config = Object.freeze({ debugLogs: true, usePlural: false });

			expect(() => {
				const adapter = motherDuckAdapter(config);
				expect(adapter).toBeDefined();
			}).not.toThrow();
		});
	});

	describe("edge cases", () => {
		it("should handle configuration with extra properties", () => {
			const config = {
				debugLogs: true,
				usePlural: false,
				extraProp: "should be ignored",
				anotherProp: 123,
			} as any;

			const adapter = motherDuckAdapter(config);
			expect(adapter).toBeDefined();
		});

		it("should handle empty object vs undefined", () => {
			const adapterEmpty = motherDuckAdapter({});
			const adapterUndefined = motherDuckAdapter();

			expect(adapterEmpty).toBeDefined();
			expect(adapterUndefined).toBeDefined();
			expect(typeof adapterEmpty).toBe(typeof adapterUndefined);
		});
	});

	describe("return value structure", () => {
		it("should return a function (createAdapter result)", () => {
			const adapter = motherDuckAdapter();
			expect(typeof adapter).toBe("function");
		});

		it("should consistently return the same type regardless of config", () => {
			const adapters = [
				motherDuckAdapter(),
				motherDuckAdapter({}),
				motherDuckAdapter({ debugLogs: true }),
				motherDuckAdapter({ usePlural: true }),
				motherDuckAdapter({ debugLogs: false, usePlural: false }),
			];

			const types = adapters.map((adapter) => typeof adapter);
			const allSameType = types.every((type) => type === types[0]);

			expect(allSameType).toBe(true);
			expect(types[0]).toBe("function");
		});
	});
});
