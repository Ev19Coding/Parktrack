import { clientOnly } from "@solidjs/start";
import { parkdata } from "~/data/parkdata";
import SearchableParks from "../components/search";
const ParkMapClient = clientOnly(() => import("../components/ParkMap"));


export default function Home() {
  return (
    <div>

      <SearchableParks />
      
      <ParkMapClient />
    </div>
    
  );
}


