// reports.tsx
import { createAsync, query, revalidate } from "@solidjs/router";
import AscendingOrderIcon from "lucide-solid/icons/arrow-down-a-z";
import DescendingOrderIcon from "lucide-solid/icons/arrow-down-z-a";
import ViewIcon from "lucide-solid/icons/eye";
import EditIcon from "lucide-solid/icons/square-pen";
import DeleteIcon from "lucide-solid/icons/trash-2";
import { createMemo, createSignal, For, Show } from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import * as v from "valibot";
import {
	BackNavigationButton,
	GenericButton,
	TooltipButton,
} from "~/components/button";
import { triggerConfirmationModal } from "~/components/modal/confirmation-modal";
import {
	closeModal,
	GenericModal,
	showModal,
} from "~/components/modal/generic-modal";
import type { ReportSchema } from "~/server/database/schema";
import {
	getReportById,
	getReportsForOwner,
	deleteReport,
} from "~/server/database/user/report-query";
import { getCurrentUserInfo } from "~/server/user";
import { DEFAULTS, DUMMY_REPORT_DATA } from "~/shared/constants";
import { generateRandomUUID } from "~/utils/random";

const { URL } = DEFAULTS;

/** ---------------------------------------
 * Report Form Component
 * --------------------------------------- */
function ReportForm(props: {
	formData: ReportSchema;
	setFormData: SetStoreFunction<ReportSchema>;
}) {
	return (
		<>
			<fieldset class="fieldset">
				<legend class="fieldset-legend">Report Details</legend>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<label class="form-control">
						<span class="label-text">Title</span>
						<input
							class="input input-bordered w-full"
							value={props.formData.title}
							onInput={(e) =>
								props.setFormData("title", e.currentTarget.value)
							}
							placeholder="Report title"
							required
						/>
					</label>

					<label class="form-control">
						<span class="label-text">Category</span>
						<input
							class="input input-bordered w-full"
							value={props.formData.category ?? ""}
							onInput={(e) =>
								props.setFormData("category", e.currentTarget.value)
							}
							placeholder="Category (e.g. Bug, Feedback)"
						/>
					</label>
				</div>
			</fieldset>

			<fieldset class="fieldset mt-4">
				<legend class="fieldset-legend">Description</legend>
				<textarea
					class="textarea textarea-bordered w-full"
					rows={4}
					value={props.formData.description ?? ""}
					onInput={(e) =>
						props.setFormData("description", e.currentTarget.value)
					}
					placeholder="Describe the issue or feedback..."
				/>
			</fieldset>
		</>
	);
}

/** ---------------------------------------
 * Modals
 * --------------------------------------- */
function CreateReportModal(props: {
	modalId: string;
	formData: ReportSchema;
	setFormData: SetStoreFunction<ReportSchema>;
	isLoading: boolean;
	onCancel: () => void;
	onSubmit: () => Promise<void>;
}) {
	return (
		<GenericModal modalId={props.modalId} class="w-full max-w-3xl">
			<div class="prose mx-auto max-w-full p-3">
				<h2 class="font-bold text-xl">Create Report</h2>
				<form class="grid gap-3" onSubmit={(e) => e.preventDefault()}>
					<ReportForm
						formData={props.formData}
						setFormData={props.setFormData}
					/>

					<div class="flex justify-end gap-2 pt-2">
						<GenericButton
							class="btn-ghost"
							type="button"
							onClick={props.onCancel}
						>
							Cancel
						</GenericButton>
						<GenericButton
							class="btn btn-primary"
							onClick={async () => await props.onSubmit()}
						>
							{props.isLoading ? "Creating..." : "Create"}
						</GenericButton>
					</div>
				</form>
			</div>
		</GenericModal>
	);
}

function EditReportModal(props: {
	modalId: string;
	formData: ReportSchema;
	setFormData: SetStoreFunction<ReportSchema>;
	isLoading: boolean;
	onCancel: () => void;
	onSubmit: () => Promise<void>;
}) {
	return (
		<GenericModal modalId={props.modalId} class="w-full max-w-3xl">
			<div class="prose mx-auto max-w-full p-3">
				<h2 class="font-bold text-xl">Edit Report</h2>
				<form class="grid gap-3" onSubmit={(e) => e.preventDefault()}>
					<input type="hidden" name="id" value={props.formData.id} />
					<ReportForm
						formData={props.formData}
						setFormData={props.setFormData}
					/>

					<div class="flex justify-end gap-2 pt-2">
						<GenericButton
							class="btn-ghost"
							type="button"
							onClick={props.onCancel}
						>
							Cancel
						</GenericButton>
						<GenericButton
							class="btn btn-primary"
							onClick={async () => await props.onSubmit()}
						>
							{props.isLoading ? "Saving..." : "Save Changes"}
						</GenericButton>
					</div>
				</form>
			</div>
		</GenericModal>
	);
}

function ViewReportModal(props: {
	modalId: string;
	formData: ReportSchema;
	onClose: () => void;
}) {
	return (
		<GenericModal modalId={props.modalId} class="w-full max-w-3xl">
			<div class="prose mx-auto max-w-full p-3">
				<h2 class="font-bold text-xl">Report Details</h2>
				<div class="grid gap-3">
					<div>
						<h3 class="font-semibold text-lg">{props.formData.title}</h3>
						<div class="text-base-content/70 text-sm">
							{props.formData.category ?? "Uncategorized"}
						</div>
					</div>

					<p class="whitespace-pre-wrap">{props.formData.description}</p>

					<div class="flex justify-end gap-2 pt-2">
						<GenericButton class="btn-ghost" onClick={props.onClose}>
							Close
						</GenericButton>
					</div>
				</div>
			</div>
		</GenericModal>
	);
}

