import { createAsync, revalidate } from "@solidjs/router";
import CheckIcon from "lucide-solid/icons/check";
import ClockIcon from "lucide-solid/icons/clock";
import FlagIcon from "lucide-solid/icons/flag";
import MessageSquareIcon from "lucide-solid/icons/message-square";
import TrashIcon from "lucide-solid/icons/trash";
import { createSignal, For, type JSXElement, Show, Suspense } from "solid-js";
import LoadingSpinner from "~/components/loading-spinner";
import { triggerConfirmationModal } from "~/components/modal/confirmation-modal";
import { toast } from "~/components/toast";
import type { ReportSchema } from "~/server/database/schema";
import { deleteLocationReport } from "~/server/report";
import { formatDateFull, formatDateRelative } from "~/utils/formatting";
import { queryUserReports } from "~/utils/report-query";

function ReportCard(props: {
	report: ReportSchema;
	isDeleting: boolean;
	onDelete: (reportId: string) => void;
}): JSXElement {
	function handleDelete() {
		props.onDelete(props.report.id);
	}

	return (
		<div
			class={`card bg-base-100 shadow-lg ${props.report.isResolved ? "border-l-4 border-l-success" : "border-l-4 border-l-warning"}`}
		>
			<div class="card-body p-4">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<div class="mb-3 flex flex-wrap items-center gap-2">
							<div
								class={`badge ${props.report.isResolved ? "badge-success" : "badge-warning"} badge-lg gap-1`}
							>
								{props.report.isResolved ? (
									<>
										<CheckIcon size={12} />
										Resolved
									</>
								) : (
									<>
										<ClockIcon size={12} />
										Pending
									</>
								)}
							</div>
						</div>

						<h3 class="mb-2 break-words font-semibold text-base">
							{props.report.title}
						</h3>

						<Show when={props.report.message}>
							<p class="mb-3 break-words text-base-content/80 text-sm">
								{props.report.message}
							</p>
						</Show>

						<div class="mb-3 flex flex-wrap items-center gap-4 text-base-content/60 text-xs">
							<div class="flex items-center gap-1">
								<ClockIcon size={12} />
								Submitted {formatDateRelative(props.report.createdAt)}
							</div>
							<div class="flex items-center gap-1">
								<FlagIcon size={12} />
								Report ID: {props.report.id}
							</div>
						</div>

						<Show when={props.report.ownerReply}>
							<div class="alert alert-success">
								<div class="flex items-start gap-2">
									<MessageSquareIcon size={16} />
									<div class="flex-1">
										<div class="font-semibold text-sm">Owner Response</div>
										<p class="mt-1 break-words text-sm">
											{props.report.ownerReply}
										</p>
										<Show when={props.report.ownerReplyAt}>
											<p class="mt-1 text-base-content/60 text-xs">
												Responded on{" "}
												{props.report.ownerReplyAt
													? formatDateFull(props.report.ownerReplyAt)
													: ""}
											</p>
										</Show>
									</div>
								</div>
							</div>
						</Show>
					</div>

					<div class="flex flex-col gap-2">
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
					</div>
				</div>
			</div>
		</div>
	);
}

function StatsCard(props: {
	title: string;
	value: number;
	icon: JSXElement;
	color?: "primary" | "warning" | "success";
}) {
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
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatsCard
					title="Total Reports"
					value={stats().total}
					icon={<FlagIcon size={24} />}
					color="primary"
				/>
				<StatsCard
					title="Pending"
					value={stats().pending}
					icon={<ClockIcon size={24} />}
					color="warning"
				/>
				<StatsCard
					title="Resolved"
					value={stats().resolved}
					icon={<CheckIcon size={24} />}
					color="success"
				/>
			</div>

			{/* Filters */}
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-4">
					<div class="flex flex-wrap items-center gap-3">
						<span class="font-semibold text-sm">Filter Reports:</span>
						<div class="space-x-2">
							<button
								type="button"
								class={`btn btn-sm ${filterStatus() === "all" ? "btn-primary" : "btn-outline"}`}
								onClick={() => setFilterStatus("all")}
							>
								All ({stats().total})
							</button>
							<button
								type="button"
								class={`btn btn-sm ${filterStatus() === "pending" ? "btn-warning" : "btn-outline"}`}
								onClick={() => setFilterStatus("pending")}
							>
								Pending ({stats().pending})
							</button>
							<button
								type="button"
								class={`btn btn-sm ${filterStatus() === "resolved" ? "btn-success" : "btn-outline"}`}
								onClick={() => setFilterStatus("resolved")}
							>
								Resolved ({stats().resolved})
							</button>
						</div>
					</div>
				</div>
			</div>

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
						<div class="flex flex-col items-center justify-center rounded-lg bg-base-200 py-12">
							<FlagIcon size={48} class="mb-4 text-base-content/30" />
							<h3 class="mb-2 font-semibold text-lg">No Reports Found</h3>
							<p class="text-center text-base-content/60">
								{filterStatus() === "all"
									? "You haven't submitted any reports yet. When you encounter issues with locations, you can report them to help improve the service."
									: filterStatus() === "pending"
										? "No pending reports. All your reports have been resolved!"
										: "No resolved reports in this filter."}
							</p>
						</div>
					}
				>
					<div class="space-y-4">
						<For each={filteredReports()}>
							{(report) => (
								<ReportCard
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
