import SettingsIcon from "lucide-solid/icons/menu";
import { onCleanup } from "solid-js";
import { makeElementDraggable } from "~/utils/draggable";
import { generateRandomUUID } from "~/utils/random";
import { TooltipButton } from "./button";

export default function SideBar() {
	const drawerId = generateRandomUUID();

	let drawerToggle$!: HTMLInputElement;

	return (
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

				<ul class="menu min-h-full w-48 bg-base-200 p-4 text-base-content md:w-64">
					<li>
						<a>Sidebar Item 1</a>
					</li>
					<li>
						<a>Sidebar Item 2</a>
					</li>
				</ul>
			</div>
		</div>
	);
}
