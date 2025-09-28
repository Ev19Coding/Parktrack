import {
	createAsync,
	createAsyncStore,
	query,
	revalidate,
} from "@solidjs/router";
import RemoveFavoriteIcon from "lucide-solid/icons/bookmark-minus";
import { createSignal, Index, Show, Suspense } from "solid-js";
import { BackNavigationButton } from "~/components/button";
import LoadingSpinner from "~/components/loading-spinner";
import { RecreationalLocationDisplayButtonCard } from "~/components/location-display-button-card";
import { triggerConfirmationModal } from "~/components/modal/confirmation-modal";
import { getCurrentUserId, removeFromFavourites } from "~/server/user";
import { getProxiedImageUrl } from "~/utils/image";
import {
	assertUserIsLoggedIn,
	queryUserFavouriteLocations,
	queryUserLoggedIn,
} from "~/utils/user-query";

export default function FavouritePage() {
	assertUserIsLoggedIn();

	const isLoggedIn = createAsync(() => queryUserLoggedIn(), {
		initialValue: false,
	});

	const favouriteLocationsQuery = query(async () => {
		const userId = await getCurrentUserId();

		if (!userId) return [];

		return queryUserFavouriteLocations(userId);
	}, "user-favourite-locations");

	const favouriteLocations = createAsyncStore(() => favouriteLocationsQuery(), {
		initialValue: [],
		reconcile: { merge: true },
	});

	// local loading state for removal/navigation
	const [isActionLoading, setIsActionLoading] = createSignal(false);

	const buttonStyle =
		"relative size-36 cursor-pointer select-none place-self-center overflow-clip rounded-box bg-base-200 md:size-40 lg:size-44";

	async function handleRemoveFavourite(event: MouseEvent, id: string) {
		// prevent the parent card's click from triggering navigation
		event.stopPropagation();

		setIsActionLoading(true);

		await removeFromFavourites(id);

		await revalidate(favouriteLocationsQuery.key);

		setIsActionLoading(false);
	}

	return (
		<div class="size-full overflow-y-auto overflow-x-clip bg-base-200/50">
			<div class="container relative mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-4">
				<BackNavigationButton />

				{/* Header */}
				<div class="hero rounded-box bg-base-100 shadow-md">
					<div class="hero-content px-4 py-6 text-center">
						<div class="max-w-full space-y-2">
							<h1 class="break-words font-bold text-xl sm:text-2xl">
								Your Favourites
							</h1>
							<p class="break-words text-base-content/70 text-xs sm:text-sm">
								A list of locations you saved. Tap a card to view details or
								remove it directly.
							</p>
						</div>
					</div>
				</div>

				{/* Content */}
				<div class="min-h-[40vh]">
					<Suspense
						fallback={
							<div class="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,_12rem)]">
								<Index each={Array(6)}>
									{() => <div class={`${buttonStyle} skeleton`}></div>}
								</Index>
							</div>
						}
					>
						<Show
							when={isLoggedIn()}
							fallback={
								<div class="card bg-base-100 p-4 shadow-md">
									<p class="text-center">
										You must be logged in to view your favourites.
									</p>
								</div>
							}
						>
							{/* If logged in, render favourites */}
							<Show
								when={favouriteLocations().length > 0}
								fallback={
									<div class="card bg-base-100 p-6 text-center shadow-md">
										<p class="font-semibold">No favourites yet</p>
										<p class="text-base-content/70 text-sm">
											Save locations from their page to see them here.
										</p>
									</div>
								}
							>
								<div class="overflow-auto">
									<div class="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,_12rem)]">
										<Index each={favouriteLocations()}>
											{(loc) => (
												<div class={buttonStyle}>
													<RecreationalLocationDisplayButtonCard
														href={`/info/${loc().id}`}
														thumbnail={getProxiedImageUrl(loc().thumbnail)}
														title={loc().title}
													/>

													{/* Remove favourite button */}
													<button
														type="button"
														class="btn btn-ghost btn-xs btn-square btn-error absolute right-2 bottom-2"
														onClick={(e) => {
															const name = loc().title;

															triggerConfirmationModal(
																() => handleRemoveFavourite(e, loc().id),
																<div>
																	Remove{" "}
																	<span class="font-semibold text-primary">
																		{name}
																	</span>{" "}
																	from favourites?
																</div>,
															);
														}}
														aria-label={`Remove ${loc().title} from favourites`}
													>
														<RemoveFavoriteIcon />
													</button>
												</div>
											)}
										</Index>
									</div>
								</div>
							</Show>
						</Show>
					</Suspense>
				</div>

				<Show when={isActionLoading()}>
					<div class="fixed top-0 left-0 z-[999999] h-screen w-screen">
						<LoadingSpinner />
					</div>
				</Show>
			</div>
		</div>
	);
}
