/**
 * @returns cleanup event listeners
 */
export function makeElementDraggable(ele: HTMLElement) {
	function drag(e: MouseEvent) {
		ele.style.transform = `translate(${e.pageX - 20}px, ${e.pageY - 20}px)`;
	}

	const mouseDownListener = () => document.addEventListener("mousemove", drag);
	const mouseUpListener = () => document.removeEventListener("mousemove", drag);

	ele.addEventListener("mousedown", mouseDownListener);

	ele.addEventListener("mouseup", mouseUpListener);

	return [
		() => ele.removeEventListener("mousedown", mouseDownListener),
		() => ele.removeEventListener("mouseup", mouseUpListener),
	] as const;
}
