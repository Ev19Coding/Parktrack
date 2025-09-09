import SettingsIcon from "lucide-solid/icons/menu";
import SearchIcon from "lucide-solid/icons/search";
import { Index, type JSXElement } from "solid-js";
import { TooltipButton } from "~/components/button";

function Header() {
	return (
		<header class="flex justify-around items-center gap-4 text-2xl lg:col-[1/3]">
			<h1 class="font-bold text-center">
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
	return (
		<label class="input place-self-center sm:min-w-120 bg-base-200 lg:col-[1/3]">
			<SearchIcon class="text-base-content/50" />
			<input type="search" required placeholder="Search" />
		</label>
	);
}

function MapView() {
	// TODO: Load the map here
	return (
		<section class="rounded-box bg-base-200 sm:place-self-center sm:w-170 h-full lg:col-[1/3]"></section>
	);
}

function DataSection(prop: {
	data: unknown[];
	header: JSXElement;
	class: string;
}) {
	return (
		<section class={`overflow-auto space-y-2 ${prop.class}`}>
			<h2 class="font-bold text-xl">{prop.header}</h2>

			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 auto-rows-fr gap-4">
				<Index each={prop.data}>
					{(_) => (
						<div class="size-36 rounded-box bg-base-200 place-self-center md:size-40 lg:size-44"></div>
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
		<div class="size-full grid grid-rows-[1fr_1fr_minmax(13.5rem,3.25fr)_minmax(12rem,3fr)_minmax(12rem,3fr)] gap-4 p-4 overflow-auto lg:grid-rows-[1fr_1fr_minmax(12.5rem,3.25fr)_minmax(11rem,3fr)_minmax(11rem,3fr)] lg:grid-cols-2">
			<Header />

			<SearchBar />

			<MapView />

			<ParkSection />

			<RestaurantSection />
		</div>
	);
}
