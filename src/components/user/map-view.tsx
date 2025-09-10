import { SolidLeafletMap } from "solidjs-leaflet";

export default function UserMapView() {
	// TODO: Load the map here
	return (
		<section class="h-full rounded-box bg-base-200 sm:w-170 sm:place-self-center lg:col-[1/3]">
			<SolidLeafletMap
				center={[63.0, 13.0]}
				id="map"
				zoom={17}
				onMapReady={(l, m) => {
					const icon = l.icon({
						iconUrl: "/marker-icon.png",
						shadowUrl: "/marker-shadow.png",
					});
					const marker = l
						.marker([63.0, 13.0], {
							icon,
						})
						.addTo(m);
					marker.bindPopup("Hello World!");
				}}
			/>
		</section>
	);
}
