import { fetchClient } from '../utils/apiClient';

interface Movie {
  id: string;
  title: string;
  filmGenres: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  ageRating: string;
  status: 'NOW_PLAYING' | 'COMING_SOON' | 'ARCHIVED';
  duration: number;
}

const movieService = {
  getAllMovie: () => fetchClient('/movies', { method: 'GET' }),

  getMovieById: (id: string) => fetchClient(`/movies/${id}`, { method: 'GET' }),

  createMovie: (data: Movie) =>
    fetchClient('/movies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMovie: (id: string, data: Movie) =>
    fetchClient(`/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export { movieService };
