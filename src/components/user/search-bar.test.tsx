import { Route, Router } from "@solidjs/router";
import { render, screen } from "@solidjs/testing-library";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Tests for UserSearchBar that use the real router and the real
 * `createAsyncStore` provided by the component's runtime where possible.
 *
 * We only stub environment-dependent hooks (geolocation) and remote-data helpers
 * (user-query) so the component can operate deterministically in JSDOM.
 */

// Provide a deterministic geolocation for tests so `useGeolocation` returns stable coords.
vi.mock("solidjs-use", () => {
	return {
		useGeolocation: (_opts?: unknown) => ({
			coords: () => ({ latitude: 12.34, longitude: 56.78 }),
		}),
		// Throttle should just return the function so tests run synchronously.
		useThrottle: (fn: () => unknown) => fn,
	};
});

// Keep proxied image helper deterministic.
vi.mock("~/utils/image", () => ({
	getProxiedImageUrl: (url?: string) => (url ? url : ""),
}));

// Provide a deterministic user-query result set (async) for the primary test.
const sampleResults = [
	{
		id: "park-1",
		title: "Park One",
		thumbnail: "/img/park-1.jpg",
		distanceKm: 2.3,
	},
	{ id: "park-2", title: "Park Two", thumbnail: "/img/park-2.jpg" },
];

vi.mock("~/utils/user-query", () => {
	return {
		// Return a Promise so the component's async store path is exercised.
		queryUserSearchForRecreationalLocations: () =>
			Promise.resolve(sampleResults),
	};
});

// Import the component AFTER registering the above mocks so it receives them.
const { default: UserSearchBar } = await import("./search-bar");

describe("UserSearchBar (integration-style)", () => {
	it("renders input and shows suggestions on focus with proxied images", async () => {
		// Ensure the current pathname is where the component should be visible.
		window.history.replaceState({}, "", "/");

		render(() => (
			<Router>
				<Route path="*" component={() => <UserSearchBar />} />
			</Router>
		));

		// The input should exist and open suggestions on focus/click.
		const input = screen.getByPlaceholderText("Search parks...");
		expect(input).toBeDefined();

		// Focus the input to open suggestions; this should trigger the async search.
		await userEvent.click(input);
		input.focus();

		// Wait for async results to be rendered.
		await waitFor(() => {
			expect(screen.getByText("Park One")).toBeDefined();
			expect(screen.getByText("Park Two")).toBeDefined();
		});

		// Check that the proxied thumbnails are rendered for results.
		const img = screen.getByAltText("Park One") as HTMLImageElement;
		expect(img).toBeDefined();
		expect(img.getAttribute("src")).toBe("/img/park-1.jpg");
	});

	it("shows fallback text when there are no results", async () => {
		// Reset modules to re-register a different user-query mock for this test.
		vi.resetModules();

		// Re-mock only the environment and helpers; keep router real.
		vi.mock("solidjs-use", () => {
			return {
				useGeolocation: () => ({
					coords: () => ({ latitude: 0, longitude: 0 }),
				}),
				useThrottle: (fn: () => unknown) => fn,
			};
		});

		vi.mock("~/utils/image", () => ({
			getProxiedImageUrl: (url?: string) => (url ? url : ""),
		}));

		// Now stub user-query to return an empty result set.
		vi.mock("~/utils/user-query", () => {
			return {
				queryUserSearchForRecreationalLocations: () => Promise.resolve([]),
			};
		});

		// Import a fresh instance of the component after mocks are in place.
		const { default: UserSearchBarEmpty } = await import("./search-bar");

		// Ensure location is set to root (or desired pathname) so the UI renders consistently.
		window.history.replaceState({}, "", "/");

		render(() => (
			<Router>
				<Route path="*" component={() => <UserSearchBarEmpty />} />
			</Router>
		));

		const input = screen.getByPlaceholderText("Search parks...");
		await userEvent.click(input);
		input.focus();

		// Wait for the fallback UI to render.
		await waitFor(() => {
			expect(screen.getByText("No results found")).toBeDefined();
		});
	});
});
