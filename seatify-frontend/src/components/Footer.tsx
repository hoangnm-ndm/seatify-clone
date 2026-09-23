import { Clapperboard, Globe, Mail, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
              <Clapperboard className="w-6 h-6 text-amber-500" />
              <span className="text-xl font-black tracking-widest text-white">SEATIFY</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Trải nghiệm điện ảnh đỉnh cao với hệ thống đặt vé xem phim Premium. Ghế ngồi thoải
              mái, màn hình siêu thực, âm thanh sống động.
            </p>
            {/* Mạng xã hội */}
            <div className="flex gap-4 pt-2">
              <Globe className="w-5 h-5 hover:text-amber-500 cursor-pointer transition-colors" />
              <Mail className="w-5 h-5 hover:text-amber-500 cursor-pointer transition-colors" />
              <MessageSquare className="w-5 h-5 hover:text-amber-500 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Cột 2: Hệ thống rạp */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">
              Hệ thống rạp
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Seatify Quốc Thanh
              </li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Seatify Hai Bà Trưng
              </li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Seatify Landmark
              </li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Seatify Đà Lạt
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Giải đáp câu hỏi (FAQ)
              </li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Chính sách bảo mật
              </li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Điều khoản sử dụng
              </li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">
                Liên hệ đối tác
              </li>
            </ul>
          </div>

          {/* Cột 4: Chăm sóc khách hàng */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">
              Chăm sóc khách hàng
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                Hotline: <span className="text-amber-500 font-bold">1900 1234</span>
              </p>
              <p>Email: support@seatify.vn</p>
              <p>Giờ làm việc: 8:00 - 22:00 (Tất cả các ngày)</p>
            </div>
          </div>
        </div>

        {/* Dòng bản quyền (Copyright) */}
        <div className="pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
          <p>© 2026 Seatify.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
