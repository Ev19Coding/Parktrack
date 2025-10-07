import { Component, createSignal } from 'solid-js';
import { closePaymentModal, FlutterWaveButton } from 'flutterwave-react-v3';
import { FlutterwaveConfig } from 'flutterwave-react-v3/dist/types';

interface PaymentButtonProps {
  amount: number;
  email: string;
  name: string;
  phone: string;
  locationId: string;
  reservationDate: string;
  onSuccess: () => void;
  onError?: () => void;
}

export const PaymentButton: Component<PaymentButtonProps> = (props) => {
    const config: FlutterwaveConfig = {
        public_key: import.meta.env['FLUTTERWAVE_PUBLIC_KEY']!,
        tx_ref: `parktrack-${Date.now()}`,
        amount: props.amount,
        currency: 'NGN',
        payment_options: 'card,ussd,bank_transfer',
        customer: {
            email: props.email,
            name: props.name,
            phone_number: props.phone,
        },
        meta: {
            locationId: props.locationId,
            reservationDate: props.reservationDate,
        },
        customizations: {
            title: 'Parktrack Location Reservation',
            description: 'Payment for location reservation',
            logo: `${window.location.origin}/images/logo.png`,
        },
    };

    const handleFlutterPayment = useFlutterwave(config);

    return (
        <button
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={() => {
                handleFlutterPayment({
                    callback: (response) => {
                        if (response.status === 'successful') {
                            props.onSuccess();
                        } else {
                            props.onError?.();
                        }
                    },
                    onClose: () => {},
                });
            }}
        >
            Pay Now
        </button>
    );
};

function useFlutterwave(config: FlutterwaveConfig) {
    return (options: { callback: (response: any) => void; onClose: () => void }) => {
        // @ts-ignore
        window.FlutterwaveCheckout({
            ...config,
            callback: options.callback,
            onclose: options.onClose,
        });
    };
}

