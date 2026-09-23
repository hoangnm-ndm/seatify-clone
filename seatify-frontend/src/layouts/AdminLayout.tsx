import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Film,
  CalendarDays,
  LogOut,
  Clapperboard,
  StepBackIcon,
} from 'lucide-react';
import { toast } from 'sonner';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất khỏi hệ thống quản trị!');
    navigate('/');
  };

  // Mảng chứa các menu để render cho lẹ
  const menuItems = [
    {
      name: 'Tổng Quan',
      path: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Quản Lý Phim',
      path: '/admin/movies',
      icon: <Film className="w-5 h-5" />,
    },
    {
      name: 'Quản Lý Suất Chiếu',
      path: '/admin/showtimes',
      icon: <CalendarDays className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* CỘT TRÁI: SIDEBAR CỐ ĐỊNH */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <Clapperboard className="w-6 h-6 text-amber-500" />
            <span className="text-xl font-black tracking-widest text-white">
              ADMIN<span className="text-amber-500">CP</span>
            </span>
          </Link>
        </div>

        {/* Thông tin Admin */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-4 bg-slate-950/30">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 font-black">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm truncate">{user?.fullName}</p>
            <p className="text-amber-500 text-xs font-bold">Quản Trị Viên</p>
          </div>
        </div>

        {/* Menu Điều Hướng */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            // Kiểm tra xem có đang ở trang này không để bôi màu vàng
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Khu vực nút dưới đáy Sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <StepBackIcon className="w-5 h-5" /> Về Trang Chủ
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> Đăng Xuất
          </button>
        </div>
      </aside>

      {/* CỘT PHẢI: NỘI DUNG CHÍNH (Thay đổi theo Menu) */}
      <main className="flex-1 overflow-y-auto bg-slate-950 relative">
        {/* Cái lỗ hổng để nhét các trang (Tổng quan, Quản lý phim...) vào */}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
