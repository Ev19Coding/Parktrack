import { betterAuth } from "better-auth";
import { motherDuckAdapter } from "./motherduck-adapter.js";

const AUTH = betterAuth({
	database: motherDuckAdapter(),
	emailAndPassword: { enabled: true },
	user: {
		deleteUser: {
			enabled: true,
		},
	},
});

export default AUTH;
