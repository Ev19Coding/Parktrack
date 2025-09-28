import { Route, Router } from "@solidjs/router";
import { render, screen } from "@solidjs/testing-library";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Tests for SideBar that use the real router APIs where possible.
 *
 * We avoid mocking @solidjs/router and instead render the component inside a
 * plain Router while controlling the current pathname by manipulating
 * window.history. We continue to provide small test stubs for non-router
 * external dependencies (auth client, query helpers, draggable utility) so
 * the component behavior can be tested deterministically without touching
 * external services.
 */
describe("SideBar (integration-style with Router)", () => {
	it("calls signOut and revalidateUserLoginData when Log Out clicked (logged in)", async () => {
		vi.resetModules();

		// Spies for external side effects
		const signOut = vi.fn(() => Promise.resolve());
		const deleteUser = vi.fn(() => Promise.resolve());
		const revalidateUserLoginData = vi.fn(() => Promise.resolve());

		// Mock auth client and user-query utilities (only these, not the router)
		vi.mock("~/server/lib/auth-client", () => {
			return {
				AUTH_CLIENT: {
					signOut,
					deleteUser,
				},
			};
		});

		vi.mock("~/utils/user-query", () => {
			return {
				// Return deterministic values for logged-in state and ownership
				queryUserLoggedIn: () => true,
				queryIsUserOwner: () => false,
				revalidateUserLoginData: () => revalidateUserLoginData(),
			};
		});

		// Mock draggable util used in SideBar to avoid DOM dragging complexity
		vi.mock("~/utils/draggable", () => {
			return {
				makeElementDraggable: (_el?: HTMLElement | null) => {
					// return cleanup function
					return () => undefined;
				},
			};
		});

		// Import SUT after registering mocks for external modules (not router)
		const { default: SideBar } = await import("./side-bar");

		// Ensure the test runs with a pathname where the SideBar should be visible.
		window.history.replaceState({}, "", "/dashboard");

		// Render inside a plain Router so useLocation/useNavigate behave normally.
		render(() => (
			<Router root={(props) => <div>{props.children}</div>}>
				<Route path="*" component={() => <SideBar />} />
			</Router>
		));

		await waitFor(() => {}); // Add this line to wait for Suspense to resolve

		// Wait for the logout label to become available inside Suspense.
		const logoutText = await screen.findByText(/Log Out|Back to Login/i);

		expect(logoutText).toBeDefined();

		// Find the button that contains the logout text and click it.
		const logoutButton = (logoutText as HTMLElement).closest(
			"button",
		) as HTMLButtonElement | null;
		expect(logoutButton).toBeTruthy();

		await userEvent.click(logoutButton!);

		// Wait for async effects to run and assert spies were called.
		await waitFor(() => {
			expect(signOut).toHaveBeenCalled();
			expect(revalidateUserLoginData).toHaveBeenCalled();
		});
	});

	it("shows 'Your Listings' link when user is owner", async () => {
		vi.resetModules();

		// Provide deterministic stubs for auth and query helpers for this scenario.
		vi.mock("~/server/lib/auth-client", () => {
			return {
				AUTH_CLIENT: {
					signOut: () => Promise.resolve(),
					deleteUser: () => Promise.resolve(),
				},
			};
		});

		vi.mock("~/utils/user-query", () => {
			return {
				queryUserLoggedIn: () => true,
				queryIsUserOwner: () => true,
				revalidateUserLoginData: () => Promise.resolve(),
			};
		});

		vi.mock("~/utils/draggable", () => {
			return {
				makeElementDraggable: (_el?: HTMLElement | null) => () => undefined,
			};
		});

		const { default: SideBar } = await import("./side-bar");

		// Make sure the location is on a non-root pathname so the SideBar renders.
		window.history.replaceState({}, "", "/dashboard");

		// Render inside a plain Router so useLocation/useNavigate behave normally.
		render(() => (
			<Router root={(props) => <div>{props.children}</div>}>
				<Route path="*" component={() => <SideBar />} />
			</Router>
		));

		await waitFor(() => {}); // Add this line to wait for Suspense to resolve

		// The 'Your Listings' anchor should be present when the mocked user is an owner.
		const yourListings = await screen.findByText(/Your Listings/i);
		expect(yourListings).toBeDefined();

		// Ensure it's an anchor/link in the rendered output.
		const anchor = (yourListings as HTMLElement).closest("a");
		expect(anchor).toBeTruthy();
	});
});
