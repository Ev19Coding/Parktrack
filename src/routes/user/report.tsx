import { createAsync, revalidate } from "@solidjs/router";
import TrashIcon from "lucide-solid/icons/trash";
import { createSignal, For, Show, Suspense } from "solid-js";
import LoadingSpinner from "~/components/loading-spinner";
import { triggerConfirmationModal } from "~/components/modal/confirmation-modal";
import {
	BaseReportCard,
	ReportEmptyState,
	ReportFilters,
	ReportStatsGrid,
} from "~/components/report";
import { toast } from "~/components/toast";
import type { ReportSchema } from "~/server/database/schema";
import { deleteLocationReport } from "~/server/report";
import { queryUserReports } from "~/utils/report-query";

function UserReportCard(props: {
	report: ReportSchema;
	isDeleting: boolean;
	onDelete: (reportId: string) => void;
}) {
	function handleDelete() {
		props.onDelete(props.report.id);
	}

	const actions = (
		<button
			type="button"
			class="btn btn-error btn-outline btn-sm gap-2"
			onClick={handleDelete}
			disabled={props.isDeleting}
		>
			{props.isDeleting ? (
				<span class="loading loading-spinner loading-xs"></span>
			) : (
				<TrashIcon size={14} />
			)}
			Delete
		</button>
	);

	return (
		<BaseReportCard
			report={props.report}
			userType="user"
			actions={actions}
			isUpdating={props.isDeleting}
		/>
	);
}

export default function UserReportPage() {
	const reports = createAsync(() => queryUserReports(), { initialValue: [] });
	const [isDeleting, setIsDeleting] = createSignal(false);

	const [filterStatus, setFilterStatus] = createSignal<
		"all" | "pending" | "resolved"
	>("all");

	async function handleDeleteReport(reportId: string) {
		triggerConfirmationModal(
			async () => {
				setIsDeleting(true);
				try {
					await deleteLocationReport(reportId);
					await revalidate(queryUserReports.key);
					toast.success(
						"Report Deleted",
						"Your report has been successfully deleted.",
					);
				} catch (error: unknown) {
					console.error("Failed to delete report:", error);
					toast.error(
						"Failed to Delete Report",
						error instanceof Error ? error.message : "Unknown error occurred",
					);
				} finally {
					setIsDeleting(false);
				}
			},
			<div>
				Are you sure you want to delete this report?{" "}
				<strong class="text-error">This action cannot be undone.</strong>
			</div>,
		);
	}

	const filteredReports = () => {
		const allReports = reports();
		switch (filterStatus()) {
			case "pending":
				return allReports.filter((r) => !r.isResolved);
			case "resolved":
				return allReports.filter((r) => r.isResolved);
			default:
				return allReports;
		}
	};

	const stats = () => {
		const allReports = reports();
		return {
			total: allReports.length,
			pending: allReports.filter((r) => !r.isResolved).length,
			resolved: allReports.filter((r) => r.isResolved).length,
		};
	};

	return (
		<div class="container mx-auto max-w-6xl space-y-6 p-4">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="font-bold text-2xl sm:text-3xl">My Reports</h1>
					<p class="text-base-content/70">
						View and manage the reports you've submitted
					</p>
				</div>
			</div>

			{/* Statistics */}
			<ReportStatsGrid stats={stats()} />

			{/* Filters */}
			<ReportFilters
				filterStatus={filterStatus}
				setFilterStatus={setFilterStatus}
				stats={stats()}
			/>

			{/* Reports List */}
			<Suspense
				fallback={
					<div class="flex items-center justify-center py-12">
						<span class="loading loading-spinner loading-lg"></span>
					</div>
				}
			>
				<Show
					when={filteredReports().length > 0}
					fallback={
						<ReportEmptyState filterStatus={filterStatus()} userType="user" />
					}
				>
					<div class="space-y-4">
						<For each={filteredReports()}>
							{(report) => (
								<UserReportCard
									report={report}
									isDeleting={isDeleting()}
									onDelete={handleDeleteReport}
								/>
							)}
						</For>
					</div>
				</Show>
			</Suspense>

			<Show when={isDeleting()}>
				<LoadingSpinner />
			</Show>
		</div>
	);
}
