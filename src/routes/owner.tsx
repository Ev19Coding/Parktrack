import { createAsync } from "@solidjs/router";
import { getOwnerData } from "~/utils/user-query";

export default function OwnerPage() {
	const ownerData = createAsync(() => getOwnerData());

	return "TODO";
}
