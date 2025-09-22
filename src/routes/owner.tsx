import { createAsync } from "@solidjs/router";
import { getOwnerData } from "~/utils/user";

export default function AdminPage() {
	const ownerData = createAsync(() => getOwnerData());

	return "TODO";
}
