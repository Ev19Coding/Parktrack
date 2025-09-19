import crypto from "node:crypto";
import type { APIEvent } from "@solidjs/start/server";
import QuickLRU from "quick-lru";

// In-memory cache for image data (consider using Redis for production)
const imageCache = new QuickLRU<
	string,
	{
		data: ArrayBuffer;
		contentType: string;
		etag: string;
		lastModified: string;
	}
>({ maxSize: 1000, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours

function generateETag(data: ArrayBuffer): string {
	return `"${crypto.createHash("md5").update(Buffer.from(data)).digest("hex")}"`;
}

/** For applying the appropriate cache headers to images from external servers */
export async function GET({ request }: APIEvent) {
	const url = new URL(request.url);
	const imageUrl = url.searchParams.get("url");

	if (!imageUrl) {
		return new Response("Invalid image URL", { status: 400 });
	}

	const cacheKey = imageUrl;
	const cached = imageCache.get(cacheKey);

	// Handle conditional requests
	const ifNoneMatch = request.headers.get("If-None-Match");
	if (cached && ifNoneMatch && ifNoneMatch === cached.etag) {
		return new Response(null, { status: 304 });
	}

	// Return cached data if available
	if (cached) {
		return new Response(cached.data, {
			headers: {
				"Content-Type": cached.contentType,
				"Cache-Control":
					"public, max-age=86400, s-maxage=604800, stale-while-revalidate=3600",
				ETag: cached.etag,
				"Last-Modified": cached.lastModified,
			},
		});
	}

	try {
		const response = await fetch(imageUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; ParkTrack Image Proxy)",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.status}`);
		}

		const imageBuffer = await response.arrayBuffer();
		const contentType = response.headers.get("Content-Type") || "image/jpeg";
		const etag = generateETag(imageBuffer);
		const lastModified = new Date().toUTCString();

		// Cache the image data
		imageCache.set(cacheKey, {
			data: imageBuffer,
			contentType,
			etag,
			lastModified,
		});

		return new Response(imageBuffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control":
					"public, max-age=86400, s-maxage=604800, stale-while-revalidate=3600",
				ETag: etag,
				"Last-Modified": lastModified,
			},
		});
	} catch {
		return new Response("Failed to fetch image", { status: 500 });
	}
}
