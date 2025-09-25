import { Show } from "solid-js";

type Props =
	| {
			onClick: () => void;
			thumbnail: string;
			title: string;
			isSkeleton?: never;
	  }
	| {
			onClick?: never;
			thumbnail?: never;
			title?: never;
			isSkeleton: true;
	  };

export function RecreationalLocationDisplayButtonCard(prop: Props) {
	return (
		<button
			type="button"
			class={`relative size-36 cursor-pointer select-none place-self-center overflow-clip rounded-box bg-base-200 md:size-40 lg:size-44 ${prop.isSkeleton && "skeleton"}`}
			onClick={prop.onClick}
		>
			<Show when={!prop.isSkeleton}>
				<img
					src={prop.thumbnail}
					alt={prop.title}
					class="size-full object-cover brightness-90 transition-all hover:scale-105 hover:brightness-105"
				/>

				<div class="absolute top-2 left-2 w-9/10 truncate break-all font-semibold text-shadow-neutral text-shadow-xs">
					{prop.title}
				</div>
			</Show>
		</button>
	);
}
