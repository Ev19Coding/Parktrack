import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as navigation from "~/utils/navigation";
import { BackNavigationButton } from "./button";
import LoadingSpinner from "./loading-spinner";

describe("LoadingSpinner", () => {
	it("renders a full-screen overlay with a spinner", () => {
		render(() => <LoadingSpinner />);

		// The spinner element uses the 'loading-spinner' class from the component
		const spinner = document.querySelector(".loading-spinner");
		expect(spinner).toBeInTheDocument();

		// The wrapper should include classes that make it an absolute full-screen overlay.
		// We check for a few of the classes used by the component rather than trying to assert
		// computed layout since that's brittle in a test environment.
		const wrapper = document.querySelector(
			".absolute.top-0.left-0.z-\\[999999\\].flex.size-full",
		);
		expect(wrapper).toBeInTheDocument();
	});
});

describe("BackNavigationButton", () => {
	let navSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Spy on the goBackToPreviousRoute function from the navigation module.
		// We don't want navigation to actually run in tests.
		navSpy = vi
			.spyOn(navigation, "goBackToPreviousRoute")
			.mockImplementation(() => undefined);

		// Make sure history exists and is deterministic for tests
		// Some tests/environments may not have a window.history, but JSDOM provides it.
		history.replaceState({}, "", "/test");
	});

	afterEach(() => {
		navSpy.mockRestore();
	});

	it("renders a button with an accessible label", () => {
		render(() => <BackNavigationButton />);

		const btn = screen.getByRole("button", { name: /go back/i });
		expect(btn).toBeInTheDocument();
		// The component shows an icon and a text span that is hidden on small screens.
		// We at least assert that the button exists and has the expected class prefix.
		expect(btn.className).toContain("btn-ghost");
	});

	it("calls goBackToPreviousRoute when clicked", async () => {
		render(() => <BackNavigationButton />);

		const btn = screen.getByRole("button", { name: /go back/i });
		await userEvent.click(btn);

		expect(navigation.goBackToPreviousRoute).toHaveBeenCalled();
	});
});
