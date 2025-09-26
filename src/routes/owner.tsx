import { createAsync, query, revalidate } from "@solidjs/router";
import {  createMemo, createSignal, Index, Show } from "solid-js";
import { createStore, } from "solid-js/store";
import { BackNavigationButton, GenericButton } from "~/components/button";
import { triggerConfirmationModal } from "~/components/modal/confirmation-modal";
import {
	closeModal,
	GenericModal,
	showModal,
} from "~/components/modal/generic-modal";
import type { RecreationalLocationSchema } from "~/server/database/schema";
import { createUserRecreationalLocationTableEntry, deleteUserRecreationalLocationTableEntry, updateUserRecreationalLocationTableEntry } from "~/server/database/user/action";
import { getRecreationalLocationFromDatabaseById } from "~/server/database/user/query";
import { DEFAULTS, DUMMY_RECREATIONAL_LOCATION_DATA } from "~/shared/constants";
import { getProxiedImageUrl } from "~/utils/image";
import { generateRandomUUID } from "~/utils/random";
import { getOwnerData } from "~/utils/user-query";import * as v from "valibot"
import { Mutable } from "solidjs-use";
import { getCurrentUserInfo } from "~/server/user";
import AscendingOrderIcon from "lucide-solid/icons/arrow-down-a-z"
import DescendingOrderIcon from "lucide-solid/icons/arrow-down-z-a"

const {URL} = DEFAULTS

