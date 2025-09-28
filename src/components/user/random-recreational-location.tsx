import {
	createAsync,
	createAsyncStore,
	revalidate,
	useNavigate,
} from "@solidjs/router";
import RefreshCwIcon from "lucide-solid/icons/refresh-cw";
import {
	createEffect,
	createMemo,
	createSignal,
	Index,
	type JSXElement,
	onMount,
	Show,
	Suspense,
} from "solid-js";
import { getProxiedImageUrl } from "~/utils/image";
import { getRandomElementInArray } from "~/utils/random";
import {
	queryCommonRecreationalLocationCategories,
	queryRecreationalLocationById,
	queryRecreationalLocationsAtRandom,
} from "~/utils/user-query";
import { TooltipButton } from "../button";
import LoadingSpinner from "../loading-spinner";
import { RecreationalLocationDisplayButtonCard } from "../location-display-button-card";

function DataSection(prop: {
	data: ReadonlyArray<{ id: string; title: string; thumbnail: string }>;
	header: JSXElement;
	class: string;
	onRefresh: () => void;
}) {
	const navigate = useNavigate();

	const getRecreationalLocationFromDatabaseById = (id: string) =>
		queryRecreationalLocationById(id);

	const [
		isLoadingRecreationalLocationInfo,
		setIsLoadingRecreationalLocationInfo,
	] = createSignal(false);

	function SkeletonLoaderFallback() {
		return <RecreationalLocationDisplayButtonCard isSkeleton={true} />;
	}

	return (
		<>
			<section class={`flex flex-col gap-2 overflow-hidden ${prop.class}`}>
				<Suspense>
					<h2 class="flex shrink items-center justify-center gap-2 font-bold text-xl">
						<span class="text-center">{prop.header}</span>

						<TooltipButton
							tooltipText="Refresh Categories"
							tooltipDir="left"
							class="btn-ghost btn-circle"
							onClick={prop.onRefresh}
						>
							<RefreshCwIcon />
						</TooltipButton>
					</h2>
				</Suspense>

				<div class="overflow-auto">
					<div class="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-3">
						<Suspense
							fallback={
								<Index each={Array(5)}>
									{(_) => <SkeletonLoaderFallback />}
								</Index>
							}
						>
							<Index each={prop.data}>
								{(baseLocationData) => (
									<RecreationalLocationDisplayButtonCard
									href={`/info/${baseLocationData().id}`}

										thumbnail={getProxiedImageUrl(baseLocationData().thumbnail)}
										title={baseLocationData().title}
									/>
								)}
							</Index>
						</Suspense>
					</div>
				</div>
			</section>

			<Show when={isLoadingRecreationalLocationInfo()}>
				{/* Let the spinner cover the entire screen */}
				<div class="fixed z-[999999] h-screen w-screen">
					<LoadingSpinner />
				</div>
			</Show>
		</>
	);
}

export function UserRecreationalLocationDisplay(prop: { class?: string }) {
	const commonCategories = createAsync(
		() => queryCommonRecreationalLocationCategories(6),
		{ initialValue: [] },
	);

	const [commonCategory, setCommonCategory] = createSignal("Location");

	const category = createMemo(
		() => getRandomElementInArray(commonCategories()) ?? "Location",
	);

	const setCommonCategoryToRandomOne = () => {
		const refreshedCategory =
			getRandomElementInArray(commonCategories()) ?? "Location";

		setCommonCategory(refreshedCategory);
	};

	createEffect(() => {
		setCommonCategory(category);
	});

	const randomParks = createAsyncStore(
		() => queryRecreationalLocationsAtRandom(commonCategory()),
		{ initialValue: [], reconcile: { merge: true } },
	);

	return (
		<DataSection
			class={prop.class ?? ""}
			data={randomParks()}
			header={`${commonCategory()}(s) for You`}
			onRefresh={setCommonCategoryToRandomOne}
		/>
	);
}
