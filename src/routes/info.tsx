import { useLocation, useNavigate } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import ArrowLeftIcon from "lucide-solid/icons/arrow-left";
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
	onMount,
	Show,
} from "solid-js";
import * as v from "valibot";
import { GenericButton } from "~/components/button";
import { RecreationalLocationSchema } from "~/server/database/schema";
import { getProxiedImageUrl } from "~/utils/image";

const UserMapView = clientOnly(() => import("~/components/user/map-view"));

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

function BackButton() {
	const navigate = useNavigate();

	const handleBack = () => {
		// Try to go back in history first, fallback to home if no history
		if (window.history.length > 1) {
			window.history.back();
		} else {
			navigate("/");
		}
	};

	return (
		<GenericButton
			onClick={handleBack}
			class="btn-ghost btn-sm absolute z-10 gap-2"
			aria-label="Go back"
		>
			<ArrowLeftIcon size={16} />
			<span class="hidden sm:inline">Back</span>
		</GenericButton>
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

	return (
		<Show when={hasImages()}>
			<InfoCard>
				<SectionHeader title="Photos" icon={<ImageIcon size={20} />} />

				<div class="space-y-4">
					<Show when={props.location.thumbnail}>
						{(thumbnail) => (
							<div class="aspect-video w-full overflow-hidden rounded-lg bg-base-200">
								<img
									src={getProxiedImageUrl(thumbnail())}
									alt={props.location.title}
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
						)}
					</Show>

					<Show
						when={props.location.images && props.location.images.length > 0}
					>
						<div class="overflow-x-auto">
							<div class="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
								<For each={props.location.images}>
									{(image) => (
										<div class="aspect-square overflow-hidden rounded-lg bg-base-200">
											<img
												src={getProxiedImageUrl(image.image)}
												alt={image.title || props.location.title}
												class="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
												loading="lazy"
											/>
										</div>
									)}
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

/** Shows extra details about a recreational location the user selected */
export default function InformationRoute() {
	const location = useLocation();

	// Use onMount to ensure this only runs on the client
	const [locationData, setLocationData] = createSignal<v.InferOutput<
		typeof RecreationalLocationSchema
	> | null>(null);
	// TODO: Remove this
	const [hasError, setHasError] = createSignal(false);

	onMount(() => {
		const result = v.safeParse(RecreationalLocationSchema, location.state);
		if (result.success) {
			setLocationData(result.output);
		} else {
			setHasError(true);
		}
	});

	return (
		<Show when={locationData()}>
			{(location) => {
				return (
					<div class="size-full overflow-y-auto overflow-x-clip bg-base-200/50">
						<div class="container relative mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-4">
							{/* Back Button */}
							<BackButton />

							{/* Header Section */}
							<div class="hero rounded-box bg-base-100 shadow-md">
								<div class="hero-content px-4 py-6 text-center">
									<div class="max-w-full">
										<h1 class="mb-2 break-words font-bold text-xl sm:text-2xl">
											{location().title}
										</h1>
										<p class="break-words text-base-content/70 text-xs sm:text-sm">
											{location().category} • {location().address}
										</p>
									</div>
								</div>
							</div>

							{/* Main Content Grid */}
							<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
								{/* Map Section - Full width on mobile, spans 2 cols on desktop */}
								<div class="h-48 min-w-0 sm:h-64 lg:col-span-2 lg:h-full">
									<UserMapView
										coords={[location().latitude, location().longitude]}
										label={location().title}
										fallback={
											<div class="flex h-full w-full items-center justify-center rounded-box bg-base-200">
												<span class="loading loading-spinner loading-lg"></span>
											</div>
										}
									/>
								</div>

								{/* Contact Info - Always visible in sidebar on desktop */}
								<div class="min-w-0 space-y-4 sm:space-y-6">
									<ContactInfo location={location()} />
									<RatingInfo location={location()} />
									<OpeningHours location={location()} />
								</div>

								{/* Full width sections */}
								<div class="min-w-0 space-y-4 sm:space-y-6 lg:col-span-3">
									<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
										<BusinessDetails location={location()} />
										<ImageGallery location={location()} />
									</div>
								</div>
							</div>
						</div>
					</div>
				);
			}}
		</Show>
	);
}
