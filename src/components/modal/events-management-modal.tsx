import CalendarIcon from "lucide-solid/icons/calendar";
import EditIcon from "lucide-solid/icons/edit";
import PlusIcon from "lucide-solid/icons/plus";
import TrashIcon from "lucide-solid/icons/trash-2";
import { createMemo, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "~/components/toast";
import {
	deleteEventFromLocation,
	type Event,
} from "~/server/database/user/action";
import { formatDateFull, formatDateRelative } from "~/utils/formatting";
import { generateRandomUUID } from "~/utils/random";
import LoadingSpinner from "../loading-spinner";
import { triggerConfirmationModal } from "./confirmation-modal";
import { triggerCreateEventModal, triggerEditEventModal } from "./event-modal";
import { closeModal, GenericModal, showModal } from "./generic-modal";

const [state, setState] = createStore({
	modalId: generateRandomUUID(),
	locationId: "",
	locationTitle: "",
	events: [] as Event[],
	onRefresh: (() => {}) as () => void | Promise<void>,
	onGetFreshEvents: (() => []) as () => Event[] | Promise<Event[]>,
});

export function EventsManagementModal() {
	const [deleting, setDeleting] = createSignal<string | null>(null);

	// Function to refresh events in the modal
	async function refreshEventsInModal() {
		try {
			// First call the parent refresh to ensure data is up to date
			await state.onRefresh?.();

			// Now fetch the fresh events
			const freshEvents = await state.onGetFreshEvents();
			setState(
				"events",
				[...freshEvents].sort(
					(a, b) => new Date(a.dueFor).getTime() - new Date(b.dueFor).getTime(),
				),
			);
		} catch (error) {
			console.error("Failed to refresh events:", error);
		}
	}

	const upcomingEvents = createMemo(() =>
		state.events.filter((event) => new Date(event.dueFor) >= new Date()),
	);

	const pastEvents = createMemo(() =>
		state.events.filter((event) => new Date(event.dueFor) < new Date()),
	);

	async function handleDeleteEvent(eventId: string, eventName: string) {
		triggerConfirmationModal(
			async () => {
				setDeleting(eventId);
				try {
					await deleteEventFromLocation(state.locationId, eventId);
					await refreshEventsInModal();
					toast.success("Event Deleted", "The event has been removed.");
				} catch (err: unknown) {
					console.error("Delete event error", err);
					toast.error(
						"Failed to Delete Event",
						err instanceof Error
							? err.message
							: "An unexpected error occurred. Please try again.",
					);
				} finally {
					setDeleting(null);
				}
			},
			<div>
				Delete event <span class="font-semibold text-primary">{eventName}</span>
				?
			</div>,
		);
	}

	function handleEditEvent(event: Event) {
		triggerEditEventModal(
			state.locationId,
			event.id,
			{
				name: event.name,
				description: event.description,
				dueFor: new Date(event.dueFor),
			},
			state.locationTitle,
			async () => {
				await refreshEventsInModal();
			},
		);
	}

	function handleCreateEvent() {
		triggerCreateEventModal(state.locationId, state.locationTitle, async () => {
			await refreshEventsInModal();
		});
	}

	function EventCard(props: { event: Event; isPast?: boolean }) {
		const eventDate = createMemo(() => new Date(props.event.dueFor));

		return (
			<div
				class={`card bg-base-100 shadow-sm ${props.isPast ? "opacity-75" : ""}`}
			>
				<div class="card-body p-4">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<h4 class="font-semibold text-base-content">
								{props.event.name}
							</h4>

							<div class="mt-1 flex items-center gap-2 text-base-content/70 text-sm">
								<CalendarIcon class="size-4" />
								<span>{formatDateFull(eventDate())}</span>
								<span class="text-xs">({formatDateRelative(eventDate())})</span>
							</div>

							<Show when={props.event.description.trim()}>
								<p class="mt-2 text-base-content/80 text-sm">
									{props.event.description}
								</p>
							</Show>
						</div>

						<div class="flex flex-col gap-1">
							<Show when={!props.isPast}>
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onClick={() => handleEditEvent(props.event)}
									disabled={deleting() === props.event.id}
								>
									<EditIcon class="size-3" />
								</button>
							</Show>

							<button
								type="button"
								class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
								onClick={() =>
									handleDeleteEvent(props.event.id, props.event.name)
								}
								disabled={deleting() === props.event.id}
							>
								{deleting() === props.event.id ? (
									<span class="loading loading-spinner loading-xs"></span>
								) : (
									<TrashIcon class="size-3" />
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<GenericModal modalId={state.modalId} z-index={999_999} class="max-w-4xl">
			<div class="space-y-6">
				{/* Header */}
				<div>
					<div class="flex items-center justify-between gap-4">
						<div>
							<h3 class="mb-2 font-bold text-primary text-xl">
								Event Management
							</h3>
							<p class="text-base-content/70 text-sm">
								Manage events for{" "}
								<span class="font-semibold text-accent">
									{state.locationTitle}
								</span>
							</p>
						</div>

						<button
							type="button"
							class="btn btn-primary"
							onClick={handleCreateEvent}
						>
							<PlusIcon class="size-4" />
							New Event
						</button>
					</div>
					<div class="divider my-3"></div>
				</div>

				{/* Content */}
				<Show
					when={state.events.length > 0}
					fallback={
						<div class="py-12 text-center">
							<div class="mb-4">
								<CalendarIcon class="mx-auto size-16 text-base-content/30" />
							</div>
							<h4 class="mb-2 font-semibold text-lg">No Events Yet</h4>
							<p class="mx-auto mb-6 max-w-md text-base-content/70">
								You haven't created any events for this location. Click "New
								Event" to get started!
							</p>
							<button
								type="button"
								class="btn btn-primary"
								onClick={handleCreateEvent}
							>
								<PlusIcon class="size-4" />
								Create Your First Event
							</button>
						</div>
					}
				>
					<div class="space-y-6">
						{/* Upcoming Events */}
						<Show when={upcomingEvents().length > 0}>
							<div>
								<div class="mb-4 flex items-center gap-3">
									<h4 class="font-semibold text-lg">Upcoming Events</h4>
									<div class="badge badge-primary">
										{upcomingEvents().length}
									</div>
								</div>
								<div class="space-y-3">
									<For each={upcomingEvents()}>
										{(event) => <EventCard event={event} />}
									</For>
								</div>
							</div>
						</Show>

						{/* Past Events */}
						<Show when={pastEvents().length > 0}>
							<div>
								<div class="mb-4 flex items-center gap-3">
									<h4 class="font-semibold text-lg">Past Events</h4>
									<div class="badge badge-neutral">{pastEvents().length}</div>
								</div>
								<div class="space-y-3">
									<For each={pastEvents()}>
										{(event) => <EventCard event={event} isPast={true} />}
									</For>
								</div>
							</div>
						</Show>
					</div>
				</Show>

				{/* Footer */}
				<div class="modal-action justify-center">
					<button
						type="button"
						class="btn btn-neutral"
						onClick={() => closeModal(state.modalId)}
					>
						Close
					</button>
				</div>
			</div>

			{/* Custom Loading overlay when deleting */}
			<Show when={deleting()}>
				<LoadingSpinner fullScreen={true} />
			</Show>
		</GenericModal>
	);
}

/** Call this to open the events management modal */
export function triggerEventsManagementModal(
	locationId: string,
	locationTitle: string,
	events: Event[],
	onRefresh?: () => void | Promise<void>,
	onGetFreshEvents?: () => Event[] | Promise<Event[]>,
) {
	setState({
		locationId,
		locationTitle,
		events: events.toSorted(
			(a, b) => new Date(a.dueFor).getTime() - new Date(b.dueFor).getTime(),
		),
		onRefresh: onRefresh ?? (() => {}),
		onGetFreshEvents: onGetFreshEvents ?? (() => events),
	});

	showModal(state.modalId);
}
