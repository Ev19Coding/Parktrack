import { createAsyncStore, query, useNavigate } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, Index, Show, Suspense } from "solid-js";
import { useThrottle } from "solidjs-use";
import { getProxiedImageUrl } from "~/utils/image";
import {
	queryRecreationalLocationById,
	queryUserSearchForRecreationalLocations,
} from "~/utils/user-query";
import LoadingSpinner from "../loading-spinner";

export default function UserSearchBar() {
	const navigate = useNavigate();

	const [input, setInput] = createSignal("");
	const [areSuggestionsOpen, setAreSuggestionsOpen] = createSignal(false);
	const [
		isLoadingRecreationalLocationInfo,
		setIsLoadingRecreationalLocationInfo,
	] = createSignal(false);

	// const { coords } = useGeolocation({ enableHighAccuracy: true });

	// This would be more reliable: use the query-fied wrapper which provides caching + revalidate
	const _getSearchResultsFromDb = (q: string) =>
		queryUserSearchForRecreationalLocations(q);

	const _throttledSearch = useThrottle(
		() => _getSearchResultsFromDb(input()),
		1000,
	);

	const basicSearchResults = createAsyncStore(async () => {
		return _throttledSearch();
	});

	const getRecreationalLocationFromDatabaseById = (id: string) =>
		queryRecreationalLocationById(id);

	// Move ref declaration outside
	let inputRef: HTMLInputElement | undefined;

	function setInputWithValue() {
		if ((inputRef?.value.length ?? 0) >= 2) {
			//@ts-expect-error inputRef will be defined when this is called
			setInput(inputRef.value.trim());
		}
	}

	return (
		<>
			<details
				class="dropdown place-self-center lg:col-[1/3]"
				open={areSuggestionsOpen()}
				onFocusOut={(e) => {
					// Close the dropdown if focus moves to an element outside of the current dropdown.
					if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
						setAreSuggestionsOpen(false);
					}
				}}
			>
				<summary class="block">
					{/* Search bar */}
					<label class="input bg-base-200 sm:min-w-120">
						<SearchIcon class="text-base-content/50" />
						<input
							type="search"
							placeholder="Search parks..."
							value={input()}
							onFocus={() => setAreSuggestionsOpen(true)}
							onClick={() => setAreSuggestionsOpen(true)}
							// Update query but keep dropdown open
							onInput={setInputWithValue}
							onKeyPress={({ key }) => key === "Enter" && setInputWithValue()}
							class="flex-1 p-2 outline-none"
							ref={inputRef}
						/>
					</label>
				</summary>

				{/* Dropdown. It's z-index is 1001 so that it stays above the leaflet map buttons */}
				<ul
					class="menu dropdown-content mt-2 max-h-96 w-full flex-nowrap overflow-y-auto rounded-box border bg-base-300 p-2 shadow-sm"
					style={{ "z-index": 1001 }}
				>
					{/* Wrap suspenses right around any stuff relying on `createAsync` */}
					<Suspense>
						<Index
							each={[...(basicSearchResults.latest ?? [])]}
							fallback={<div class="px-3 py-2">No results found</div>}
						>
							{(park) => {
								return (
									<li>
										<button
											type="button"
											class="flex justify-between"
											onClick={async () => {
												setIsLoadingRecreationalLocationInfo(true);

												const data =
													await getRecreationalLocationFromDatabaseById(
														park().id,
													);

												setIsLoadingRecreationalLocationInfo(false);

												if (data) {
													setAreSuggestionsOpen(false);

													// Navigate to the info route and set the data to
													navigate("/info", { state: data });
												}
											}}
										>
											{park().title}

											<Show when={park().thumbnail}>
												{(thumbnail) => {
													const proxiedImgUrl = () =>
														getProxiedImageUrl(thumbnail());

													return (
														<img
															alt={park().title}
															class="aspect-square h-7"
															src={proxiedImgUrl()}
															loading="lazy"
														/>
													);
												}}
											</Show>
										</button>
									</li>
								);
							}}
						</Index>
					</Suspense>
				</ul>
			</details>

			<Show when={isLoadingRecreationalLocationInfo()}>
				<LoadingSpinner />
			</Show>
		</>
	);
}
