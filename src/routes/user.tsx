import { A, createAsync, query } from "@solidjs/router";
import SettingsIcon from "lucide-solid/icons/menu";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, Index, type JSXElement, Suspense } from "solid-js";
import { useGeolocation, useThrottle } from "solidjs-use";
import { TooltipButton } from "~/components/button";
import { getRelevantDataFromJawgsApi as _getRelevantDataFromJawgsApi } from "~/location/geocoding";
import type { PromiseValue } from "~/utils/generics";

function Header() {
	return (
		<header class="flex items-center justify-around gap-4 text-2xl lg:col-[1/3]">
			<h1 class="text-center font-bold">
				Parks {"&"} Restaurants in AMAC, Abuja
			</h1>

			<TooltipButton
				tooltipText="Settings"
				tooltipDir="left"
				class="btn-square p-2"
			>
				<SettingsIcon class="size-8 text-base-content/50" />
			</TooltipButton>
		</header>
	);
}

function SearchBar() {
	const [input, setInput] = createSignal("");
	const [areSuggestionsOpen, setAreSuggestionsOpen] = createSignal(false);

	const { coords } = useGeolocation({ enableHighAccuracy: true });

	// Cache previous results
	const getRelevantDataFromJawgsApi = query(
		_getRelevantDataFromJawgsApi,
		"jawgs-autocomplete-api",
	);

	let lastValidApiResultCache:
		| PromiseValue<ReturnType<typeof getRelevantDataFromJawgsApi>>
		| undefined;

	const results = useThrottle(
		createAsync(async () => {
			const res = await getRelevantDataFromJawgsApi({
				distance: 500,
				latitude: coords().latitude,
				longitude: coords().longitude,
				query: input(),
			});

			if (res.length) {
				lastValidApiResultCache = res;

				return res;
			} else {
				return lastValidApiResultCache ?? res;
			}
		}),
		1000,
	);

	// Filter parks
	// const results = createMemo(() => {
	// 	const q = query().trim().toLowerCase();
	// 	if (!q) return parkdata; // Show all parks when empty (like YouTube does with suggestions)
	// 	return parkdata.filter((p) => p.name.toLowerCase().includes(q));
	// });

	return (
		<details
			class="dropdown place-self-center lg:col-[1/3]"
			open={areSuggestionsOpen()}
			onFocusOut={(e) =>
				//@ts-expect-error This works
				!e.currentTarget.contains(e.relatedTarget) &&
				setAreSuggestionsOpen(false)
			}
		>
			<summary class="block">
				{/* Search bar */}
				{/** biome-ignore lint/a11y/noLabelWithoutControl: <The're an input but biome doesn't detect it because of the iife> */}
				<label class="input bg-base-200 sm:min-w-120">
					<SearchIcon class="text-base-content/50" /> {(() => {
						let inputRef$: HTMLInputElement | undefined;

						function setInputWithValue() {
							if ((inputRef$?.value ?? "").length >= 2)
								// biome-ignore lint/style/noNonNullAssertion: <biome can't tell this will be valid>
								setInput(inputRef$!.value);
						}

						return (
							<input
								type="search"
								placeholder="Search parks..."
								value={input()}
								onClick={(_) => setAreSuggestionsOpen(true)}
								// Update query but keep dropdown open
								onInput={setInputWithValue}
								onKeyPress={({ key }) => key === "Enter" && setInputWithValue()}
								class="flex-1 p-2 outline-none"
								ref={inputRef$}
							/>
						);
					})()}
					<p class="label">
						<span class="text-xs sm:text-sm">
							Powered by{" "}
							<a
								href="https://www.jawg.io/"
								class="link link-primary"
								target="_blank"
								rel="noopener"
							>
								Jawg
							</a>
						</span>
					</p>
				</label>
			</summary>

			{/* Dropdown */}
			<ul class="menu dropdown-content z-1 mt-2 max-h-96 w-full flex-nowrap overflow-y-auto rounded-box border bg-base-300 p-2 shadow-sm">
				{/* Wrap suspenses right around any stuff relying on `createAsync` */}
				<Suspense>
					<Index
						each={results()}
						fallback={<div class="px-3 py-2">No results found</div>}
					>
						{(park) => (
							<li>
								<A href="/user">{park().label}</A>
							</li>
						)}
					</Index>
				</Suspense>
			</ul>
		</details>
	);
}

function MapView() {
	// TODO: Load the map here
	return (
		<section class="h-full rounded-box bg-base-200 sm:w-170 sm:place-self-center lg:col-[1/3]"></section>
	);
}

function DataSection(prop: {
	data: unknown[];
	header: JSXElement;
	class: string;
}) {
	return (
		<section class={`space-y-2 overflow-auto ${prop.class}`}>
			<h2 class="font-bold text-xl">{prop.header}</h2>

			<div class="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-3">
				<Index each={prop.data}>
					{(_) => (
						<div class="size-36 place-self-center rounded-box bg-base-200 md:size-40 lg:size-44"></div>
					)}
				</Index>
			</div>
		</section>
	);
}

function ParkSection() {
	return (
		<DataSection
			class="lg:col-[1/2] lg:row-span-2"
			data={Array(15)}
			header="Parks"
		/>
	);
}

function RestaurantSection() {
	return (
		<DataSection
			class="lg:col-[2/3] lg:row-span-2"
			data={Array(4)}
			header="Restaurants"
		/>
	);
}

export default function Home() {
	return (
		<div class="grid size-full grid-rows-[1fr_1fr_minmax(13.5rem,3.25fr)_minmax(12rem,3fr)_minmax(12rem,3fr)] gap-4 overflow-auto p-4 lg:grid-cols-2 lg:grid-rows-[1fr_1fr_minmax(12.5rem,3.25fr)_minmax(11rem,3fr)_minmax(11rem,3fr)]">
			<Header />

			<SearchBar />

			<MapView />

			<ParkSection />

			<RestaurantSection />
		</div>
	);
}
