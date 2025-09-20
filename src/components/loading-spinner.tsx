/** This will grow to fill up its nearest postioned parent */
export default function LoadingSpinner() {
	return (
		<div class="absolute top-0 left-0 z-[999999] flex size-full items-center justify-center bg-black/75 backdrop-blur-xs">
			<span class="loading loading-spinner loading-xl"></span>
		</div>
	);
}
