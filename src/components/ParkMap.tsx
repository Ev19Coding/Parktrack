import { useNavigate } from "@solidjs/router";
import L from "leaflet";
import { onMount } from "solid-js";
import "leaflet/dist/leaflet.css";
import type { JSX } from "solid-js";
import { ESCAPED_HTML_ELEMENT_FROM_OUTER_HTML } from "~/shared/constants";
import { parks } from "../data/parks";


const userLocationIcon = L.icon({
  iconUrl: "https://img.icons8.com/officel/80/marker.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

export default function ParkMap() {
	let mapDiv: HTMLDivElement | undefined;
	const navigate = useNavigate();

	onMount(() => {
		if (!mapDiv) return;

    const map = L.map(mapDiv);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    parks.forEach((park) => {
      const popupContent = `
        <div style="width:200px">
          <strong>${park.name}</strong><br/>
          <em>${park.address}</em><br/>
          Entry Fee: ${park.entryFee}<br/>
          Phone: ${park.phone}
        </div>
      `;

      const marker = L.marker([park.lat, park.lng])
        .addTo(map)
        .bindPopup(popupContent);

      // Double-click marker → go to park details
      marker.on("dblclick", () => {
        navigate(`/park/${park.id}`);
      });

      bounds.extend([park.lat, park.lng]);
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

  return <div ref={mapDiv} style={{ height: "500px", width: "100%" }} />;
}
