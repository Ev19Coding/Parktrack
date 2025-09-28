import { createAsync, revalidate, useParams } from "@solidjs/router";
import RemoveFavoriteIcon from "lucide-solid/icons/bookmark-minus";
import AddFavoriteIcon from "lucide-solid/icons/bookmark-plus";
import CalendarIcon from "lucide-solid/icons/calendar";
import ClockIcon from "lucide-solid/icons/clock";
import ExternalLinkIcon from "lucide-solid/icons/external-link";
import GlobeIcon from "lucide-solid/icons/globe";
import ImageIcon from "lucide-solid/icons/image";
import MailIcon from "lucide-solid/icons/mail";
import MapPinIcon from "lucide-solid/icons/map-pin";
import PhoneIcon from "lucide-solid/icons/phone";
import StarIcon from "lucide-solid/icons/star";
import {
	createMemo,
	createSignal,
	For,
	type JSXElement,
	Show,
	Suspense,
} from "solid-js";
import * as v from "valibot";
import { BackNavigationButton } from "~/components/button";
import UserMapView from "~/components/map-view";
import { GenericModal, showModal } from "~/components/modal/generic-modal";
import type { RecreationalLocationSchema } from "~/server/database/schema";
import { addToFavourites, removeFromFavourites } from "~/server/user";
import { DUMMY_RECREATIONAL_LOCATION_DATA } from "~/shared/constants";
import { getProxiedImageUrl } from "~/utils/image";
import { generateRandomUUID } from "~/utils/random";
import {
	queryIsLocationInUserFavourites,
	queryIsUserOwner,
	queryRecreationalLocationById,
	queryUserLoggedIn,
} from "~/utils/user-query";
import { IdParamSchema } from "~/utils/validation/url-param";

function InfoCard(props: { children: JSXElement; class?: string }) {
	return (
		<div class={`card bg-base-100 shadow-md ${props.class || ""}`}>
			<div class="card-body p-3 sm:p-4 lg:p-6">{props.children}</div>
		</div>
	);
}

function SectionHeader(props: { title: string; icon: JSXElement }) {
	return (
		<h2 class="card-title mb-3 flex items-center gap-2 text-base sm:mb-4 sm:text-lg lg:text-xl">
			{props.icon}
			{props.title}
		</h2>
	);
}

function ContactInfo(props: {
	location: v.InferOutput<typeof RecreationalLocationSchema>;
}) {
	return (
		<InfoCard>
			<SectionHeader title="Contact & Links" icon={<PhoneIcon size={20} />} />

			<div class="space-y-3">
				<Show when={props.location.phone}>
					<div class="flex min-w-0 items-start gap-3">
						<PhoneIcon size={16} class="mt-0.5 flex-shrink-0 text-primary" />
						<a
							href={`tel:${props.location.phone}`}
							class="link link-primary break-all text-sm"
						>
							{props.location.phone}
						</a>
					</div>
				</Show>

				<Show when={props.location.website}>
					{(website) => (
						<div class="flex min-w-0 items-start gap-3">
							<GlobeIcon size={16} class="mt-0.5 flex-shrink-0 text-primary" />
							<a
								href={website()}
								target="_blank"
								rel="noopener noreferrer"
								class="link link-primary flex min-w-0 items-center gap-1 text-sm"
							>
								<span class="truncate">Website</span>
								<ExternalLinkIcon size={12} class="flex-shrink-0" />
							</a>
						</div>
					)}
				</Show>

				<Show when={props.location.emails && props.location.emails.length > 0}>
					<div class="flex min-w-0 items-start gap-3">
						<MailIcon size={16} class="mt-0.5 flex-shrink-0 text-primary" />
						<div class="flex min-w-0 flex-1 flex-col gap-1">
							<For each={props.location.emails}>
								{(email) => (
									<a
										href={`mailto:${email}`}
										class="link link-primary break-all text-sm"
									>
										{email}
									</a>
								)}
							</For>
						</div>
					</div>
				</Show>

				<div class="flex min-w-0 items-start gap-3">
					<MapPinIcon size={16} class="mt-0.5 flex-shrink-0 text-primary" />
					<span class="break-words text-sm">{props.location.address}</span>
				</div>

				<div class="flex min-w-0 items-start gap-3">
					<ExternalLinkIcon
						size={16}
						class="mt-0.5 flex-shrink-0 text-primary"
					/>
					<a
						href={props.location.link}
						target="_blank"
						rel="noopener noreferrer"
						class="link link-primary flex min-w-0 items-center gap-1 text-sm"
					>
						<span class="truncate">View on Google Maps</span>
						<ExternalLinkIcon size={12} class="flex-shrink-0" />
					</a>
				</div>
			</div>
		</InfoCard>
	);
}

