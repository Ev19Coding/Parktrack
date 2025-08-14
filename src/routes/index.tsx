import { clientOnly } from "@solidjs/start";

const ParkMapClient = clientOnly(() => import("../components/ParkMap"));

export default function Home() {
  return (
    <div>
      <h1>Park Locator</h1>
      <ParkMapClient />
    </div>
  );
}
