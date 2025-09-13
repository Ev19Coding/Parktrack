import { Map, Marker } from "leaflet";
import MapPinIcon from "lucide-solid/icons/map-pin";
import { on } from "solid-js";
import { createEffect } from "solid-js";
import { SolidLeafletMap } from "solidjs-leaflet";
import { generateRandomUUID } from "~/utils/random";

function svgToDataUrl(svgElement: Element): string {
	const svgString = svgElement.outerHTML;
	return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

export default function UserMapView(prop: {
	label: string;
	coords: [latitude: number, longitude: number] | null;
}) {
	const mapId = generateRandomUUID();
	const zoomSize = 18;

	const mapPinSvgString = svgToDataUrl(
		MapPinIcon({ height: "32px", width: "32px" }) as SVGElement,
	);

	let mapRef: Map | undefined;
	let leafletRef: typeof import("leaflet") | undefined;
	let markerRef: Marker | undefined;

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
		<section class="h-full rounded-box bg-base-200 sm:w-170 sm:place-self-center lg:col-[1/3] overflow-auto">
			<SolidLeafletMap
				center={[63.0, 13.0]}
				id={mapId}
				zoom={zoomSize}
				height="100%"
				width="100%"
				onMapReady={(leaflet, map) => {
					const icon = leaflet.icon({
						iconUrl: mapPinSvgString,
						// shadowUrl: "/marker-shadow.png",
					});
					const marker = leaflet
						.marker([63.0, 13.0], {
							icon,
						})
						.addTo(map);

					mapRef = map;
					leafletRef = leaflet;
					markerRef = marker;
				}}
			/>
		</section>
	);
}
