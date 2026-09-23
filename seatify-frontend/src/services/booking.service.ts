import { fetchClient } from '../utils/apiClient';

interface HoldSeatData {
  showtimeId: string;
  seatNames: string[];
  totalPrice: number;
  userId?: string;
  guestInfo: { fullName: string; email: string; phone: string };
}

const bookingService = {
  holdSeats: (data: HoldSeatData) =>
    fetchClient('/bookings/hold', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyHistory: () => fetchClient('/bookings/my-history', { method: 'GET' }),

  getBookingById: (id: string) => fetchClient(`/bookings/${id}`, { method: 'GET' }),

  // Cần nhận ID để nhét vào URL
  cancelBooking: (id: string) => fetchClient(`/bookings/${id}/cancel`, { method: 'POST' }),
};

export { bookingService };
