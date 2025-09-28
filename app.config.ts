import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	server: {
		compressPublicAssets: true,
		prerender: {
			crawlLinks: true,
			routes: [
				"/",
				"/user",
				"/owner",
				"/favourite",
				...Array.from({ length: 1100 }, (_, i) => `/info/${i}`),
			],
		},
	},
});
