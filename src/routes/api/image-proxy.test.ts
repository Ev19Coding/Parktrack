import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./image-proxy";

// Create a vitest-managed stub for global.fetch so Vitest can restore it automatically.
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("image proxy API", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	it("should return 400 for missing URL", async () => {
		const request = new Request("http://localhost/api/image-proxy");
		const event = { request } as any;

		const response = await GET(event);

		expect(response.status).toBe(400);
	});

	it("should proxy image requests", async () => {
		const imageUrl = "https://example.com/image.jpg";
		const mockImageData = new ArrayBuffer(1024);

		mockFetch.mockResolvedValueOnce({
			ok: true,
			arrayBuffer: () => Promise.resolve(mockImageData),
			headers: new Headers([["Content-Type", "image/jpeg"]]),
		});

		const request = new Request(
			`http://localhost/api/image-proxy?url=${encodeURIComponent(imageUrl)}`,
		);
		const event = { request } as any;

		const response = await GET(event);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/jpeg");
		expect(mockFetch).toHaveBeenCalledWith(imageUrl, expect.any(Object));
	});

	it("should return 500 for fetch errors", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		const request = new Request(
			"http://localhost/api/image-proxy?url=https://bad-url.com/image.jpg",
		);
		const event = { request } as any;

		const response = await GET(event);

		expect(response.status).toBe(500);
	});
});
