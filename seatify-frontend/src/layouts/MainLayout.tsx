import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    // Thêm relative và overflow-hidden để chứa ánh sáng
    <div className="relative flex min-h-screen flex-col bg-slate-950 text-slate-200 font-sans transition-colors duration-300 overflow-x-hidden">
      {/* --- HIỆU ỨNG AMBIENT BACKGROUND (NỀN CHÌM) --- */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none z-0"></div>

      {/* Các thành phần chính phải có z-10 để nổi lên trên nền chìm */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow container mx-auto px-4 py-8">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
