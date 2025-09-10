import { A, createAsync, query } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, Index, Suspense } from "solid-js";
import { useGeolocation, useThrottle } from "solidjs-use";
import { getRelevantDataFromJawgsApi as _getRelevantDataFromJawgsApi } from "~/location/geocoding";
import type { PromiseValue } from "~/utils/generics";

export default function UserSearchBar() {
	const [input, setInput] = createSignal("");
	const [areSuggestionsOpen, setAreSuggestionsOpen] = createSignal(false);

	const { coords } = useGeolocation({ enableHighAccuracy: true });

	// Cache previous results
	const getRelevantDataFromJawgsApi = query(
		_getRelevantDataFromJawgsApi,
		"jawgs-autocomplete-api",
	);

	let lastValidApiResultCache:
		| PromiseValue<ReturnType<typeof getRelevantDataFromJawgsApi>>
		| undefined;

	const results = useThrottle(
		createAsync(async () => {
			const res = await getRelevantDataFromJawgsApi({
				distance: 500,
				latitude: coords().latitude,
				longitude: coords().longitude,
				query: input(),
			});

			if (res.length) {
				lastValidApiResultCache = res;

				return res;
			} else {
				return lastValidApiResultCache ?? res;
			}
		}),
		1000,
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
					<p class="label">
						<span class="text-xs sm:text-sm">
							Powered by{" "}
							<a
								href="https://www.jawg.io/"
								class="link link-primary"
								target="_blank"
								rel="noopener"
							>
								Jawg
							</a>
						</span>
					</p>
				</label>
			</summary>

			{/* Dropdown */}
			<ul class="menu dropdown-content z-1 mt-2 max-h-96 w-full flex-nowrap overflow-y-auto rounded-box border bg-base-300 p-2 shadow-sm">
				{/* Wrap suspenses right around any stuff relying on `createAsync` */}
				<Suspense>
					<Index
						each={results()}
						fallback={<div class="px-3 py-2">No results found</div>}
					>
						{(park) => (
							<li>
								<A href="/user">{park().label}</A>
							</li>
						)}
					</Index>
				</Suspense>
			</ul>
		</details>
	);
}
