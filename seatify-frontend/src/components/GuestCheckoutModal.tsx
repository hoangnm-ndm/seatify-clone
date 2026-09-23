import { useState } from 'react';
import { X, Mail, User, Phone, Ticket, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { bookingService } from '../services/booking.service';

// 1. Thêm thuộc tính showtimeId vào khuôn Props
interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeats: string[];
  totalPrice: number;
  showtimeId: string; // <-- THÊM CÁI NÀY ĐỂ TRUYỀN XUỐNG BE
}

const GuestCheckoutModal = ({
  isOpen,
  onClose,
  selectedSeats,
  totalPrice,
  showtimeId,
}: GuestCheckoutModalProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // Trạng thái đang gọi API

  const [guestData, setGuestData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestData.fullName || !guestData.email || !guestData.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin để nhận vé!');
      return;
    }

    // 2. GỌI API KHÓA GHẾ XUỐNG BACKEND
    try {
      setIsLoading(true);
      const response = await bookingService.holdSeats({
        showtimeId: showtimeId,
        seatNames: selectedSeats,
        guestInfo: guestData,
        totalPrice: totalPrice,
      });

      // 3. THÀNH CÔNG: Chuyển hướng sang trang Thanh Toán kèm theo ID Hóa đơn thật!
      toast.success('Giữ ghế thành công!');
      onClose();
      navigate(`/checkout/${response.data.id}`);
    } catch (error) {
      // 4. THẤT BẠI (Ghế bị giật mất): Báo lỗi và đóng form để khách chọn lại
      if (error instanceof Error) {
        toast.error(error.message);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden transform transition-all">
        {/* Nút Đóng */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer p-2 disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 sm:p-12">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20">
              <Ticket className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2 text-center">
            Thông Tin Nhận Vé
          </h2>
          <p className="text-slate-400 text-center text-sm mb-6">
            Bạn đang mua vé với tư cách Khách. Vui lòng nhập đúng Email để nhận mã QR.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Ghế đã chọn</p>
              <p className="text-amber-500 font-bold">{selectedSeats.join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Tổng thanh toán</p>
              <p className="text-white font-black text-xl">
                {totalPrice.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Họ và tên"
                value={guestData.fullName}
                onChange={(e) => setGuestData({ ...guestData, fullName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="email"
                placeholder="Email nhận vé"
                value={guestData.email}
                onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={guestData.phone}
                onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold uppercase tracking-wider py-4 rounded-xl hover:from-amber-500 hover:to-amber-400 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-amber-500/25 mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> ĐANG KHÓA GHẾ...
                </>
              ) : (
                'TIẾN HÀNH THANH TOÁN'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckoutModal;
