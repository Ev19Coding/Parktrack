import { Route, Router } from "@solidjs/router";
import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { RecreationalLocationDisplayButtonCard } from "./location-display-button-card";

/**
 * Tests use the real router API by wrapping the component in a Router.
 * This follows Solid testing guidance and avoids mocking @solidjs/router.
 */

describe("RecreationalLocationDisplayButtonCard (with real Router)", () => {
	it("renders image, title and uses provided href when not a skeleton", () => {
		render(() => (
			<Router root={(props) => <div>{props.children}</div>}>
				<Route
					path="*"
					component={() => (
						<RecreationalLocationDisplayButtonCard
							href="/info/park-123"
							thumbnail="/images/park-123.jpg"
							title="My Test Park"
						/>
					)}
				/>
			</Router>
		));

		// Image should be present with correct src and alt attributes.
		const img = screen.getByAltText("My Test Park") as HTMLImageElement;
		expect(img).toBeDefined();
		expect(img.getAttribute("src")).toBe("/images/park-123.jpg");

		// Title overlay text should be present.
		expect(screen.getByText("My Test Park")).toBeDefined();

		// Anchor wrapper should contain the provided href.
		const link = screen.getByRole("link") as HTMLAnchorElement;
		expect(link).toBeDefined();
		// Router may render absolute or relative href; assert it contains the path.
		expect(link.getAttribute("href")).toContain("/info/park-123");
	});

	it("renders skeleton state when isSkeleton is true and does not render an image or title", () => {
		render(() => (
			<Router root={(props) => <div>{props.children}</div>}>
				<Route
					path="*"
					component={() => <RecreationalLocationDisplayButtonCard isSkeleton />}
				/>
			</Router>
		));

		// No image should exist in skeleton state.
		expect(document.querySelector("img")).toBeNull();

		const link = screen.getByRole("link") as HTMLAnchorElement;
		expect(link).toBeDefined();

		// The component should include the 'skeleton' class when loading.
		expect(link.className).toContain("skeleton");

		// When skeleton, href should default to '#' or include it.
		const href = link.getAttribute("href");
		expect(href).toBeTruthy();
		expect(href).toContain("#");
	});

	it("keeps expected structural classes and image src when not skeleton", () => {
		render(() => (
			<Router root={(props) => <div>{props.children}</div>}>
				<Route
					path="*"
					component={() => (
						<RecreationalLocationDisplayButtonCard
							href="/info/abc"
							thumbnail="/img.png"
							title="Park ABC"
						/>
					)}
				/>
			</Router>
		));

		const link = screen.getByRole("link") as HTMLAnchorElement;
		expect(link).toBeDefined();

		// Check a couple of classes relevant to layout/interaction.
		expect(link.className).toContain("relative");
		expect(link.className).toContain("cursor-pointer");

		const img = screen.getByAltText("Park ABC") as HTMLImageElement;
		expect(img.getAttribute("src")).toBe("/img.png");
	});
});
