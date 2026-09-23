import { PrismaClient } from '@prisma/client'; // Đã xóa import MovieStatus rác

const prisma = new PrismaClient();

// --- 1. ĐÚC KHUÔN CHO DỮ LIỆU ĐẦU VÀO ---
interface MovieInput {
  title: string;
  description?: string;
  posterUrl?: string;
  trailerUrl?: string;
  filmGenres?: string;
  duration: number | string;
  ageRating: string;
  director?: string;
  cast?: string;
  country?: string;
  language?: string;
  releaseDate?: string;
  endDate?: string;
}

// --- 2. CÁC HÀM GET (TÍNH TOÁN STATUS ẢO) ---
const getAllMovies = async () => {
  const movies = await prisma.movie.findMany({
    orderBy: { title: 'asc' },
  });

  const now = new Date();
  const processedMovies = movies.map((movie) => {
    let computedStatus = 'COMING_SOON';

    if (movie.releaseDate && movie.endDate) {
      if (now >= movie.releaseDate && now <= movie.endDate) {
        computedStatus = 'NOW_PLAYING';
      } else if (now > movie.endDate) {
        computedStatus = 'ARCHIVED';
      }
    }

    return {
      ...movie,
      status: computedStatus,
    };
  });

  return processedMovies;
};

const getMovieById = async (id: string) => {
  const movie = await prisma.movie.findUnique({
    where: { id: id },
  });

  if (!movie) {
    throw new Error('Không tìm thấy bộ phim này!');
  }

  const now = new Date();
  let computedStatus = 'COMING_SOON';

  if (movie.releaseDate && movie.endDate) {
    if (now >= movie.releaseDate && now <= movie.endDate) {
      computedStatus = 'NOW_PLAYING';
    } else if (now > movie.endDate) {
      computedStatus = 'ARCHIVED';
    }
  }

  return {
    ...movie,
    status: computedStatus,
  };
};

// --- 3. CÁC HÀM GHI DỮ LIỆU ---

// Create
const addMovie = async (data: MovieInput) => {
  const newMovie = await prisma.movie.create({
    data: {
      title: data.title,
      description: data.description,
      posterUrl: data.posterUrl,
      trailerUrl: data.trailerUrl,
      filmGenres: data.filmGenres,
      duration: typeof data.duration === 'string' ? parseInt(data.duration) : data.duration,
      ageRating: data.ageRating,
      // Bỏ cột status đi!
      director: data.director,
      cast: data.cast,
      country: data.country,
      language: data.language,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null, // VÁ LỖI THIẾU END DATE
    },
  });
  return newMovie;
};

// Update
const updateMovie = async (id: string, data: MovieInput) => {
  const updatedMovie = await prisma.movie.update({
    where: { id: id },
    data: {
      title: data.title,
      description: data.description,
      posterUrl: data.posterUrl,
      trailerUrl: data.trailerUrl,
      filmGenres: data.filmGenres,
      duration: typeof data.duration === 'string' ? parseInt(data.duration) : data.duration,
      ageRating: data.ageRating,
      // Bỏ cột status đi!
      director: data.director,
      cast: data.cast,
      country: data.country,
      language: data.language,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  return updatedMovie;
};

export { getAllMovies, getMovieById, addMovie, updateMovie };
