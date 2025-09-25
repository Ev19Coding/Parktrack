import { useNavigate } from "@solidjs/router";
import ArrowLeftIcon from "lucide-solid/icons/arrow-left";
import type { JSX, JSXElement } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
	children: JSXElement;
}

function Button(prop: ButtonProps) {
	return (
		<button {...prop} class={`btn ${prop.class}`} type={prop.type ?? "button"}>
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

/** Moves back to the previous page in history */
function BackNavigationButton() {
	const navigate = useNavigate();

	const handleBack = () => {
		// Try to go back in history first, fallback to home if no history
		if (window.history.length > 1) {
			window.history.back();
		} else {
			navigate("/");
		}
	};

	return (
		<Button
			onClick={handleBack}
			class="btn-ghost btn-sm absolute z-10 gap-2"
			aria-label="Go back"
		>
			<ArrowLeftIcon size={16} />
			<span class="hidden sm:inline">Back</span>
		</Button>
	);
}

export { Button as GenericButton, TooltipButton, BackNavigationButton };
