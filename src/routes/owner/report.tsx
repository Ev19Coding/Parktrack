import { createAsync, revalidate } from "@solidjs/router";
import CheckIcon from "lucide-solid/icons/check";
import MessageSquareIcon from "lucide-solid/icons/message-square";
import XIcon from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";

import {
	closeModal,
	GenericModal,
	showModal,
} from "~/components/modal/generic-modal";
import {
	BaseReportCard,
	ReportEmptyState,
	ReportFilters,
	ReportStatsGrid,
} from "~/components/report";
import { toast } from "~/components/toast";
import {
	resolveLocationReport,
	unresolveLocationReport,
} from "~/server/report";
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

function OwnerReportCard(props: {
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

	const actions = (
		<>
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
		</>
	);

	return (
		<BaseReportCard
			report={props.report}
			locationTitle={props.report.locationTitle}
			userType="owner"
			actions={actions}
			isUpdating={isUpdating()}
		/>
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
						<ReportEmptyState filterStatus={filterStatus()} userType="owner" />
					}
				>
					<div class="space-y-4">
						<For each={filteredReports()}>
							{(report) => <OwnerReportCard report={report} />}
						</For>
					</div>
				</Show>
			</Suspense>

			{/* Reply Modal */}
			<ReplyModal />
		</div>
	);
}
