import CheckIcon from "lucide-solid/icons/check";
import ClockIcon from "lucide-solid/icons/clock";
import FlagIcon from "lucide-solid/icons/flag";
import { StatsCard } from "./stats-card";

export interface ReportStatsGridProps {
	stats: {
		total: number;
		pending: number;
		resolved: number;
	};
}

export function ReportStatsGrid(props: ReportStatsGridProps) {
	return (
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<StatsCard
				title="Total Reports"
				value={props.stats.total}
				icon={<FlagIcon size={24} />}
				color="primary"
			/>
			<StatsCard
				title="Pending"
				value={props.stats.pending}
				icon={<ClockIcon size={24} />}
				color="warning"
			/>
			<StatsCard
				title="Resolved"
				value={props.stats.resolved}
				icon={<CheckIcon size={24} />}
				color="success"
			/>
		</div>
	);
}
