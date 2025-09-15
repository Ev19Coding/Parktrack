import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
	plugins: [solid()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test-setup.ts"],
		globals: true,
		deps: {
			optimizer: {
				web: {
					include: ["solid-js"],
				},
			},
		},
		server: {
			deps: {
				inline: ["solid-js"],
			},
		},
	},
	resolve: {
		conditions: ["development", "browser"],
		alias: {
			"~": new URL("./src", import.meta.url).pathname,
		},
	},
});
