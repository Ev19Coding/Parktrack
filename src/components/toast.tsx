import AlertCircleIcon from "lucide-solid/icons/alert-circle";
import CheckCircleIcon from "lucide-solid/icons/check-circle";
import InfoIcon from "lucide-solid/icons/info";
import XIcon from "lucide-solid/icons/x";
import XCircleIcon from "lucide-solid/icons/x-circle";
import { createEffect, createSignal, For, onCleanup } from "solid-js";
import { generateRandomUUID } from "~/utils/random";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
	id: string;
	type: ToastType;
	title: string;
	message: string | undefined;
	duration?: number;
}

const [toasts, setToasts] = createSignal<Toast[]>([]);

function getToastIcon(type: ToastType) {
	switch (type) {
		case "success":
			return <CheckCircleIcon size={20} />;
		case "error":
			return <XCircleIcon size={20} />;
		case "warning":
			return <AlertCircleIcon size={20} />;
		case "info":
			return <InfoIcon size={20} />;
	}
}

function getToastAlertClass(type: ToastType) {
	switch (type) {
		case "success":
			return "alert-success";
		case "error":
			return "alert-error";
		case "warning":
			return "alert-warning";
		case "info":
			return "alert-info";
	}
}

function removeToast(id: string) {
	setToasts((prev) => prev.filter((toast) => toast.id !== id));
}

export function addToast(
	type: ToastType,
	title: string,
	message?: string,
	duration = 5000,
) {
	const id = generateRandomUUID();
	const toast: Toast = {
		id,
		type,
		title,
		message,
		duration,
	};

	setToasts((prev) => [...prev, toast]);

	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}

	return id;
}

export function ToastContainer() {
	return (
		<div class="toast toast-top toast-end z-[9999999]">
			<For each={toasts()}>
				{(toast) => (
					<ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
				)}
			</For>
		</div>
	);
}

function ToastItem(props: { toast: Toast; onClose: () => void }) {
	let timeoutId: ReturnType<typeof setTimeout>;

	createEffect(() => {
		if (props.toast.duration && props.toast.duration > 0) {
			timeoutId = setTimeout(props.onClose, props.toast.duration);
		}
	});

	onCleanup(() => {
		if (timeoutId) clearTimeout(timeoutId);
	});

	return (
		<div class={`alert ${getToastAlertClass(props.toast.type)} shadow-lg`}>
			<div class="flex items-start gap-3">
				{getToastIcon(props.toast.type)}
				<div class="flex-1">
					<div class="font-bold">{props.toast.title}</div>
					{props.toast.message && (
						<div class="text-sm opacity-90">{props.toast.message}</div>
					)}
				</div>
				<button
					type="button"
					class="btn btn-ghost btn-sm btn-square"
					onClick={props.onClose}
				>
					<XIcon size={16} />
				</button>
			</div>
		</div>
	);
}

// Convenience functions for common toast types
export const toast = {
	success: (title: string, message?: string, duration?: number) =>
		addToast("success", title, message, duration),
	error: (title: string, message?: string, duration?: number) =>
		addToast("error", title, message, duration),
	warning: (title: string, message?: string, duration?: number) =>
		addToast("warning", title, message, duration),
	info: (title: string, message?: string, duration?: number) =>
		addToast("info", title, message, duration),
};
