/**
 * @returns cleanup event listener function
 */
export function makeElementDraggable(ele: HTMLElement) {
	function drag(e: MouseEvent | TouchEvent) {
		let pageX: number, pageY: number;

		if (e instanceof MouseEvent) {
			pageX = e.pageX;
			pageY = e.pageY;
		} else if (e instanceof TouchEvent && e.touches.length > 0) {
			pageX = e.touches[0]?.pageX ?? 0;
			pageY = e.touches[0]?.pageY ?? 0;
		} else {
			return;
		}

		ele.style.transform = `translate(${pageX - 20}px, ${pageY - 20}px)`;
	}

	const mouseDownListener = () => document.addEventListener("mousemove", drag);
	const mouseUpListener = () => document.removeEventListener("mousemove", drag);

	const touchStartListener = () => document.addEventListener("touchmove", drag);
	const touchEndListener = () =>
		document.removeEventListener("touchmove", drag);

	ele.addEventListener("mousedown", mouseDownListener);
	ele.addEventListener("mouseup", mouseUpListener);

	ele.addEventListener("touchstart", touchStartListener);
	ele.addEventListener("touchend", touchEndListener);

	return () => {
		ele.removeEventListener("mousedown", mouseDownListener);
		ele.removeEventListener("mouseup", mouseUpListener);
		ele.removeEventListener("touchstart", touchStartListener);
		ele.removeEventListener("touchend", touchEndListener);
	};
}
