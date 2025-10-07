export interface PaymentResponse {
  status: 'successful' | 'failed' | 'cancelled';
  tx_ref: string;
  transaction_id?: string;
  flw_ref?: string;
  amount?: number;
  currency?: string;
  customer?: {
    email: string;
    phone_number: string;
    name: string;
  };
}