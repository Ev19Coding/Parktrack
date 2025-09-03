import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import "./app.css";

export default function App() {
	return (
		<Router
			root={(props) => (
				<div class="w-screen h-screen flex flex-col">
					<Nav />
					<div class="grow">
						<Suspense>{props.children}</Suspense>
					</div>
				</div>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
export function search() {
	return <input type="search" placeholder="Search..." name="search" id="#" />;
}
