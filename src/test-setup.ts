import "@testing-library/jest-dom";
import { config } from "dotenv";

// Load environment variables from .env file for tests
config();

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
