import { createSignal, Index, Show } from "solid-js";
import * as v from "valibot";
import { BackNavigationButton } from "~/components/button";
import LoadingSpinner from "~/components/loading-spinner";
import { RecreationalLocationDisplayButtonCard } from "~/components/location-display-button-card";
import { getProxiedImageUrl } from "~/utils/image";

type Result = {
	id: string;
	title: string;
	thumbnail: string;
	category?: string;
	tags?: string[];
	distanceKm?: number;
	href?: string;
};

const MOCK_RESULTS: Result[] = [
	{
		id: "1",
		title: "Millenium Park",
		thumbnail: "/images/001-MP/Abuja_Millenium_Park_2019_01.jpg",
		category: "Park",
		tags: ["green", "family"],
		distanceKm: 1.2,
		href: "/info/1",
	},
	{
		id: "2",
		title: "Jabi Lake Waterfront",
		thumbnail: "/images/Jabi-Lake-Waterfront.jpg",
		category: "Park",
		tags: ["water", "walk"],
		distanceKm: 4.5,
		href: "/info/2",
	},
	{
		id: "3",
		title: "Sample Restaurant",
		thumbnail: "/images/placeholder.webp",
		category: "Restaurant",
		tags: ["food", "family"],
		distanceKm: 2.1,
		href: "/info/3",
	},
];

