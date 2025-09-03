import { A } from "@solidjs/router";
import { createMemo, createSignal, Index } from "solid-js";
import { parkdata } from "~/data/parkdata"; // Or parkdata → rename accordingly

export default function SearchableParks() {
	const [query, setQuery] = createSignal("");
	const [areSuggestionsOpen, setAreSuggestionsOpen] = createSignal(false);

	// Filter parks
	const results = createMemo(() => {
		const q = query().trim().toLowerCase();
		if (!q) return parkdata; // Show all parks when empty (like YouTube does with suggestions)
		return parkdata.filter((p) => p.name.toLowerCase().includes(q));
	});

	return (
		<details
			class="dropdown"
			open={areSuggestionsOpen()}
			onFocusOut={(e) =>
				//@ts-expect-error This works
				!e.currentTarget.contains(e.relatedTarget) &&
				setAreSuggestionsOpen(false)
			}
		>
			<summary class="block">
				{/* Search bar */}
				<label class="input input-primary">
					{/* TODO: Use an icon library like lucide to replace this inline svg */}
					<svg
						class="h-[1em] opacity-50"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						aria-label="Search icon"
					>
						<title>Search</title>
						<g
							stroke-linejoin="round"
							stroke-linecap="round"
							stroke-width="2.5"
							fill="none"
							stroke="currentColor"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<path d="m21 21-4.3-4.3"></path>
						</g>
					</svg>

					<input
						type="search"
						placeholder="Search parks..."
						value={query()}
						onClick={(_) => setAreSuggestionsOpen(true)}
						onInput={(e) => setQuery(e.currentTarget.value)} // Update query but keep dropdown open
						class="flex-1 p-2 outline-none"
					/>
				</label>
			</summary>

			<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-full p-2 shadow-sm">
				<Index
					each={results()}
					fallback={<div class="px-3 py-2">No results found</div>}
				>
					{(park) => (
						<li>
							<A href={`/parks/${park().id}`}>{park().name}</A>
						</li>
					)}
				</Index>
			</ul>
		</details>
	);
}