function RatingInfo(props: {
	location: v.InferOutput<typeof RecreationalLocationSchema>;
}) {
	const rating = createMemo(
		() => props.location.rating || props.location.reviewRating || 0,
	);
	const reviewCount = createMemo(() => props.location.reviewCount || 0);

	return (
		<Show when={rating() > 0 || reviewCount() > 0}>
			<InfoCard>
				<SectionHeader title="Reviews & Rating" icon={<StarIcon size={20} />} />

				<div class="space-y-4">
					<Show when={rating() > 0}>
						<div class="flex flex-wrap items-center gap-2">
							<div class="rating rating-sm flex-shrink-0">
								<For each={Array(5)}>
									{(_, index) => (
										<input
											type="radio"
											disabled
											checked={true}
											class={`mask mask-star ${index() < Math.floor(rating()) ? "bg-warning" : "bg-base-300"}`}
										/>
									)}
								</For>
							</div>
							<span class="font-semibold text-lg">{rating().toFixed(1)}</span>
							<Show when={reviewCount() > 0}>
								<span class="text-base-content/70 text-sm">
									({reviewCount()} reviews)
								</span>
							</Show>
						</div>
					</Show>

					<Show
						when={
							props.location.reviewsBreakdown || props.location.reviewsPerRating
						}
					>
						<div class="space-y-2">
							<h3 class="font-medium text-sm">Review breakdown:</h3>
							<div class="space-y-1 overflow-x-auto">
								<For
									each={Object.entries(
										props.location.reviewsBreakdown ||
											props.location.reviewsPerRating ||
											{},
									)}
								>
									{([stars, count]) => (
										<div class="flex min-w-0 items-center gap-2 text-sm">
											<span class="w-8 flex-shrink-0">{stars}★</span>
											<progress
												class="progress progress-warning w-16 flex-shrink-0 sm:w-24"
												value={count}
												max={reviewCount()}
											/>
											<span class="flex-shrink-0 text-base-content/70 text-xs">
												({count})
											</span>
										</div>
									)}
								</For>
							</div>
						</div>
					</Show>

					<Show when={props.location.reviewsLink}>
						{(reviewsLink) => (
							<a
								href={reviewsLink()}
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-outline btn-sm w-full sm:w-auto"
							>
								Read Reviews <ExternalLinkIcon size={14} />
							</a>
						)}
					</Show>
				</div>
			</InfoCard>
		</Show>
	);
}

function OpeningHours(props: {
	location: v.InferOutput<typeof RecreationalLocationSchema>;
}) {
	return (
		<Show
			when={
				props.location.openHours &&
				Object.keys(props.location.openHours).length > 0
			}
		>
			<InfoCard>
				<SectionHeader title="Opening Hours" icon={<ClockIcon size={20} />} />

				<div class="space-y-2 overflow-x-auto">
					<For each={Object.entries(props.location.openHours)}>
						{([day, hours]) => (
							<div class="flex min-w-0 items-start justify-between gap-2 text-sm">
								<span class="flex-shrink-0 font-medium capitalize">{day}:</span>
								<span
									class={`break-words text-right ${
										hours.includes("Closed") ? "text-error" : "text-success"
									}`}
								>
									{Array.isArray(hours) ? hours.join(", ") : hours}
								</span>
							</div>
						)}
					</For>
				</div>
			</InfoCard>
		</Show>
	);
}

