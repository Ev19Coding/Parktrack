import { createAsync, query, revalidate } from "@solidjs/router";
import AscendingOrderIcon from "lucide-solid/icons/arrow-down-a-z";
import DescendingOrderIcon from "lucide-solid/icons/arrow-down-z-a";
import ViewIcon from "lucide-solid/icons/eye";
import EditIcon from "lucide-solid/icons/square-pen";
import DeleteIcon from "lucide-solid/icons/trash-2";
import { createMemo, createSignal, For, Index, Show } from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import type { Mutable } from "solidjs-use";
import * as v from "valibot";
import { BackNavigationButton, GenericButton } from "~/components/button";
import { triggerConfirmationModal } from "~/components/modal/confirmation-modal";
import {
	closeModal,
	GenericModal,
	showModal,
} from "~/components/modal/generic-modal";
import type { RecreationalLocationSchema } from "~/server/database/schema";
import {
	createUserRecreationalLocationTableEntry,
	deleteUserRecreationalLocationTableEntry,
	updateUserRecreationalLocationTableEntry,
} from "~/server/database/user/action";
import { getCurrentUserInfo } from "~/server/user";
import { DEFAULTS, DUMMY_RECREATIONAL_LOCATION_DATA } from "~/shared/constants";
import { getProxiedImageUrl } from "~/utils/image";
import { generateRandomUUID } from "~/utils/random";
import {
	getOwnerData,
	queryAllRecreationalLocationCategories,
	queryRecreationalLocationById,
	revalidateRecreationalLocationById,
	revalidateRecreationalLocationCategories,
} from "~/utils/user-query";

const { URL } = DEFAULTS;

