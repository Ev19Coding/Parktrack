import type { Accessor, Setter } from "solid-js";

export interface ReportFiltersProps {
	filterStatus: Accessor<"all" | "pending" | "resolved">;
	setFilterStatus: Setter<"all" | "pending" | "resolved">;
	stats: {
		total: number;
		pending: number;
		resolved: number;
	};
}

export function ReportFilters(props: ReportFiltersProps) {
	return (
		<div class="card bg-base-100 shadow-md">
			<div class="card-body p-4">
				<div class="flex flex-wrap items-center gap-3">
					<span class="font-semibold text-sm">Filter Reports:</span>
					<div class="space-x-2">
						<button
							type="button"
							class={`btn btn-sm ${props.filterStatus() === "all" ? "btn-primary" : "btn-outline"}`}
							onClick={() => props.setFilterStatus("all")}
						>
							All ({props.stats.total})
						</button>
						<button
							type="button"
							class={`btn btn-sm ${props.filterStatus() === "pending" ? "btn-warning" : "btn-outline"}`}
							onClick={() => props.setFilterStatus("pending")}
						>
							Pending ({props.stats.pending})
						</button>
						<button
							type="button"
							class={`btn btn-sm ${props.filterStatus() === "resolved" ? "btn-success" : "btn-outline"}`}
							onClick={() => props.setFilterStatus("resolved")}
						>
							Resolved ({props.stats.resolved})
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
