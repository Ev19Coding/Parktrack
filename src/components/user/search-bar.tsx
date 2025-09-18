import { A, createAsyncStore, query, useNavigate } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, Index, type Setter, Show, Suspense } from "solid-js";
import { useGeolocation, useThrottle } from "solidjs-use";
import type { RecreationalLocationSchema } from "~/server/database/schema";
import {
	getRecreationalLocationFromDatabaseById as _getRecreationalLocationFromDatabaseById,
	getUserQueryResultFromDatabase,
} from "~/server/database/user/query";
import { getProxiedImageUrl } from "~/utils/image";

export default function UserSearchBar(prop: {
	setLocationResult: Setter<RecreationalLocationSchema | null>;
}) {
	const navigate = useNavigate();

	const [input, setInput] = createSignal("");
	const [areSuggestionsOpen, setAreSuggestionsOpen] = createSignal(false);

	// const { coords } = useGeolocation({ enableHighAccuracy: true });

	// This would be more reliable:
	const _getSearchResultsFromDb = query(
		getUserQueryResultFromDatabase,
		"db-user-query-search",
	);

	const _throttledSearch = useThrottle(
		() => _getSearchResultsFromDb(input()),
		1000,
	);

	const basicSearchResults = createAsyncStore(async () => {
		return _throttledSearch();
	});

	const getRecreationalLocationFromDatabaseById = query(
		_getRecreationalLocationFromDatabaseById,
		"db-location-data-query",
	);

	// Move ref declaration outside
	let inputRef: HTMLInputElement | undefined;

	function setInputWithValue() {
		if ((inputRef?.value.length ?? 0) >= 2) {
			//@ts-expect-error inputRef will be defined when this is called
			setInput(inputRef.value);
		}
	}

	return (
		<details
			class="dropdown place-self-center lg:col-[1/3]"
			open={areSuggestionsOpen()}
			onFocusOut={(e) =>
				//@ts-expect-error This works
				!e.currentTarget.contains(e.relatedTarget) &&
				setAreSuggestionsOpen(false)
			}
		>
			<summary class="block">
				{/* Search bar */}
				<label class="input bg-base-200 sm:min-w-120">
					<SearchIcon class="text-base-content/50" />
					<input
						type="search"
						placeholder="Search parks..."
						value={input()}
						onClick={(_) => setAreSuggestionsOpen(true)}
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
											const data =
												await getRecreationalLocationFromDatabaseById(
													park().id,
												);

											if (data) {
												prop.setLocationResult(data);
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
	);
}
