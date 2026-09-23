import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, useParams } from 'react-router-dom';
import { Play, Tags, Clock, Globe, MessageCircle, UserCheck, MapPin } from 'lucide-react';
import TrailerModal from '../components/TrailerModal';
import { showtimeService } from '../services/showtime.service';
import { movieService } from '../services/movie.service';

// --- INTERFACE (Khuôn dữ liệu chi tiết phim) ---
interface MovieDetailData {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  filmGenres: string | null;
  duration: number;
  ageRating: string;
  director: string | null;
  cast: string | null;
  country: string | null;
  language: string | null;
  releaseDate: string | null;
  createdAt: string;
}

// --- INTERFACE (Khuôn dữ liệu lịch chiếu) ---
// 1. Khuôn data gốc từ API Backend trả về
interface ShowtimeApiResponse {
  id: string;
  startTime: string;
  roomName: string;
  cinemaName: string;
  cinemaAddress: string;
  totalSeats: number;
  soldSeats: number;
  isFull: boolean;
}

// 2. Khuôn sau khi gộp nhóm cho Frontend hiển thị
interface TimeSlot {
  id: string;
  time: string;
  isFull: boolean;
}

interface RoomGroup {
  roomName: string;
  times: TimeSlot[];
}

interface CinemaGroup {
  cinemaName: string;
  address: string;
  rooms: RoomGroup[];
}

const getAgeDescription = (rating: string) => {
  if (rating === 'P') return 'Phim được phép phổ biến đến người xem ở mọi độ tuổi.';
  if (rating === 'T13') return 'Phim dành cho khán giả từ đủ 13 tuổi trở lên (13+).';
  if (rating === 'T16') return 'Phim dành cho khán giả từ đủ 16 tuổi trở lên (16+).';
  if (rating === 'T18') return 'Phim dành cho khán giả từ đủ 18 tuổi trở lên (18+).';
  return 'Chưa phân loại';
};

// --- TẠO DANH SÁCH NGÀY ĐỘNG (5 NGÀY TỚI) ---
const generateUpcomingDates = () => {
  const dates = [];
  const today = new Date();
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    dates.push({
      display: `${day}/${month}`,
      dayOfWeek: i === 0 ? 'Hôm nay' : dayNames[d.getDay()],
      value: `${year}-${month}-${day}`, // Chuẩn YYYY-MM-DD để gửi API
    });
  }
  return dates;
};

const DYNAMIC_DATES = generateUpcomingDates();

