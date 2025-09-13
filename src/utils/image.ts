/** Will perform some edits to make the browser properly cache external image requests */
export function getProxiedImageUrl(originalImgUrl: string) {
	return `/api/image-proxy?url=${encodeURIComponent(originalImgUrl)}`;
}
