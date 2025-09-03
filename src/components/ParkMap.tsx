import { useNavigate } from "@solidjs/router";
import L from "leaflet";
import { onMount } from "solid-js";
import "leaflet/dist/leaflet.css";
import { location } from "../data/spots";

const userLocationIcon = L.icon({
	iconUrl: "https://img.icons8.com/officel/80/marker.png",
	iconSize: [40, 40],
	iconAnchor: [20, 40],
});

export default function ParkMap() {
	let mapDiv: HTMLDivElement | undefined;
	const navigate = useNavigate();

	onMount(() => {
		if (!mapDiv) return;

		// Create map
		const map = L.map(mapDiv);

		// Add tiles
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map);

		const bounds = L.latLngBounds([]);
		let userMarker: L.Marker | null = null;

		function safeAddMarker(lat: number, lng: number, popupHTML: string) {
			if (
				typeof lat === "number" &&
				typeof lng === "number" &&
				lat >= -90 &&
				lat <= 90 &&
				lng >= -180 &&
				lng <= 180
			) {
				const marker = L.marker([lat, lng]).addTo(map).bindPopup(popupHTML);
				bounds.extend([lat, lng]);
				return marker;
			}
			console.warn("Invalid coordinates skipped:", lat, lng);
		}

		function addParks() {
			location.forEach(({ lat, lng, name, address, entryFee, phone, id }) => {
				const popupHTML = `
         <div class="w-50">
           <strong>${name}</strong><br/>
           <em>${address}</em><br/>
           Entry Fee: ${entryFee}<br/>
           Phone: ${phone}
         </div>
       `;

				const marker = safeAddMarker(lat, lng, popupHTML);
				if (marker) {
					marker.on("dblclick", () => {
						navigate(`/park/${id}`);
					});
				}
			});
		}

		if ("geolocation" in navigator) {
			navigator.geolocation.watchPosition(
				({ coords }) => {
					const userLat = coords.latitude;
					const userLng = coords.longitude;

					if (!userMarker) {
						// First time locating user
						userMarker = L.marker([userLat, userLng], {
							icon: userLocationIcon,
						})
							.addTo(map)
							.bindPopup("You are here")
							.openPopup();

						map.setView([userLat, userLng], 12); // set initial view
						addParks();
					} else {
						// Update position
						userMarker.setLatLng([userLat, userLng]);
					}
				},
				(err) => {
					console.error("Geolocation error:", err);
					addParks();
					map.fitBounds(bounds, { padding: [50, 50] });
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0,
				},
			);
		} else {
			addParks();
			map.fitBounds(bounds, { padding: [50, 50] });
		}
	});

	return <div ref={mapDiv} class="h-125 w-full" />;
}
