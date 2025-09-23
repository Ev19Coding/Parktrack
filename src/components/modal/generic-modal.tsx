import { ReactiveMap } from "@solid-primitives/map";
import { createSignal, type JSX, Show, type Signal } from "solid-js";
import { Portal } from "solid-js/web";

/** So we can have multiple dialogs */
const signalMap = new ReactiveMap<string, Signal<boolean>>();

function performAfterDelay(callback: () => void, delay = 300) {
	setTimeout(() => callback(), delay);
}

/** Use to open the modal.
 * **<button class="btn" onclick="my_modal_2.showModal()">open modal</button>** */
function GenericModal(prop: {
	modalId: string;
	children: JSX.Element;
	class?: string;
	/** Normally, modal's have a z-index of 999 */
	"z-index"?: number | undefined;
}) {
	const signal = () => signalMap.get(prop.modalId);

	return (
		<Show when={signal()?.[0]()}>
			<Portal>
				<dialog
					closedby="closerequest"
					id={prop.modalId}
					class="modal"
					style={{ "z-index": prop["z-index"] ?? 999 }}
					onClose={(_) => {
						// Give a small delay so the animation completes
						performAfterDelay(() => signal()?.[1](false));
					}}
				>
					<div class={`modal-box max-h-[90vh] sm:max-h-[85vh] ${prop.class}`}>
						<form method="dialog">
							<button
								type="submit"
								class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
								aria-label="Close Modal"
							>
								✕
							</button>

							<div>{prop.children}</div>
						</form>
					</div>
					<form method="dialog" class="modal-backdrop">
						<button type="submit">close</button>
					</form>
				</dialog>
			</Portal>
		</Show>
	);
}

function getDialogElementFromId(id: string): HTMLDialogElement | null {
	const dialog = document.getElementById(id);

	return dialog instanceof HTMLDialogElement ? dialog : null;
}

function getModalSignal(modalId: string) {
	return (
		signalMap.get(modalId) ??
		// biome-ignore lint/style/noNonNullAssertion: <Can't be null>
		signalMap.set(modalId, createSignal(false)).get(modalId)!
	);
}

function showModal(modalId: string) {
	// Mount the dialog's contents first
	const [modalSignal, setModalSignal] = getModalSignal(modalId);

	if (!modalSignal()) {
		setModalSignal(true);

		performAfterDelay(() => getDialogElementFromId(modalId)?.show(), 10);
	}
}

function closeModal(modalId: string) {
	getDialogElementFromId(modalId)?.close();

	// Unmount the dialog's contents
	const [_, setModalSignal] = getModalSignal(modalId);

	performAfterDelay(() => setModalSignal(false));
}

export { GenericModal, closeModal, showModal };
