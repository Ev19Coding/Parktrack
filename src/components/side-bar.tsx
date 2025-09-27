import { A, createAsync, useLocation, useNavigate } from "@solidjs/router";
import HomePageIcon from "lucide-solid/icons/house";
import LogOutIcon from "lucide-solid/icons/log-out";
import ListingsIcon from "lucide-solid/icons/map";
import SettingsIcon from "lucide-solid/icons/menu";
import StarIcon from "lucide-solid/icons/star";
import TrashIcon from "lucide-solid/icons/trash-2";
import { createSignal, onCleanup, Show, Suspense } from "solid-js";
import { AUTH_CLIENT } from "~/server/lib/auth-client";
import { makeElementDraggable } from "~/utils/draggable";
import { generateRandomUUID } from "~/utils/random";
import {
	queryIsUserOwner,
	queryUserLoggedIn,
	revalidateUserLoginData,
} from "~/utils/user-query";
import { TooltipButton } from "./button";
import LoadingSpinner from "./loading-spinner";
import { triggerConfirmationModal } from "./modal/confirmation-modal";

export default function SideBar() {
	const navigate = useNavigate();
	const location = useLocation();

	const [isLoading, setIsLoading] = createSignal(false);

	const isLoggedIn = createAsync(() => queryUserLoggedIn(), {
		initialValue: false,
	});

	const isUserOwner = createAsync(() => queryIsUserOwner(), {
		initialValue: false,
	});

	const drawerId = generateRandomUUID();

	let drawerToggle$!: HTMLInputElement;

	return (
		// No use of showing this on the login page
		<Show when={location.pathname !== "/"}>
			<div class="drawer">
				<input
					id={drawerId}
					type="checkbox"
					class="drawer-toggle"
					ref={drawerToggle$}
				/>
				<div class="drawer-content">
					<label for={drawerId} class="drawer-button">
						<TooltipButton
							tooltipText="Sidebar"
							tooltipDir="right"
							class="btn-square z-[99999] m-2 p-2 hover:shadow-md hover:shadow-primary/50"
							// Make a draggable button
							style={{ position: "fixed" }}
							ref={(ref) => {
								const listeners = makeElementDraggable(ref);

								onCleanup(() => {
									listeners();
								});
							}}
							onClick={(_) => {
								drawerToggle$.click();
							}}
						>
							<SettingsIcon class="size-8 text-base-content/50" />
						</TooltipButton>
					</label>
				</div>

				<div class="drawer-side z-[99999]">
					<label
						for={drawerId}
						aria-label="close sidebar"
						class="drawer-overlay"
					></label>

					<ul class="menu min-h-full w-52 justify-end gap-2 bg-base-200 p-4 py-8 text-base-content *:w-full *:font-semibold">
						<li>
							<button
								type="button"
								onClick={async (_) => {
									setIsLoading(true);
									try {
										if (isLoggedIn()) {
											// Wait for signOut to complete so server cookie/state is updated first
											await AUTH_CLIENT.signOut();
										}

										await revalidateUserLoginData();

										navigate("/");

										drawerToggle$.click();
									} finally {
										setIsLoading(false);
									}
								}}
							>
								<LogOutIcon />
								<Suspense>
									{isLoggedIn() ? "Log Out" : "Back to Login"}
								</Suspense>
							</button>
						</li>

						<Suspense>
							<Show when={isUserOwner()}>
								<li>
									<A
										href="/owner"
										onClick={(_) => {
											// Close the side bar
											drawerToggle$.click();
										}}
									>
										<ListingsIcon /> Your Listings
									</A>
								</li>
							</Show>
						</Suspense>

						<Suspense>
							<Show when={isLoggedIn()}>
								<li>
									<A
										href="/favourite"
										onClick={(_) => {
											// Close the side bar
											drawerToggle$.click();
										}}
									>
										<StarIcon /> Favourites
									</A>
								</li>
							</Show>
						</Suspense>

						<li>
							<A
								href="/user"
								onClick={(_) => {
									// Close the side bar
									drawerToggle$.click();
								}}
							>
								<HomePageIcon /> Homepage
							</A>
						</li>

						<li>
							<button type="button">
								<SettingsIcon />
								Settings
							</button>
						</li>

						<Suspense>
							<Show when={isLoggedIn()}>
								<li>
									<button
										type="button"
										class="text-error"
										onClick={(_) =>
											triggerConfirmationModal(async () => {
												setIsLoading(true);

												await AUTH_CLIENT.deleteUser();

												await revalidateUserLoginData();

												navigate("/");

												setIsLoading(false);
											}, "Account deletion is permanent. Are you sure?")
										}
									>
										<TrashIcon />
										Delete Account
									</button>
								</li>
							</Show>
						</Suspense>
					</ul>
				</div>
			</div>

			<Show when={isLoading()}>
				<LoadingSpinner />
			</Show>
		</Show>
	);
}
