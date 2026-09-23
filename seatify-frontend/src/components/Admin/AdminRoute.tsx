import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const AdminRoute = () => {
  const { user } = useAuth();

  // Kiểm tra 1: Chưa đăng nhập hoặc Không phải Admin
  if (!user || user.role !== 'ADMIN') {
    toast.error('Khu vực cấm! Bạn không có quyền truy cập.');
    // Đá văng về trang chủ, dùng replace để họ không bấm nút Back trên trình duyệt quay lại được
    return <Navigate to="/" replace />;
  }

  // Kiểm tra 2: Mọi thứ OK -> Mở barie cho đi tiếp vào các trang bên trong (Outlet)
  return <Outlet />;
};

export default AdminRoute;
