import { describe, it, expect } from "vitest";
import { getProxiedImageUrl } from "./image";
import { PLACEHOLDER_IMG } from "~/shared/constants";

describe("getProxiedImageUrl", () => {
	it("should return placeholder image unchanged", () => {
		const result = getProxiedImageUrl(PLACEHOLDER_IMG);
		expect(result).toBe(PLACEHOLDER_IMG);
	});

	it("should proxy external URLs", () => {
		const externalUrl = "https://example.com/image.jpg";
		const result = getProxiedImageUrl(externalUrl);
		expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(externalUrl)}`);
	});

	it("should handle URLs with special characters", () => {
		const urlWithSpaces = "https://example.com/image with spaces.jpg";
		const result = getProxiedImageUrl(urlWithSpaces);
		expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(urlWithSpaces)}`);
	});
});
