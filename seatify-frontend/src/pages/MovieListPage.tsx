import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchClient } from '../utils/apiClient';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { Loader2, Film } from 'lucide-react';
import { toast } from 'sonner';

interface Movie {
  id: string;
  title: string;
  filmGenres: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  ageRating: string;
  status: 'NOW_PLAYING' | 'COMING_SOON' | 'ARCHIVED';
  duration: number;
  country: string | null;
  language: string | null;
}

const MovieListPage = () => {
  // Lấy chữ "now-playing" hoặc "coming-soon" từ thanh URL
  const { status } = useParams();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. CHUYỂN ĐỔI NGÔN NGỮ (TỪ URL SANG DATABASE)
  const isNowPlaying = status === 'now-playing';
  const pageTitle = isNowPlaying ? 'PHIM ĐANG CHIẾU' : 'PHIM SẮP CHIẾU';
  const dbStatus = isNowPlaying ? 'NOW_PLAYING' : 'COMING_SOON';

  // State quản lý Trailer
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState<string | null>(null);

  // Hàm hứng link trailer từ MovieCard bắn lên
  const handlePlayTrailer = (url: string) => {
    setCurrentTrailerUrl(url);
    setIsTrailerOpen(true);
  };

  // 2. GỌI API & LỌC DỮ LIỆU
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const response = await fetchClient('/movies');

        // Chỉ lấy những phim có status khớp với cái tab đang xem
        const filteredMovies = response.data.filter((movie: Movie) => movie.status === dbStatus);
        setMovies(filteredMovies);
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [dbStatus]); // Hễ đổi URL (từ đang chiếu sang sắp chiếu) là chạy lại hàm này

  return (
    <div className="py-12 min-h-[80vh]">
      <div className="container mx-auto px-4">
        {/* THANH TIÊU ĐỀ */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-4 text-center">
            {pageTitle}
          </h1>
          <div className="w-24 h-1 bg-amber-500 rounded-full"></div>
        </div>

        {/* LOGIC HIỂN THỊ */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center text-slate-500 py-20 border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
            Chưa có bộ phim nào trong danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                genre={movie.filmGenres || 'Đang cập nhật'}
                posterUrl={movie.posterUrl || ''}
                trailerUrl={movie.trailerUrl || undefined}
                onPlayTrailer={handlePlayTrailer}
                ageRating={movie.ageRating}
                duration={movie.duration}
                country={movie.country || 'Đang cập nhật'}
                language={movie.language || 'Đang cập nhật'}
              />
            ))}
          </div>
        )}
      </div>

      {/*MODAL TRAILER*/}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoUrl={currentTrailerUrl}
      />
    </div>
  );
};

export default MovieListPage;
