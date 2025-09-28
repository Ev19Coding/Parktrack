import { render, screen } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";

/**
 * Typed props for the mocked router `A` component.
 * Avoids any usage.
 */
type RouterAProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
	children?: JSX.Element | string | Array<JSX.Element | string>;
	href?: string | undefined;
	type?: string | undefined;
	class?: string | undefined;
	[index: string]: unknown;
};

// Register a module mock for @solidjs/router before importing the SUT.
// The mock returns a thin passthrough to a native <a> element so the component
// can be imported and rendered in the JSDOM test environment.
vi.mock("@solidjs/router", () => {
	const A = (props: RouterAProps) => {
		const { children, href, type, class: className, ...rest } = props;

		// Cast rest to the expected Anchor props for the JSX spread.
		const anchorProps = {
			href,
			type,
			class: className,
			...rest,
		} as JSX.AnchorHTMLAttributes<HTMLAnchorElement>;

		// Render a native anchor that mirrors the router `A` interface closely.
		return <a {...anchorProps}>{children as JSX.Element}</a>;
	};

	return { A };
});

// Import the component after the mock registration so the module receives the mocked `A`.
const { RecreationalLocationDisplayButtonCard } = await import(
	"./location-display-button-card"
);

describe("RecreationalLocationDisplayButtonCard (co-located)", () => {
	it("renders image, title and uses provided href when not a skeleton", () => {
		render(() => (
			<RecreationalLocationDisplayButtonCard
				href="/info/park-123"
				thumbnail="/images/park-123.jpg"
				title="My Test Park"
			/>
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
		expect(link.getAttribute("href")).toContain("/info/park-123");
	});

	it("renders skeleton state when isSkeleton is true and does not render an image or title", () => {
		render(() => <RecreationalLocationDisplayButtonCard isSkeleton />);

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
			<RecreationalLocationDisplayButtonCard
				href="/info/abc"
				thumbnail="/img.png"
				title="Park ABC"
			/>
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
