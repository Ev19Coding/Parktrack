import { onMount } from "solid-js";
import { goBackToPreviousRoute } from "~/utils/navigation";

export default function NotFound() {
	// Navigate back to the previous page or login page
	onMount(goBackToPreviousRoute);

	return "";
}
