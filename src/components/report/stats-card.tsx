import type { JSXElement } from "solid-js";

export interface StatsCardProps {
	title: string;
	value: number;
	icon: JSXElement;
	color?: "primary" | "warning" | "success";
}

export function StatsCard(props: StatsCardProps) {
	const colorClass = () => {
		switch (props.color) {
			case "warning":
				return "text-warning";
			case "success":
				return "text-success";
			default:
				return "text-primary";
		}
	};

	return (
		<div class="stats bg-base-100 shadow-lg">
			<div class="stat">
				<div class={`stat-figure ${colorClass()}`}>{props.icon}</div>
				<div class="stat-title font-semibold">{props.title}</div>
				<div class={`stat-value ${colorClass()}`}>{props.value}</div>
			</div>
		</div>
	);
}
