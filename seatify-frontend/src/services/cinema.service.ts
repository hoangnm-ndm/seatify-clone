import { fetchClient } from '../utils/apiClient';

export const cinemaService = {
  getAllCinemas: () => fetchClient('/cinemas', { method: 'GET' }),
};
