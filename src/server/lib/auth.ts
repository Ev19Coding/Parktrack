import { betterAuth } from "better-auth";
import { motherDuckAdapter } from "./motherduck-adapter.js";

const AUTH = betterAuth({
	database: motherDuckAdapter(),
	emailAndPassword: { enabled: true },
	user: {
		additionalFields: {
			type: { type: "string", defaultValue: "user" },
			favourites: { type: "string[]", defaultValue: [] },
		},
		deleteUser: {
			enabled: true,
		},
	},
});

export default AUTH;
