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
				"/user/report",
				"/owner",
				"/owner/report",
				"/favourite",
				// ...Array.from({ length: 1100 }, (_, i) => `/info/${i}`),
			],
		},
	},
});
