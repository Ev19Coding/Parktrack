import { useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";

export default function NotFound() {
	// Navigate back to the previous page or login page
	onMount(() => {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			useNavigate()("/");
		}
	});

	return "";
}
