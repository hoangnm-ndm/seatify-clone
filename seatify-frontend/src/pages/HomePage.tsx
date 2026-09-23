import { useState, useEffect } from 'react';
import MovieCard from '../components/MovieCard';
import HeroBanner from '../components/HeroBanner';
import { movieService } from '../services/movie.service';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TrailerModal from '../components/TrailerModal';

// THÊM CÔNG CỤ VUỐT (SWIPER)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

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

const HomePage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // --- STATE QUẢN LÝ TRAILER ---
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await movieService.getAllMovie();
        setMovies(response.data);
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovies();
  }, []);

  // 1. KHÔNG DÙNG .slice(0, 4) NỮA! Lấy toàn bộ phim để làm danh sách trượt
  const nowPlayingMovies = movies.filter((m) => m.status === 'NOW_PLAYING');
  const comingSoonMovies = movies.filter((m) => m.status === 'COMING_SOON');

  // Hàm mở Trailer từ MovieCard
  const handlePlayTrailer = (url: string) => {
    setCurrentTrailerUrl(url); // Lưu link video
    setIsTrailerOpen(true); // Bật popup lên
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-amber-500 text-2xl font-black animate-pulse">ĐANG TẢI PHIM...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* HERO BANNER (Truyền 4 phim HOT vào) */}
      <HeroBanner movies={nowPlayingMovies.slice(0, 4)} onPlayTrailer={handlePlayTrailer} />

      {/* ĐÃ XÓA QUICK BOOKING THEO YÊU CẦU */}

      {/* ========================================== */}
      {/* KHU VỰC PHIM ĐANG CHIẾU (DÙNG SWIPER) */}
      {/* ========================================== */}
      <div className="mt-20 mb-10">
        <div className="flex items-end justify-between mb-8 border-b border-slate-800 pb-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white border-l-4 border-amber-500 pl-4 leading-none">
            Phim Đang Chiếu
          </h2>
          <Link
            to="/movies-status/now-playing"
            className="text-amber-500 font-bold text-sm hover:text-amber-400 transition-colors uppercase tracking-widest"
          >
            Xem tất cả ➔
          </Link>
        </div>

        {nowPlayingMovies.length === 0 ? (
          <p className="text-center text-slate-500 py-10">Chưa có phim nào đang chiếu.</p>
        ) : (
          <div className="relative">
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation // Bật 2 mũi tên qua lại
              spaceBetween={24} // Khoảng cách giữa các phim
              slidesPerView={2} // Trên điện thoại hiện 2 phim
              breakpoints={{
                640: { slidesPerView: 3 }, // Tablet nhỏ hiện 3
                1024: { slidesPerView: 4 }, // Laptop hiện 4
                1280: { slidesPerView: 5 }, // Màn to hiện 5 phim
              }}
              // CSS !py-10 để thẻ phim khi Hover nảy lên không bị cắt mất bóng đổ
              className="!py-6 !px-2"
            >
              {nowPlayingMovies.map((movie) => (
                <SwiperSlide key={movie.id}>
                  <MovieCard
                    id={movie.id}
                    title={movie.title}
                    genre={movie.filmGenres || 'Đang cập nhật'}
                    posterUrl={movie.posterUrl || ''}
                    ageRating={movie.ageRating}
                    duration={movie.duration}
                    trailerUrl={movie.trailerUrl || undefined}
                    onPlayTrailer={handlePlayTrailer}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* KHU VỰC PHIM SẮP CHIẾU (DÙNG SWIPER) */}
      {/* ========================================== */}
      <div className="mt-16 mb-20">
        <div className="flex items-end justify-between mb-8 border-b border-slate-800 pb-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white border-l-4 border-amber-500 pl-4 leading-none">
            Phim Sắp Chiếu
          </h2>
          <Link
            to="/movies-status/coming-soon"
            className="text-amber-500 font-bold text-sm hover:text-amber-400 transition-colors uppercase tracking-widest"
          >
            Xem tất cả ➔
          </Link>
        </div>

        {comingSoonMovies.length === 0 ? (
          <p className="text-center text-slate-500 py-10">Chưa có phim nào sắp chiếu.</p>
        ) : (
          <div className="relative">
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation
              spaceBetween={24}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 5 },
              }}
              className="!py-6 !px-2"
            >
              {comingSoonMovies.map((movie) => (
                <SwiperSlide key={movie.id}>
                  <MovieCard
                    id={movie.id}
                    title={movie.title}
                    genre={movie.filmGenres || 'Đang cập nhật'}
                    posterUrl={movie.posterUrl || ''}
                    ageRating={movie.ageRating}
                    duration={movie.duration}
                    trailerUrl={movie.trailerUrl || undefined}
                    onPlayTrailer={handlePlayTrailer}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      {/* --- GỌI MODAL TRAILER RA TẠI TRANG CHỦ --- */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoUrl={currentTrailerUrl}
      />
    </div>
  );
};

export default HomePage;
