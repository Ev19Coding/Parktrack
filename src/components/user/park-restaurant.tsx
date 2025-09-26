import {
	createAsync,
	createAsyncStore,
	query,
	useNavigate,
} from "@solidjs/router";
import { createSignal, Index, type JSXElement, Show, Suspense } from "solid-js";
import type { PromiseValue } from "~/types/generics";
import { getProxiedImageUrl } from "~/utils/image";
import { getRandomElementInArray } from "~/utils/random";
import {
	queryRecreationalLocationById,
	queryRecreationalLocationCategories,
	queryRecreationalLocationsAtRandom,
} from "~/utils/user-query";
import LoadingSpinner from "../loading-spinner";
import { RecreationalLocationDisplayButtonCard } from "../location-display-button-card";

function DataSection(prop: {
	data: ReadonlyArray<{ id: string; title: string; thumbnail: string }>;
	header: JSXElement;
	class: string;
}) {
	const navigate = useNavigate();

	const getRecreationalLocationFromDatabaseById = (id: string) =>
		queryRecreationalLocationById(id)

	const [
		isLoadingRecreationalLocationInfo,
		setIsLoadingRecreationalLocationInfo,
	] = createSignal(false);

	function SkeletonLoaderFallback() {
		return <RecreationalLocationDisplayButtonCard isSkeleton={true} />;
	}

	return (
		<>
			<section class={`flex flex-col gap-2 overflow-hidden ${prop.class}`}>
				<Suspense>
					<h2 class="shrink font-bold text-xl">{prop.header}</h2>
				</Suspense>

				<div class="overflow-auto">
					<div class="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-3">
						<Suspense
							fallback={
								<Index each={Array(5)}>
									{(_) => <SkeletonLoaderFallback />}
								</Index>
							}
						>
							<Index each={prop.data}>
								{(baseLocationData) => (
									<RecreationalLocationDisplayButtonCard
										onClick={async () => {
											setIsLoadingRecreationalLocationInfo(true);

											const data =
												await getRecreationalLocationFromDatabaseById(
													baseLocationData().id,
												);

											if (data) {
												// Navigate to the info route and set the data to
												navigate("/info", { state: data });
											}

											setIsLoadingRecreationalLocationInfo(false);
										}}
										thumbnail={getProxiedImageUrl(baseLocationData().thumbnail)}
										title={baseLocationData().title}
									/>
								)}
							</Index>
						</Suspense>
					</div>
				</div>
			</section>

			<Show when={isLoadingRecreationalLocationInfo()}>
				{/* Let the spinner cover the entire screen */}
				<div class="fixed z-[999999] h-screen w-screen">
					<LoadingSpinner />
				</div>
			</Show>
		</>
	);
}

export function UserRecreationalLocationDisplay(prop: { class?: string }) {
	const randomCategory = createAsync(
		async () =>
			getRandomElementInArray(await queryRecreationalLocationCategories()),
		{ initialValue: "Locations" },
	);

	const randomParks = createAsyncStore(
		() => queryRecreationalLocationsAtRandom(randomCategory()),
		{ initialValue: [], reconcile: { merge: true } },
	);

	return (
		<DataSection
			class={prop.class ?? ""}
			data={randomParks()}
			header={`${randomCategory()}(s) for You`}
		/>
	);
}
