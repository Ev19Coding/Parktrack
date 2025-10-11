import { createMemo } from "solid-js";
import { useGeolocation } from "solidjs-use";
import UserMapView from "~/components/map-view";
import { UserRecreationalLocationDisplay } from "~/components/user/random-recreational-location";
import UserSearchBar from "~/components/user/search-bar";

// TODO: Move this out of here
function Header() {
	return (
		<header class="flex items-center justify-around text-2xl lg:col-[1/3]">
			<h1 class="text-center font-bold">Recreational Locations In Abuja</h1>
		</header>
	);
}

export default function Home() {
	const { coords } = useGeolocation({ enableHighAccuracy: true });

	const latAndLong = createMemo(() => {
		const { latitude, longitude } = coords();

		return [latitude, longitude] as const;
	});

	return (
		<div class="relative grid size-full grid-rows-[1fr_1fr_minmax(13.5rem,3.25fr)_minmax(12rem,3fr)_minmax(12rem,3fr)] gap-4 overflow-auto p-4 lg:grid-cols-2 lg:grid-rows-[1fr_1fr_minmax(12.5rem,3.25fr)_minmax(11rem,3fr)_minmax(11rem,3fr)]">
			<Header />

			<UserSearchBar />

			<UserMapView
				coords={latAndLong()}
				label="You"
				zoom={16}
				showNearby={true}
				markerType="user"
			/>

			<UserRecreationalLocationDisplay class="lg:col-[1/2] lg:row-span-2" />

			<UserRecreationalLocationDisplay class="lg:col-[2/3] lg:row-span-2" />
		</div>
	);
}