/** Utility to generate a minimal about-category object from a tag string */
function aboutFromTag(tag: string) {
	return { id: generateRandomUUID(), name: tag, options: [] };
}
function LocationForm(props: {
	formData: Mutable<RecreationalLocationSchema>;
	setFormData: SetStoreFunction<Mutable<RecreationalLocationSchema>>;
	categories: readonly string[];
}) {
	// Local signals for the small interactive lists
	const [openHourInput, setOpenHourInput] = createSignal("");
	const [imageTitleInput, setImageTitleInput] = createSignal("");
	const [imageUrlInput, setImageUrlInput] = createSignal("");
	const [aboutTagInput, setAboutTagInput] = createSignal("");

	// Email helper: comma-separated to string[]
	function onEmailsInput(value: string) {
		const list = value
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		props.setFormData("emails", list.length ? list : undefined);
	}

	function upsertOwner(part: Partial<RecreationalLocationSchema["owner"]>) {
		props.setFormData("owner", {
			...(props.formData.owner ?? { id: "", name: "", link: "" }),
			...part,
		});
	}

	// openHours - expect input like "Monday: 8am-5pm" or "Monday: Open"
	function addOpenHour() {
		const raw = openHourInput().trim();
		if (!raw) return;
		const [dayPart, ...rest] = raw.split(":");
		if (!dayPart || rest.length === 0) return;
		const day = dayPart.trim();
		const hours = rest.join(":").trim();
		// merge into existing openHours
		const existing = props.formData.openHours ?? {};
		const prev = existing[day] ?? [];
		props.setFormData("openHours", { ...existing, [day]: [...prev, hours] });
		setOpenHourInput("");
	}

	function removeOpenHour(day: string, idx: number) {
		const existing = props.formData.openHours ?? {};
		const arr = [...(existing[day] ?? [])];
		arr.splice(idx, 1);
		if (arr.length === 0) {
			const copy = { ...existing };
			delete copy[day];
			props.setFormData("openHours", Object.keys(copy).length ? copy : {});
			return;
		}
		props.setFormData("openHours", { ...existing, [day]: arr });
	}

	// images: simple title + url inputs produce { title, image }
	function addImage() {
		const title = imageTitleInput().trim();
		const url = imageUrlInput().trim();
		if (!url) return;
		const item = { title: title || "Image", image: url };
		const arr = props.formData.images
			? [...props.formData.images, item]
			: [item];
		props.setFormData("images", arr);
		setImageTitleInput("");
		setImageUrlInput("");
	}

	function removeImage(idx: number) {
		if (!props.formData.images) return;
		const arr = [...props.formData.images];
		arr.splice(idx, 1);
		props.setFormData("images", arr.length ? arr : []);
	}

	// about: treat as simple tags -> convert to about categories
	function addAboutTag() {
		const tag = aboutTagInput().trim();
		if (!tag) return;
		const newAbout = aboutFromTag(tag);
		const arr = props.formData.about
			? [...props.formData.about, newAbout]
			: [newAbout];
		props.setFormData("about", arr);
		setAboutTagInput("");
	}

	function removeAbout(idx: number) {
		if (!props.formData.about) return;
		const arr = [...props.formData.about];
		arr.splice(idx, 1);
		props.setFormData("about", arr.length ? arr : undefined);
	}

	return (
		<>
			{/* Basic / header */}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="form-control">
					<span class="label-text">Title</span>
					<input
						name="title"
						placeholder="Name of the location"
						class="input input-bordered input-primary w-full"
						value={props.formData.title}
						onInput={(e) => props.setFormData("title", e.currentTarget.value)}
						required
					/>
				</label>

				{/* category as plain text with datalist suggestions */}
				<label class="form-control">
					<span class="label-text">Category</span>
					<input
						name="category"
						list="category-suggestions"
						class="input input-bordered w-full"
						placeholder="e.g. Park, Trail, Beach"
						value={props.formData.category ?? ""}
						onInput={(e) =>
							props.setFormData("category", e.currentTarget.value)
						}
					/>
					<datalist id="category-suggestions">
						<For each={props.categories}>{(c) => <option value={c} />}</For>
					</datalist>
				</label>
			</div>

			{/* Address & Link */}
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="form-control">
					<span class="label-text">Address</span>
					<input
						name="address"
						placeholder="Full address or landmark"
						class="input input-bordered w-full"
						value={props.formData.address ?? ""}
						onInput={(e) => props.setFormData("address", e.currentTarget.value)}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Direct Link</span>
					<input
						name="link"
						placeholder="Direct map/listing URL"
						class="input input-bordered w-full"
						value={props.formData.link}
						onInput={(e) => props.setFormData("link", e.currentTarget.value)}
					/>
				</label>
			</div>

			{/* Coordinates / Plus Code */}
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<label class="form-control">
					<span class="label-text">Latitude</span>
					<input
						name="latitude"
						class="input input-bordered w-full"
						placeholder="e.g. 34.0522"
						value={props.formData.latitude ?? ""}
						onInput={(e) =>
							props.setFormData("latitude", Number(e.currentTarget.value))
						}
						type="number"
						step="any"
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Longitude</span>
					<input
						name="longitude"
						class="input input-bordered w-full"
						placeholder="e.g. -118.2437"
						value={props.formData.longitude ?? ""}
						onInput={(e) =>
							props.setFormData("longitude", Number(e.currentTarget.value))
						}
						type="number"
						step="any"
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Plus Code</span>
					<input
						name="plusCode"
						class="input input-bordered w-full"
						placeholder="Plus Code (optional)"
						value={props.formData.plusCode ?? ""}
						onInput={(e) =>
							props.setFormData("plusCode", e.currentTarget.value)
						}
					/>
				</label>
			</div>

			{/* Thumbnail / Reviews Link */}
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="form-control">
					<span class="label-text">Thumbnail URL</span>
					<input
						name="thumbnail"
						placeholder="Image URL (will use placeholder if empty)"
						class="input input-bordered w-full"
						value={props.formData.thumbnail ?? ""}
						onInput={(e) =>
							props.setFormData("thumbnail", e.currentTarget.value)
						}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Reviews Link</span>
					<input
						name="reviewsLink"
						placeholder="Link to reviews page (optional)"
						class="input input-bordered w-full"
						value={props.formData.reviewsLink ?? ""}
						onInput={(e) =>
							props.setFormData("reviewsLink", e.currentTarget.value)
						}
					/>
				</label>
			</div>

			{/* Description */}
			<label class="form-control mt-4">
				<span class="label-text">Description</span>
				<textarea
					name="description"
					placeholder="Short description or notes about the location"
					class="textarea textarea-bordered w-full"
					value={props.formData.description ?? ""}
					onInput={(e) =>
						props.setFormData("description", e.currentTarget.value)
					}
					rows={4}
				/>
			</label>

			{/* Contact */}
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<label class="form-control">
					<span class="label-text">Phone</span>
					<input
						name="phone"
						placeholder="+1 555-555-5555"
						class="input input-bordered w-full"
						value={props.formData.phone ?? ""}
						onInput={(e) => props.setFormData("phone", e.currentTarget.value)}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Website</span>
					<input
						name="website"
						placeholder="https://example.com"
						class="input input-bordered w-full"
						value={props.formData.website ?? ""}
						onInput={(e) => props.setFormData("website", e.currentTarget.value)}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Emails (comma separated)</span>
					<input
						name="emails"
						placeholder="owner@example.com, info@example.com"
						class="input input-bordered w-full"
						value={(props.formData.emails ?? []).join(", ")}
						onInput={(e) => onEmailsInput(e.currentTarget.value)}
					/>
				</label>
			</div>

			{/* Rating / ReviewCount / PriceRange */}
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<label class="form-control">
					<span class="label-text">Rating</span>
					<input
						name="rating"
						type="number"
						step="0.1"
						min="0"
						max="5"
						placeholder="0.0 - 5.0"
						class="input input-bordered w-full"
						value={props.formData.rating ?? ""}
						onInput={(e) =>
							props.setFormData(
								"rating",
								e.currentTarget.value === ""
									? undefined
									: Number(e.currentTarget.value),
							)
						}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Review Count</span>
					<input
						name="reviewCount"
						type="number"
						min="0"
						placeholder="Total reviews"
						class="input input-bordered w-full"
						value={props.formData.reviewCount ?? ""}
						onInput={(e) =>
							props.setFormData(
								"reviewCount",
								e.currentTarget.value === ""
									? undefined
									: Number(e.currentTarget.value),
							)
						}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Price Range</span>
					<input
						name="priceRange"
						class="input input-bordered w-full"
						placeholder="e.g. ₦₦, ₦25,000–30,000"
						value={props.formData.priceRange ?? ""}
						onInput={(e) =>
							props.setFormData("priceRange", e.currentTarget.value)
						}
					/>
				</label>
			</div>

			{/* Timezone / Owner */}
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<label class="form-control">
					<span class="label-text">Timezone</span>
					<input
						name="timezone"
						class="input input-bordered w-full"
						placeholder="e.g. America/Los_Angeles"
						value={props.formData.timezone ?? ""}
						onInput={(e) =>
							props.setFormData("timezone", e.currentTarget.value)
						}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Owner Name</span>
					<input
						name="ownerName"
						placeholder="Owner name"
						class="input input-bordered w-full"
						value={props.formData.owner?.name ?? ""}
						onInput={(e) => upsertOwner({ name: e.currentTarget.value })}
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Owner Link</span>
					<input
						name="ownerLink"
						placeholder="https://owner.example.com"
						class="input input-bordered w-full"
						value={props.formData.owner?.link ?? ""}
						onInput={(e) => upsertOwner({ link: e.currentTarget.value })}
					/>
				</label>
			</div>

			{/* Active toggle */}
			<label class="form-control mt-4 cursor-pointer">
				<div class="flex items-center gap-3">
					<span class="label-text">Active in system</span>
					<input
						type="checkbox"
						class="toggle toggle-primary"
						checked={Boolean(props.formData.isActive)}
						onInput={(e) =>
							props.setFormData("isActive", e.currentTarget.checked)
						}
					/>
				</div>
			</label>

			{/* ------------------ openHours UI ------------------ */}
			<div class="card mt-6 bg-base-100 p-3 shadow-sm">
				<div class="mb-2 flex items-center justify-between">
					<div class="font-semibold">Open Hours</div>
					<div class="text-base-content/70 text-sm">Enter as "Day: hours"</div>
				</div>

				<div class="flex flex-col gap-2 sm:flex-row">
					<input
						class="input input-bordered flex-1"
						placeholder="e.g. Monday: 8 am–5 pm"
						value={openHourInput()}
						onInput={(e) => setOpenHourInput(e.currentTarget.value)}
						onKeyDown={(e) =>
							e.key === "Enter" && (e.preventDefault(), addOpenHour())
						}
					/>
					<button type="button" class="btn btn-primary" onClick={addOpenHour}>
						Add
					</button>
				</div>

				<div class="mt-3 flex flex-wrap gap-2">
					{Object.entries(props.formData.openHours ?? {}).map(([day, arr]) =>
						arr.map((h, idx) => (
							<div class="badge badge-outline" role="listitem">
								<span class="mr-2">
									{day}: {h}
								</span>
								<button
									type="button"
									class="btn btn-xs btn-ghost"
									onClick={() => removeOpenHour(day, idx)}
								>
									✕
								</button>
							</div>
						)),
					)}
				</div>
			</div>

			{/* ------------------ Images UI ------------------ */}
			<div class="card mt-6 bg-base-100 p-3 shadow-sm">
				<div class="mb-2 flex items-center justify-between">
					<div class="font-semibold">Images</div>
					<div class="text-base-content/70 text-sm">Add image title + URL</div>
				</div>

				<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
					<input
						class="input input-bordered col-span-1"
						placeholder="Title (optional)"
						value={imageTitleInput()}
						onInput={(e) => setImageTitleInput(e.currentTarget.value)}
					/>
					<input
						class="input input-bordered col-span-1 sm:col-span-2"
						placeholder="Image URL"
						value={imageUrlInput()}
						onInput={(e) => setImageUrlInput(e.currentTarget.value)}
						onKeyDown={(e) =>
							e.key === "Enter" && (e.preventDefault(), addImage())
						}
					/>
				</div>

				<div class="mt-2 flex gap-2">
					<button type="button" class="btn btn-primary" onClick={addImage}>
						Add Image
					</button>
				</div>

				<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
					<For each={props.formData.images ?? []}>
						{(img, i) => (
							<div class="card bg-base-200 p-2">
								<div class="flex items-center gap-2">
									<img
										src={getProxiedImageUrl(img.image)}
										alt={img.title}
										class="h-12 w-20 rounded object-cover"
									/>
									<div class="flex-1">
										<div class="font-semibold text-sm">{img.title}</div>
										<div class="truncate text-base-content/60 text-xs">
											{img.image}
										</div>
									</div>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onClick={() => removeImage(i())}
									>
										Remove
									</button>
								</div>
							</div>
						)}
					</For>
				</div>
			</div>

			{/* ------------------ About tags UI ------------------ */}
			<div class="card mt-6 bg-base-100 p-3 shadow-sm">
				<div class="mb-2 flex items-center justify-between">
					<div class="font-semibold">About (tags)</div>
					<div class="text-base-content/70 text-sm">
						Tags describing features/amenities
					</div>
				</div>

				<div class="flex gap-2">
					<input
						class="input input-bordered flex-1"
						placeholder="Add tag (e.g. playground)"
						value={aboutTagInput()}
						onInput={(e) => setAboutTagInput(e.currentTarget.value)}
						onKeyDown={(e) =>
							e.key === "Enter" && (e.preventDefault(), addAboutTag())
						}
					/>
					<button type="button" class="btn btn-primary" onClick={addAboutTag}>
						Add
					</button>
				</div>

				<div class="mt-3 flex flex-wrap gap-2">
					<For each={props.formData.about ?? []}>
						{(a, idx) => (
							<div class="badge badge-lg" role="listitem">
								<span class="mr-2">{a.name}</span>
								<button
									type="button"
									class="btn btn-xs btn-ghost"
									onClick={() => removeAbout(idx())}
								>
									✕
								</button>
							</div>
						)}
					</For>
				</div>
			</div>
		</>
	);
}

