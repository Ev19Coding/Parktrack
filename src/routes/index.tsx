import { A } from "@solidjs/router";
import Counter from "~/components/Counter";
import ParkMap from "../components/ParkMap";
import { lazy } from "solid-js";
import { clientOnly } from "@solidjs/start";


const ParkMapClient = clientOnly(() => import("../components/ParkMap"));

export default function Home() {
  return (
    <div>
      <ParkMapClient />
    </div>
  );
}



