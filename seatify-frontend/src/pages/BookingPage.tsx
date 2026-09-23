import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Plus, DoorOpen, Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import GuestCheckoutModal from '../components/GuestCheckoutModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/booking.service';
import { showtimeService } from '../services/showtime.service';

// Định nghĩa khuôn thông tin Suất chiếu
interface ShowtimeInfo {
  startTime: string;
  movie: {
    title: string;
    ageRating: string;
  };
  room: {
    name: string;
    cinema: { name: string; location: string };
  };
}

const BookingPage = () => {
  const { showtimeId } = useParams();

  // 1. STATE QUẢN LÝ VÉ & GHẾ CHỌN
  const [tickets, setTickets] = useState({ adult: 0, student: 0 });
  const totalTickets = tickets.adult + tickets.student;

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  // state quản lý hiển thị popup khi chọn vé hssv
  const [isStudentWarningOpen, setIsStudentWarningOpen] = useState(false);

  // 2. STATE & API LẤY GHẾ ĐÃ BÁN (DATA THẬT)
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);

  const [showtimeInfo, setShowtimeInfo] = useState<ShowtimeInfo | null>(null); // State chứa thông tin phim, rạp

  // HÀM: ĐẶT VÉ TRỰC TIẾP CHO KHÁCH ĐÃ ĐĂNG NHẬP (BỎ QUA FORM GUEST)
  const navigate = useNavigate();
  const { user } = useAuth(); // Lấy thông tin khách đang đăng nhập
  const [isHolding, setIsHolding] = useState(false); // Trạng thái nút bấm xoay vòng

  //Hàm
  const handleDirectBooking = async () => {
    if (!user) return; // Đề phòng
    try {
      setIsHolding(true);
      const response = await bookingService.holdSeats({
        showtimeId: showtimeId as string,
        seatNames: selectedSeats,
        totalPrice: totalPrice,
        userId: user.id,
        guestInfo: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || '000',
        },
      });

      toast.success('Giữ ghế thành công!');
      navigate(`/checkout/${response.data.id}`); // Bay sang trang thanh toán
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsHolding(false);
    }
  };

  //3. THUẬT TOÁN TÍNH TIỀN ---
  // Hàm kiểm tra một ghế thuộc loại gì và trả về tiền phụ thu
  const getSeatSurcharge = (seatId: string): number => {
    const row = seatId.charAt(0); // Lấy chữ cái đầu (A, B, C...)
    if (['D', 'E', 'F', 'G', 'H', 'I'].includes(row)) return 20000; // VIP: +20k
    if (['J'].includes(row)) return 25000; // Couple: +25k/ghế
    return 0; // Thường: Không phụ thu
  };

  // 1. Tính giá vé cơ bản (Base price)
  const baseTicketPrice = tickets.adult * 80000 + tickets.student * 55000;

  // 2. Tính tổng tiền phụ thu từ những ghế ĐANG CHỌN
  // reduce là hàm gom mảng siêu việt của Javascript
  const totalSurcharge = selectedSeats.reduce((sum, seatId) => sum + getSeatSurcharge(seatId), 0);

  // 3. TỔNG TIỀN CUỐI CÙNG = Vé cơ bản + Phụ thu ghế
  const totalPrice = baseTicketPrice + totalSurcharge;

  useEffect(() => {
    const fetchShowtimeData = async () => {
      try {
        setIsLoadingSeats(true);
        // Gọi 2 API CÙNG LÚC
        const [seatsRes, infoRes] = await Promise.all([
          showtimeService.getSeats(showtimeId as string),
          showtimeService.getShowtimeById(showtimeId as string),
        ]);

        setBookedSeats(seatsRes.data);
        setShowtimeInfo(infoRes.data);
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      } finally {
        setIsLoadingSeats(false);
      }
    };

    if (showtimeId) fetchShowtimeData();
  }, [showtimeId]);

  // 3. LOGIC TĂNG GIẢM VÉ
  const handleTicketChange = (
    type: 'adult' | 'student',
    operation: 'increase' | 'decrease',
    skipWarning = false,
  ) => {
    // BẮT BỆNH HSSV: Nếu bấm Tăng vé HSSV, mà vé đang là 0, và chưa skipWarning -> Bật Popup!
    if (type === 'student' && operation === 'increase' && tickets.student === 0 && !skipWarning) {
      setIsStudentWarningOpen(true);
      return; // Dừng hàm lại, không cho tăng vé vội
    }

    setTickets((prev) => {
      const currentCount = prev[type];
      if (operation === 'decrease' && currentCount === 0) return prev;

      const newTotal = prev.adult + prev.student + (operation === 'increase' ? 1 : -1);
      if (operation === 'increase' && newTotal > 8) {
        toast.error('Bạn chỉ được mua tối đa 8 vé cho mỗi giao dịch!');
        return prev;
      }

      if (operation === 'decrease' && newTotal < selectedSeats.length) {
        setSelectedSeats([]);
        toast.error('Số vé ít hơn số ghế đã chọn. Hệ thống đã xóa ghế, vui lòng chọn lại!');
      }

      return {
        ...prev,
        [type]: operation === 'increase' ? currentCount + 1 : currentCount - 1,
      };
    });
  };

  // 4. LOGIC CLICK GHẾ
  const handleSeatClick = (seatId: string) => {
    if (totalTickets === 0) {
      toast.error('Vui lòng chọn số lượng vé trước khi chọn ghế!');
      return;
    }

    // So sánh với mảng data THẬT
    if (bookedSeats.includes(seatId)) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId);
      if (prev.length >= totalTickets) {
        toast.error(`Bạn chỉ được chọn tối đa ${totalTickets} ghế!`);
        return prev;
      }
      return [...prev, seatId];
    });
  };

  // 5. THUẬT TOÁN ĐÚC GHẾ THEO KHỐI (BLOCK)
  const renderSeats = (row: string, start: number, end: number) => {
    const seats = [];
    let i = start;

    while (i <= end) {
      const isCouple = ['J'].includes(row);

      // LOGIC XỬ LÝ GHẾ ĐÔI (SOFA DÍNH LIỀN)
      if (isCouple) {
        const seatId1 = `${row}${i}`;
        const seatId2 = `${row}${i + 1}`;

        // Kiểm tra ghế đã bán bằng DATA THẬT
        const isBooked1 = bookedSeats.includes(seatId1);
        const isSelected1 = selectedSeats.includes(seatId1);
        let class1 = 'bg-pink-900/20 border-pink-500/50 text-pink-500 hover:bg-pink-500/30';
        if (isBooked1) class1 = 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed';
        else if (isSelected1)
          class1 =
            'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/50 z-10';

        const isBooked2 = bookedSeats.includes(seatId2);
        const isSelected2 = selectedSeats.includes(seatId2);
        let class2 = 'bg-pink-900/20 border-pink-500/50 text-pink-500 hover:bg-pink-500/30';
        if (isBooked2) class2 = 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed';
        else if (isSelected2)
          class2 =
            'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/50 z-10';

        seats.push(
          <div key={`${row}${i}-pair`} className="flex">
            <button
              onClick={() => handleSeatClick(seatId1)}
              disabled={isBooked1}
              className={`w-8 h-8 sm:w-10 sm:h-10 text-[10px] sm:text-xs font-semibold border-y border-l transition-all duration-200 cursor-pointer disabled:cursor-not-allowed rounded-l-lg ${class1}`}
            >
              {seatId1}
            </button>
            <button
              onClick={() => handleSeatClick(seatId2)}
              disabled={isBooked2}
              className={`w-8 h-8 sm:w-10 sm:h-10 text-[10px] sm:text-xs font-semibold border-y border-r border-l border-l-slate-800 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed rounded-r-lg ${class2}`}
            >
              {seatId2}
            </button>
          </div>,
        );
        i += 2;
      }
      // LOGIC XỬ LÝ GHẾ THƯỜNG / VIP
      else {
        const seatId = `${row}${i}`;
        const isVIP = ['D', 'E', 'F', 'G', 'H', 'I'].includes(row);

        // Kiểm tra ghế đã bán bằng DATA THẬT
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        let seatClass = 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700';
        if (isBooked) seatClass = 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed';
        else if (isSelected)
          seatClass =
            'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/50 scale-110 z-10';
        else if (isVIP)
          seatClass = 'bg-slate-800 border-amber-500/50 text-amber-500 hover:bg-amber-500/20';

        seats.push(
          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            disabled={isBooked}
            className={`w-8 h-8 sm:w-10 sm:h-10 text-[10px] sm:text-[11px] font-semibold border transition-all duration-200 cursor-pointer disabled:cursor-not-allowed rounded-lg ${seatClass}`}
          >
            {seatId}
          </button>,
        );
        i++;
      }
    }
    return seats;
  };

  // Các nhóm hàng ghế
  const rowsPart1 = ['A', 'B', 'C', 'D'];
  const rowsPart2 = ['E', 'F', 'G', 'H'];
  const rowsPart3 = ['I', 'J'];

  return (
    <div className="py-12 pb-40">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            ĐẶT VÉ TRỰC TUYẾN
          </h1>

          {/* HIỂN THỊ THÔNG TIN SUẤT CHIẾU BẰNG DATA THẬT */}
          {showtimeInfo ? (
            <div className="flex flex-col items-center justify-center space-y-1">
              <h2 className="text-2xl font-bold text-amber-500 uppercase tracking-wide">
                {showtimeInfo.movie.title}
              </h2>
              <p className="text-slate-300 font-medium text-lg">
                {showtimeInfo.room.cinema.name} - {showtimeInfo.room.name}
              </p>
              <div className="flex items-center gap-2 mt-2 text-slate-400 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">
                <span>Suất chiếu:</span>
                <span className="text-white font-bold">
                  {new Date(showtimeInfo.startTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>-</span>
                <span className="text-white font-bold">
                  {new Date(showtimeInfo.startTime).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          ) : (
            // Hiệu ứng khung xương (Skeleton) khi đang chờ data API
            <div className="animate-pulse flex flex-col items-center space-y-3 mt-4">
              <div className="h-6 w-64 bg-slate-800/50 rounded-full"></div>
              <div className="h-4 w-48 bg-slate-800/50 rounded-full"></div>
            </div>
          )}
        </div>

        {/* --- KHU VỰC 1: CHỌN LOẠI VÉ --- */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white border-b-4 border-amber-500 pb-2">
              1. Chọn Loại Vé
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg hover:border-amber-500/50 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-white uppercase">Người Lớn</h3>
                <p className="text-amber-500 font-semibold mt-1">80,000 VNĐ</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleTicketChange('adult', 'decrease')}
                  disabled={tickets.adult === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-lg text-white">
                  {tickets.adult}
                </span>
                <button
                  onClick={() => handleTicketChange('adult', 'increase')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg hover:border-amber-500/50 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-white uppercase">HSSV - U22</h3>
                <p className="text-amber-500 font-semibold mt-1">55,000 VNĐ</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleTicketChange('student', 'decrease')}
                  disabled={tickets.student === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-lg text-white">
                  {tickets.student}
                </span>
                <button
                  onClick={() => handleTicketChange('student', 'increase')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- KHU VỰC 2: SƠ ĐỒ GHẾ --- */}
        <div className="mb-16 bg-slate-900/50 p-6 sm:p-10 rounded-3xl border border-slate-800 overflow-x-auto relative">
          {/* Màn hình loading che sơ đồ khi đang tải data từ DB */}
          {isLoadingSeats && (
            <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center rounded-3xl backdrop-blur-sm">
              <div className="text-amber-500 text-xl font-bold animate-pulse mb-2">
                Đang tải dữ liệu ghế...
              </div>
            </div>
          )}

          <div className="flex items-center justify-center mb-16">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white border-b-4 border-amber-500 pb-2">
              2. Chọn Ghế
            </h2>
          </div>

          <div className="min-w-[800px] flex flex-col items-center">
            {/* ĐỒ HỌA MÀN HÌNH & CỬA VÀO */}
            <div className="w-full flex justify-center relative mb-20 mt-4">
              <div className="w-3/4 max-w-2xl h-12 border-t-4 border-amber-500/50 rounded-[50%] flex items-start justify-center shadow-[0_-15px_30px_-15px_rgba(245,158,11,0.2)]">
                <span className="text-slate-400 font-bold uppercase tracking-widest mt-2">
                  Màn Hình
                </span>
              </div>
              <div className="absolute right-4 sm:right-10 top-0 flex flex-col items-center border border-green-500/50 bg-green-500/10 text-green-500 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <DoorOpen className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-wider">Lối Vào</span>
              </div>
            </div>

            {/* KIẾN TRÚC 3 KHỐI */}
            <div className="relative flex items-start justify-center gap-6 sm:gap-10 mx-auto w-fit">
              {/* KHỐI 0 */}
              <div className="absolute -left-8 sm:-left-12 flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  {rowsPart1.map((r) => (
                    <div
                      key={r}
                      className="h-8 sm:h-10 flex items-center justify-center font-bold text-slate-500"
                    >
                      {r}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 py-3 border-2 border-transparent">
                  {rowsPart2.map((r) => (
                    <div
                      key={r}
                      className="h-8 sm:h-10 flex items-center justify-center font-bold text-slate-500"
                    >
                      {r}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {rowsPart3.map((r) => (
                    <div
                      key={r}
                      className="h-8 sm:h-10 flex items-center justify-center font-bold text-slate-500"
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* KHỐI 1 */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  {rowsPart1.map((r) => (
                    <div key={r} className="flex gap-2">
                      {renderSeats(r, 1, 4)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 py-3 border-2 border-transparent">
                  {rowsPart2.map((r) => (
                    <div key={r} className="flex gap-2">
                      {renderSeats(r, 1, 4)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {rowsPart3.map((r) => (
                    <div
                      key={r}
                      className={`flex gap-2 ${r === 'J' ? 'justify-between w-full' : ''}`}
                    >
                      {renderSeats(r, 1, 4)}
                    </div>
                  ))}
                </div>
              </div>

              {/* KHỐI 2 */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  {rowsPart1.map((r) => (
                    <div key={r} className="flex gap-2">
                      {renderSeats(r, 5, 14)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 py-3 border-2 border-dashed border-cyan-500/60 rounded-2xl relative bg-cyan-500/5 px-2 -mx-2">
                  {rowsPart2.map((r) => (
                    <div key={r} className="flex gap-2">
                      {renderSeats(r, 5, 14)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {rowsPart3.map((r) => (
                    <div
                      key={r}
                      className={`flex gap-2 ${r === 'J' ? 'justify-between w-full' : ''}`}
                    >
                      {renderSeats(r, 5, 14)}
                    </div>
                  ))}
                </div>
              </div>

              {/* KHỐI 3 */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  {rowsPart1.map((r) => (
                    <div key={r} className="flex gap-2">
                      {renderSeats(r, 15, 18)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 py-3 border-2 border-transparent">
                  {rowsPart2.map((r) => (
                    <div key={r} className="flex gap-2">
                      {renderSeats(r, 15, 18)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {rowsPart3.map((r) => (
                    <div
                      key={r}
                      className={`flex gap-2 ${r === 'J' ? 'justify-between w-full' : ''}`}
                    >
                      {renderSeats(r, 15, 18)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CHÚ THÍCH MÀU SẮC */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-8 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-slate-600 rounded"></div>
                <span className="text-sm text-slate-400 font-medium">Thường</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-amber-500/50 text-amber-500 rounded flex items-center justify-center text-[10px] font-bold">
                  VIP
                </div>
                <span className="text-sm text-slate-400 font-medium">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  <div className="w-4 h-6 border-y border-l border-pink-500/50 rounded-l"></div>
                  <div className="w-4 h-6 border-y border-r border-pink-500/50 rounded-r"></div>
                </div>
                <span className="text-sm text-slate-400 font-medium">Ghế Đôi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-800 rounded"></div>
                <span className="text-sm text-slate-400 font-medium">Đã bán</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-500 rounded shadow-lg shadow-amber-500/50"></div>
                <span className="text-sm text-slate-400 font-medium">Đang chọn</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- KHU VỰC 3: THANH THANH TOÁN DÍNH ĐÁY --- */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="container mx-auto max-w-6xl px-4 h-24 flex items-center justify-between gap-4">
          {/* Thông tin Phim & Rạp (Bên trái) */}
          <div className="hidden md:flex flex-col">
            <h3 className="text-white font-black uppercase tracking-wider text-lg">
              {showtimeInfo
                ? `${showtimeInfo.movie.title} (${showtimeInfo.movie.ageRating})`
                : 'Đang tải...'}
            </h3>
            <p className="text-slate-400 text-sm font-medium">
              {showtimeInfo
                ? `${showtimeInfo.room.cinema.name} - ${showtimeInfo.room.name}`
                : 'Đang tải...'}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                Thời gian giữ vé
              </span>
              <span className="text-amber-500 font-black text-xl leading-none">05:00</span>
            </div>

            <div className="hidden sm:flex flex-col">
              <span className="text-slate-400 text-sm">Ghế đang chọn:</span>
              <span className="text-white font-bold max-w-[150px] truncate">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex flex-col items-end">
              <span className="text-slate-400 text-xs font-medium">
                {totalSurcharge > 0
                  ? `+ Phụ thu ghế: ${totalSurcharge.toLocaleString('vi-VN')}đ`
                  : 'Tạm tính:'}
              </span>
              <span className="text-2xl font-black text-white">
                {totalPrice.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <button
              // Vừa kiểm tra logic vé, vừa khóa nút lại (disabled) nếu đang trong trạng thái isHolding
              disabled={totalTickets === 0 || selectedSeats.length !== totalTickets || isHolding}
              onClick={() => {
                if (user) {
                  handleDirectBooking();
                } else {
                  setIsGuestModalOpen(true);
                }
              }}
              // Thêm 'flex items-center gap-2' để chứa Icon cho đẹp
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 shadow-lg hover:shadow-amber-500/25 transform hover:-translate-y-1 disabled:transform-none disabled:shadow-none cursor-pointer"
            >
              {/* Hiển thị vòng xoay nếu isHolding = true, ngược lại hiện icon Vé */}
              {isHolding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> ĐANG XỬ LÝ...
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5" /> ĐẶT VÉ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <GuestCheckoutModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        selectedSeats={selectedSeats}
        totalPrice={totalPrice}
        showtimeId={showtimeId as string}
      />

      {/* MODAL CẢNH BÁO QUY ĐỊNH VÉ HSSV */}
      {isStudentWarningOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden transform transition-all p-8 sm:p-10 text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-amber-500 font-black text-2xl">!</span>
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
              Lưu ý hạng vé
            </h3>

            <p className="text-slate-400 mb-8 leading-relaxed text-sm">
              Bạn đang mua hạng vé đặc biệt dành cho HSSV, U22. Vui lòng mang theo{' '}
              <span className="text-amber-500 font-bold">CCCD hoặc Thẻ HSSV có dán ảnh</span> để xác
              minh tại quầy trước khi vào rạp.
              <br />
              <br />
              Nhân viên rạp có quyền từ chối cho bạn vào xem nếu không thực hiện đúng quy định này!
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setIsStudentWarningOpen(false)}
                className="flex-1 py-3.5 rounded-xl font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                HỦY
              </button>
              <button
                onClick={() => {
                  setIsStudentWarningOpen(false); // Tắt popup
                  handleTicketChange('student', 'increase', true); // Ép cộng 1 vé và bỏ qua cảnh báo
                }}
                className="flex-1 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg hover:from-amber-500 hover:to-amber-400 transform transition-transform hover:-translate-y-1 cursor-pointer"
              >
                ĐỒNG Ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