function CreateLocationModal(props: {
	modalId: string;
	formData: Mutable<RecreationalLocationSchema>;
	setFormData: SetStoreFunction<Mutable<RecreationalLocationSchema>>;
	categories: ReadonlyArray<string>;
	isLoading: boolean;
	onCancel: () => void;
	onSubmit: () => Promise<void>;
}) {
	return (
		<GenericModal modalId={props.modalId} class="w-full max-w-4xl">
			<div class="prose mx-auto max-w-full p-3">
				<h2 class="font-bold text-xl">Create Location</h2>

				<form
					method="post"
					class="grid gap-3"
					onSubmit={(e) => e.preventDefault()}
				>
					<LocationForm
						formData={props.formData}
						setFormData={props.setFormData}
						categories={props.categories}
					/>

					<div class="flex justify-end gap-2 pt-2">
						<GenericButton
							class="btn-ghost"
							type="button"
							onClick={props.onCancel}
						>
							Cancel
						</GenericButton>

						<GenericButton
							class="btn btn-primary"
							onClick={async () => await props.onSubmit()}
						>
							{props.isLoading ? "Creating..." : "Create"}
						</GenericButton>
					</div>
				</form>
			</div>
		</GenericModal>
	);
}

function EditLocationModal(props: {
	modalId: string;
	formData: Mutable<RecreationalLocationSchema>;
	setFormData: SetStoreFunction<Mutable<RecreationalLocationSchema>>;
	categories: readonly string[];
	isLoading: boolean;
	onCancel: () => void;
	onSubmit: () => Promise<void>;
}) {
	return (
		<GenericModal modalId={props.modalId} class="w-full max-w-4xl">
			<div class="prose mx-auto max-w-full p-3">
				<h2 class="font-bold text-xl">Edit Location</h2>

				<form class="grid gap-3" onSubmit={(e) => e.preventDefault()}>
					<input type="hidden" name="id" value={props.formData.id} />
					<LocationForm
						formData={props.formData}
						setFormData={props.setFormData}
						categories={props.categories}
					/>

					<div class="flex justify-end gap-2 pt-2">
						<GenericButton
							class="btn-ghost"
							type="button"
							onClick={props.onCancel}
						>
							Cancel
						</GenericButton>

						<GenericButton
							class="btn btn-primary"
							onClick={async () => await props.onSubmit()}
						>
							{props.isLoading ? "Saving..." : "Save Changes"}
						</GenericButton>
					</div>
				</form>
			</div>
		</GenericModal>
	);
}