export default function OwnerPage() {
  const queryOwnerRecreationalLocations = query(async () => {
		const { locations = [] } = (await getOwnerData()) ?? {};

		const fullDataLocationPromises = locations.map((loc) =>
			getRecreationalLocationFromDatabaseById(loc.id),
		);

		return (await Promise.allSettled(fullDataLocationPromises)).reduce<RecreationalLocationSchema[]>((acc,val)=>{
		if (val.status === "fulfilled" && val.value) acc.push(val.value)

		return acc
		}, [])
	}, "get-owner-recreational-locations")

	const ownerRecreationalLocations = createAsync(()=>queryOwnerRecreationalLocations(), {initialValue:[]});

	const SortKeySchema = v.union([v.literal("title"), v.literal("category")])
	type SortKeySchema = v.InferOutput<typeof SortKeySchema>

	const [search, setSearch] = createSignal("");
	const [sortKey, setSortKey] = createSignal<SortKeySchema>("title");
	const [sortDir, setSortDir] = createSignal<"asc" | "desc">("asc");
	const [isActionLoading, setIsActionLoading] = createSignal(false);

	// modal ids (unique so multiple mounted modals won't clash)
	const createModalId = generateRandomUUID();
	const viewModalId = generateRandomUUID();
	const editModalId = generateRandomUUID();

	const [formData, setFormData] = createStore<Mutable<RecreationalLocationSchema>>(
		DUMMY_RECREATIONAL_LOCATION_DATA,
	);

	async function setOwnerOnLocationData(){
	const info = await getCurrentUserInfo()

	if (!info) throw Error("No owner data detected")

	setFormData("owner", {id:info.id,name:info.name,link:URL})
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
			const av = (a[key] ??"").toLowerCase();
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
			setIsActionLoading(true)

				await deleteUserRecreationalLocationTableEntry(id);

				await revalidate(queryOwnerRecreationalLocations.key)

				closeModal(viewModalId);

				setIsActionLoading(false)
			},
			<div>
				Delete <span class="font-semibold text-primary">{title}</span>{" "}
				permanently?
			</div>,
		);
	}

	function openViewModal(data:RecreationalLocationSchema){
	setFormData(data)

	showModal(viewModalId)
	}

	function openEditModal(data:RecreationalLocationSchema){
	setFormData(data)

	showModal(editModalId)
	}

	function openCreateModal(){
	setFormData(DUMMY_RECREATIONAL_LOCATION_DATA)

	showModal(createModalId)
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
							class="input input-bordered"
							value={search()}
							onInput={(e) => setSearch(e.currentTarget.value)}
						/>

						<select
							class="select select-bordered"
							value={sortKey()}
							onInput={(e) =>
								setSortKey(v.parse(SortKeySchema,e.currentTarget.value))
							}
						>
							<option value="title">Title</option>
							<option value="category">Category</option>
						</select>

						<button
							type="button"
							class="btn btn-ghost"
							onClick={() => setSortDir(sortDir() === "asc" ? "desc" : "asc")}
							aria-label="Toggle sort direction"
						>
							{sortDir() === "asc" ?  <AscendingOrderIcon/> : <DescendingOrderIcon/>}
						</button>
					</div>

					<div>
						<GenericButton
							class="btn-primary"
							onClick={() => showModal(createModalId)}
						>
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
													src={getProxiedImageUrl(
													loc().thumbnail
													)}
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
														View
													</button>
													<button
														type="button"
														class="btn btn-outline btn-sm"
														onClick={() => openEditModal(loc())}
													>
														Edit
													</button>
													<button
														type="button"
														class="btn btn-error btn-sm"
														onClick={() => confirmDelete(loc().id, loc().title)}
													>
														Delete
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

			{/* Create Modal */}
			<GenericModal modalId={createModalId} class="w-full max-w-4xl">
				<div class="prose mx-auto max-w-full p-2">
					<h2 class="font-bold text-xl">Create Location</h2>

					<form method="post" class="grid gap-3">
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<div>
								<label class="label">
									<span class="label-text">Title</span>
								</label>
								<input
									name="title"
									required
									class="input input-bordered w-full"
									value={formData.title}
									onInput={(e) => setFormData("title",e.currentTarget.value)}
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Category</span>
								</label>
								<input
									name="category"
									class="input input-bordered w-full"
									value={formData.category??""}
									onInput={(e) =>
										setFormData("category", e.currentTarget.value)
									}
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<div>
								<label class="label">
									<span class="label-text">Address</span>
								</label>
								<input
									name="address"
									class="input input-bordered w-full"
									value={formData.address??""}
									onInput={(e) =>
										setFormData("address", e.currentTarget.value)
									}
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Link</span>
								</label>
								<input
									name="link"
									class="input input-bordered w-full"
									value={formData.link}
									onInput={(e) => setFormData("link", e.currentTarget.value)}
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
							<div>
								<label class="label">
									<span class="label-text">Latitude</span>
								</label>
								<input
									name="latitude"
									class="input input-bordered w-full"
									value={formData.latitude}
									onInput={(e) =>
										setFormData("latitude", Number(e.currentTarget.value))
									}
									type="number"
									step="any"
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Longitude</span>
								</label>
								<input
									name="longitude"
									class="input input-bordered w-full"
									value={formData.longitude}
									onInput={(e) =>
										setFormData("longitude", Number(e.currentTarget.value))
									}
									type="number"
									step="any"
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Thumbnail URL</span>
								</label>
								<input
									name="thumbnail"
									class="input input-bordered w-full"
									value={formData.thumbnail}
									onInput={(e) =>
										setFormData("thumbnail", e.currentTarget.value)
									}
								/>
							</div>
						</div>

						<div class="flex justify-end gap-2 pt-2">
							<GenericButton
								class="btn-ghost"
								type="button"
								onClick={() => closeModal(createModalId)}
							>
								Cancel
							</GenericButton>

							<GenericButton class="btn-primary" onClick={async _=>{
							setIsActionLoading(true)

							await setOwnerOnLocationData()

							await createUserRecreationalLocationTableEntry(formData)


							await revalidate(queryOwnerRecreationalLocations.key)

							closeModal(createModalId)

							setIsActionLoading(false)

							}}>
								{isActionLoading() ? "Creating..." : "Create"}
							</GenericButton>
						</div>
					</form>
				</div>
			</GenericModal>

			{/* View Modal */}
			<GenericModal modalId={viewModalId} class="w-full max-w-4xl">
				<div class="prose mx-auto max-w-full p-2">
					<h2 class="font-bold text-xl">Location Details</h2>

					<Show when={formData} fallback={<div>No item selected.</div>}>
						{(location) => (
							<div class="grid gap-3">
								<div class="flex items-start gap-4">
									<img
										src={getProxiedImageUrl(location().thumbnail)}
										alt={location().title}
										class="h-28 w-40 rounded object-cover"
									/>

									<div>
										<h3 class="font-semibold text-lg">{location().title}</h3>
										<div class="text-base-content/70 text-sm">
											{location().category ?? "Other"} • {location().address ?? "N/A"}
										</div>
									</div>
								</div>

								<div>
									<label class="label">
										<span class="label-text">Raw Data</span>
									</label>
									<pre class="max-h-64 overflow-auto rounded bg-base-200 p-2 text-xs">
										{JSON.stringify(location(), null, 2)}
									</pre>
								</div>

								<div class="flex justify-end gap-2 pt-2">
									<GenericButton
										class="btn-ghost"
										onClick={() => closeModal(viewModalId)}
									>
										Close
									</GenericButton>
								</div>
							</div>
						)}
					</Show>
				</div>
			</GenericModal>

			{/* Edit Modal*/}
			<GenericModal modalId={editModalId} class="w-full max-w-4xl">
				<div class="prose mx-auto max-w-full p-2">
					<h2 class="font-bold text-xl">Edit Location</h2>

					<form class="grid gap-3">
						<input type="hidden" name="id" value={formData.id} />

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<div>
								<label class="label">
									<span class="label-text">Title</span>
								</label>
								<input
									name="title"
									required
									class="input input-bordered w-full"
									value={formData.title}
									onInput={(e) => setFormData("title", e.currentTarget.value)}
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Category</span>
								</label>
								<input
									name="category"
									class="input input-bordered w-full"
									value={formData.category ?? ""}
									onInput={(e) =>
										setFormData("category", e.currentTarget.value)
									}
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<div>
								<label class="label">
									<span class="label-text">Address</span>
								</label>
								<input
									name="address"
									class="input input-bordered w-full"
									value={formData.address ?? ""}
									onInput={(e) => setFormData("address", e.currentTarget.value)}
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Link</span>
								</label>
								<input
									name="link"
									class="input input-bordered w-full"
									value={formData.link}
									onInput={(e) => setFormData("link", e.currentTarget.value)}
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
							<div>
								<label class="label">
									<span class="label-text">Latitude</span>
								</label>
								<input
									name="latitude"
									class="input input-bordered w-full"
									value={formData.latitude}
									onInput={(e) =>
										setFormData("latitude", Number(e.currentTarget.value))
									}
									type="number"
									step="any"
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Longitude</span>
								</label>
								<input
									name="longitude"
									class="input input-bordered w-full"
									value={formData.longitude}
									onInput={(e) =>
										setFormData("longitude", Number(e.currentTarget.value))
									}
									type="number"
									step="any"
								/>
							</div>

							<div>
								<label class="label">
									<span class="label-text">Thumbnail URL</span>
								</label>
								<input
									name="thumbnail"
									class="input input-bordered w-full"
									value={formData.thumbnail}
									onInput={(e) =>
										setFormData("thumbnail", e.currentTarget.value)
									}
								/>
							</div>
						</div>

						<div class="flex justify-end gap-2 pt-2">
							<GenericButton
								class="btn-ghost"
								type="button"
								onClick={() => closeModal(editModalId)}
							>
								Cancel
							</GenericButton>

							<GenericButton class="btn-primary" onClick={async _=>{
							setIsActionLoading(true)

							await setOwnerOnLocationData()

							await updateUserRecreationalLocationTableEntry(formData.id, formData)

							await revalidate(queryOwnerRecreationalLocations.key)

							closeModal(editModalId)

							setIsActionLoading(false)

							}}>
								{isActionLoading() ? "Saving..." : "Save Changes"}
							</GenericButton>
						</div>
					</form>
				</div>
			</GenericModal>
		</div>
	);
}
