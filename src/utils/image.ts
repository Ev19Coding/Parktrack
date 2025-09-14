import PlaceholderImg from "~/assets/img/placeholder.webp";
/** Will perform some edits to make the browser properly cache external image requests */
export function getProxiedImageUrl(originalImgUrl: string) {
	if (originalImgUrl === PlaceholderImg) return PlaceholderImg;

	return `/api/image-proxy?url=${encodeURIComponent(originalImgUrl)}`;
}
