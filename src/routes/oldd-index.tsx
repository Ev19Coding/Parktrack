import { clientOnly } from "@solidjs/start";
import SearchableParks from "../components/search";

const ParkMapClient = clientOnly(() => import("../components/ParkMap"));

export default function Home() {
	return (
		<div class="size-full flex flex-col justify-around items-center">
			<SearchableParks />

			<ParkMapClient />
		</div>
	);
}
