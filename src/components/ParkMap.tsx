import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import L from "leaflet";
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

    // Create the map
     const map = L.map(mapDiv).setView([9.082, 8.6753], 12); // Default: Nigeria
     
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    function safeAddMarker(lat: number, lng: number, popupHTML: string) {
      if (
        typeof lat === "number" &&typeof lng === "number" &&
       lat >= -90 &&
       lat <= 90 &&
       lng >= -180 &&
       lng <= 180) {
      const marker = L.marker([lat, lng]).addTo(map).bindPopup(popupHTML);
      bounds.extend([lat, lng]);
      return marker;
    }
    console.warn("Invalid coordinates skipped:", lat, lng);
  }

  // Function to add parks
  function addParks() {
    parks.forEach(({ lat, lng, name, address, entryFee, phone, id }) => {
      const popupHTML = (
        PopupContent({ address, entryFee, name, phone }) as HTMLDivElement
      ).outerHTML.replaceAll(ESCAPED_HTML_ELEMENT_FROM_OUTER_HTML, "");

      const marker = safeAddMarker(lat, lng, popupHTML);
      if (marker) {
        marker.on("dblclick", () => {
          navigate(`/parkdata/${id}`);
        });
      }
    });
  }

  // Track user location in real-time
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      ({ coords }) => {
        const userLat = coords.latitude;
        const userLng = coords.longitude;

        L.marker([userLat, userLng], { icon: userLocationIcon })
          .addTo(map)
          .bindPopup("You are here");

        map.setView([userLat, userLng], 14); // Focus on user location

        addParks();
        map.fitBounds(bounds, { padding: [50, 50] });
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
      }
    );
  } else {
    addParks();
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
      <strong>{prop.name}</strong>
      <br />
      <em>{prop.address}</em>
      <br />
      Entry Fee: {prop.entryFee}
      <br />
      Phone: {prop.phone}
    </div>
  );
}
