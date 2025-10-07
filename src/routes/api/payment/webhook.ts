import { verifyWebhookSignature } from "~/server/lib/payment";

export async function POST(request: Request) {
  const signature = request.headers.get('verif-hash');
  
  if (!signature || signature !== process.env["FLUTTERWAVE_WEBHOOK_HASH"]) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload = await request.text();
  const isValid = verifyWebhookSignature(signature, payload);
  
  if (!isValid) {
    return new Response('Invalid webhook signature', { status: 401 });
  }

  const event = JSON.parse(payload);

  // Handle different webhook events
  switch (event.event) {
    case 'charge.completed':
      if (event.data.status === 'successful') {
        // Update reservation status in your database
        // You'll need to implement this based on your database structure
        await updateReservationStatus(
          event.data.meta.locationId,
          event.data.meta.reservationDate,
          'confirmed'
        );
      }
      break;
    
    case 'transfer.completed':
      // Handle transfer completion
      break;
    
    default:
      // Handle other events
      break;
  }

  return new Response('Webhook processed successfully', { status: 200 });
}

async function updateReservationStatus(
  locationId: string,
  reservationDate: string,
  status: 'confirmed' | 'pending' | 'cancelled'
) {
  // Implement your database update logic here
  // This will depend on your database schema and structure
}