import { Component, createSignal } from 'solid-js';
import { PaymentButton } from './payment/payment-button';
import { useNavigate } from '@solidjs/router';

interface LocationReservationProps {
  locationId: string;
  price: number;
  locationName: string;
}

export const LocationReservation: Component<LocationReservationProps> = (props) => {
  const navigate = useNavigate();
  const [reservationDate, setReservationDate] = createSignal('');
  const [userDetails, setUserDetails] = createSignal({
    email: '',
    name: '',
    phone: ''
  });
  const [error, setError] = createSignal('');

  const handlePaymentSuccess = async () => {
    try {
      // You can add API call here to update reservation status
      navigate('/payment/success');
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError('Failed to confirm reservation. Please contact support.');
    }
  };

  const handlePaymentError = () => {
    setError('Payment failed. Please try again.');
  };

  return (
    <div class="p-4 border rounded shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Make a Reservation</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            class="w-full p-2 border rounded"
            value={reservationDate()}
            onInput={(e) => setReservationDate(e.currentTarget.value)}
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            class="w-full p-2 border rounded"
            value={userDetails().name}
            onInput={(e) => setUserDetails({ ...userDetails(), name: e.currentTarget.value })}
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            class="w-full p-2 border rounded"
            value={userDetails().email}
            onInput={(e) => setUserDetails({ ...userDetails(), email: e.currentTarget.value })}
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            class="w-full p-2 border rounded"
            value={userDetails().phone}
            onInput={(e) => setUserDetails({ ...userDetails(), phone: e.currentTarget.value })}
          />
        </div>

        <div class="mt-6">
          <PaymentButton
            amount={props.price}
            email={userDetails().email}
            name={userDetails().name}
            phone={userDetails().phone}
            locationId={props.locationId}
            reservationDate={reservationDate()}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    </div>
  );
};