import { createAsync, revalidate } from "@solidjs/router";
import CheckIcon from "lucide-solid/icons/check";
import ClockIcon from "lucide-solid/icons/clock";
import FlagIcon from "lucide-solid/icons/flag";
import MessageSquareIcon from "lucide-solid/icons/message-square";
import UserIcon from "lucide-solid/icons/user";
import XIcon from "lucide-solid/icons/x";
import { createSignal, For, type JSXElement, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";

import {
	closeModal,
	GenericModal,
	showModal,
} from "~/components/modal/generic-modal";
import { toast } from "~/components/toast";
import {
	resolveLocationReport,
	unresolveLocationReport,
} from "~/server/report";
import { formatDateFull, formatDateRelative } from "~/utils/formatting";
import { generateRandomUUID } from "~/utils/random";
import { queryOwnerReports } from "~/utils/report-query";

interface ReplyModalState {
	modalId: string;
	reportId: string;
	reportTitle: string;
	isOpen: boolean;
}

const [replyModalState, setReplyModalState] = createStore<ReplyModalState>({
	modalId: generateRandomUUID(),
	reportId: "",
	reportTitle: "",
	isOpen: false,
});

function ReplyModal() {
	const [reply, setReply] = createSignal("");
	const [isSubmitting, setIsSubmitting] = createSignal(false);

	async function handleSubmit() {
		if (!reply().trim()) {
			toast.warning(
				"Reply Required",
				"Please enter a response before resolving the report.",
			);
			return;
		}

		setIsSubmitting(true);
		try {
			await resolveLocationReport(replyModalState.reportId, reply().trim());

			await revalidate(queryOwnerReports.key);

			toast.success(
				"Report Resolved",
				"The report has been successfully resolved with your response.",
			);
			closeModal(replyModalState.modalId);
			setReply("");
		} catch (error: unknown) {
			console.error("Failed to resolve report:", error);
			toast.error(
				"Failed to Resolve Report",
				error instanceof Error ? error.message : "Unknown error occurred",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<GenericModal modalId={replyModalState.modalId}>
			<div class="space-y-4">
				<div>
					<h3 class="mb-2 font-semibold text-lg">Resolve Report</h3>
					<p class="text-base-content/70 text-sm">
						Provide a response to:{" "}
						<span class="font-semibold">{replyModalState.reportTitle}</span>
					</p>
				</div>

				<fieldset class="fieldset">
					<legend class="fieldset-legend">Response to Report</legend>

					<div class="form-control w-full">
						<label class="label" for="reply-textarea">
							<span class="label-text font-medium">Your Response</span>
							<span class="label-text-alt text-xs">
								Optional - explain how you've addressed this issue
							</span>
						</label>
						<textarea
							id="reply-textarea"
							class="textarea textarea-bordered min-h-24 w-full"
							placeholder="Thank you for your report. We have..."
							value={reply()}
							onInput={(e) => setReply(e.currentTarget.value)}
						/>
					</div>
				</fieldset>

				<div class="modal-action">
					<button
						type="button"
						onClick={() => {
							closeModal(replyModalState.modalId);
							setReply("");
						}}
						class="btn btn-outline btn-neutral"
						disabled={isSubmitting()}
					>
						Cancel
					</button>

					<button
						type="button"
						class="btn btn-success gap-2"
						onClick={handleSubmit}
						disabled={isSubmitting()}
					>
						{isSubmitting() ? (
							<>
								<span class="loading loading-spinner loading-sm"></span>
								Resolving...
							</>
						) : (
							<>
								<CheckIcon size={16} />
								Mark as Resolved
							</>
						)}
					</button>
				</div>
			</div>
		</GenericModal>
	);
}

function ReportCard(props: {
	report: Awaited<ReturnType<typeof queryOwnerReports>>[0];
}) {
	const [isUpdating, setIsUpdating] = createSignal(false);

	async function handleQuickResolve() {
		setIsUpdating(true);
		try {
			await resolveLocationReport(props.report.id);
			await revalidate(queryOwnerReports.key);
		} catch (error: unknown) {
			console.error("Failed to resolve report:", error);
			toast.error(
				"Failed to Resolve Report",
				error instanceof Error ? error.message : "Unknown error occurred",
			);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleUnresolve() {
		setIsUpdating(true);
		try {
			await unresolveLocationReport(props.report.id);
			await revalidate(queryOwnerReports.key);
		} catch (error: unknown) {
			console.error("Failed to unresolve report:", error);
			toast.error(
				"Failed to Unresolve Report",
				error instanceof Error ? error.message : "Unknown error occurred",
			);
		} finally {
			setIsUpdating(false);
		}
	}

	function openReplyModal() {
		setReplyModalState({
			reportId: props.report.id,
			reportTitle: props.report.title,
			isOpen: true,
		});
		showModal(replyModalState.modalId);
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
							<div class="badge badge-outline badge-primary">
								{props.report.locationTitle}
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
								<UserIcon size={12} />
								Report ID: {props.report.id}
							</div>
							<div class="flex items-center gap-1">
								<ClockIcon size={12} />
								{formatDateRelative(props.report.createdAt)}
							</div>
						</div>

						<Show when={props.report.ownerReply}>
							<div class="alert alert-success">
								<div class="flex items-start gap-2">
									<MessageSquareIcon size={16} />
									<div class="flex-1">
										<div class="font-semibold text-sm">Your Response</div>
										<p class="mt-1 break-words text-sm">
											{props.report.ownerReply}
										</p>
										<Show when={props.report.ownerReplyAt}>
											<p class="mt-1 text-base-content/60 text-xs">
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
						<Show when={!props.report.isResolved}>
							<button
								type="button"
								class="btn btn-success btn-sm gap-2"
								onClick={openReplyModal}
								disabled={isUpdating()}
							>
								<MessageSquareIcon size={14} />
								Reply & Resolve
							</button>

							<button
								type="button"
								class="btn btn-outline btn-success btn-sm gap-2"
								onClick={handleQuickResolve}
								disabled={isUpdating()}
							>
								{isUpdating() ? (
									<span class="loading loading-spinner loading-xs"></span>
								) : (
									<CheckIcon size={14} />
								)}
								Quick Resolve
							</button>
						</Show>

						<Show when={props.report.isResolved}>
							<button
								type="button"
								class="btn btn-warning btn-sm gap-2"
								onClick={handleUnresolve}
								disabled={isUpdating()}
							>
								{isUpdating() ? (
									<span class="loading loading-spinner loading-xs"></span>
								) : (
									<XIcon size={14} />
								)}
								Unresolve
							</button>
						</Show>
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

export default function OwnerReportPage() {
	const reports = createAsync(() => queryOwnerReports(), { initialValue: [] });

	const [filterStatus, setFilterStatus] = createSignal<
		"all" | "pending" | "resolved"
	>("all");

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
					<h1 class="font-bold text-2xl sm:text-3xl">Location Reports</h1>
					<p class="text-base-content/70">
						Manage reports submitted by users for your locations
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
									? "You don't have any reports yet. When users report issues with your locations, they'll appear here."
									: filterStatus() === "pending"
										? "No pending reports. Great job keeping your locations well-maintained!"
										: "No resolved reports in this filter."}
							</p>
						</div>
					}
				>
					<div class="space-y-4">
						<For each={filteredReports()}>
							{(report) => <ReportCard report={report} />}
						</For>
					</div>
				</Show>
			</Suspense>

			{/* Reply Modal */}
			<ReplyModal />
		</div>
	);
}
