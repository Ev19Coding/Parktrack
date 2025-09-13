import type { APIEvent } from "@solidjs/start/server";

/** For applying the appropriate cache headers to images from external servers */
export async function GET({ request }: APIEvent) {
	const url = new URL(request.url);
	const imageUrl = url.searchParams.get("url");

	if (!imageUrl) {
		return new Response("Invalid image URL", { status: 400 });
	}

	try {
		const response = await fetch(imageUrl);
		const imageBuffer = await response.arrayBuffer();

		return new Response(imageBuffer, {
			headers: {
				"Content-Type": response.headers.get("Content-Type") || "image/jpeg",
				"Cache-Control": "public, max-age=86400, s-maxage=604800", // 1 day client, 1 week CDN
				ETag: response.headers.get("ETag") || "",
				"Last-Modified": response.headers.get("Last-Modified") || "",
			},
		});
	} catch {
		return new Response("Failed to fetch image", { status: 500 });
	}
}
