import { useParams } from "@solidjs/router";
import { parkdata } from "~/data/parkdata";

export default function ParkDetails() {
	const params = useParams();
	const park = parkdata.find((p: { id: number }) => p.id === Number(params.id));

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
