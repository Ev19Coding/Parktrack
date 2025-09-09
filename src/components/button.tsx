import type { JSX, JSXElement } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
	children: JSXElement;
}

function Button(prop: ButtonProps) {
	return (
		<button {...prop} class={`btn ${prop.class}`} type="button">
			{prop.children}
		</button>
	);
}

const tooltipDirectionClasses = {
	top: "tooltip-top",
	bottom: "tooltip-bottom",
	left: "tooltip-left",
	right: "tooltip-right",
};

function TooltipButton(
	prop: ButtonProps & {
		/** The text to display in the tooltip. */
		tooltipText: JSXElement;

		/** The direction the tooltip should show up in. */
		tooltipDir?: "left" | "right" | "top" | "bottom";
	},
) {
	return (
		<Button {...prop} class={`relative ${prop.class}`}>
			{prop.children}

			<div
				class={`tooltip absolute size-full ${tooltipDirectionClasses[prop.tooltipDir ?? "top"]}`}
			>
				<div class="tooltip-content">{prop.tooltipText}</div>
			</div>
		</Button>
	);
}

export { Button as GenericButton, TooltipButton };
