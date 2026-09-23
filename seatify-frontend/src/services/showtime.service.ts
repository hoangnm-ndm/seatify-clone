import { fetchClient } from '../utils/apiClient';

interface CreateShowTimeData {
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

const showtimeService = {
  createShowtime: (data: CreateShowTimeData) =>
    fetchClient('/showtimes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSeats: (showtimeId: string) =>
    fetchClient(`/showtimes/${showtimeId}/seats`, { method: 'GET' }),

  getShowtimeById: (id: string) => fetchClient(`/showtimes/${id}`, { method: 'GET' }),

  getShowtimesByFilter: (movieId: string, date: string) =>
    fetchClient(`/showtimes?movieId=${movieId}&date=${date}`, {
      method: 'GET',
    }),
};

export { showtimeService };
