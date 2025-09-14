import { createAsync, query, useNavigate } from "@solidjs/router";
import { Index, type JSXElement, Suspense } from "solid-js";
import {
	getRecreationalLocationFromDatabaseById as _getRecreationalLocationFromDatabaseById,
	getParkRecreationalLocationsFromDatabaseAtRandom,
	getRestaurantRecreationalLocationsFromDatabaseAtRandom,
} from "~/server/database/user/query";
import { PromiseValue } from "~/types/generics";
import { getProxiedImageUrl } from "~/utils/image";

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

	return (
		<section class={`flex flex-col gap-2 overflow-hidden ${prop.class}`}>
			<h2 class="shrink font-bold text-xl">{prop.header}</h2>

			<div class="overflow-auto">
				<div class="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-3">
					<Index each={prop.data}>
						{(baseLocationData) => (
							<button
								type="button"
								class="relative size-36 cursor-pointer select-none place-self-center overflow-clip rounded-box bg-base-200 md:size-40 lg:size-44"
								onClick={async () => {
									const data = await getRecreationalLocationFromDatabaseById(
										// Use a string so the query can be serialized and cached
										`${baseLocationData().id}`,
									);

									if (data) {
										// Navigate to the info route and set the data to
										navigate("/info", { state: data });
									}
								}}
							>
								<img
									src={getProxiedImageUrl(baseLocationData().thumbnail)}
									alt={baseLocationData().title}
									class="size-full object-cover brightness-90 hover:scale-105 hover:brightness-105"
								/>

								<div class="absolute top-2 left-2 w-9/10 truncate break-all font-semibold text-shadow-neutral text-shadow-xs">
									{baseLocationData().title}
								</div>
							</button>
						)}
					</Index>
				</div>
			</div>
		</section>
	);
}

export function UserParkSection() {
	const randomParks = createAsync(() =>
		getParkRecreationalLocationsFromDatabaseAtRandom(),
	);

	return (
		<Suspense>
			<DataSection
				class="lg:col-[1/2] lg:row-span-2"
				data={randomParks() ?? []}
				header="Parks for You"
			/>
		</Suspense>
	);
}

export function UserRestaurantSection() {
	const randomRestaurants = createAsync(() =>
		getRestaurantRecreationalLocationsFromDatabaseAtRandom(),
	);

	return (
		<Suspense>
			<DataSection
				class="lg:col-[2/3] lg:row-span-2"
				data={randomRestaurants() ?? []}
				header="Restaurants for You"
			/>
		</Suspense>
	);
}
