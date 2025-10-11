import { A, createAsync } from "@solidjs/router";
import CalendarIcon from "lucide-solid/icons/calendar";
import ClockIcon from "lucide-solid/icons/clock";
import MapPinIcon from "lucide-solid/icons/map-pin";
import StarIcon from "lucide-solid/icons/star";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import LoadingSpinner from "~/components/loading-spinner";
import { toast } from "~/components/toast";
import { getUpcomingEventsForUser } from "~/server/database/user/action";
import { formatDateRelative, formatTime } from "~/utils/formatting";
import { assertUserIsLoggedIn } from "~/utils/user-query";

export default function CalendarPage() {
	assertUserIsLoggedIn();

	const [timeframe, setTimeframe] = createSignal<30 | 90>(90);

	const upcomingEventsAsync = createAsync(
		() => getUpcomingEventsForUser(timeframe()),
		{ initialValue: [] },
	);

	const eventsGroupedByDate = createMemo(() => {
		const events = upcomingEventsAsync.latest;
		const grouped = new Map<string, typeof events>();

		for (const event of events) {
			const dateKey = event.dueFor.toDateString();
			if (!grouped.has(dateKey)) {
				grouped.set(dateKey, []);
			}
			const dateEvents = grouped.get(dateKey);
			if (dateEvents) {
				dateEvents.push(event);
			}
		}

		for (const dateEvents of grouped.values()) {
			dateEvents.sort((a, b) => a.dueFor.getTime() - b.dueFor.getTime());
		}

		return Array.from(grouped.entries()).sort((a, b) => {
			return new Date(a[0]).getTime() - new Date(b[0]).getTime();
		});
	});

	const totalEventsCount = createMemo(() => upcomingEventsAsync.latest.length);

	async function refreshEvents() {
		try {
			window.location.reload();
		} catch (err) {
			console.error("Failed to refresh events:", err);
			toast.error(
				"Refresh Failed",
				"Could not refresh events. Please try again.",
			);
		}
	}

	function formatEventDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		}
		if (date.toDateString() === tomorrow.toDateString()) {
			return "Tomorrow";
		}

		return date.toLocaleDateString("en-US", {
			weekday: "long",
			month: "short",
			day: "numeric",
		});
	}

	return (
		<div class="container mx-auto max-w-4xl p-4">
			<div class="mb-8">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<div class="flex items-center gap-3">
						<CalendarIcon class="size-10" />
						<div>
							<h1 class="font-bold text-3xl text-base-content">
								Event Calendar
							</h1>
							<p class="text-base-content/70">
								Upcoming events from your favorite locations
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<button
							type="button"
							class="btn btn-outline btn-sm"
							onClick={refreshEvents}
						>
							Refresh
						</button>

						<div class="join">
							<button
								type="button"
								class={`btn btn-sm join-item ${
									timeframe() === 30 ? "btn-active" : "btn-outline"
								}`}
								onClick={() => setTimeframe(30)}
							>
								30 Days
							</button>
							<button
								type="button"
								class={`btn btn-sm join-item ${
									timeframe() === 90 ? "btn-active" : "btn-outline"
								}`}
								onClick={() => setTimeframe(90)}
							>
								90 Days
							</button>
						</div>
					</div>
				</div>

				<div class="stats mt-6 shadow">
					<div class="stat">
						<div class="stat-figure text-primary">
							<CalendarIcon class="size-8" />
						</div>
						<div class="stat-title">Upcoming Events</div>
						<Suspense fallback={<div class="stat-value">...</div>}>
							<div class="stat-value text-primary">{totalEventsCount()}</div>
						</Suspense>
						<div class="stat-desc">Next {timeframe()} days</div>
					</div>
				</div>
			</div>

			<Suspense fallback={<LoadingSpinner />}>
				<Show
					when={eventsGroupedByDate().length > 0}
					fallback={
						<div class="py-12 text-center">
							<div class="mb-4">
								<CalendarIcon class="mx-auto size-16 text-base-content/30" />
							</div>
							<h3 class="mb-2 font-semibold text-xl">No Upcoming Events</h3>
							<p class="mx-auto mb-6 max-w-md text-base-content/70">
								You don't have any upcoming events from your favorite locations.
								Add some locations to your favorites to see their events here!
							</p>
							<A href="/favourite" class="btn btn-primary">
								<StarIcon class="size-4" />
								Manage Favorites
							</A>
						</div>
					}
				>
					<div class="space-y-8">
						<For each={eventsGroupedByDate()}>
							{(dateGroup) => (
								<div>
									<div class="mb-4 flex items-center gap-3">
										<h2 class="font-semibold text-base-content text-xl">
											{formatEventDate(dateGroup[0])}
										</h2>
										<div class="badge badge-neutral">
											{dateGroup[1].length} events
										</div>
									</div>

									<div class="grid gap-4">
										<For each={dateGroup[1]}>
											{(event) => (
												<div class="card bg-base-100 shadow-sm">
													<div class="card-body p-4">
														<div class="flex items-start justify-between gap-4">
															<div class="flex-1">
																<h3 class="card-title mb-2 text-lg">
																	{event.name}
																</h3>

																<div class="mb-3 flex items-center gap-4 text-base-content/70 text-sm">
																	<div class="flex items-center gap-1">
																		<ClockIcon class="size-4" />
																		<span>{formatTime(event.dueFor)}</span>
																		<span class="text-xs">
																			({formatDateRelative(event.dueFor)})
																		</span>
																	</div>

																	<div class="flex items-center gap-1">
																		<MapPinIcon class="size-4" />
																		<A
																			href={`/search?q=${encodeURIComponent(
																				event.locationTitle,
																			)}`}
																			class="link link-primary"
																		>
																			{event.locationTitle}
																		</A>
																	</div>
																</div>

																<Show when={event.description.trim()}>
																	<p class="text-base-content/80 text-sm">
																		{event.description}
																	</p>
																</Show>
															</div>

															<div class="badge badge-outline badge-primary">
																{new Date(event.dueFor).toLocaleDateString(
																	"en-US",
																	{
																		month: "short",
																		day: "numeric",
																	},
																)}
															</div>
														</div>
													</div>
												</div>
											)}
										</For>
									</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</Suspense>
		</div>
	);
}
