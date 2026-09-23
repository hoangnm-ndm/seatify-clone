import { fetchClient } from '../utils/apiClient';

const paymentService = {
  createUrl: (bookingId: string) =>
    fetchClient('/payments/create-url', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    }),

  confirmPayment: (bookingId: string) =>
    fetchClient('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    }),
};

export { paymentService };
