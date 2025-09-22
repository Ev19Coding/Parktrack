import type { Map as LMap, Marker } from "leaflet";
import { createEffect, createSignal, on, onMount, Show } from "solid-js";
import { SolidLeafletMap } from "solidjs-leaflet";
import mapMarkerStr from "~/assets/map-maker.svg";
import { generateRandomUUID } from "~/utils/random";

export default function UserMapView(prop: {
	label: string;
	coords: readonly [latitude: number, longitude: number] | null;
}) {
	const mapId = generateRandomUUID();
	const zoomSize = 18;

	let mapRef: LMap | undefined;
	// let leafletRef: typeof import("leaflet") | undefined;
	let markerRef: Marker | undefined;

	// SSR workaround
	const [loadMap, setLoadMap] = createSignal(false);

	onMount(() => setLoadMap(true));

	createEffect(
		on(
			() => prop.coords,
			() => {
				if (prop.coords) {
					const [lat, lng] = prop.coords;
					mapRef?.setView([lat, lng], zoomSize);
					markerRef?.setLatLng([lat, lng]).bindPopup(prop.label);
				}
			},
		),
	);

	return (
		<section class="relative h-full overflow-auto rounded-box bg-base-200 sm:w-170 sm:place-self-center lg:col-[1/3]">
			<Show when={loadMap()} fallback={<div class="skeleton size-full"></div>}>
				<SolidLeafletMap
					center={[prop.coords?.[0] ?? 63.0, prop.coords?.[1] ?? 13.0]}
					id={mapId}
					zoom={zoomSize}
					height="100%"
					width="100%"
					onMapReady={(leaflet, map) => {
						const icon = leaflet.icon({
							iconUrl: mapMarkerStr,
							// shadowUrl: "/marker-shadow.png",
						});
						const marker = leaflet
							.marker([prop.coords?.[0] ?? 63.0, prop.coords?.[1] ?? 13.0], {
								icon,
							})
							.addTo(map);

						mapRef = map;
						// leafletRef = leaflet;
						markerRef = marker;
					}}
				/>
			</Show>
		</section>
	);
}
