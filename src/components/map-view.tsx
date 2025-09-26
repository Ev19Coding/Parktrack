/** biome-ignore-all lint/style/noNonNullAssertion: <This is valid tbf> */
import { useNavigate } from "@solidjs/router";
import type { Map as LMap, Marker } from "leaflet";
import {
	createEffect,
	createMemo,
	createSignal,
	on,
	onMount,
	Show,
} from "solid-js";
import { SolidLeafletMap } from "solidjs-leaflet";
import locationMarker from "~/assets/marker/location.svg";
import generalMarker from "~/assets/marker/other.webp";
import userMarker from "~/assets/marker/user.webp";
import { getProxiedImageUrl } from "~/utils/image";
import { generateRandomUUID } from "~/utils/random";
import {
	queryRecreationalLocationById,
	queryRecreationalLocationsCloseToCoords,
} from "~/utils/user-query";
import LoadingSpinner from "./loading-spinner";

export default function UserMapView(prop: {
	label: string;
	coords: readonly [latitude: number, longitude: number] | null;
	markerType: "user" | "location";
	zoom?: number;
	/** Whether closeby locations should be marked */
	showNearby?: boolean;
}) {
	const mapId = generateRandomUUID();
	const ZOOM_SIZE = 18;
	const navigate = useNavigate();

	const coords = createMemo(
		() =>
			[
				prop.coords?.[0] === Infinity ? 0 : (prop.coords?.[0] ?? 0),
				prop.coords?.[1] === Infinity ? 0 : (prop.coords?.[1] ?? 0),
			] as const,
	);

	const [mapRef, setMapRef] = createSignal<LMap | undefined>();
	const [leafletRef, setLeafletRef] = createSignal<
		typeof import("leaflet") | undefined
	>();
	const [markerRef, setMarkerRef] = createSignal<Marker | undefined>();
	const [recreationalMarkers, setRecreationalMarkers] = createSignal<Marker[]>(
		[],
	);

	// SSR workaround
	const [loadMap, setLoadMap] = createSignal(false);

	const [isLoading, setIsLoading] = createSignal(false);

	onMount(() => setLoadMap(true));

	createEffect(
		on(coords, () => {
			const [lat, lng] = coords();
			mapRef()?.setView([lat, lng], prop.zoom ?? ZOOM_SIZE);
			markerRef()?.setLatLng([lat, lng]).bindPopup(prop.label);
		}),
	);

	// Clear existing recreational markers and add new ones when coordinates change
	createEffect(
		// Only track the basics so we don't enter an infinite loop
		on([coords, mapRef, leafletRef, () => prop.showNearby], async () => {
			if (!mapRef() || !leafletRef() || !prop.showNearby) return;

			// Clear existing recreational markers
			recreationalMarkers().forEach((marker) => {
				marker.off();
				marker.remove();
			});
			setRecreationalMarkers([]);

			// Get recreational locations near the current coordinates
			const locations = await queryRecreationalLocationsCloseToCoords({
				lat: coords()[0],
				long: coords()[1],
				maxResults: 55,
				range: 55,
			})

			// Create markers for each recreational location
			const newMarkers: Marker[] = [];

			locations.forEach(({ id, latitude, longitude, thumbnail, title }) => {
				const popupId = `info-btn-${id}` as const;

				const marker = leafletRef()
					?.marker([latitude, longitude], {
						icon: leafletRef()!.icon({
							iconUrl: generalMarker,
						}),
					})
					.bindPopup(`
				<div class="flex justify-center items-center gap-2">
					<h3 class="text-center">${title}</h3>
					<img src="${getProxiedImageUrl(thumbnail)}" alt="${title}" class="w-12 h-auto object-cover aspect-square" />
					<button
						class="btn btn-info btn-sm"
						id=${popupId}
					>
						Go
					</button>
				</div>
			`)
					.addTo(mapRef()!);

				// Add click event listener to the button after popup opens
				marker?.on("popupopen", () => {
					const button = document.getElementById(popupId);

					if (button) {
						const clickListener = async () => {
							setIsLoading(true);

							const locationData = await queryRecreationalLocationById(id)

							if (locationData) {
								// If already on info page, navigate away first
								if (window.location.pathname === "/info") {
									navigate("/", { replace: true });
									// Use setTimeout to ensure the navigation completes
									setTimeout(() => {
										navigate("/info", { replace: true, state: locationData });
									}, 0);
								} else {
									navigate("/info", { replace: true, state: locationData });
								}
							}

							setIsLoading(false);
						};

						button.addEventListener("click", clickListener, { once: true });
					}
				});

				newMarkers.push(marker!);
			});

			setRecreationalMarkers(newMarkers);
		}),
	);

	return (
		<section class="relative h-full overflow-auto rounded-box bg-base-200 sm:w-170 sm:place-self-center lg:col-[1/3]">
			<Show when={loadMap()} fallback={<div class="skeleton size-full"></div>}>
				<SolidLeafletMap
					center={[...coords()]}
					id={mapId}
					zoom={prop.zoom ?? ZOOM_SIZE}
					height="100%"
					width="100%"
					onMapReady={(leaflet, map) => {
						const icon = leaflet.icon({
							iconUrl: prop.markerType === "user" ? userMarker : locationMarker,
							// shadowUrl: "/marker-shadow.png",
						});
						const marker = leaflet
							.marker([...coords()], {
								icon,
							})
							.addTo(map);

						setMapRef(map);
						setLeafletRef(leaflet);
						setMarkerRef(marker);
					}}
				/>
			</Show>

			<Show when={isLoading()}>
				<LoadingSpinner />
			</Show>
		</section>
	);
}
