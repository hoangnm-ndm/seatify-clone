import { useState } from 'react';
import { Search, User, LogOut, ChevronDown, Clapperboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

import logoImg from '../assets/logo-seatify.png';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công!');
    navigate('/');
  };

  const handleSearch = () => {
    if (keyword.trim() !== '') {
      navigate(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
      setKeyword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    // Dùng React Fragment (<> ... </>) để bọc toàn bộ, giúp lôi Modal ra khỏi Header
    <>
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800/50 shadow-sm text-slate-200">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* ========================================== */}
          {/* CỤM TRÁI: LOGO & MENU */}
          {/* ========================================== */}
          <div className="flex items-center gap-10">
            {/* LOGO CỦA BẠN (GIỮ NGUYÊN 100%) */}
            <Link to="/" className="flex items-center gap-1 group cursor-pointer">
              <img
                src={logoImg}
                alt="S"
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] rounded-lg"
              />
              <span className="text-[25px] font-black tracking-widest text-white group-hover:text-amber-500 transition-colors">
                Seatify
              </span>
            </Link>

            {/* MENU PHIM */}
            <div className="relative group hidden lg:block">
              <button className="flex items-center gap-1.5 font-bold text-sm text-slate-300 hover:text-amber-500 transition-colors py-2 cursor-pointer">
                Khám Phá{' '}
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
              </button>

              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top group-hover:translate-y-0 translate-y-2 z-50 overflow-hidden">
                <Link
                  to="/movies-status/now-playing"
                  className="block px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-amber-500 transition-colors border-b border-slate-800/50"
                >
                  Phim Đang Chiếu
                </Link>
                <Link
                  to="/movies-status/coming-soon"
                  className="block px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-amber-500 transition-colors"
                >
                  Phim Sắp Chiếu
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* CỤM PHẢI: TÌM KIẾM & TÀI KHOẢN */}
          {/* ========================================== */}
          <div className="flex items-center gap-6">
            {/* THANH TÌM KIẾM */}
            <div className="hidden md:flex items-center bg-slate-900/50 border border-slate-700/50 hover:border-slate-500 focus-within:border-amber-500 focus-within:bg-slate-900 rounded-full px-4 py-2 transition-all w-64 lg:w-72">
              <input
                type="text"
                placeholder="Tìm tên phim..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none w-full text-sm text-slate-200 placeholder-slate-500"
              />
              <Search
                onClick={handleSearch}
                className="w-4 h-4 text-slate-400 hover:text-amber-500 cursor-pointer transition-colors shrink-0"
              />
            </div>

            {/* KHỐI TÀI KHOẢN */}
            <div className="flex items-center">
              {!user ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" /> Đăng nhập
                </button>
              ) : (
                <div className="relative group">
                  <div className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-bold text-white max-w-[100px] truncate ml-1">
                      {user.fullName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors mr-1" />
                  </div>

                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right group-hover:translate-y-0 translate-y-2 z-50">
                    <div className="p-4 border-b border-slate-800/50 bg-slate-800/20 rounded-t-2xl">
                      <p className="text-white font-bold truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1 mt-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-amber-500 rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4" /> Quản lý tài khoản
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 rounded-xl transition-colors mt-2 border border-amber-500/20"
                        >
                          <Clapperboard className="w-4 h-4" /> Bảng Điều Khiển
                        </Link>
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-800/50">
                      <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* 4. MODALS (ĐÃ ĐƯỢC ĐƯA RA KHỎI THẺ HEADER) */}
      {/* ========================================== */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

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
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleLogout();
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg hover:bg-red-600 transform transition-transform hover:-translate-y-1 cursor-pointer"
              >
                ĐĂNG XUẤT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
