import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { GenericButton, TooltipButton } from "./button";

describe("GenericButton", () => {
	it("should render button with text", () => {
		render(() => <GenericButton>Click me</GenericButton>);
		expect(screen.getByRole("button")).toHaveTextContent("Click me");
	});

	it("should apply btn class by default", () => {
		render(() => <GenericButton>Button</GenericButton>);
		expect(screen.getByRole("button")).toHaveClass("btn");
	});

	it("should merge custom classes", () => {
		render(() => <GenericButton class="custom">Button</GenericButton>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("btn", "custom");
	});

	it("should be type button by default", () => {
		render(() => <GenericButton>Button</GenericButton>);
		expect(screen.getByRole("button")).toHaveAttribute("type", "button");
	});
});

describe("TooltipButton", () => {
	it("should render button with tooltip text", () => {
		render(() => (
			<TooltipButton tooltipText="Help text">
				Help
			</TooltipButton>
		));

		expect(screen.getByRole("button")).toHaveTextContent("Help");
		expect(screen.getByText("Help text")).toBeInTheDocument();
	});

	it("should apply tooltip direction class", () => {
		render(() => (
			<TooltipButton tooltipText="Help" tooltipDir="left">
				Button
			</TooltipButton>
		));

		expect(document.querySelector(".tooltip-left")).toBeInTheDocument();
	});

	it("should default to top direction", () => {
		render(() => (
			<TooltipButton tooltipText="Help">
				Button
			</TooltipButton>
		));

		expect(document.querySelector(".tooltip-top")).toBeInTheDocument();
	});
});
