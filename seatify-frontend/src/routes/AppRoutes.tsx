import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// ======================================================
// 1. IMPORTS BÌNH THƯỜNG (STATIC IMPORTS)
// Những cái này cần tải ngay lập tức khi mở web để dựng bộ khung
// ======================================================
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import AdminRoute from '../components/Admin/AdminRoute';
import HomePage from '../pages/HomePage'; // Trang chủ tải ngay lập tức

// ======================================================
// 2. IMPORTS LƯỜI BIẾNG (LAZY LOADING)
// Chỉ tải code của các trang này khi người dùng thực sự click vào link của nó
// ======================================================
// --- Khách hàng ---
const MovieDetailPage = lazy(() => import('../pages/MovieDetailPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const MovieListPage = lazy(() => import('../pages/MovieListPage'));
const BookingPage = lazy(() => import('../pages/BookingPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const PaymentSuccessPage = lazy(() => import('../pages/PaymentSucces'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// --- Admin (Khách hàng vĩnh viễn không phải tải code này) ---
const AdminDashboardPage = lazy(() => import('../pages/Admin/AdminDashboardPage'));
const AdminMoviesPage = lazy(() => import('../pages/Admin/AdminMoviePage'));
const AdminShowtimePage = lazy(() => import('../pages/Admin/AdminShowtimePage'));

// ======================================================
// 3. MÀN HÌNH CHỜ (FALLBACK)
// Hiện ra trong khoảng 0.1 giây lúc trình duyệt đang kéo file code mới về
// ======================================================
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      <p className="text-amber-500 font-bold tracking-widest animate-pulse">ĐANG TẢI TRANG...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    // Bọc toàn bộ Routes trong Suspense để hứng trạng thái tải file code
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* LUỒNG KHÁCH HÀNG */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="movies/:movieId" element={<MovieDetailPage />} />
          <Route path="movies-status/:status" element={<MovieListPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="booking/:showtimeId" element={<BookingPage />} />
          <Route path="checkout/:bookingId" element={<CheckoutPage />} />
          <Route path="payment-success/:bookingId" element={<PaymentSuccessPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* LUỒNG ADMIN */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="showtimes" element={<AdminShowtimePage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
