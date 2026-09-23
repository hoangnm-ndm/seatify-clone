import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchClient } from '../utils/apiClient';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { SearchX, Loader2 } from 'lucide-react';

// Định nghĩa khuôn cho bộ phim lấy từ API về
interface Movie {
  id: string;
  title: string;
  filmGenres: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  ageRating: string;
  duration: number;
}

const SearchPage = () => {
  // Hook của React Router để đọc tham số URL (?keyword=...)
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý Trailer
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState<string | null>(null);

  // Hàm hứng link trailer từ MovieCard bắn lên
  const handlePlayTrailer = (url: string) => {
    setCurrentTrailerUrl(url);
    setIsTrailerOpen(true);
  };

  useEffect(() => {
    const fetchAndFilterMovies = async () => {
      try {
        setIsLoading(true);
        // Lấy tất cả phim từ DB lên (Vì số lượng phim ít nên ta lấy hết rồi lọc ở FE cho nhanh)
        const response = await fetchClient('/movies');

        // Dùng Javascript để lọc: Chuyển tên phim và từ khóa về chữ thường hết để so sánh không phân biệt hoa/thường
        const filteredMovies = response.data.filter((movie: Movie) =>
          movie.title.toLowerCase().includes(keyword.toLowerCase()),
        );

        setMovies(filteredMovies);
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (keyword) {
      fetchAndFilterMovies();
    }
  }, [keyword]); // Hễ từ khóa URL thay đổi là chạy lại hàm này

  return (
    <div className="py-12 min-h-[80vh]">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
            KẾT QUẢ TÌM KIẾM
          </h1>
          <p className="text-slate-400">
            Tìm thấy <span className="text-amber-500 font-bold">{movies.length}</span> kết quả cho
            từ khóa: <span className="text-white">"{keyword}"</span>
          </p>
        </div>

        {/* LOGIC HIỂN THỊ */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
        ) : movies.length === 0 ? (
          // NẾU TÌM KHÔNG RA PHIM NÀO
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
            <SearchX className="w-20 h-20 text-slate-600 mb-6" />
            <h3 className="text-2xl font-black text-amber-500 uppercase tracking-widest text-center">
              KHÔNG TÌM THẤY PHIM
            </h3>
            <p className="text-slate-500 mt-4 text-center">
              Rất tiếc, hiện tại hệ thống không có phim nào khớp với từ khóa của bạn.
              <br /> Vui lòng thử lại với tên khác.
            </p>
          </div>
        ) : (
          // NẾU TÌM THẤY PHIM
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL TRAILER*/}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoUrl={currentTrailerUrl}
      />
    </div>
  );
};

export default SearchPage;
