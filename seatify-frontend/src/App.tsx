import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    // 1. Trạm phát sóng User
    <AuthProvider>
      {/* 2. Máy phát thông báo */}
      <Toaster richColors position="top-right" duration={3000} />
      {/* 3. Hệ thống chuyển trang */}
      <BrowserRouter>
        {/* 4. Lính canh tự cuộn chuột */}
        <ScrollToTop />
        {/* 5. Toàn bộ giao diện trang web nằm ở đây */}
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
