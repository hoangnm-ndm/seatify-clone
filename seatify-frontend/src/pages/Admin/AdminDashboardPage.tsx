import { Users, Film, Ticket, CalendarDays } from 'lucide-react';

const AdminDashboardPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-8">
        Tổng Quan Hệ Thống
      </h1>

      {/* 4 Thẻ Thống kê (Chỉ làm giao diện tĩnh cho đẹp mắt) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Doanh Thu Tháng</p>
              <h3 className="text-2xl font-black text-white mt-1">125.5M VNĐ</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
              <Ticket className="w-6 h-6" />
            </div>
          </div>
          <p className="text-green-500 text-sm font-bold">+15% so với tháng trước</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Tổng Số Phim</p>
              <h3 className="text-2xl font-black text-white mt-1">24</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Film className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">8 phim đang chiếu</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Suất Chiếu Hôm Nay</p>
              <h3 className="text-2xl font-black text-white mt-1">18</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Trên 3 cụm rạp</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase">Khách Hàng</p>
              <h3 className="text-2xl font-black text-white mt-1">1,204</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">24 user đăng ký mới</p>
        </div>
      </div>

      <div className="mt-12 text-center text-slate-500 border-2 border-dashed border-slate-800 p-20 rounded-3xl">
        Khu vực phát triển biểu đồ thống kê...
      </div>
    </div>
  );
};

export default AdminDashboardPage;
