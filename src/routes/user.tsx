import { clientOnly } from "@solidjs/start";
import SettingsIcon from "lucide-solid/icons/menu";
import { createMemo, createSignal } from "solid-js";
import { TooltipButton } from "~/components/button";
import type { RecreationalLocationSchema } from "~/server/database/schema";

// TODO: Move this out of here
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

const UserSearchBar = clientOnly(() => import("~/components/user/search-bar"));
const UserMapView = clientOnly(() => import("~/components/user/map-view"));
const UserParkSection = clientOnly(() =>
	import("~/components/user/park-restaurant").then((module) => ({
		default: module.UserParkSection,
	})),
);
const UserRestaurantSection = clientOnly(() =>
	import("~/components/user/park-restaurant").then((module) => ({
		default: module.UserRestaurantSection,
	})),
);

export default function Home() {
	const [selectedArea, setSelectedArea] =
		createSignal<RecreationalLocationSchema | null>(null);

	const coords = createMemo(() => {
		const area = selectedArea();
		return area ? ([area.latitude, area.longitude] as [number, number]) : null;
	});

	const label = createMemo(() => selectedArea()?.title ?? "");

	return (
		<div class="grid size-full grid-rows-[1fr_1fr_minmax(13.5rem,3.25fr)_minmax(12rem,3fr)_minmax(12rem,3fr)] gap-4 overflow-auto p-4 lg:grid-cols-2 lg:grid-rows-[1fr_1fr_minmax(12.5rem,3.25fr)_minmax(11rem,3fr)_minmax(11rem,3fr)]">
			<Header />

			<UserSearchBar setLocationResult={setSelectedArea} />

			<UserMapView coords={coords()} label={label()} />

			<UserParkSection />

			<UserRestaurantSection />
		</div>
	);
}
