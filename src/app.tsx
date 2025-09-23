import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { ConfirmationModal } from "./components/modal/confirmation-modal";
import SideBar from "./components/side-bar";

export default function App() {
	return (
		<Router
			root={(props) => (
				<div class="h-screen w-screen overflow-clip">
					<SideBar />
					<ConfirmationModal />

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
