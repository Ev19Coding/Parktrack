import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { toast } from "~/components/toast";
import {
	addEventToLocation,
	type CreateEvent,
	updateEventInLocation,
} from "~/server/database/user/action";
import { generateRandomUUID } from "~/utils/random";
import { closeModal, GenericModal, showModal } from "./generic-modal";

const [state, setState] = createStore({
	modalId: generateRandomUUID(),
	locationId: "",
	locationTitle: "",
	eventId: "" as string | null, // null for create, string for edit
	initialData: null as CreateEvent | null,
	onSuccess: (() => {}) as () => void | Promise<void>,
});

export function EventModal() {
	const [name, setName] = createSignal("");
	const [description, setDescription] = createSignal("");
	const [dueFor, setDueFor] = createSignal("");
	const [submitting, setSubmitting] = createSignal(false);

	// Reactively initialize form with existing data when editing
	createEffect(() => {
		const initialData = state.initialData;
		if (initialData) {
			setName(initialData.name);
			setDescription(initialData.description);
			setDueFor(initialData.dueFor.toISOString().slice(0, 16)); // Format for datetime-local input
		} else {
			setName("");
			setDescription("");
			setDueFor("");
		}
	});

	// Reset form when modal is closed/opened
	createEffect(() => {
		const locationId = state.locationId;
		// This effect will run when state changes, ensuring form is properly reset
		if (!locationId) {
			setName("");
			setDescription("");
			setDueFor("");
		}
	});

	const isEditing = () => state.eventId !== null;

	// Computed values for reactive validation
	const canSubmit = () => {
		const nameValue = name();
		const dueForValue = dueFor();
		return (
			nameValue.trim().length > 0 && dueForValue.length > 0 && !submitting()
		);
	};

	async function submitEvent() {
		// Basic validation
		if (!state.locationId) {
			toast.error("Error", "Missing location ID. Please try again.");
			return;
		}
		if (!name().trim()) {
			toast.warning("Validation Error", "Please enter an event name.");
			return;
		}
		if (!dueFor()) {
			toast.warning(
				"Validation Error",
				"Please select an event date and time.",
			);
			return;
		}

		const eventDate = new Date(dueFor());
		const now = new Date();

		if (eventDate <= now) {
			toast.warning("Validation Error", "Event date must be in the future.");
			return;
		}

		setSubmitting(true);
		try {
			const eventData: CreateEvent = {
				name: name().trim(),
				description: description().trim(),
				dueFor: eventDate,
			};

			if (isEditing() && state.eventId) {
				await updateEventInLocation(state.locationId, state.eventId, eventData);
				toast.success(
					"Event Updated",
					"Your event has been updated successfully.",
				);
			} else {
				await addEventToLocation(state.locationId, eventData);
				toast.success(
					"Event Created",
					"Your event has been created successfully.",
				);
			}

			// Call success callback
			await state.onSuccess?.();

			// Reset form
			setName("");
			setDescription("");
			setDueFor("");

			// Close modal
			closeModal(state.modalId);
		} catch (err: unknown) {
			console.error("Event error", err);
			toast.error(
				isEditing() ? "Failed to Update Event" : "Failed to Create Event",
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
					<h3 class="mb-2 font-bold text-primary text-xl">
						{isEditing() ? "Edit Event" : "Create New Event"}
					</h3>
					<div class="divider my-1"></div>
					<p class="text-base-content/70 text-sm">
						{isEditing() ? "Update your event details" : "Add a new event to"}{" "}
						<span class="font-semibold text-accent">{state.locationTitle}</span>
					</p>
				</div>

				{/* Form */}
				<fieldset class="fieldset space-y-4">
					<legend class="fieldset-legend">Event Details</legend>

					<div class="space-y-2">
						<label
							for="event-name-input"
							class="font-semibold text-base-content text-sm"
						>
							Event Name <span class="text-error">*</span>
						</label>
						<input
							id="event-name-input"
							type="text"
							class="input input-bordered input-primary focus:input-accent w-full"
							placeholder="Enter event name (e.g., 'Summer Festival', 'Weekly Yoga Class')"
							value={name()}
							onInput={(e) => setName(e.currentTarget.value)}
							maxlength="100"
						/>
						<div class="text-right text-base-content/60 text-xs">
							{name().length}/100 characters
						</div>
					</div>

					<div class="space-y-2">
						<label
							for="event-date-input"
							class="font-semibold text-base-content text-sm"
						>
							Event Date & Time <span class="text-error">*</span>
						</label>
						<input
							id="event-date-input"
							type="datetime-local"
							class="input input-bordered input-primary focus:input-accent w-full"
							value={dueFor()}
							onInput={(e) => setDueFor(e.currentTarget.value)}
							min={new Date().toISOString().slice(0, 16)}
						/>
					</div>

					<div class="space-y-2">
						<label
							for="event-description-textarea"
							class="font-semibold text-base-content text-sm"
						>
							Description <span class="text-base-content/60">(Optional)</span>
						</label>
						<textarea
							id="event-description-textarea"
							class="textarea textarea-bordered textarea-primary focus:textarea-accent min-h-24 w-full"
							placeholder="Describe your event - what activities, what to bring, any special requirements, etc."
							value={description()}
							onInput={(e) => setDescription(e.currentTarget.value)}
							maxlength="500"
						/>
						<div class="text-right text-base-content/60 text-xs">
							{description().length}/500 characters
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
						onClick={submitEvent}
						disabled={!canSubmit()}
					>
						{submitting() ? (
							<>
								{/* Custom loading spinner cus I'm lazy :p */}
								<span class="loading loading-spinner loading-sm"></span>
								{isEditing() ? "Updating..." : "Creating..."}
							</>
						) : isEditing() ? (
							"Update Event"
						) : (
							"Create Event"
						)}
					</button>
				</div>
			</div>
		</GenericModal>
	);
}

/** Call this to open the event modal for creating a new event */
export function triggerCreateEventModal(
	locationId: string,
	locationTitle?: string,
	onSuccess?: () => void | Promise<void>,
) {
	setState({
		locationId,
		locationTitle: locationTitle ?? "this location",
		eventId: null,
		initialData: null,
		onSuccess: onSuccess ?? (() => {}),
	});

	showModal(state.modalId);
}

/** Call this to open the event modal for editing an existing event */
export function triggerEditEventModal(
	locationId: string,
	eventId: string,
	eventData: CreateEvent,
	locationTitle?: string,
	onSuccess?: () => void | Promise<void>,
) {
	setState({
		locationId,
		locationTitle: locationTitle ?? "this location",
		eventId,
		initialData: eventData,
		onSuccess: onSuccess ?? (() => {}),
	});

	showModal(state.modalId);
}
