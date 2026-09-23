// Thêm chữ 'type' trước ReactNode để làm vui lòng TypeScript
import { createContext, useContext, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// Định nghĩa khuôn
interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone: string;
  birthDay: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // LOGIC MỚI: KIỂM TRA HẠN SỬ DỤNG TOKEN NGAY LÚC KHỞI ĐỘNG
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        // Bóc cái token ra xem
        const decodedToken = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000; // Thời gian hiện tại (tính bằng giây)

        // Nếu thời hạn (exp) nhỏ hơn thời gian hiện tại -> ĐÃ HẾT HẠN (Ôi thiu)
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          console.log('Token đã hết hạn! Tự động đăng xuất.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return null; // Trả về null -> Hiện nút Đăng nhập
        }

        // Còn hạn thì cho qua
        return JSON.parse(storedUser);
      } catch {
        // Nếu token bị hacker sửa bậy bạ -> decode lỗi -> Xóa luôn
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

// Đặt bùa tắt cảnh báo ESLint cho dòng dưới đây vì đây là chuẩn quốc tế
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được bọc trong AuthProvider');
  return context;
};
