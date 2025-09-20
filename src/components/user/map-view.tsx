import { onMount } from "solid-js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "@solidjs/router";
import { parkdata } from "~/data/parkdata";

export default function ParkMap() {
  let map: L.Map | undefined;
  const navigate = useNavigate();

  // Add marker safely
  function safeAddMarker(lat: number, lng: number, popupHTML: string) {
    if (!map) return null;

    const marker = L.marker([lat, lng]).addTo(map).bindPopup(popupHTML);
    return marker;
  }

  // Add parks from dataset
  function addParks() {
    parkdata.forEach((park) => {
      const { lat, lng, name, address, entryFee, phone, id } = park;
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
        // Hover tooltip with name only
        marker.bindTooltip(name, { permanent: false, direction: "top" });

        // Navigate to info page on click
        marker.on("click", () => {
          navigate(`/parks/${id}`, { state: park });
        });
      }
    });
  }

  // Add user location
  function addUserLocation() {
    if (!map) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userMarker = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl:
                "https://cdn-icons-png.flaticon.com/512/64/64113.png", // blue marker icon
              iconSize: [30, 30],
              iconAnchor: [15, 30],
            }),
          })
            .addTo(map)
            .bindPopup("📍 You are here");

          // Optional: tooltip on hover for user marker
          userMarker.bindTooltip("You are here", {
            permanent: false,
            direction: "top",
          });

          map.setView([latitude, longitude], 13);
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  }

  onMount(() => {
    map = L.map("map").setView([9.05785, 7.49508], 12); // default Abuja coords

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    addParks();
    addUserLocation();
  });

  return (
    <div
      id="map"
      class="w-full h-[500px] rounded-lg shadow border border-gray-200"
    />
  );
}
