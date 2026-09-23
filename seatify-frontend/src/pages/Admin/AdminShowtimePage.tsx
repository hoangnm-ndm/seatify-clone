import { useState, useEffect } from 'react';
import { CalendarPlus, Loader2, Film, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { showtimeService } from '../../services/showtime.service';
import { movieService } from '../../services/movie.service';
import { cinemaService } from '../../services/cinema.service';

// --- SỬA LỖI ANY: ĐỊNH NGHĨA KHUÔN DỮ LIỆU ---
interface Movie {
  id: string;
  title: string;
  status: string;
  duration: number;
}

interface Room {
  id: string;
  name: string;
}

interface Cinema {
  id: string;
  name: string;
  rooms: Room[];
}

// --- KHUÔN CUSTOM DROPDOWN SIÊU XỊN ---
const CustomDropdown = ({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-1/5" onBlur={() => setTimeout(() => setIsOpen(false), 200)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-700 text-amber-500 font-bold rounded-xl px-2 py-3 focus:border-amber-500 outline-none transition-colors cursor-pointer disabled:opacity-50 text-center flex items-center justify-center"
      >
        {value}
      </button>

      {/* Danh sách xổ xuống: max-h-40 (Khoảng 5-6 dòng), overflow-y-auto (Thanh cuộn) */}
      {isOpen && !disabled && (
        <ul className="absolute left-0 top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-40 overflow-y-auto z-50 custom-scrollbar">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`p-2 cursor-pointer text-center font-bold transition-colors ${value === opt ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AdminShowtimePage = () => {
  // Thay thế toàn bộ chữ any bằng Khuôn vừa tạo
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    movieId: '',
    cinemaId: '',
    roomId: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [moviesRes, cinemasRes] = await Promise.all([
          movieService.getAllMovie(),
          cinemaService.getAllCinemas(),
        ]);

        // Dùng khuôn Movie thay vì any
        setMovies(moviesRes.data.filter((m: Movie) => m.status !== 'ARCHIVED'));
        setCinemas(cinemasRes.data);
      } catch {
        // SỬA LỖI UNUSED VAR: Nếu không xài thì bỏ luôn chữ (error)
        toast.error('Lỗi khi tải dữ liệu Phim & Rạp!');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadMasterData();
  }, []);

  const handleCinemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCinemaId = e.target.value;
    setFormData({ ...formData, cinemaId: selectedCinemaId, roomId: '' });

    if (selectedCinemaId) {
      const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);
      setAvailableRooms(selectedCinema ? selectedCinema.rooms : []);
    } else {
      setAvailableRooms([]);
    }
  };

  // --- HÀM HELPER: Lấy giờ Local chuẩn của máy tính để nhét vào thẻ <input type="datetime-local"> ---
  const toLocalISOString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000; // Bù trừ múi giờ
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // --- LOGIC: TỰ ĐỘNG TÍNH GIỜ KẾT THÚC & ÉP TRÒN 5 PHÚT ---
  // --- CHUẨN BỊ MẢNG GIỜ & PHÚT CHO DROPDOWN ---
  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']; // Khóa cứng 12 tùy chọn

  // --- BÓC TÁCH GIÁ TRỊ HIỆN TẠI TỪ STATE ---
  // Ví dụ formData.startTime là "2026-08-20T17:25"
  const currentStartStr = formData.startTime || toLocalISOString(new Date());
  const startDatePart = currentStartStr.split('T')[0]; // Lấy "2026-08-20"
  const startHourPart = currentStartStr.split('T')[1]?.substring(0, 2) || '12'; // Lấy "17"
  const startMinutePart = currentStartStr.split('T')[1]?.substring(3, 5) || '00'; // Lấy "25"

  // --- LOGIC: TỰ ĐỘNG TÍNH GIỜ KẾT THÚC KHI ĐỔI NGÀY/GIỜ/PHÚT ---
  const updateCustomStartTime = (newDate: string, newHour: string, newMinute: string) => {
    if (!formData.movieId) return;

    // Ráp lại thành chuỗi chuẩn ISO
    const newStartTimeStr = `${newDate}T${newHour}:${newMinute}`;
    const startDateObj = new Date(newStartTimeStr);

    let newEndTimeStr = formData.endTime;

    // Tính Giờ kết thúc tự động
    const selectedMovie = movies.find((m) => m.id === formData.movieId);
    if (selectedMovie) {
      const endDateObj = new Date(startDateObj);
      endDateObj.setMinutes(endDateObj.getMinutes() + selectedMovie.duration + 15);
      newEndTimeStr = toLocalISOString(endDateObj);
    }

    setFormData({
      ...formData,
      startTime: newStartTimeStr,
      endTime: newEndTimeStr,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.movieId || !formData.roomId || !formData.startTime || !formData.endTime) {
      return toast.error('Vui lòng điền đầy đủ thông tin!');
    }

    try {
      setIsSubmitting(true);
      const startUTC = new Date(formData.startTime).toISOString();
      const endUTC = new Date(formData.endTime).toISOString();

      await showtimeService.createShowtime({
        movieId: formData.movieId,
        roomId: formData.roomId,
        startTime: startUTC,
        endTime: endUTC,
      });

      toast.success('Tạo suất chiếu thành công!');
      setFormData({
        movieId: '',
        cinemaId: '',
        roomId: '',
        startTime: '',
        endTime: '',
      });
      setAvailableRooms([]);
    } catch (error) {
      // SỬA LỖI ANY: Dùng instanceof để kiểm tra an toàn
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Lỗi khi tạo suất chiếu!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData)
    return <div className="p-8 text-amber-500 font-bold animate-pulse">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b-2 border-slate-800 pb-4">
        <CalendarPlus className="w-8 h-8 text-amber-500" />
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">
          Tạo Suất Chiếu Mới
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CỘT 1: CHỌN PHIM */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-500" /> Chọn Phim
            </label>
            <select
              value={formData.movieId}
              onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors cursor-pointer"
            >
              <option value="">-- Vui lòng chọn phim --</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* CỘT 2: CHỌN RẠP & PHÒNG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" /> Chọn Cụm Rạp
              </label>
              <select
                value={formData.cinemaId}
                onChange={handleCinemaChange}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors cursor-pointer"
              >
                <option value="">-- Vui lòng chọn rạp --</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" /> Chọn Phòng Chiếu
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                disabled={!formData.cinemaId}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Vui lòng chọn phòng --</option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CỘT 3: THỜI GIAN CHIẾU */}
          {/* CỘT 3: THỜI GIAN CHIẾU (CUSTOM SPLIT UI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ colorScheme: 'dark' }}>
            {/* --- Ô CHỌN GIỜ BẮT ĐẦU (TÁCH LÀM 3 KHỐI) --- */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Giờ Bắt Đầu
              </label>

              <div className="flex gap-2 items-center">
                {/* 1. Nút chọn Ngày */}
                <input
                  type="date"
                  min={toLocalISOString(new Date()).split('T')[0]}
                  value={startDatePart}
                  onChange={(e) =>
                    updateCustomStartTime(e.target.value, startHourPart, startMinutePart)
                  }
                  disabled={!formData.movieId}
                  className="w-3/5 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-colors cursor-pointer disabled:opacity-50"
                />

                {/* 2. Custom Dropdown Giờ */}
                <CustomDropdown
                  value={startHourPart}
                  options={hoursList}
                  onChange={(val: string) =>
                    updateCustomStartTime(startDatePart, val, startMinutePart)
                  }
                  disabled={!formData.movieId}
                />

                <span className="text-slate-400 font-bold">:</span>

                {/* 3. Custom Dropdown Phút */}
                <CustomDropdown
                  value={startMinutePart}
                  options={minutesList}
                  onChange={(val: string) =>
                    updateCustomStartTime(startDatePart, startHourPart, val)
                  }
                  disabled={!formData.movieId}
                />
              </div>
            </div>

            {/* --- Ô CHỌN GIỜ KẾT THÚC (KHÓA CỨNG) --- */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" /> Giờ Kết Thúc (Tự động tính)
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                readOnly
                className="w-full bg-slate-900 border border-slate-800 text-amber-500/60 font-bold rounded-xl px-4 py-3 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* NÚT SUBMIT */}
          <div className="pt-6 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold uppercase tracking-wider py-4 rounded-xl hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg hover:shadow-amber-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> ĐANG TẠO SUẤT CHIẾU & 180 VÉ...
                </>
              ) : (
                'XÁC NHẬN TẠO SUẤT CHIẾU'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminShowtimePage;