/** ---------------------------------------
 * Main Page
 * --------------------------------------- */
export default function ReportsPage() {
	// Fetch all reports (replace with real query)
	const reportsQuery = query(async () => {
		// Example: fetch reports for current user
		return await fetch(`${URL}/api/reports`).then((r) => r.json());
	}, "get-reports");

	const reports = createAsync(() => reportsQuery(), { initialValue: [] });

	const SortKeySchema = v.union([v.literal("title"), v.literal("category")]);
	type SortKeySchema = v.InferOutput<typeof SortKeySchema>;

	const [search, setSearch] = createSignal("");
	const [sortKey, setSortKey] = createSignal<SortKeySchema>("title");
	const [sortDir, setSortDir] = createSignal<"asc" | "desc">("asc");
	const [isActionLoading, setIsActionLoading] = createSignal(false);

	const createModalId = generateRandomUUID();
	const viewModalId = generateRandomUUID();
	const editModalId = generateRandomUUID();

	const [formData, setFormData] = createStore<ReportSchema>(
		structuredClone(DUMMY_REPORT_DATA),
	);

	const filteredAndSorted = createMemo(() => {
		const term = search().toLowerCase();
		const sorted = [...reports()].filter(
			(r) =>
				r.title.toLowerCase().includes(term) ||
				(r.category ?? "").toLowerCase().includes(term),
		);

		sorted.sort((a, b) => {
			const key = sortKey();
			const dir = sortDir();
			const av = a[key] ?? "";
			const bv = b[key] ?? "";
			return dir === "asc"
				? av.localeCompare(bv)
				: bv.localeCompare(av);
		});

		return sorted;
	});

	async function handleCreate() {
		setIsActionLoading(true);
		await createReportEntry(formData);
		await revalidate("get-reports");
		closeModal(createModalId);
		setIsActionLoading(false);
	}

	async function handleEdit() {
		setIsActionLoading(true);
		await updateReportEntry(formData);
		await revalidate("get-reports");
		closeModal(editModalId);
		setIsActionLoading(false);
	}

	async function handleDelete(id: string) {
		const confirmed = await triggerConfirmationModal(
			"Delete Report",
			"Are you sure you want to delete this report?",
		);
		if (!confirmed) return;
		await deleteReportEntry(id);
		await revalidate("get-reports");
	}

	return (
		<div class="p-4">
			<div class="mb-4 flex items-center justify-between">
				<BackNavigationButton />
				<GenericButton
					class="btn btn-primary"
					onClick={() => {
						setFormData(structuredClone(DUMMY_REPORT_DATA));
						showModal(createModalId);
					}}
				>
					Create Report
				</GenericButton>
			</div>

			<div class="mb-4 flex flex-wrap items-center gap-2">
				<input
					class="input input-bordered w-full max-w-xs"
					placeholder="Search reports..."
					value={search()}
					onInput={(e) => setSearch(e.currentTarget.value)}
				/>
				<TooltipButton
					onClick={() =>
						setSortDir(sortDir() === "asc" ? "desc" : "asc")
					}
					tooltipText="Toggle sort direction"
				>
					<Show when={sortDir() === "asc"} fallback={<DescendingOrderIcon />}>
						<AscendingOrderIcon />
					</Show>
				</TooltipButton>
			</div>

			<div class="overflow-x-auto">
				<table class="table w-full">
					<thead>
						<tr>
							<th>Title</th>
							<th>Category</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						<For each={filteredAndSorted()}>
							{(report) => (
								<tr>
									<td>{report.title}</td>
									<td>{report.category ?? "N/A"}</td>
									<td class="flex gap-2">
										<TooltipButton
											onClick={() => {
												setFormData(report);
												showModal(viewModalId);
											}}
											tooltipText="View"
										>
											<ViewIcon />
										</TooltipButton>

										<TooltipButton
											onClick={() => {
												setFormData(structuredClone(report));
												showModal(editModalId);
											}}
											tooltipText="Edit"
										>
											<EditIcon />
										</TooltipButton>

										<TooltipButton
											onClick={() => handleDelete(report.id)}
											tooltipText="Delete"
										>
											<DeleteIcon />
										</TooltipButton>
									</td>
								</tr>
							)}
						</For>
					</tbody>
				</table>
			</div>

			<CreateReportModal
				modalId={createModalId}
				formData={formData}
				setFormData={setFormData}
				isLoading={isActionLoading()}
				onCancel={() => closeModal(createModalId)}
				onSubmit={handleCreate}
			/>

			<EditReportModal
				modalId={editModalId}
				formData={formData}
				setFormData={setFormData}
				isLoading={isActionLoading()}
				onCancel={() => closeModal(editModalId)}
				onSubmit={handleEdit}
			/>

			<ViewReportModal
				modalId={viewModalId}
				formData={formData}
				onClose={() => closeModal(viewModalId)}
			/>
		</div>
	);
}
