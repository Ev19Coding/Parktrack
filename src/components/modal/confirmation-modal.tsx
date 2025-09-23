import type { JSX } from "solid-js/jsx-runtime";
import { createStore } from "solid-js/store";
import { generateRandomUUID } from "~/utils/random";
import { GenericButton } from "../button";
import { closeModal, GenericModal, showModal } from "./generic-modal";

const [prop, setProp] = createStore<{
	modalId: string;
	onConfirm: () => Promise<unknown>;
	children: JSX.Element;
}>({
	modalId: generateRandomUUID(),
	onConfirm: async () => void 0,
	children: "",
});

/** Used to confirm destructive actions and such.
 *
 * Only one can be active at any given time and this component must be anchored in the root app.
 */
export function ConfirmationModal() {
	function closeConfirmationModal() {
		closeModal(prop.modalId);
	}

	return (
		<GenericModal modalId={prop.modalId} z-index={99_999}>
			<div class="mb-4 text-center">
				{prop.children || (
					<div class="text-warning">
						You are about to perform a potentially{" "}
						<strong class="text-warning">destructive</strong> action. Do you
						wish to continue?
					</div>
				)}
			</div>

			<div class="modal-action">
				<GenericButton class="btn-primary" onClick={closeConfirmationModal}>
					Changed my mind...
				</GenericButton>

				<GenericButton
					class="btn-error"
					onClick={async (_) => {
						await prop.onConfirm();

						closeConfirmationModal();
					}}
				>
					Confirm
				</GenericButton>
			</div>
		</GenericModal>
	);
}

/** Call this anywhere to trigger the confirmation modal */
export function triggerConfirmationModal(
	confirmCallBack: () => Promise<unknown>,
	message?: JSX.Element,
) {
	setProp({ children: message ?? "", onConfirm: confirmCallBack });

	showModal(prop.modalId);
}
