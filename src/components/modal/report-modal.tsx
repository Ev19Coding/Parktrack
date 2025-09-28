// src/components/modal/report-modal.tsx
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericModal, showModal, closeModal } from "./generic-modal";
import { generateRandomUUID } from "~/utils/random";
import { GenericButton } from "~/components/button";

const [state, setState] = createStore({
	modalId: generateRandomUUID(),
	locationId: "" as string,
	title: "" as string,
	onSuccess: (() => {}) as () => void | Promise<void>,
});

export function ReportModal() {
	const [reason, setReason] = createSignal("");
	const [details, setDetails] = createSignal("");
	const [email, setEmail] = createSignal("");
	const [file, setFile] = createSignal<File | null>(null);
	const [submitting, setSubmitting] = createSignal(false);

	async function submitReport() {
		// basic validation
		if (!state.locationId) {
			alert("Missing location id.");
			return;
		}
		if (!reason()) {
			alert("Please select a reason.");
			return;
		}

		setSubmitting(true);
		try {
			const form = new FormData();
			form.append("locationId", state.locationId);
			form.append("reason", reason());
			form.append("details", details());
			if (email()) form.append("email", email());
			if (file()) form.append("photo", file() as Blob);

			const res = await fetch("/api/reports", {
				method: "POST",
				body: form,
			});

			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || "Failed to submit report");
			}

			// optional: call back
			await state.onSuccess?.();

			// simple success UX - you can replace with toast
			alert("Report submitted — thank you.");
			closeModal(state.modalId);
		} catch (err: any) {
			console.error("Report error", err);
			alert("Could not submit report: " + (err.message || "unknown error"));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<GenericModal modalId={state.modalId} z-index={999_999}>
			<h3 class="text-lg font-semibold mb-2">
				Report an issue for <span class="font-bold">{state.title}</span>
			</h3>

			<div class="space-y-3">
				<label class="block">
					<span class="label-text">Reason</span>
					<select
						class="select select-bordered w-full"
						value={reason()}
						onChange={(e) => setReason(e.currentTarget.value)}
					>
						<option value="">-- choose a reason --</option>
						<option value="incorrect_info">Incorrect information</option>
						<option value="closed_permanently">
							Closed / Permanently closed
						</option>
						<option value="unsafe">Unsafe / Unsafe content</option>
						<option value="spam">Spam / Duplicate</option>
						<option value="other">Other</option>
					</select>
				</label>

				<label class="block">
					<span class="label-text">Details (optional)</span>
					<textarea
						class="textarea textarea-bordered w-full"
						rows={3}
						value={details()}
						onInput={(e) => setDetails(e.currentTarget.value)}
						placeholder="Add any extra information to help us investigate"
					/>
				</label>

				<label class="block">
					<span class="label-text">Attach photo (optional)</span>

					<input
						type="file"
						accept="image/*"
						onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
					/>
				</label>
			</div>

			<div class="modal-action mt-4">
				<GenericButton
					onClick={() => closeModal(state.modalId)}
					class="btn-ghost"
				>
					Cancel
				</GenericButton>

				<GenericButton
					class="btn-primary"
					onClick={submitReport}
					disabled={submitting()}
				>
					{submitting() ? "Sending..." : "Send Report"}
				</GenericButton>
			</div>
		</GenericModal>
	);
}

/** Call this to open the report modal */
export function triggerReportModal(
	locationId: string,
	title?: string,
	onSuccess?: () => void | Promise<void>,
) {
	setState({
		locationId,
		title: title ?? "location",
		onSuccess: onSuccess ?? (() => {}),
	});

	showModal(state.modalId);
}