export default function AdvancedSearchPage() {
	const MIN_DISTANCE_IN_KM = 1;
	const MAX_DISTANCE_IN_KM = 100;

	// Form state
	const [query, setQuery] = createSignal("");
	const [category, setCategory] = createSignal<"" | "Park" | "Restaurant">("");
	const [tagInput, setTagInput] = createSignal("");
	const [distance, setDistance] = createSignal(10); // km
	const [sortBy, setSortBy] = createSignal<"relevance" | "distance">(
		"relevance",
	);

	// Results + loading + validation errors
	const [isActionLoading, setIsActionLoading] = createSignal(false);
	const [results, setResults] = createSignal<Result[]>([]);
	const [errors, setErrors] = createSignal<{
		query?: string;
		distance?: string;
	}>({});

	// Simple client-side "search" that filters the mock results.
	// Using valibot for basic validation. We keep checks simple so this
	// can be replaced with a full server-side schema later.
	async function runSearch(e?: Event) {
		if (e) e.preventDefault();

		// reset errors
		setErrors({});

		try {
			v.parse(v.string(), query());
		} catch {
			setErrors({ query: "Invalid search keywords" });
			return;
		}

		// ensure distance is a number in range
		const numericDistance = Number(distance());
		if (
			Number.isNaN(numericDistance) ||
			numericDistance < MIN_DISTANCE_IN_KM ||
			numericDistance > MAX_DISTANCE_IN_KM
		) {
			setErrors({
				distance: `Distance must be between ${MIN_DISTANCE_IN_KM} and ${MAX_DISTANCE_IN_KM} KM`,
			});
			return;
		}

		setIsActionLoading(true);

		// simulate network latency
		await new Promise((r) => setTimeout(r, 600));

		const tags = tagInput()
			.split(",")
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);

		let filtered = MOCK_RESULTS.filter((r) => {
			// query match
			const q = query().trim().toLowerCase();
			if (q) {
				const inTitle = r.title.toLowerCase().includes(q);
				const inTags = r.tags?.some((t) => t.toLowerCase().includes(q));
				if (!inTitle && !inTags) return false;
			}

			// category match
			if (category() && r.category !== category()) return false;

			// tags match (all provided tags must be present)
			if (tags.length > 0) {
				const hasAll = tags.every((t) =>
					r.tags?.some((rt) => rt.toLowerCase().includes(t)),
				);
				if (!hasAll) return false;
			}

			// distance filter
			if (typeof r.distanceKm === "number" && r.distanceKm > numericDistance)
				return false;

			return true;
		});

		// sorting
		if (sortBy() === "distance") {
			filtered = filtered.sort(
				(a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
			);
		}

		setResults(filtered);

		setIsActionLoading(false);
	}

	// run initial empty search to show suggestions
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	(async () => {
		// small delay so page renders quickly
		await new Promise((r) => setTimeout(r, 50));
		setResults(MOCK_RESULTS);
	})();

	return (
		<div class="size-full overflow-y-auto overflow-x-clip bg-base-200/50">
			<div class="container relative mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-4">
				<BackNavigationButton />

				{/* Header */}
				<div class="hero rounded-box bg-base-100 shadow-md">
					<div class="hero-content px-4 py-6 text-center">
						<div class="max-w-full space-y-2">
							<h1 class="break-words font-bold text-xl sm:text-2xl">
								Advanced Search
							</h1>
							<p class="break-words text-base-content/70 text-xs sm:text-sm">
								Search locations by keywords, category, tags, distance and more.
							</p>
						</div>
					</div>
				</div>

				{/* Main content area: filters (left) + results (right) */}
				<div class="grid gap-4 lg:grid-cols-4">
					{/* Filters (daisyUI card + form-control usage) */}
					<aside class="col-span-1">
						<div class="card bg-base-100 shadow-sm">
							<div class="card-body space-y-3">
								<form
									onSubmit={runSearch}
									class="space-y-3"
									aria-label="Advanced search filters"
								>
									<div class="form-control">
										<label for="keywords" class="label">
											<span class="label-text">Keywords</span>
										</label>
										<input
											id="keywords"
											class="input input-bordered w-full"
											placeholder="e.g. lake, playground"
											value={query()}
											onInput={(e) => setQuery(e.currentTarget.value)}
											aria-invalid={!!errors().query}
											aria-describedby={
												errors().query ? "keywords-error" : undefined
											}
										/>
										<Show when={errors().query}>
											<span id="keywords-error" class="mt-1 text-error text-sm">
												{errors().query}
											</span>
										</Show>
									</div>

									<div class="form-control">
										<label for="category" class="label">
											<span class="label-text">Category</span>
										</label>
										<select
											id="category"
											class="select select-bordered w-full"
											value={category()}
											onInput={(e) =>
												// @ts-expect-error DOM value is string; options guarantee allowed values
												setCategory(e.currentTarget.value)
											}
										>
											<option value="">Any</option>
											<option value="Park">Park</option>
											<option value="Restaurant">Restaurant</option>
										</select>
									</div>

									<div class="form-control">
										<label for="tags" class="label">
											<span class="label-text">Tags (comma separated)</span>
										</label>
										<input
											id="tags"
											class="input input-bordered w-full"
											placeholder="e.g. family, water"
											value={tagInput()}
											onInput={(e) => setTagInput(e.currentTarget.value)}
										/>
									</div>

									<div class="form-control">
										<label for="maxDistance" class="label">
											<span class="label-text">Max Distance (KM)</span>
										</label>
										<input
											id="maxDistance"
											type="range"
											min={MIN_DISTANCE_IN_KM}
											max={MAX_DISTANCE_IN_KM}
											value={distance()}
											onInput={(e) =>
												setDistance(Number(e.currentTarget.value))
											}
											class="range range-primary"
											aria-describedby={
												errors().distance ? "distance-error" : undefined
											}
										/>
										<div class="text-info text-sm">{distance()} KM</div>
										<Show when={errors().distance}>
											<span id="distance-error" class="mt-1 text-error text-sm">
												{errors().distance}
											</span>
										</Show>
									</div>

									<div class="form-control">
										<label for="sortBy" class="label">
											<span class="label-text">Sort By</span>
										</label>
										<select
											id="sortBy"
											class="select select-bordered w-full"
											value={sortBy()}
											onInput={(e) => {
												// DOM value is string; options guarantee allowed values
												setSortBy(
													e.currentTarget.value as "relevance" | "distance",
												);
											}}
										>
											<option value="relevance">Relevance</option>
											<option value="distance">Distance</option>
										</select>
									</div>

									<div class="flex gap-2">
										<button
											type="submit"
											class="btn btn-primary flex-1"
											disabled={isActionLoading()}
										>
											{isActionLoading() ? (
												<span class="loading loading-spinner loading-sm"></span>
											) : (
												"Search"
											)}
										</button>

										<button
											type="button"
											class="btn btn-ghost"
											onClick={() => {
												setQuery("");
												setCategory("");
												setTagInput("");
												setDistance(10);
												setSortBy("relevance");
												setResults(MOCK_RESULTS);
												setErrors({});
											}}
										>
											Reset
										</button>
									</div>
								</form>
							</div>
						</div>
					</aside>

					{/* Results */}
					<section class="col-span-3">
						<div class="mb-3 flex items-center justify-between">
							<div>
								<p class="text-base-content/70 text-sm">
									Showing <strong>{results().length}</strong> result
									{results().length === 1 ? "" : "s"}
								</p>
							</div>

							<div class="text-base-content/60 text-xs">
								{/* Small hint area */}
								Tip: click a card to view details
							</div>
						</div>

						{/* grid of cards */}
						<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
							{/* When loading show skeletons */}
							<Show when={isActionLoading()}>
								<Index each={[1, 2, 3, 4]}>
									{() => (
										<RecreationalLocationDisplayButtonCard isSkeleton={true} />
									)}
								</Index>
							</Show>

							{/* Actual results */}
							<Index
								each={results()}
								fallback={
									<div class="col-span-full rounded-box bg-base-100 p-4 text-center shadow-sm">
										No results found. Try widening your filters.
									</div>
								}
							>
								{(res) => {
									const r = res();
									return (
										<RecreationalLocationDisplayButtonCard
											href={r.href ?? "#"}
											title={r.title}
											thumbnail={getProxiedImageUrl(r.thumbnail)}
										/>
									);
								}}
							</Index>
						</div>
					</section>
				</div>

				{/* Global loading overlay */}
				<Show when={isActionLoading()}>
					<div class="fixed top-0 left-0 z-[999999] h-screen w-screen">
						<LoadingSpinner />
					</div>
				</Show>
			</div>
		</div>
	);
}
