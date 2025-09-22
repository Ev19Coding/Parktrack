import { createAsync } from "@solidjs/router";
import { getAdminData } from "~/utils/user";

export default function AdminPage() {
	const adminData = createAsync(() => getAdminData());

	return "TODO";
}