function ViewLocationModal(props: {
	modalId: string;
	formData: Mutable<RecreationalLocationSchema>;
	onClose: () => void;
}) {
	return (
		<GenericModal modalId={props.modalId} class="w-full max-w-4xl">
			<div class="prose mx-auto max-w-full p-3">
				<h2 class="font-bold text-xl">Location Details</h2>

				<div class="grid gap-3">
					<div class="flex items-start gap-4">
						<img
							src={getProxiedImageUrl(props.formData.thumbnail)}
							alt={props.formData.title}
							class="h-28 w-40 rounded object-cover"
						/>

						<div>
							<h3 class="font-semibold text-lg">{props.formData.title}</h3>
							<div class="text-base-content/70 text-sm">
								{props.formData.category ?? "Other"} •{" "}
								{props.formData.address ?? "N/A"}
							</div>
						</div>
					</div>

					<div>
						<div class="label">
							<span class="label-text">Raw Data</span>
						</div>

						<pre class="max-h-64 overflow-auto rounded bg-base-200 p-2 text-xs">
							{JSON.stringify(props.formData, null, 2)}
						</pre>
					</div>

					<div class="flex justify-end gap-2 pt-2">
						<GenericButton class="btn-ghost" onClick={props.onClose}>
							Close
						</GenericButton>
					</div>
				</div>
			</div>
		</GenericModal>
	);
}

