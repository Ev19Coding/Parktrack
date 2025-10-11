import { Show } from "solid-js";
import { Portal } from "solid-js/web";

/** This will grow to fill up its nearest postioned parent */
export default function LoadingSpinner(prop: { fullScreen?: boolean }) {
	function Spinner() {
		return (
			<div
				class={`absolute inset-0 z-[999999] flex size-full items-center justify-center bg-black/75 backdrop-blur-xs ${prop.fullScreen ? "fixed" : "absolute"}`}
			>
				<span class="loading loading-spinner loading-xl"></span>
			</div>
		);
	}

	return (
		<Show when={prop.fullScreen} fallback={<Spinner />}>
			<Portal>
				<Spinner />
			</Portal>
		</Show>
	);
}
