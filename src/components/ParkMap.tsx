import { useNavigate } from "@solidjs/router";
import L from "leaflet";
import { onMount } from "solid-js";
import "leaflet/dist/leaflet.css";
import type { JSX } from "solid-js";
import { ESCAPED_HTML_ELEMENT_FROM_OUTER_HTML } from "~/shared/constants";
import { parks } from "../data/parks";

export default function ParkMap() {
	let mapDiv: HTMLDivElement | undefined;
	const navigate = useNavigate();

	onMount(() => {
		if (!mapDiv) return;

		const map = L.map(mapDiv);

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map);

		const bounds = L.latLngBounds([]);

		parks.forEach(({ lat, lng, name, address, entryFee, phone, id }) => {
			const marker = L.marker([lat, lng])
				.addTo(map)
				.bindPopup(
					(
						PopupContent({ address, entryFee, name, phone }) as HTMLDivElement
					).outerHTML.replaceAll(ESCAPED_HTML_ELEMENT_FROM_OUTER_HTML, ""),
				);

			// Double-click marker → go to park details
			marker.on("dblclick", () => {
				navigate(`/park/${id}`);
			});

			bounds.extend([lat, lng]);
		});

		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(({ coords }) => {
				const userMarker = L.marker([coords.latitude, coords.longitude])
					.addTo(map)
					.bindPopup("You are here");

				bounds.extend(userMarker.getLatLng());
				map.fitBounds(bounds, { padding: [50, 50] });
			});
		} else {
			map.fitBounds(bounds, { padding: [50, 50] });
		}
	});

	return <div ref={mapDiv} class="h-125 w-full" />;
}

function PopupContent(prop: {
	name: string;
	address: string;
	entryFee: string;
	phone: string;
}): JSX.Element {
	return (
		<div class="w-50">
			<strong>${prop.name}</strong>
			<br />
			<em>${prop.address}</em>
			<br />
			Entry Fee: ${prop.entryFee}
			<br />
			Phone: ${prop.phone}
		</div>
	);
}
