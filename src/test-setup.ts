import "@testing-library/jest-dom";
import { config } from "dotenv";
import { afterEach, vi } from "vitest";

/**
 * Central test setup
 *
 * - Loads .env for tests
 * - Sets a default timeout (override via VITEST_TIMEOUT_MS env var)
 * - Provides a lightweight crypto.randomUUID polyfill for Node-like test envs
 * - Centralized teardown to restore mocks and reset modules
 * - Exposes a runtime flag __RUN_DB_TESTS for gating DB-heavy tests
 *
 * Additional behavior:
 * - Provide a minimal mock for the Solid HMR / solid-refresh runtime so any HMR
 *   wrapper injected by the plugin is a no-op in tests and will not execute component
 *   code at import time.
 */

/*
 * Prevent solid-refresh HMR wrappers from executing component code at import time.
 * Prefer mocking the module itself so any HMR wrapper injected by the Vite/solid plugin
 * resolves to a harmless module rather than running runtime logic during test imports.
 *
 * Provide a minimal $$registry export because some HMR wrappers expect it to exist.
 *
 * Guard the mocks behind a runtime detection check for Vitest's `vi` to avoid
 * init-order / worker-initialization issues when modules are evaluated outside
 * of the fully-initialized Vitest worker (this has caused `dispose` / listener
 * ordering errors in certain worker setups).
 */
try {
	// Only attempt to register mocks when running inside a Vitest runtime where
	// `vi.mock` is available. This avoids touching globals during transform-time
	// or other tooling phases which can cause worker init ordering problems.
	const isVitestRuntime =
		typeof vi !== "undefined" && typeof (vi as any).mock === "function";
	if (isVitestRuntime) {
		// Provide direct, test-friendly no-op identity mocks for solid-refresh HMR helpers.
		// The HMR wrapper may call these exports during module import; returning identity
		// or no-op functions prevents the wrapper from executing component code outside
		// of a Solid render root in tests.
		vi.mock("solid-refresh", () => {
			const noop = (v?: unknown) => v;
			return {
				__esModule: true,
				$$registry: noop,
				$$component: noop,
				$$refresh: noop,
				register: noop,
				runtime: {},
				default: {
					$$registry: noop,
					$$component: noop,
					$$refresh: noop,
					register: noop,
					runtime: {},
				},
			};
		});
		vi.mock("@solid-refresh", () => {
			const noop = (v?: unknown) => v;
			return {
				__esModule: true,
				$$registry: noop,
				$$component: noop,
				$$refresh: noop,
				register: noop,
				runtime: {},
				default: {
					$$registry: noop,
					$$component: noop,
					$$refresh: noop,
					register: noop,
					runtime: {},
				},
			};
		});
	}
} catch {
	// Non-fatal: if the mocking API isn't available at runtime, continue without throwing.
	// Tests will still run, but may log HMR-related warnings in that environment.
}

// Load environment variables for tests
config();

// Default test timeout (ms). Can be overridden with VITEST_TIMEOUT_MS env var.
const DEFAULT_VITEST_TIMEOUT = Number(process.env["VITEST_TIMEOUT_MS"] ?? 5000);
// vitest exposes vi.setTimeout at runtime; cast to any to satisfy TS in all environments.
if (typeof (vi as any).setTimeout === "function") {
	(vi as any).setTimeout(DEFAULT_VITEST_TIMEOUT);
}

// Keep a stable reference to original globals we may need to restore.
// Use any casts to avoid TS strictness for runtime globals.
const __originalFetch = (globalThis as any).fetch;

// Lightweight crypto.randomUUID polyfill for Node-like test environments that don't provide it.
if (!(globalThis as any).crypto?.randomUUID) {
	Object.defineProperty(globalThis, "crypto", {
		value: {
			randomUUID: () =>
				"test-uuid-" + Math.random().toString(36).substring(2, 15),
		},
		writable: true,
	});
}

// Centralized cleanup to avoid global mock leakage between tests.
// - Restores spies and mocks using Vitest helpers
// - Attempts to call resetModules when available at runtime
// - Defensively restores global.fetch if a test mutated it directly
afterEach(() => {
	try {
		// Restore spies/stubs created via vi.spyOn / vi.fn
		vi.restoreAllMocks();

		// Reset mocked implementations
		vi.resetAllMocks();

		// Some Vitest versions expose resetModules; call it if present.
		const maybeResetModules = (vi as any).resetModules;
		if (typeof maybeResetModules === "function") {
			maybeResetModules();
		}
	} catch (err) {
		// Keep teardown robust; log to help diagnose if cleanup fails.
		// eslint-disable-next-line no-console
		console.warn("Test teardown cleanup warning:", err);
	}

	// NOTE: defensive restoration of global.fetch was removed intentionally.
	// Tests should use `vi.stubGlobal("fetch", ...)` (Vitest-managed stubs) or explicitly
	// restore any global they override. Centralized teardown still restores and resets
	// Vitest-managed mocks via `vi.restoreAllMocks()` and `vi.resetAllMocks()` above.
});
// Expose a runtime-only flag for gating DB-heavy integration tests.
// Set RUN_DB_TESTS=true in CI to enable DuckDB/DB integration tests.
(globalThis as any)["__RUN_DB_TESTS"] = process.env["RUN_DB_TESTS"] === "true";
