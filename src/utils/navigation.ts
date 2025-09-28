import { useNavigate } from "@solidjs/router";

// Navigate back to the previous page or login page
export function goBackToPreviousRoute() {
	if (window.history.length > 1) {
		window.history.back();
	} else {
		useNavigate()("/");
	}
}
