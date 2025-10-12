import { createAsync } from "@solidjs/router";
import MapPinIcon from "lucide-solid/icons/map-pin";
import RefreshCwIcon from "lucide-solid/icons/refresh-cw";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, For, Index, Show } from "solid-js";
import { useGeolocation } from "solidjs-use";
import * as v from "valibot";
import { BackNavigationButton } from "~/components/button";
import { RecreationalLocationDisplayButtonCard } from "~/components/location-display-button-card";
import {
	getAllRecreationalLocationCategories,
	getUserQueryResultFromDatabase,
} from "~/server/database/user/query";
import { getProxiedImageUrl } from "~/utils/image";

export default function AdvancedSearchPage() {
	const MIN_DISTANCE_IN_KM = 1;
	const MAX_DISTANCE_IN_KM = 100;

	// Form state
	const [query, setQuery] = createSignal("");
	const [category, setCategory] = createSignal("");
	const [distance, setDistance] = createSignal(10);
	const [sortBy, setSortBy] = createSignal<"relevance" | "distance">(
		"relevance",
	);
	const [searchResults, setSearchResults] = createSignal<
		Array<{
			id: string;
			title: string;
			thumbnail: string;
			distanceKm?: number;
		}>
	>([]);
	const [isLoading, setIsLoading] = createSignal(false);

	// Validation errors
	const [errors, setErrors] = createSignal<{
		query?: string;
		distance?: string;
	}>({});

	// Get user geolocation
	const { coords } = useGeolocation({ enableHighAccuracy: true });

	// Get categories
	const categories = createAsync(() => getAllRecreationalLocationCategories());

	// Search function with validation
	async function runSearch(e?: Event) {
		if (e) e.preventDefault();

		setErrors({});
		setIsLoading(true);

		try {
			// Validate query if provided
			if (query()?.trim()) {
				v.parse(v.string(), query());
			}
		} catch {
			setErrors({ query: "Invalid search keywords" });
			setIsLoading(false);
			return;
		}

		// Validate distance
		const numericDistance = Number(distance());
		if (
			Number.isNaN(numericDistance) ||
			numericDistance < MIN_DISTANCE_IN_KM ||
			numericDistance > MAX_DISTANCE_IN_KM
		) {
			setErrors({
				distance: `Distance must be between ${MIN_DISTANCE_IN_KM} and ${MAX_DISTANCE_IN_KM} KM`,
			});
			setIsLoading(false);
			return;
		}

		try {
			const searchCoords = (): [number, number] => [
				coords().latitude,
				coords().longitude,
			];

			let results = await getUserQueryResultFromDatabase(
				query(),
				searchCoords(),
				50,
			);

			console.log(results);

			// Apply distance filter
			if (numericDistance < 100) {
				results = results.filter(
					(location) =>
						!location.distanceKm || location.distanceKm <= numericDistance,
				);
			}

			// Apply sorting
			if (
				sortBy() === "distance" &&
				results.some((r) => r.distanceKm !== undefined)
			) {
				results = results.toSorted((a, b) => {
					const distA = a.distanceKm ?? Infinity;
					const distB = b.distanceKm ?? Infinity;
					return distA - distB;
				});
			}

			setSearchResults(results.slice(0, 20));
		} catch (error) {
			console.error("Search error:", error);
			setSearchResults([]);
		} finally {
			setIsLoading(false);
		}
	}

	// Reset function
	function resetForm() {
		setQuery("");
		setCategory("");
		setDistance(10);
		setSortBy("relevance");
		setErrors({});
		setSearchResults([]);
	}

	// Run initial search on mount
	setTimeout(() => {
		runSearch();
	}, 100);

	return (
		<div class="min-h-screen bg-base-200">
			<div class="container relative mx-auto max-w-7xl space-y-6 p-4">
				<BackNavigationButton />

				{/* Header */}
				<div class="hero rounded-box bg-base-100">
					<div class="hero-content text-center">
						<div class="max-w-md">
							<h1 class="mb-2 flex items-center justify-center gap-3 font-bold text-3xl">
								<SearchIcon class="size-8" />
								Advanced Search
							</h1>
							<p class="text-base-content/70">
								Discover amazing recreational locations with powerful filters
								and smart search.
							</p>
						</div>
					</div>
				</div>

				{/* Main content area: filters (left) + results (right) */}
				<div class="grid gap-6 lg:grid-cols-4">
					{/* Filters */}
					<aside class="lg:col-span-1">
						<div class="card bg-base-100 shadow-sm">
							<div class="card-body">
								<h2 class="card-title text-lg">Search Filters</h2>

								<form onSubmit={runSearch} class="space-y-4">
									{/* Keywords */}
									<div class="form-control">
										<label class="label" for="keywords-input">
											<span class="label-text font-medium">Keywords</span>
										</label>
										<input
											id="keywords-input"
											type="text"
											placeholder="e.g. lake, playground"
											class={`input input-bordered w-full ${errors().query ? "input-error" : ""}`}
											value={query()}
											onInput={(e) => setQuery(e.currentTarget.value)}
										/>
										<Show when={errors().query}>
											<div class="label">
												<span class="label-text-alt text-error">
													{errors().query}
												</span>
											</div>
										</Show>
									</div>

									{/* Category */}
									<div class="form-control">
										<label class="label" for="category-select">
											<span class="label-text font-medium">Category</span>
										</label>
										<select
											id="category-select"
											class="select select-bordered w-full"
											value={category()}
											onInput={(e) => setCategory(e.currentTarget.value)}
										>
											<option value="">All Categories</option>
											<Show
												when={categories()}
												fallback={<option disabled>Loading...</option>}
											>
												<For each={categories()}>
													{(cat) => <option value={cat}>{cat}</option>}
												</For>
											</Show>
										</select>
									</div>

									{/* Distance */}
									<div class="form-control">
										<label class="label" for="distance-range">
											<span class="label-text font-medium">
												Max Distance: {distance()} KM
											</span>
										</label>
										<input
											id="distance-range"
											type="range"
											min={MIN_DISTANCE_IN_KM}
											max={MAX_DISTANCE_IN_KM}
											value={distance()}
											onInput={(e) =>
												setDistance(Number(e.currentTarget.value))
											}
											class={`range range-primary ${errors().distance ? "range-error" : ""}`}
										/>
										<div class="flex w-full justify-between px-2 text-xs">
											<span>{MIN_DISTANCE_IN_KM}km</span>
											<span>25km</span>
											<span>50km</span>
											<span>75km</span>
											<span>{MAX_DISTANCE_IN_KM}km</span>
										</div>
										<Show when={errors().distance}>
											<div class="label">
												<span class="label-text-alt text-error">
													{errors().distance}
												</span>
											</div>
										</Show>
									</div>

									{/* Sort By */}
									<div class="form-control">
										<label class="label" for="sort-select">
											<span class="label-text font-medium">Sort By</span>
										</label>
										<select
											id="sort-select"
											class="select select-bordered w-full"
											value={sortBy()}
											onInput={(e) =>
												setSortBy(
													e.currentTarget.value as "relevance" | "distance",
												)
											}
										>
											<option value="relevance">Relevance</option>
											<option value="distance">Distance</option>
										</select>
									</div>

									{/* Action Buttons */}
									<div class="flex gap-2 pt-6">
										<button
											type="submit"
											class="btn btn-primary flex-1 gap-2"
											disabled={isLoading()}
										>
											<Show
												when={isLoading()}
												fallback={<SearchIcon class="h-4 w-4" />}
											>
												<span class="loading loading-spinner loading-sm"></span>
											</Show>
											{isLoading() ? "Searching..." : "Search"}
										</button>
										<button
											type="button"
											class="btn btn-ghost gap-2"
											onClick={resetForm}
										>
											<RefreshCwIcon class="h-4 w-4" />
											Reset
										</button>
									</div>
								</form>
							</div>
						</div>
					</aside>

					{/* Results */}
					<section class="lg:col-span-3">
						<div class="space-y-4">
							{/* Results Header */}
							<div class="flex items-center justify-between">
								<p class="text-base-content/70 text-sm">
									<Show when={!isLoading()} fallback="Searching...">
										Showing <strong>{searchResults().length}</strong> result
										{searchResults().length === 1 ? "" : "s"}
										<Show when={coords().latitude && coords().longitude}>
											<span class="ml-1 text-primary">
												(using your location)
											</span>
										</Show>
									</Show>
								</p>
							</div>

							{/* Results Grid */}
							<Show when={isLoading()}>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									<Index each={Array(8).fill(0)}>
										{() => (
											<RecreationalLocationDisplayButtonCard
												isSkeleton={true}
											/>
										)}
									</Index>
								</div>
							</Show>

							<Show when={!isLoading()}>
								<Show
									when={searchResults().length > 0}
									fallback={
										<div class="card bg-base-100 shadow-sm">
											<div class="card-body text-center">
												<SearchIcon class="mx-auto mb-4 h-16 w-16 text-base-content/20" />
												<h3 class="mb-2 font-medium text-lg">
													No results found
												</h3>
												<p class="mb-4 text-base-content/70">
													Try adjusting your search criteria or expanding your
													search area.
												</p>
												<button
													type="button"
													class="btn btn-outline btn-sm"
													onClick={resetForm}
												>
													Clear Filters
												</button>
											</div>
										</div>
									}
								>
									<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
										<Index each={searchResults()}>
											{(location) => {
												const loc = location();
												return (
													<div class="relative">
														<RecreationalLocationDisplayButtonCard
															href={`/info/${loc.id}`}
															title={loc.title}
															thumbnail={getProxiedImageUrl(loc.thumbnail)}
														/>
														<Show when={loc.distanceKm !== undefined}>
															<div class="badge badge-primary badge-sm absolute right-2 bottom-2 flex items-center gap-1">
																<MapPinIcon class="h-3 w-3" />
																{loc.distanceKm?.toFixed(1)} km
															</div>
														</Show>
													</div>
												);
											}}
										</Index>
									</div>
								</Show>
							</Show>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
