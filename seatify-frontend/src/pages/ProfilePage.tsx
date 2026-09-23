import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, History, LogOut, Mail, Phone, CalendarDays, Lock, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchClient } from '../utils/apiClient';

// Khuôn dữ liệu cho Lịch sử hóa đơn
interface BookingHistoryItem {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  ticketSeats: {
    showtime: {
      movie: { title: string };
      room: { cinema: { name: string } };
    };
  }[];
}

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  // 1. Khởi tạo dữ liệu trực tiếp lấy từ 'user' luôn (Dùng user? để phòng hờ bị null)
  // Lấy thẳng dữ liệu từ user, xử lý chuỗi ngày tháng
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDay: user?.birthDay ? user.birthDay.split('T')[0] : '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // State lưu trữ lịch sử đặt vé
  const [historyData, setHistoryData] = useState<BookingHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // State quản lý Popup xác nhận Đăng xuất
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // 2. EFFECT CHỈ LÀM BẢO VỆ: Nếu phát hiện không có user -> Đá văng ra ngoài
  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để truy cập!');
      navigate('/');
    }
  }, [user, navigate]);

  // Khi activeTab chuyển sang 'history', tự động gọi API (useEffect gọi lịch sử đặt vé)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetchClient('/bookings/my-history');
        setHistoryData(response.data);
      } catch (error) {
        if (error instanceof Error) toast.error('Không thể tải lịch sử đặt vé');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật thông tin thành công! (Giả lập)');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp!');
    }
    toast.success('Đổi mật khẩu thành công! (Giả lập)');
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="py-12 min-h-[80vh]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ========================================== */}
          {/* CỘT TRÁI: SIDEBAR MENU (CLEAN UI) */}
          {/* ========================================== */}
          <div className="w-full lg:w-1/4 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl sticky top-24">
              {/* Avatar & Tên */}
              <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-white font-bold text-lg truncate">{user.fullName}</h3>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="p-4 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <User className="w-5 h-5" /> Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'history' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <History className="w-5 h-5" /> Lịch sử đặt vé
                </button>

                <div className="my-2 border-t border-slate-800"></div>

                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="w-5 h-5" /> Đăng xuất
                </button>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* CỘT PHẢI: NỘI DUNG CHÍNH (Thay đổi theo Tab) */}
          {/* ========================================== */}
          <div className="w-full lg:w-3/4 space-y-8">
            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'profile' && (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-8 border-b-2 border-slate-800 pb-4">
                    Thông tin cá nhân
                  </h2>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Họ và tên</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="w-5 h-5 text-slate-500" />
                          </div>
                          <input
                            type="text"
                            value={profileData.fullName}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                fullName: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2" style={{ colorScheme: 'dark' }}>
                        <label className="text-sm font-bold text-slate-400">Ngày sinh</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <CalendarDays className="w-5 h-5 text-slate-500" />
                          </div>
                          <input
                            type="date"
                            value={profileData.birthDay}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                birthDay: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Số điện thoại</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="w-5 h-5 text-slate-500" />
                          </div>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">
                          Email (Không thể đổi)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="w-5 h-5 text-slate-500" />
                          </div>
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full bg-slate-800/50 border border-slate-800 text-slate-500 rounded-xl pl-12 pr-4 py-3 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="flex items-center gap-2 bg-amber-500 text-slate-950 font-black px-8 py-3 rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <Save className="w-5 h-5" /> LƯU THÔNG TIN
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-8 border-b-2 border-slate-800 pb-4">
                    Đổi mật khẩu
                  </h2>
                  <form onSubmit={handleChangePassword} className="max-w-md space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Mật khẩu cũ *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="w-5 h-5 text-slate-500" />
                        </div>
                        <input
                          type="password"
                          value={passwordData.oldPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              oldPassword: e.target.value,
                            })
                          }
                          required
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Mật khẩu mới *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="w-5 h-5 text-slate-500" />
                        </div>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          required
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">
                        Xác nhận mật khẩu mới *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="w-5 h-5 text-slate-500" />
                        </div>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="bg-slate-800 border border-slate-700 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        CẬP NHẬT MẬT KHẨU
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* TAB 2: LỊCH SỬ ĐẶT VÉ */}
            {activeTab === 'history' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl min-h-[400px]">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-8 border-b-2 border-slate-800 pb-4 flex items-center gap-3">
                  <History className="w-6 h-6 text-amber-500" /> Lịch sử đặt vé
                </h2>

                {isLoadingHistory ? (
                  <div className="text-center text-amber-500 font-bold animate-pulse py-10">
                    Đang tải dữ liệu...
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <History className="w-20 h-20 text-slate-800 mb-6" />
                    <h3 className="text-xl font-bold text-slate-500 uppercase">
                      Chưa có giao dịch
                    </h3>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                          <th className="pb-4 font-bold">Mã Đơn</th>
                          <th className="pb-4 font-bold">Phim & Rạp</th>
                          <th className="pb-4 font-bold">Ngày Đặt</th>
                          <th className="pb-4 font-bold">Tổng Tiền</th>
                          <th className="pb-4 font-bold">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {historyData.map((booking) => {
                          const movieTitle = booking.ticketSeats[0]?.showtime.movie.title || 'N/A';
                          const cinemaName =
                            booking.ticketSeats[0]?.showtime.room.cinema.name || 'N/A';

                          // Custom màu sắc theo trạng thái
                          let statusClass = 'bg-slate-800 text-slate-400 border-slate-700';
                          let statusText = 'Đang xử lý';
                          if (booking.status === 'SUCCESS') {
                            statusClass = 'bg-green-500/10 text-green-500 border-green-500/20';
                            statusText = 'Thành công';
                          } else if (booking.status === 'PENDING') {
                            statusClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                            statusText = 'Chờ thanh toán';
                          } else if (booking.status === 'FAILED') {
                            statusClass = 'bg-red-500/10 text-red-500 border-red-500/20';
                            statusText = 'Đã hủy';
                          }

                          return (
                            <tr
                              key={booking.id}
                              className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-4 font-mono text-slate-300">
                                {/* Cắt ngắn mã đơn hàng cho gọn */}
                                {booking.id.substring(0, 8)}...
                              </td>
                              <td className="py-4">
                                <p className="font-bold text-white mb-1">{movieTitle}</p>
                                <p className="text-xs text-slate-500">{cinemaName}</p>
                              </td>
                              <td className="py-4 text-slate-400">
                                {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="py-4 font-black text-amber-500">
                                {booking.totalPrice.toLocaleString('vi-VN')}đ
                              </td>
                              <td className="py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold border ${statusClass}`}
                                >
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      {/* ========================================== */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden transform transition-all p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              Đăng Xuất
            </h3>
            <p className="text-slate-400 mb-8 text-sm">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                HỦY
              </button>
              <button
                onClick={handleLogout} // Khi bấm nút này mới thực sự chạy hàm xóa Token
                className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg hover:bg-red-600 transform transition-transform hover:-translate-y-1 cursor-pointer"
              >
                ĐĂNG XUẤT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
