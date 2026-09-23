const BASE_URL = import.meta.env.VITE_API_URL;

export const fetchClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  //XỬ LÝ LỖI (Bắt lỗi 401 Hết hạn Token)
  if (!response.ok) {
    // Nếu Backend báo 401 (Vé giả hoặc Hết hạn)
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Đá thẳng về trang chủ và ép reload để xóa sạch State
      window.location.href = '/';
    }

    const errorData = await response.json();
    throw new Error(errorData.message || 'Có lỗi xảy ra từ máy chủ!');
  }

  return await response.json();
};
