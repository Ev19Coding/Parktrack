import { createAsync } from "@solidjs/router";
import { getAdminData } from "~/utils/user-query";

export default function AdminPage() {
	const adminData = createAsync(() => getAdminData());

	return "TODO";
}
