import { Search } from 'lucide-react';

const QuickBooking = () => {
  return (
    <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl relative z-10 -mt-12 mx-4 lg:mx-0">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Tiêu đề */}
        <div className="md:w-1/5 text-center md:text-left">
          <h3 className="text-xl font-black text-white uppercase tracking-wider">
            Đặt Vé <span className="text-amber-500">Nhanh</span>
          </h3>
        </div>

        {/* Các ô chọn (Select Box) */}
        <div className="w-full md:w-3/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5 outline-none cursor-pointer hover:border-slate-500 transition-colors">
            <option>1. Chọn Rạp</option>
            <option>Seatify Quốc Thanh</option>
            <option>Seatify Landmark</option>
          </select>

          <select className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5 outline-none cursor-pointer hover:border-slate-500 transition-colors">
            <option>2. Chọn Phim</option>
            <option>Lật Mặt 7</option>
            <option>Deadpool & Wolverine</option>
          </select>

          <select className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5 outline-none cursor-pointer hover:border-slate-500 transition-colors">
            <option>3. Chọn Ngày</option>
            <option>Hôm nay</option>
            <option>Ngày mai</option>
          </select>

          <select className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5 outline-none cursor-pointer hover:border-slate-500 transition-colors">
            <option>4. Chọn Suất</option>
            <option>18:00</option>
            <option>20:00</option>
          </select>
        </div>

        {/* Nút bấm */}
        <div className="w-full md:w-1/5 flex justify-end">
          <button className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg hover:shadow-amber-500/25">
            <Search className="w-5 h-5" /> ĐẶT NGAY
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickBooking;
