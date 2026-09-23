import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Play, Ticket, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import CSS cốt lõi của Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Movie {
  id: string;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  filmGenres: string | null;
  ageRating: string;
  duration: number;
}

interface HeroBannerProps {
  movies: Movie[];
  onPlayTrailer: (url: string) => void;
}

const HeroBanner = ({ movies, onPlayTrailer }: HeroBannerProps) => {
  // Chỉ lấy 3-4 phim đang chiếu mới nhất để làm Banner
  const bannerMovies = movies.slice(0, 4);

  if (bannerMovies.length === 0) return null;

  return (
    <div className="w-full mt-4 rounded-3xl overflow-hidden shadow-2xl relative group">
      {/* 
        Cấu hình Swiper: 
        - loop: Cuộn tròn vô tận
        - autoplay: Tự động chạy sau 5 giây (5000ms), người dùng vuốt thì vẫn tiếp tục chạy
      */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 7000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={true}
        className="w-full h-[350px] md:h-[500px] lg:h-[600px] rounded-3xl"
      >
        {bannerMovies.map((movie) => (
          <SwiperSlide key={movie.id}>
            <div className="relative w-full h-full">
              {/* Ảnh Nền (Poster phim) */}
              <img
                src={movie.backdropUrl || ''}
                alt={movie.title}
                className="w-full h-full object-cover object-top"
              />

              {/* Lớp phủ Đen Gradient: Giúp ảnh không bị chói và chữ trắng dễ đọc hơn */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent w-full md:w-3/4"></div>

              {/* NỘI DUNG TRÊN BANNER */}
              <div className="absolute inset-0 container mx-auto px-6 md:px-12 flex flex-col justify-end pb-16 md:pb-24">
                {/* Nhãn Độ tuổi */}
                <span className="inline-block bg-amber-500 text-slate-950 text-xs sm:text-sm font-black px-3 py-1 rounded shadow-md w-max mb-4">
                  {movie.ageRating}
                </span>

                {/* Tên Phim */}
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-wider mb-4 max-w-3xl leading-tight drop-shadow-lg">
                  {movie.title}
                </h2>

                {/* Thể loại & Thời lượng */}
                <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm md:text-base font-medium mb-8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> {movie.duration} Phút
                  </div>
                  <span className="text-slate-600">|</span>
                  <div className="text-amber-400 font-bold">{movie.filmGenres}</div>
                </div>

                {/* Hai Nút Bấm */}
                <div className="flex items-center gap-4">
                  <Link
                    to={`/movies/${movie.id}`}
                    className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-amber-500/60"
                  >
                    <Ticket className="w-5 h-5" />{' '}
                    <span className="hidden sm:inline">Đặt Vé Ngay</span>
                  </Link>

                  <button
                    onClick={() => onPlayTrailer(movie.trailerUrl || '')}
                    className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 border-2 border-slate-400 text-white hover:bg-slate-800 hover:border-white shadow-lg cursor-pointer"
                  >
                    <Play className="w-5 h-5" />{' '}
                    <span className="hidden sm:inline">Xem Trailer</span>
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroBanner;
