import { A, createAsync, useLocation, useNavigate } from "@solidjs/router";
import HomePageIcon from "lucide-solid/icons/house";
import LogOutIcon from "lucide-solid/icons/log-out";
import SettingsIcon from "lucide-solid/icons/menu";
import TrashIcon from "lucide-solid/icons/trash-2";
import { createSignal, onCleanup, Show } from "solid-js";
import { AUTH_CLIENT } from "~/server/lib/auth-client";
import { makeElementDraggable } from "~/utils/draggable";
import { generateRandomUUID } from "~/utils/random";
import { isUserLoggedIn, revalidateUserLoginData } from "~/utils/user-query";
import { TooltipButton } from "./button";
import LoadingSpinner from "./loading-spinner";
import { triggerConfirmationModal } from "./modal/confirmation-modal";
import { Suspense } from "solid-js";

export default function SideBar() {
	const navigate = useNavigate();
	const location = useLocation();

	const [isLoading, setIsLoading] = createSignal(false);

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
							{(() => {
								const isLoggedIn = createAsync(() => isUserLoggedIn(), {
									initialValue: true,
								});

								return (
									<button
										type="button"
										onClick={async (_) => {
											setIsLoading(true);

											if (isLoggedIn()) {
												AUTH_CLIENT.signOut({
													fetchOptions: {
														onResponse() {
															setIsLoading(false);
														},
														onSuccess() {
															revalidateUserLoginData().then(() => {
																// Move to the log out page
																navigate("/");

																// Close the side bar
																drawerToggle$.click();
															});
														},
													},
												});
											} else {
												await revalidateUserLoginData();

												// Move to the log out page
												navigate("/");

												setIsLoading(false);
											}
										}}
									>
										<LogOutIcon />{" "}
										<Suspense>
											{isLoggedIn.latest ? "Log Out" : "Back to Login"}
										</Suspense>
									</button>
								);
							})()}
						</li>

						<li>
							<A href="/user">
								<HomePageIcon /> Homepage
							</A>
						</li>

						<li>
							<button type="button">
								<SettingsIcon />
								Settings
							</button>
						</li>

						{(() => {
							const isLoggedIn = createAsync(() => isUserLoggedIn());

							return (
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

														navigate("/");

														await revalidateUserLoginData();

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
							);
						})()}
					</ul>
				</div>
			</div>

			<Show when={isLoading()}>
				<LoadingSpinner />
			</Show>
		</Show>
	);
}
