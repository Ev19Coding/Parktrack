import { PLACEHOLDER_IMG } from "~/shared/constants";
/** Will perform some edits to make the browser properly cache external image requests */
export function getProxiedImageUrl(originalImgUrl: string) {
	if (originalImgUrl === PLACEHOLDER_IMG) return PLACEHOLDER_IMG;

	return `/api/image-proxy?url=${encodeURIComponent(originalImgUrl)}`;
}
