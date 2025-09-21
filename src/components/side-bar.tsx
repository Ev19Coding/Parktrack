import { useLocation, useNavigate } from "@solidjs/router";
import LogOutIcon from "lucide-solid/icons/log-out";
import SettingsIcon from "lucide-solid/icons/menu";
import { createSignal, onCleanup, Show } from "solid-js";
import { AUTH_CLIENT } from "~/server/lib/auth-client";
import { makeElementDraggable } from "~/utils/draggable";
import { generateRandomUUID } from "~/utils/random";
import { TooltipButton } from "./button";
import LoadingSpinner from "./loading-spinner";

export default function SideBar() {
	const navigate = useNavigate();
	const location = useLocation();

	const [isSigningOut, setIsSigningOut] = createSignal(false);

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

					<ul class="menu min-h-full w-48 justify-end gap-2 bg-base-200 p-4 py-8 text-base-content *:w-full *:font-semibold">
						<li>
							<button
								type="button"
								onClick={(_) => {
									setIsSigningOut(true);

									AUTH_CLIENT.signOut({
										fetchOptions: {
											onResponse() {
												setIsSigningOut(false);
											},
											onSuccess() {
												// Move to the log out page
												navigate("/");

												// Close the side bar
												drawerToggle$.click();
											},
										},
									});
								}}
							>
								<LogOutIcon /> Log Out
							</button>
						</li>

						<li>
							<button type="button">
								<SettingsIcon />
								Settings
							</button>
						</li>
					</ul>
				</div>
			</div>

			<Show when={isSigningOut()}>
				<LoadingSpinner />
			</Show>
		</Show>
	);
}