const MovieDetailPage = () => {
  const { movieId } = useParams();

  // 1. STATE QUẢN LÝ PHIM
  const [movie, setMovie] = useState<MovieDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. STATE QUẢN LÝ LỊCH CHIẾU
  // Mặc định chọn ngày 30/07 để có data
  const [selectedDate, setSelectedDate] = useState(DYNAMIC_DATES[0].value);
  const [showtimesData, setShowtimesData] = useState<CinemaGroup[]>([]);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);

  // State quản lý Trailer Modal
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // --- EFFECT 1: LẤY CHI TIẾT PHIM ---
  useEffect(() => {
    const loadMovieDetail = async () => {
      try {
        setIsLoading(true);
        const response = await movieService.getMovieById(movieId as string);
        setMovie(response.data);
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (movieId) loadMovieDetail();
  }, [movieId]);

  // --- EFFECT 2: LẤY LỊCH CHIẾU ---
  useEffect(() => {
    const loadShowtimes = async () => {
      if (!movieId) return;
      try {
        setIsLoadingShowtimes(true);
        // Gửi Query String chứa movieId và date
        const res = await showtimeService.getShowtimesByFilter(movieId, selectedDate);

        // THUẬT TOÁN GỘP NHÓM (GROUPING ALGORITHM)
        const groupedCinemas: CinemaGroup[] = [];
        res.data.forEach((st: ShowtimeApiResponse) => {
          let cinema = groupedCinemas.find((c) => c.cinemaName === st.cinemaName);
          if (!cinema) {
            cinema = {
              cinemaName: st.cinemaName,
              address: st.cinemaAddress,
              rooms: [],
            };
            groupedCinemas.push(cinema);
          }

          let room = cinema.rooms.find((r) => r.roomName === st.roomName);
          if (!room) {
            room = { roomName: st.roomName, times: [] };
            cinema.rooms.push(room);
          }

          const timeString = new Date(st.startTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          room.times.push({
            id: st.id,
            time: timeString,
            isFull: st.isFull,
          });
        });

        setShowtimesData(groupedCinemas);
      } catch {
        setShowtimesData([]);
      } finally {
        setIsLoadingShowtimes(false);
      }
    };
    loadShowtimes();
  }, [movieId, selectedDate]);

  // --- RENDER MÀN HÌNH LOADING ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-amber-500 text-2xl font-black animate-pulse">
          ĐANG TẢI THÔNG TIN PHIM...
        </div>
      </div>
    );
  }

  // --- RENDER MÀN HÌNH LỖI ---
  if (!movie) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <h1 className="text-3xl font-bold text-red-500">404</h1>
        <p className="text-xl text-slate-400">Không tìm thấy bộ phim này!</p>
        <Link
          to="/"
          className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400"
        >
          Về Trang Chủ
        </Link>
      </div>
    );
  }

  // ==========================================
  // RENDER GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <div className="-mt-8">
      {/* KHỐI 1: BACKGROUND VÀ THÔNG TIN PHIM */}
      <div className=" w-full py-16 md:py-24 container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Cột trái: Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-slate-800 relative">
              <img
                src={movie.posterUrl || ''}
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-sm font-black px-3 py-1 rounded shadow-md">
                {movie.ageRating}
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-2">
              {movie.title}
            </h1>
            <p className="text-xl text-slate-400 font-medium italic mb-8">{movie.title}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 mb-8 mt-6">
              {movie.filmGenres && (
                <div className="flex items-center gap-3 text-slate-300">
                  <Tags className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="font-semibold">{movie.filmGenres}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-300">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="font-semibold">{movie.duration} Phút</span>
              </div>
              {movie.country && (
                <div className="flex items-center gap-3 text-slate-300">
                  <Globe className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="font-semibold">{movie.country}</span>
                </div>
              )}
              {movie.language && (
                <div className="flex items-center gap-3 text-slate-300">
                  <MessageCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="font-semibold">{movie.language}</span>
                </div>
              )}
              <div className="flex items-start gap-3 text-slate-300 sm:col-span-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mt-2">
                <UserCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-amber-400 font-medium leading-relaxed">
                  Phân loại: {getAgeDescription(movie.ageRating)}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8 text-sm md:text-base">
              <p>
                <span className="text-slate-500 font-semibold">Đạo diễn:</span>{' '}
                <span className="text-white font-medium">{movie.director}</span>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Diễn viên:</span>{' '}
                <span className="text-white font-medium">{movie.cast}</span>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Khởi chiếu:</span>{' '}
                <span className="text-white font-medium">
                  {movie.releaseDate
                    ? new Date(movie.releaseDate).toLocaleDateString('vi-VN')
                    : 'Đang cập nhật'}
                </span>
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-3">NỘI DUNG PHIM</h3>
              <p className="text-slate-400 leading-relaxed text-justify">{movie.description}</p>
            </div>

            <div>
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 border-2 border-slate-600 text-white hover:bg-slate-800 hover:border-slate-500 shadow-lg cursor-pointer"
              >
                <Play className="w-5 h-5" /> Xem Trailer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 2: LỊCH CHIẾU PHIM */}
      <div className="container mx-auto px-4 py-12 mb-20">
        <div className="flex flex-col items-center justify-center mb-10">
          <h2 className="text-3xl font-black uppercase tracking-wider text-white mb-2">
            Lịch Chiếu
          </h2>
          <div className="w-24 h-1 bg-amber-500 rounded-full"></div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* TABS CHỌN NGÀY */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {DYNAMIC_DATES.map((dateObj, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(dateObj.value)}
                className={`flex flex-col items-center justify-center w-24 py-3 rounded-xl border transition-all cursor-pointer ${
                  selectedDate === dateObj.value
                    ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-105'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 font-bold'
                }`}
              >
                <span className="text-sm">{dateObj.display}</span>
                <span className="text-xs font-medium mt-1">{dateObj.dayOfWeek}</span>
              </button>
            ))}
          </div>

          {/* DANH SÁCH RẠP & SUẤT CHIẾU */}
          <div className="space-y-6">
            {isLoadingShowtimes ? (
              <div className="text-center text-amber-500 font-bold animate-pulse py-10">
                Đang tải lịch chiếu...
              </div>
            ) : showtimesData.length === 0 ? (
              <div className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-xl">
                Không có lịch chiếu vào ngày này.
              </div>
            ) : (
              showtimesData.map((cinema, cIndex) => (
                <div
                  key={cIndex}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-start gap-3 mb-6 pb-6 border-b border-slate-800">
                    <MapPin className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="text-xl font-bold text-white">{cinema.cinemaName}</h4>
                      <p className="text-sm text-slate-500 mt-1">{cinema.address}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {cinema.rooms.map((room, rIndex) => (
                      <div key={rIndex}>
                        <p className="text-sm font-semibold text-slate-400 mb-3">{room.roomName}</p>
                        <div className="flex flex-wrap gap-3">
                          {room.times.map((timeObj, tIndex) => (
                            <Link
                              to={`/booking/${timeObj.id}`}
                              key={tIndex}
                              className={`px-5 py-2.5 rounded-lg border font-bold transition-colors ${
                                timeObj.isFull
                                  ? 'border-slate-800 bg-slate-900 text-slate-600 pointer-events-none'
                                  : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-amber-500 hover:text-amber-500'
                              }`}
                            >
                              {timeObj.time}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Gọi Modal Trailer ra đây */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoUrl={movie.trailerUrl}
      />
    </div>
  );
};

export default MovieDetailPage;
