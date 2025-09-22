import { A, redirect, useNavigate } from "@solidjs/router";

export default function NotFound() {
	// Navigate back to the login page
	useNavigate()("/");

	return "";
}
