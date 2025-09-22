import { createMemo, createSignal } from "solid-js";
import { useGeolocation } from "solidjs-use";
import UserMapView from "~/components/map-view";
import {
	UserParkSection,
	UserRestaurantSection,
} from "~/components/user/park-restaurant";
import UserSearchBar from "~/components/user/search-bar";
import type { RecreationalLocationSchema } from "~/server/database/schema";

// TODO: Move this out of here
function Header() {
	return (
		<header class="flex items-center justify-around text-2xl lg:col-[1/3]">
			<h1 class="text-center font-bold">
				Parks {"&"} Restaurants in AMAC, Abuja
			</h1>
		</header>
	);
}

export default function Home() {
  const {coords} = useGeolocation()

  const latAndLong = createMemo(()=>{
    const {latitude,longitude} = coords()

    return [latitude, longitude] as const
  })

	return (
		<div class="relative grid size-full grid-rows-[1fr_1fr_minmax(13.5rem,3.25fr)_minmax(12rem,3fr)_minmax(12rem,3fr)] gap-4 overflow-auto p-4 lg:grid-cols-2 lg:grid-rows-[1fr_1fr_minmax(12.5rem,3.25fr)_minmax(11rem,3fr)_minmax(11rem,3fr)]">
			<Header />

			<UserSearchBar/>

      <UserMapView coords={latAndLong()} label="You" zoom={16} showNearby={true} />

			<UserParkSection />

			<UserRestaurantSection />
		</div>
	);
}