export default function OwnerPage() {
	// fetch owner's locations (existing)
	const queryOwnerRecreationalLocations = query(async () => {
		const { locations = [] } = (await getOwnerData()) ?? {};

		const fullDataLocationPromises = locations.map((loc) =>
			queryRecreationalLocationById(loc.id),
		);

		return (await Promise.allSettled(fullDataLocationPromises)).reduce<
			RecreationalLocationSchema[]
		>((acc, val) => {
			if (val.status === "fulfilled" && val.value) acc.push(val.value);
			return acc;
		}, []);
	}, "get-owner-recreational-locations");

	const ownerRecreationalLocations = createAsync(
		() => queryOwnerRecreationalLocations(),
		{ initialValue: [] },
	);

	// categories suggestions resource (used by LocationForm datalist)
	const categoriesAsync = createAsync(
		() => queryAllRecreationalLocationCategories(),
		{ initialValue: [] },
	);
	const categories = createMemo(() => categoriesAsync() ?? []);

	const SortKeySchema = v.union([v.literal("title"), v.literal("category")]);
	type SortKeySchema = v.InferOutput<typeof SortKeySchema>;

	const [search, setSearch] = createSignal("");
	const [sortKey, setSortKey] = createSignal<SortKeySchema>("title");
	const [sortDir, setSortDir] = createSignal<"asc" | "desc">("asc");
	const [isActionLoading, setIsActionLoading] = createSignal(false);

	const createModalId = generateRandomUUID();
	const viewModalId = generateRandomUUID();
	const editModalId = generateRandomUUID();

	const [formData, setFormData] = createStore<
		Mutable<RecreationalLocationSchema>
	>(structuredClone(DUMMY_RECREATIONAL_LOCATION_DATA));

	async function setOwnerOnLocationData() {
		const info = await getCurrentUserInfo();
		if (!info) throw Error("No owner data detected");
		setFormData("owner", { id: info.id, name: info.name, link: URL });
	}

	const locations = createMemo(() => {
		const base = ownerRecreationalLocations();
		const term = search().trim().toLowerCase();
		const filtered = term
			? base.filter((l) =>
					String(l.title ?? "")
						.toLowerCase()
						.includes(term),
				)
			: base.slice();

		const key = sortKey();
		filtered.sort((a, b) => {
			const av = (a[key] ?? "").toLowerCase();
			const bv = (b[key] ?? "").toLowerCase();
			if (av === bv) return 0;
			const res = av < bv ? -1 : 1;
			return sortDir() === "asc" ? res : -res;
		});

		return filtered;
	});

	function confirmDelete(id: string, title: string) {
		triggerConfirmationModal(
			async () => {
				setIsActionLoading(true);
				await deleteUserRecreationalLocationTableEntry(id);
				// Revalidate owner list, categories and the specific location cache
				try {
					await Promise.all([
						revalidateRecreationalLocationById(),
						revalidateRecreationalLocationCategories(),
						revalidate(queryOwnerRecreationalLocations.key),
					]);
				} catch {
					// Fallback to revalidating the owner query key if any helper fails
					await revalidate(queryOwnerRecreationalLocations.key);
				}
				closeModal(viewModalId);
				setIsActionLoading(false);
			},
			<div>
				Delete <span class="font-semibold text-primary">{title}</span>{" "}
				permanently?
			</div>,
		);
	}

	function openViewModal(data: RecreationalLocationSchema) {
		setFormData(data);
		showModal(viewModalId);
	}

	function openEditModal(data: RecreationalLocationSchema) {
		setFormData(data);
		showModal(editModalId);
	}

	function openCreateModal() {
		setFormData(structuredClone(DUMMY_RECREATIONAL_LOCATION_DATA));
		showModal(createModalId);
	}

	async function handleCreate() {
		setIsActionLoading(true);
		await setOwnerOnLocationData();
		const created = await createUserRecreationalLocationTableEntry(formData);
		// Revalidate owner list, categories and the newly created record if possible
		try {
			await Promise.all([
				revalidateRecreationalLocationById(),
				revalidateRecreationalLocationCategories(),
				revalidate(queryOwnerRecreationalLocations.key),
			]);
		} catch {
			// Ensure the owner listing is at least revalidated on error
			await revalidate(queryOwnerRecreationalLocations.key);
		}
		closeModal(createModalId);
		setIsActionLoading(false);
	}

	async function handleEdit() {
		setIsActionLoading(true);
		await setOwnerOnLocationData();
		await updateUserRecreationalLocationTableEntry(formData.id, formData);
		// Revalidate owner list, categories and the updated record
		try {
			await Promise.all([
				revalidateRecreationalLocationById(),
				revalidateRecreationalLocationCategories(),
				revalidate(queryOwnerRecreationalLocations.key),
			]);
		} catch {
			await revalidate(queryOwnerRecreationalLocations.key);
		}
		closeModal(editModalId);
		setIsActionLoading(false);
	}

	return (
		<div class="size-full overflow-y-auto overflow-x-clip bg-base-200/50">
			<div class="container relative mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-4">
				<BackNavigationButton />

				<div class="hero rounded-box bg-base-100 shadow-md">
					<div class="hero-content px-4 py-6 text-center">
						<div class="max-w-full space-y-2">
							<h1 class="break-words font-bold text-xl sm:text-2xl">
								Owner Portal
							</h1>
							<p class="break-words text-base-content/70 text-xs sm:text-sm">
								Manage the recreational locations you created. Use the buttons
								to create, view, edit, or remove items.
							</p>
						</div>
					</div>
				</div>

				{/* Controls */}
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-2">
						<input
							type="search"
							placeholder="Search by title..."
							class="input input-bordered w-40"
							value={search()}
							onInput={(e) => setSearch(e.currentTarget.value)}
						/>

						<select
							class="select select-bordered w-40"
							value={sortKey()}
							onInput={(e) =>
								setSortKey(v.parse(SortKeySchema, e.currentTarget.value))
							}
						>
							<option value="title">Title</option>
							<option value="category">Category</option>
						</select>

						<button
							type="button"
							class="btn btn-ghost btn-square"
							onClick={() => setSortDir(sortDir() === "asc" ? "desc" : "asc")}
							aria-label="Toggle sort direction"
						>
							{sortDir() === "asc" ? (
								<AscendingOrderIcon />
							) : (
								<DescendingOrderIcon />
							)}
						</button>
					</div>

					<div>
						<GenericButton class="btn btn-primary" onClick={openCreateModal}>
							Create Location
						</GenericButton>
					</div>
				</div>

				{/* Table */}
				<div class="card overflow-auto bg-base-100 shadow-md">
					<table class="table-compact table w-full">
						<thead>
							<tr>
								<th>Thumbnail</th>
								<th>Title</th>
								<th>Category</th>
								<th class="hidden sm:table-cell">Address</th>
								<th>Actions</th>
							</tr>
						</thead>

						<tbody>
							<Show
								when={locations().length > 0}
								fallback={
									<tr>
										<td colSpan={5}>
											<div class="p-4 text-center text-base-content/70">
												No locations found.
											</div>
										</td>
									</tr>
								}
							>
								<Index each={locations()}>
									{(loc) => (
										<tr>
											<td class="max-w-[6rem] p-2">
												<img
													src={getProxiedImageUrl(loc().thumbnail)}
													alt={loc().title}
													class="h-16 w-24 rounded object-cover"
												/>
											</td>
											<td class="break-words">{loc().title}</td>
											<td class="break-words">{loc().category ?? "Other"}</td>
											<td class="hidden break-words sm:table-cell">
												{loc().address ?? "N/A"}
											</td>
											<td>
												<div class="flex gap-2">
													<button
														type="button"
														class="btn btn-ghost btn-sm"
														onClick={() => openViewModal(loc())}
													>
														<ViewIcon />
														<span class="hidden md:inline-block">View</span>
													</button>
													<button
														type="button"
														class="btn btn-outline btn-sm"
														onClick={() => openEditModal(loc())}
													>
														<EditIcon />
														<span class="hidden md:inline-block">Edit</span>
													</button>
													<button
														type="button"
														class="btn btn-error btn-sm"
														onClick={() => confirmDelete(loc().id, loc().title)}
													>
														<DeleteIcon />
														<span class="hidden md:inline-block">Delete</span>
													</button>
												</div>
											</td>
										</tr>
									)}
								</Index>
							</Show>
						</tbody>
					</table>
				</div>

				<Show when={isActionLoading()}>
					<div class="fixed inset-0 z-[999999] grid place-items-center bg-black/30">
						<div class="card bg-base-100 p-6 shadow-lg">
							<div class="flex items-center gap-3">
								<span class="loading loading-spinner"></span>
								<span>Processing...</span>
							</div>
						</div>
					</div>
				</Show>
			</div>

			{/* Modals */}
			<CreateLocationModal
				modalId={createModalId}
				formData={formData}
				setFormData={setFormData}
				categories={categories()}
				isLoading={isActionLoading()}
				onCancel={() => closeModal(createModalId)}
				onSubmit={handleCreate}
			/>

			<ViewLocationModal
				modalId={viewModalId}
				formData={formData}
				onClose={() => closeModal(viewModalId)}
			/>

			<EditLocationModal
				modalId={editModalId}
				formData={formData}
				setFormData={setFormData}
				categories={categories()}
				isLoading={isActionLoading()}
				onCancel={() => closeModal(editModalId)}
				onSubmit={handleEdit}
			/>
		</div>
	);
}
