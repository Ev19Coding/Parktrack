import "@testing-library/jest-dom";

// Simple crypto polyfill for Node.js environment
if (!globalThis.crypto?.randomUUID) {
	Object.defineProperty(globalThis, "crypto", {
		value: {
			randomUUID: () =>
				"test-uuid-" + Math.random().toString(36).substring(2, 15),
		},
		writable: true,
	});
}
