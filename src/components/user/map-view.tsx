import { SolidLeafletMap } from "solidjs-leaflet";
import { generateRandomUUID } from "~/utils/random";

export default function UserMapView() {
	const mapId = generateRandomUUID()

	return (
		<section class="h-full rounded-box bg-base-200 sm:w-170 sm:place-self-center lg:col-[1/3] overflow-auto">
			<SolidLeafletMap
				center={[63.0, 13.0]}
				id={mapId}
				zoom={17} height="100%"
				width="100%"
				onMapReady={(leaflet, map) => {
					const icon = leaflet.icon({
						iconUrl: "/marker-icon.png",
						shadowUrl: "/marker-shadow.png",
					});
					const marker = leaflet
						.marker([63.0, 13.0], {
							icon,
						})
						.addTo(map);
					marker.bindPopup("Hello World!");
				}}
			/>
		</section>
	);
}
