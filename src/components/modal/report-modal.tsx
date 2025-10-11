import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { toast } from "~/components/toast";
import { createLocationReport } from "~/server/report";
import { generateRandomUUID } from "~/utils/random";
import { closeModal, GenericModal, showModal } from "./generic-modal";

const [state, setState] = createStore({
	modalId: generateRandomUUID(),
	locationId: "" as string,
	locationTitle: "" as string,
	onSuccess: (() => {}) as () => void | Promise<void>,
});

export function ReportModal() {
	const [title, setTitle] = createSignal("Other");
	const [message, setMessage] = createSignal("");
	const [submitting, setSubmitting] = createSignal(false);

	async function submitReport() {
		// Basic validation
		if (!state.locationId) {
			toast.error("Error", "Missing location ID. Please try again.");
			return;
		}
		if (!title().trim()) {
			toast.warning(
				"Validation Error",
				"Please select an issue type for your report.",
			);
			return;
		}

		setSubmitting(true);
		try {
			await createLocationReport(
				state.locationId,
				title().trim(),
				message().trim(),
			);

			// Call success callback
			await state.onSuccess?.();

			// Reset form
			setTitle("Other");
			setMessage("");

			// Close modal with success message
			toast.success(
				"Report Submitted Successfully",
				"Thank you for helping us improve! The location owner will be notified.",
			);
			closeModal(state.modalId);
		} catch (err: unknown) {
			console.error("Report error", err);
			toast.error(
				"Failed to Submit Report",
				err instanceof Error
					? err.message
					: "An unexpected error occurred. Please try again.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<GenericModal modalId={state.modalId} z-index={999_999}>
			<div class="space-y-6">
				{/* Header */}
				<div class="text-center">
					<h3 class="mb-2 font-bold text-primary text-xl">Report an Issue</h3>
					<div class="divider my-1"></div>
					<p class="text-base-content/70 text-sm">
						Help us improve by reporting a problem with{" "}
						<span class="font-semibold text-accent">{state.locationTitle}</span>
					</p>
				</div>

				{/* Form */}
				<fieldset class="fieldset space-y-4">
					<legend class="fieldset-legend">Report Details</legend>

					<div class="form-control w-full">
						<label class="label" for="issue-type-select">
							<span class="label-text font-semibold">Issue Type</span>
							<span class="label-text-alt text-error">Required</span>
						</label>
						<select
							id="issue-type-select"
							class="select select-bordered select-primary focus:select-accent w-full"
							value={title()}
							onChange={(e) => setTitle(e.currentTarget.value)}
						>
							<option disabled value="">
								Choose an issue type
							</option>
							<option value="Other">Other</option>
							<option value="Incorrect Information">
								📝 Incorrect Information
							</option>
							<option value="Permanently Closed">🚫 Permanently Closed</option>
							<option value="Safety Concern">⚠️ Safety Concern</option>
							<option value="Inappropriate Content">
								🔞 Inappropriate Content
							</option>
							<option value="Spam or Duplicate">🗑️ Spam or Duplicate</option>
							<option value="Accessibility Issue">
								♿ Accessibility Issue
							</option>
							<option value="Facility Problem">🔧 Facility Problem</option>
						</select>
					</div>

					<div class="form-control w-full">
						<label class="label" for="description-textarea">
							<span class="label-text font-semibold">Description</span>
							<span class="label-text-alt">Optional - Provide details</span>
						</label>
						<textarea
							id="description-textarea"
							class="textarea textarea-bordered textarea-primary focus:textarea-accent min-h-24 w-full"
							placeholder="Please describe the issue in detail. This information will help the location owner understand and address your concern more effectively."
							value={message()}
							onInput={(e) => setMessage(e.currentTarget.value)}
						/>
						<div class="label">
							<span class="label-text-alt"></span>
							<span class="label-text-alt">
								{message().length}/500 characters
							</span>
						</div>
					</div>
				</fieldset>

				{/* Actions */}
				<div class="modal-action justify-center gap-3">
					<button
						type="button"
						class="btn btn-outline btn-neutral"
						onClick={() => closeModal(state.modalId)}
						disabled={submitting()}
					>
						Cancel
					</button>

					<button
						type="button"
						class="btn btn-primary min-w-32"
						onClick={submitReport}
						disabled={submitting() || !title().trim()}
					>
						{submitting() ? (
							<>
								<span class="loading loading-spinner loading-sm"></span>
								Submitting...
							</>
						) : (
							<>Submit Report</>
						)}
					</button>
				</div>
			</div>
		</GenericModal>
	);
}

/** Call this to open the report modal */
export function triggerReportModal(
	locationId: string,
	locationTitle?: string,
	onSuccess?: () => void | Promise<void>,
) {
	setState({
		locationId,
		locationTitle: locationTitle ?? "this location",
		onSuccess: onSuccess ?? (() => {}),
	});

	showModal(state.modalId);
}
