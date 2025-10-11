import FlagIcon from "lucide-solid/icons/flag";
import type { JSXElement } from "solid-js";

export interface ReportEmptyStateProps {
	filterStatus: "all" | "pending" | "resolved";
	userType: "user" | "owner";
}

export function ReportEmptyState(props: ReportEmptyStateProps) {
	const getEmptyMessage = (): JSXElement => {
		if (props.filterStatus === "all") {
			return props.userType === "user" ? (
				<p class="text-center text-base-content/60">
					You haven't submitted any reports yet. When you encounter issues with
					locations, you can report them to help improve the service.
				</p>
			) : (
				<p class="text-center text-base-content/60">
					You don't have any reports yet. When users report issues with your
					locations, they'll appear here.
				</p>
			);
		}

		if (props.filterStatus === "pending") {
			return props.userType === "user" ? (
				<p class="text-center text-base-content/60">
					No pending reports. All your reports have been resolved!
				</p>
			) : (
				<p class="text-center text-base-content/60">
					No pending reports. Great job keeping your locations well-maintained!
				</p>
			);
		}

		return (
			<p class="text-center text-base-content/60">
				No resolved reports in this filter.
			</p>
		);
	};

	return (
		<div class="flex flex-col items-center justify-center rounded-lg bg-base-200 py-12">
			<FlagIcon size={48} class="mb-4 text-base-content/30" />
			<h3 class="mb-2 font-semibold text-lg">No Reports Found</h3>
			{getEmptyMessage()}
		</div>
	);
}
