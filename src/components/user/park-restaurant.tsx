import {
	createAsync,
	createAsyncStore,
	query,
	useNavigate,
} from "@solidjs/router";
import { createSignal, Index, type JSXElement, Show, Suspense } from "solid-js";
import {
	getRecreationalLocationFromDatabaseById as _getRecreationalLocationFromDatabaseById,
	getParkRecreationalLocationsFromDatabaseAtRandom,
	getRestaurantRecreationalLocationsFromDatabaseAtRandom,
} from "~/server/database/user/query";
import type { PromiseValue } from "~/types/generics";
import { getProxiedImageUrl } from "~/utils/image";
import LoadingSpinner from "../loading-spinner";

function DataSection(prop: {
	data: PromiseValue<
		ReturnType<typeof getParkRecreationalLocationsFromDatabaseAtRandom>
	>;

	header: JSXElement;
	class: string;
}) {
	const navigate = useNavigate();

	const getRecreationalLocationFromDatabaseById = query(
		_getRecreationalLocationFromDatabaseById,
		"db-location-data-query",
	);

	const [
		isLoadingRecreationalLocationInfo,
		setIsLoadingRecreationalLocationInfo,
	] = createSignal(false);

	const buttonStyle =
		"relative size-36 cursor-pointer select-none place-self-center overflow-clip rounded-box bg-base-200 md:size-40 lg:size-44";

	function SkeletonLoaderFallback() {
		return <div class={`${buttonStyle} skeleton`}></div>;
	}

	return (
		<>
			<section class={`flex flex-col gap-2 overflow-hidden ${prop.class}`}>
				<h2 class="shrink font-bold text-xl">{prop.header}</h2>

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
									<button
										type="button"
										class={buttonStyle}
										onClick={async () => {
											setIsLoadingRecreationalLocationInfo(true);

											const data =
												await getRecreationalLocationFromDatabaseById(
													baseLocationData().id,
												);

											setIsLoadingRecreationalLocationInfo(false);

											if (data) {
												// Navigate to the info route and set the data to
												navigate("/info", { state: data });
											}
										}}
									>
										<img
											src={getProxiedImageUrl(baseLocationData().thumbnail)}
											alt={baseLocationData().title}
											class="size-full object-cover brightness-90 transition-all hover:scale-105 hover:brightness-105"
										/>

										<div class="absolute top-2 left-2 w-9/10 truncate break-all font-semibold text-shadow-neutral text-shadow-xs">
											{baseLocationData().title}
										</div>
									</button>
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

export function UserParkSection() {
	const randomParks = createAsyncStore(
		() => getParkRecreationalLocationsFromDatabaseAtRandom(),
		{ initialValue: [], reconcile: { merge: true } },
	);

	return (
		<DataSection
			class="lg:col-[1/2] lg:row-span-2"
			data={randomParks()}
			header="Parks for You"
		/>
	);
}

export function UserRestaurantSection() {
	const randomRestaurants = createAsyncStore(
		() => getRestaurantRecreationalLocationsFromDatabaseAtRandom(),
		{ initialValue: [], reconcile: { merge: true } },
	);

	return (
		<DataSection
			class="lg:col-[2/3] lg:row-span-2"
			data={randomRestaurants() ?? []}
			header="Restaurants for You"
		/>
	);
}
