import { useState } from 'react';
import { X, Mail, Lock, User, Phone, CalendarDays, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  // Thay isLogin thành activeTab để quản lý UI chuẩn hơn
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // State tắt bật con mắt mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    birthDay: '',
  });
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- REGEX KIỂM TRA ĐỊNH DẠNG ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Mật khẩu: Tối thiểu 8 ký tự, ít nhất 1 chữ cái và 1 chữ số
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    try {
      // ==========================================
      // XỬ LÝ ĐĂNG NHẬP
      // ==========================================
      if (activeTab === 'login') {
        if (!formData.email || !formData.password) {
          return toast.error('Vui lòng nhập Email và Mật khẩu!');
        }
        if (!emailRegex.test(formData.email)) {
          return toast.error('Định dạng Email không hợp lệ!');
        }

        // Gọi API
        const response = await authService.login({
          email: formData.email,
          password: formData.password,
        });

        // Lấy thông tin user và token từ BE trả về, ném vào hàm login
        login(response.data.user, response.data.token);
        toast.success(`Đăng nhập thành công! Chào ${response.data.user.fullName}`);
        onClose();
      }

      // ==========================================
      // XỬ LÝ ĐĂNG KÝ
      // ==========================================
      else {
        if (
          !formData.email ||
          !formData.password ||
          !formData.fullName ||
          !formData.phone ||
          !formData.birthDay
        ) {
          return toast.error('Vui lòng điền đầy đủ thông tin!');
        }
        if (!emailRegex.test(formData.email)) {
          return toast.error('Định dạng Email không hợp lệ!');
        }
        if (!passwordRegex.test(formData.password)) {
          return toast.error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số!');
        }
        if (formData.password !== formData.confirmPassword) {
          return toast.error('Mật khẩu xác nhận không khớp!');
        }

        // Bắn Data xuống BE
        await authService.register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
          birthDay: formData.birthDay,
        });

        toast.success('Đăng ký thành công! Bạn có thể đăng nhập.');
        setActiveTab('login');
        setFormData({ ...formData, password: '', confirmPassword: '' });
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message); // Hứng lỗi từ BE và in ra Toast màu đỏ
      } else {
        toast.error('Có lỗi không xác định xảy ra!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden transform transition-all flex flex-col">
        {/* Nút X Đóng Modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer z-10 p-1 bg-slate-800/50 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- KHU VỰC TABS (Giống Cinestar nhưng màu Premium) --- */}
        <div className="flex w-full h-16 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 flex items-center justify-center font-black uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 flex items-center justify-center font-black uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* --- KHU VỰC FORM --- */}
        <div className="p-8 sm:p-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CÁC TRƯỜNG DÀNH RIÊNG CHO ĐĂNG KÝ */}
            {activeTab === 'register' && (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Họ và tên *"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      placeholder="Số điện thoại *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  {/* color-scheme: dark giúp cái icon lịch (calendar picker) tự động có màu tối trên Chrome */}
                  <div className="relative flex-1" style={{ colorScheme: 'dark' }}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CalendarDays className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="date"
                      value={formData.birthDay}
                      onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* EMAIL (Dùng chung cho cả 2 Tab) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="email"
                placeholder="Địa chỉ Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* PASSWORD (Có con mắt ẩn/hiện) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu *"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-amber-500 cursor-pointer"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>

            {/* CONFIRM PASSWORD (Chỉ hiện khi Đăng Ký) */}
            {activeTab === 'register' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Xác nhận mật khẩu *"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-amber-500 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}

            {/* Quên mật khẩu (Chỉ hiện lúc Đăng nhập) */}
            {activeTab === 'login' && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-sm text-slate-400 hover:text-amber-500 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Nút Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl hover:from-amber-500 hover:to-amber-400 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-amber-500/25 mt-4 cursor-pointer"
            >
              {activeTab === 'login' ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
