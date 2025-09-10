import { Index, type JSXElement } from "solid-js";

function DataSection(prop: {
	data: unknown[];
	header: JSXElement;
	class: string;
}) {
	return (
		<section class={`space-y-2 overflow-auto ${prop.class}`}>
			<h2 class="font-bold text-xl">{prop.header}</h2>

			<div class="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-3">
				<Index each={prop.data}>
					{(_) => (
						<div class="size-36 place-self-center rounded-box bg-base-200 md:size-40 lg:size-44"></div>
					)}
				</Index>
			</div>
		</section>
	);
}

export function UserParkSection() {
	return (
		<DataSection
			class="lg:col-[1/2] lg:row-span-2"
			data={Array(15)}
			header="Parks"
		/>
	);
}

export function UserRestaurantSection() {
	return (
		<DataSection
			class="lg:col-[2/3] lg:row-span-2"
			data={Array(4)}
			header="Restaurants"
		/>
	);
}
