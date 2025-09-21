import { createAuthClient } from "better-auth/solid";

export const AUTH_CLIENT = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	// baseURL: "http://localhost:3000"
});
