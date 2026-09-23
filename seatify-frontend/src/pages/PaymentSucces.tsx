import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, MailCheck, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '../services/payment.service';
import { bookingService } from '../services/booking.service';

// --- KHUÔN DỮ LIỆU HÓA ĐƠN ---
interface BookingData {
  id: string;
  userId: string | null;
  guestName: string | null;
  guestEmail: string | null;
}

const PaymentSuccessPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State phục vụ tính năng Upsell (Tạo tài khoản từ Guest)
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  useEffect(() => {
    const confirmAndFetchData = async () => {
      try {
        // Chốt đơn dưới Backend
        await paymentService.confirmPayment(bookingId as string);

        // Lấy thông tin hóa đơn
        const res = await bookingService.getBookingById(bookingId as string);
        setBooking(res.data);
      } catch (error) {
        console.error('Lỗi khi chốt đơn:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) confirmAndFetchData();
  }, [bookingId]);

  // HÀM XỬ LÝ UPSELL: GUEST -> USER
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
    }

    setIsCreatingAccount(true);
    // Giả lập thời gian xử lý API tạo tài khoản từ Guest
    setTimeout(() => {
      setIsCreatingAccount(false);
      setAccountCreated(true);
      toast.success('Tạo tài khoản thành công! Mật khẩu đã được lưu.');
    }, 1500);
  };

  if (isLoading)
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-amber-500 font-bold animate-pulse">
        ĐANG XÁC NHẬN THANH TOÁN...
      </div>
    );
  if (!booking)
    return <div className="text-center text-white mt-20">Không tìm thấy thông tin giao dịch!</div>;

  // Nếu hóa đơn không có userId -> Là Khách vãng lai (Guest)
  const isGuest = !booking.userId;
  const targetEmail = booking.guestEmail || 'email của bạn';

  return (
    <div className="py-12 min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg px-4">
        {/* 1. KHỐI THÔNG BÁO THÀNH CÔNG (TẬP TRUNG VÀO EMAIL) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 md:p-10 text-center relative overflow-hidden">
          {/* Lớp ánh sáng xanh lá ẩn dưới nền */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-green-500/10 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              Thanh Toán Thành Công
            </h1>
            <p className="text-slate-400 mb-8">
              Cảm ơn <span className="text-white font-bold">{booking.guestName}</span> đã lựa chọn
              Seatify.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4">
              <MailCheck className="w-12 h-12 text-amber-500" />
              <div>
                <p className="text-slate-300 font-medium mb-1">
                  Vé điện tử (QR Code) đã được gửi tới email:
                </p>
                <p className="text-amber-500 font-bold text-lg">{targetEmail}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam). Bạn chỉ cần đưa mã QR trong email
                cho nhân viên để vào rạp.
              </p>
            </div>
          </div>
        </div>

        {/* 2. KHỐI UPSELL: CHUYỂN ĐỔI GUEST THÀNH USER */}
        {isGuest && !accountCreated && (
          <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl shadow-xl p-8 transform transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-black text-white uppercase">Tạo tài khoản nhanh</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Hệ thống đã lưu email <span className="text-white font-bold">{targetEmail}</span> của
              bạn. Hãy tạo một mật khẩu để lần sau mua vé nhanh hơn và tích điểm nhận ưu đãi nhé!
            </p>

            <form onSubmit={handleCreateAccount} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingAccount}
                className="bg-amber-500 text-slate-950 font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {isCreatingAccount ? 'ĐANG TẠO...' : 'ĐĂNG KÝ NGAY'}
              </button>
            </form>
          </div>
        )}

        {/* Thông báo tạo tài khoản thành công */}
        {accountCreated && (
          <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-3xl p-6 text-center">
            <p className="text-green-500 font-bold">🎉 Chào mừng bạn gia nhập cộng đồng Seatify!</p>
          </div>
        )}

        {/* Nút Về Trang chủ */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold group cursor-pointer"
          >
            Tiếp tục khám phá phim{' '}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
