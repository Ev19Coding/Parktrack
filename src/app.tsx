import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
	return (
		<Router
			root={(props) => (
				<div class="w-screen h-screen overflow-clip">
					<Suspense>{props.children}</Suspense>
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
