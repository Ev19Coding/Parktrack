import { useParams } from "@solidjs/router";
import { parks } from "../../data/parks";

export default function ParkDetails() {
  const params = useParams();
  const park = parks.find((p) => p.id === params.id);

  if (!park) {
    return <h1>Park not found</h1>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>{park.name}</h1>
      
      <p><strong>Address:</strong> {park.address}</p>
      <p><strong>Entry Fee:</strong> {park.entryFee}</p>
      <p><strong>Phone:</strong> {park.phone}</p>
    </div>
  );
}
