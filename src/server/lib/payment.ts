import crypto from 'crypto';

export interface PaymentDetails {
  amount: number;
  email: string;
  name: string;
  phone: string;
  locationId: string;
  reservationDate: string;
}

export async function initializePayment(details: PaymentDetails) {
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env['FLUTTERWAVE_SECRET_KEY']}`
    },
    body: JSON.stringify({
      tx_ref: `parktrack-${Date.now()}`,
      amount: details.amount,
      currency: 'NGN',
      redirect_url: `${process.env['APP_URL']}/payment/callback`,
      customer: {
        email: details.email,
        name: details.name,
        phonenumber: details.phone
      },
      meta: {
        locationId: details.locationId,
        reservationDate: details.reservationDate
      },
      customizations: {
        title: 'Parktrack Location Reservation',
        logo: `${process.env['APP_URL']}/images/logo.png`
      }
    })
  });

  return await response.json();
}

export function verifyWebhookSignature(signature: string, payload: string) {
  const hash = crypto
    .createHmac('sha256', process.env['FLUTTERWAVE_SECRET_KEY']!)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

export async function verifyTransaction(transactionId: string) {
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      headers: {
        'Authorization': `Bearer ${process.env['FLUTTERWAVE_SECRET_KEY']}`
      }
    }
  );

  return await response.json();
}