function ImageGallery(props: {
	location: v.InferOutput<typeof RecreationalLocationSchema>;
}) {
	const hasImages = createMemo(
		() =>
			(props.location.images && props.location.images.length > 0) ||
			props.location.thumbnail,
	);

	function Image(localProp: {
		class: string;
		src: string;
		alt?: string | undefined;
	}) {
		return (
			<img
				src={getProxiedImageUrl(localProp.src)}
				alt={localProp.alt || props.location.title}
				class={localProp.class}
				loading="lazy"
			/>
		);
	}

	function ImageZoomModal(localProp: { modalId: string; src: string }) {
		return (
			<GenericModal
				modalId={localProp.modalId}
				class="h-screen max-h-[75dvh] w-screen max-w-[75dvw]"
				z-index={999_999}
			>
				<div class="size-full overflow-auto">
					<Image
						class="m-auto aspect-square size-full h-[80dvh] w-auto max-w-[80dvh] object-contain sm:h-auto sm:max-h-[90dvw] sm:w-[90dvw]"
						src={localProp.src}
					></Image>
				</div>
			</GenericModal>
		);
	}

	return (
		<Show when={hasImages()}>
			<InfoCard>
				<SectionHeader title="Photos" icon={<ImageIcon size={20} />} />

				<div class="space-y-4">
					<Show when={props.location.thumbnail}>
						{(thumbnail) => {
							const modalId = generateRandomUUID();

							return (
								<button
									type="button"
									class="aspect-video w-full overflow-hidden rounded-lg bg-base-200"
									onClick={(_) => showModal(modalId)}
								>
									<Image
										class="h-full w-full object-cover"
										src={thumbnail()}
									></Image>

									<ImageZoomModal modalId={modalId} src={thumbnail()} />
								</button>
							);
						}}
					</Show>

					<Show
						when={props.location.images && props.location.images.length > 0}
					>
						<div class="overflow-x-auto">
							<div class="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
								<For each={props.location.images}>
									{(imageData) => {
										const modalId = generateRandomUUID();

										return (
											<button
												type="button"
												class="aspect-square overflow-hidden rounded-lg bg-base-200"
												onClick={(_) => showModal(modalId)}
											>
												<Image
													class="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
													src={imageData.image}
													alt={imageData.title}
												/>

												<ImageZoomModal
													modalId={modalId}
													src={imageData.image}
												/>
											</button>
										);
									}}
								</For>
							</div>
						</div>
					</Show>
				</div>
			</InfoCard>
		</Show>
	);
}

function BusinessDetails(props: {
	location: v.InferOutput<typeof RecreationalLocationSchema>;
}) {
	return (
		<InfoCard>
			<SectionHeader title="Details" icon={<CalendarIcon size={20} />} />

			<div class="space-y-3">
				<div class="flex flex-wrap gap-2">
					<div class="badge badge-primary break-all">
						{props.location.category}
					</div>
					<Show when={props.location.priceRange}>
						{(priceRange) => (
							<div class="badge badge-secondary break-all">{priceRange()}</div>
						)}
					</Show>
				</div>

				<Show when={props.location.description}>
					{(description) => (
						<div>
							<h3 class="mb-2 font-medium text-sm">Description:</h3>
							<p class="break-words text-base-content/80 text-sm leading-relaxed">
								{description()}
							</p>
						</div>
					)}
				</Show>

				<Show when={props.location.about && props.location.about.length > 0}>
					<div>
						<h3 class="mb-3 font-medium">Amenities & Features:</h3>
						<div class="space-y-3">
							<For each={props.location.about}>
								{(category) => (
									<div>
										<h4 class="mb-2 break-words font-medium text-primary text-sm uppercase tracking-wide">
											{category.name}
										</h4>
										<div class="flex flex-wrap gap-2">
											<For each={category.options}>
												{(option) => (
													<span class="badge badge-outline badge-sm break-all">
														{option.name}
													</span>
												)}
											</For>
										</div>
									</div>
								)}
							</For>
						</div>
					</div>
				</Show>
			</div>
		</InfoCard>
	);
}

