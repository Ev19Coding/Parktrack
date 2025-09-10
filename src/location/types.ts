import type { JawgsLocationResult } from "./jawg-geocoding";

export type LocationApiResult = JawgsLocationResult & { api: "jawg" };
