import { toSolidStartHandler } from "better-auth/solid-start";
import AUTH from "~/server/lib/auth";

export const { GET, POST } = toSolidStartHandler(AUTH);
