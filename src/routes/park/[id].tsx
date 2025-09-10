import { useLocation, useParams } from "@solidjs/router";
import { parkdata } from "~/data/parkdata";
import { ParkRouteState } from "~/types/park-route";

export default function ParkDetails() {
	//@ts-expect-error I'll deal with the type issue later
	const state: ParkRouteState | null = useLocation().state;

	const park = parkdata.find((park) => park.name === state?.name);

	if (!park) return <p>Park not found</p>;

	return (
		<div>
			<section>
				<h1>{park.name}</h1>
				<p>{park.about}</p>
				<p>
					<strong>Hours:</strong> {park.hours}
				</p>
				<p>
					<strong>Phone:</strong> {park.phone}
				</p>
				{park.website && (
					<p>
						<a href={park.website} target="_blank">
							Visit Website
						</a>
					</p>
				)}
				<p>
					<strong>Address:</strong> {park.address}, {park.city}
				</p>
				<p>
					<strong>Wheelchair Accessible:</strong> {park.wheelchairAccessible}
				</p>
				<p>
					<strong>Price:</strong> {park.price}
				</p>

				<div>
					{park.social?.facebook && (
						<a href={park.social.facebook} target="_blank">
							Facebook
						</a>
					)}
					{park.social?.instagram && (
						<a href={park.social.instagram} target="_blank">
							Instagram
						</a>
					)}
				</div>
			</section>
		</div>
	);
}