/** Shows extra details about a recreational location the user selected. Requires that id of the location is in the url parameters */
export default function InformationRoute() {
  // Destructure the params since it's a proxy
	const params = v.parse(IdParamSchema, {...useParams()})

	const locationData = createAsync(
		async () =>
			(await queryRecreationalLocationById(params.id)) ??
			DUMMY_RECREATIONAL_LOCATION_DATA,
		{ initialValue: DUMMY_RECREATIONAL_LOCATION_DATA },
	);

	return (
		<div class="size-full overflow-y-auto overflow-x-clip bg-base-200/50">
			<div class="container relative mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-4">
				{/* Back Button */}
				<BackNavigationButton />

				{/* Header Section */}
				<div class="hero rounded-box bg-base-100 shadow-md">
					<div class="hero-content px-4 py-6 text-center">
						<div class="max-w-full space-y-2">
							<h1 class="break-words font-bold text-xl sm:text-2xl">
								{locationData().title}
							</h1>

							<p class="break-words text-base-content/70 text-xs sm:text-sm">
								{locationData().category} • {locationData().address}
							</p>

							{(() => {
								const id = () => locationData().id;

								const isRecreationLocationUserFavourite = createAsync(
									() => queryIsLocationInUserFavourites(id()),
									{ initialValue: false },
								);

								const [isLoading, setIsLoading] = createSignal(false);

								function LoadingSpinner() {
									return (
										<>
											<span class="loading loading-spinner"></span>
											Please wait...
										</>
									);
								}

								const isLoggedIn = createAsync(() => queryUserLoggedIn(), {
									initialValue: false,
								});

								const isNotOwner = createAsync(
									async () => !(await queryIsUserOwner()),
									{ initialValue: true },
								);

								return (
									<Show when={isLoggedIn() && isNotOwner()}>
										<button
											type="button"
											class="link link-primary inline-flex items-center justify-center gap-1 break-words font-semibold text-base-content/70 text-xs sm:text-sm"
											disabled={isLoading()}
											onClick={async (_) => {
												setIsLoading(true);

												if (isRecreationLocationUserFavourite()) {
													await removeFromFavourites(id());
												} else {
													await addToFavourites(id());
												}

												await revalidate(queryIsLocationInUserFavourites.key);

												setIsLoading(false);
											}}
										>
											<Suspense fallback={<LoadingSpinner />}>
												<Show
													when={isLoading()}
													fallback={
														isRecreationLocationUserFavourite() ? (
															<>
																<RemoveFavoriteIcon />
																Remove from Favourites
															</>
														) : (
															<>
																<AddFavoriteIcon />
																Add to Favourites
															</>
														)
													}
												>
													<LoadingSpinner />
												</Show>
											</Suspense>
										</button>
									</Show>
								);
							})()}
						</div>
					</div>
				</div>

				{/* Main Content Grid */}
				<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
					{/* Map Section - Full width on mobile, spans 2 cols on desktop */}
					<div class="h-48 min-w-0 sm:h-64 lg:col-span-2 lg:h-full">
						<UserMapView
							coords={[locationData().latitude, locationData().longitude]}
							label={locationData().title}
							markerType="location"
							// Uncomment to display nearby locations around the shown recreational location
							// showNearby={true}
							// zoom={16}
						/>
					</div>

					{/* Contact Info - Always visible in sidebar on desktop */}
					<div class="min-w-0 space-y-4 sm:space-y-6">
						<ContactInfo location={locationData()} />
						<RatingInfo location={locationData()} />
						<OpeningHours location={locationData()} />
					</div>

					{/* Full width sections */}
					<div class="min-w-0 space-y-4 sm:space-y-6 lg:col-span-3">
						<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
							<BusinessDetails location={locationData()} />
							<ImageGallery location={locationData()} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
