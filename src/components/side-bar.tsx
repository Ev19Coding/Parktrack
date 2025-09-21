import SettingsIcon from "lucide-solid/icons/menu";
import { onCleanup } from "solid-js";
import { makeElementDraggable } from "~/utils/draggable";
import { TooltipButton } from "./button";

export default function SideBar() {
	return (
		<div class="drawer">
			<input id="my-drawer" type="checkbox" class="drawer-toggle" />
			<div class="drawer-content">
				<label for="my-drawer" class="drawer-button">
					<TooltipButton
						tooltipText="Sidebar"
						tooltipDir="right"
						class="btn-square z-[999999] m-2 p-2 hover:shadow-md hover:shadow-primary/50"
						// Make a draggable button
						style={{ position: "fixed" }}
						ref={(ref) => {
							const listeners = makeElementDraggable(ref);

							onCleanup(() => {
								listeners.forEach((listener) => {
									listener();
								});
							});
						}}
					>
						<SettingsIcon class="size-8 text-base-content/50" />
					</TooltipButton>
				</label>
			</div>
			<div class="drawer-side">
				<label
					for="my-drawer"
					aria-label="close sidebar"
					class="drawer-overlay"
				></label>
				<ul class="menu min-h-full w-80 bg-base-200 p-4 text-base-content">
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
