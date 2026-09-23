# 08. Kiến trúc frontend: hiện trạng và đề xuất

> Bổ sung ngày 24/09/2026. `fe/` = `seatify-frontend/src/`.
> File này trình bày chi tiết **ARCH-11 → ARCH-16**, **CODE-04** và **CODE-05**.

## 1. Hiện trạng

```text
fe/
├── App.tsx · main.tsx · index.css
├── routes/AppRoutes.tsx          # <Routes> JSX, một file cho mọi route
├── layouts/                      # MainLayout, AdminLayout
├── pages/                        # 9 trang khách hàng nằm phẳng + pages/Admin/ (3 trang)
├── components/                   # 10 component nằm phẳng + components/Admin/AdminRoute
├── contexts/AuthContext.tsx
├── services/                     # 6 file gọi API
└── utils/apiClient.ts
```

| Chỉ số | Giá trị |
|---|---|
| Trang tự gọi API trong `useEffect` | 11 file |
| Trang gọi thẳng `fetchClient`, bỏ qua `services/` | 4 (`ProfilePage`, `MovieListPage`, `SearchPage`, `AdminMoviePage`) |
| Custom hook tự viết | 0 (chỉ có `useAuth`) |
| Component có từ 7 `useState` trở lên | 5 (`BookingPage` 9, `AdminShowtimePage` 8, `AdminMoviePage` 8, `ProfilePage` 7, `MovieDetailPage` 7) |
| `interface Movie` khai báo lại | 7 file, và các bản không giống nhau |
| Lớp phủ modal viết tay | 8 chỗ |
| Kiểu trả về của `fetchClient` | `Promise<any>` (ngầm định, vì `response.json()` trả về `any`) |
| `strict` trong `tsconfig.app.json` | **Tắt** (không được khai báo từ commit đầu tiên) |

## 2. Vấn đề chi tiết

### ARCH-11: Thư mục phẳng theo loại file, trộn lẫn khách hàng và quản trị

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** `pages/` chứa lẫn trang công khai và trang cần đăng nhập. Guard của admin nằm trong `components/Admin/`, còn trang admin nằm trong `pages/Admin/`. `components/` trộn component dùng chung (`ScrollToTop`), component của một tính năng (`GuestCheckoutModal`, `TrailerModal`), layout con (`Header`, `Footer`) và code chết (`QuickBooking`). `CustomDropdown` được định nghĩa ngay trong `pages/Admin/AdminShowtimePage.tsx:28-71`.
- **Ảnh hưởng:** không có ranh giới tính năng. Muốn sửa luồng đặt vé phải tìm trong `pages/`, `components/` và `services/`. Không phân biệt được component nào có thể tái sử dụng.

### ARCH-12: Routing dạng JSX trong một file, không có error boundary

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**
  - `fe/routes/AppRoutes.tsx` khai báo mọi route bằng `<Routes>/<Route>`, còn `fe/App.tsx` dùng `<BrowserRouter>`. Dự án chưa dùng data router (`createBrowserRouter`), nên không có `errorElement`, `lazy` theo route hay `<ScrollRestoration />`.
  - **Không có error boundary nào.** Nếu một trang ném lỗi khi render (ví dụ `data.ticketSeats[0].showtime` khi mảng rỗng), hoặc tải chunk lazy thất bại (mạng yếu, vừa deploy bản mới), **toàn bộ ứng dụng trắng màn hình**.
  - `fe/components/ScrollToTop.tsx` tự viết lại một việc mà `<ScrollRestoration />` của data router đã làm sẵn.
  - Guard admin gọi `toast` ngay trong lúc render (ERR-09). Route `movies-status/:status` nhận bất kỳ giá trị nào: `/movies-status/abc` hiển thị trang phim sắp chiếu (`fe/pages/MovieListPage.tsx:30-32`).
  - Đường dẫn được viết thành chuỗi ở nhiều nơi (`/movies/${id}`, `/booking/${id}`, `/checkout/${id}`…). Không có hằng số `ROUTES` dùng chung.

### ARCH-13: Dữ liệu từ server được quản lý thủ công

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận (race condition là rủi ro tiềm ẩn)
- **Bằng chứng:** 11 file lặp đi lặp lại mẫu `useState(data) + useState(isLoading) + useEffect(fetch) + try/catch/finally`. Hậu quả cụ thể:
  - **Không có cache:** `HomePage`, `MovieListPage`, `SearchPage` và `AdminShowtimePage` đều tải lại toàn bộ `/movies` rồi tự lọc. Chuyển trang qua lại là tải lại.
  - **Race condition:** `fe/pages/MovieDetailPage.tsx:124-165` gọi API mỗi khi đổi ngày nhưng **không hủy request cũ**. Bấm nhanh từ ngày A sang ngày B, nếu response của ngày A đến sau thì lịch chiếu ngày A hiện dưới tab ngày B.
  - **Dữ liệu ghế cũ:** `fe/pages/BookingPage.tsx:92-112` chỉ tải trạng thái ghế **một lần**. Người khác giữ ghế trong lúc khách đang chọn thì khách không biết, cho tới khi bấm "Tiếp tục" và nhận lỗi.
  - **Làm mới thủ công:** `refreshKey` trong `AdminMoviePage` là cách tự chế để tải lại sau khi thêm hoặc sửa.
- **Hướng xử lý:** TanStack Query (xem mục 4.3).

### ARCH-14: State toàn cục có hai nguồn sự thật

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** `AuthContext` giữ `user`, nhưng `fe/utils/apiClient.ts:4, 23-26` lại tự đọc và xóa `localStorage`, rồi tải lại **toàn bộ trang** bằng `window.location.href = '/'` khi gặp lỗi 401, vì `apiClient` không truy cập được context. Thông tin `user` lưu trong `localStorage` là bản chụp lúc đăng nhập và không bao giờ được làm mới. State giao diện dùng ở nhiều nơi (modal trailer, modal đăng nhập) bị nhân bản ở 4 trang.
- **Hướng xử lý:** zustand cho **state phía client** (auth, UI), đọc được cả ngoài React (`useAuthStore.getState()`). **Không** đưa dữ liệu server vào zustand, vì phần đó đã có TanStack Query.

### ARCH-15: Logic gọi API và logic nghiệp vụ nằm trong component, không có custom hook

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** `BookingPage.tsx` (666 dòng) vừa gọi 3 API, vừa tính giá, vừa giữ quy tắc chọn vé/ghế, vừa vẽ sơ đồ ghế, vừa quản lý 2 modal. `CheckoutPage.tsx` tự tính thời gian còn lại và tự chạy `setInterval`. 4 trang gọi thẳng `fetchClient` với chuỗi endpoint viết cứng. Các file `services/*` không khai báo kiểu trả về.
- **Ảnh hưởng:** không tái sử dụng được logic (đồng hồ đếm ngược, chọn ghế); không test được logic nếu không render cả trang; thay đổi API phải tìm trong mọi component.

### ARCH-16: Types và interface phân tán, kiểu an toàn chỉ là hình thức

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**
  - `interface Movie` khai báo ở 7 file (`HomePage`, `SearchPage`, `MovieListPage`, `HeroBanner`, `AdminMoviePage`, `AdminShowtimePage`, `services/movie.service.ts`), và các bản lệch nhau: `posterUrl: string` ở chỗ này, `string | null` ở chỗ khác; `status` lúc là union, lúc là `string`.
  - `BookingData` định nghĩa khác nhau ở `CheckoutPage.tsx:19-26` và `PaymentSucces.tsx:9-14`.
  - `fetchClient` trả về `Promise<any>`, nên `res.data` ở mọi nơi là `any`. Các interface ở trên chỉ là **lời hứa không được kiểm chứng**: nếu backend đổi tên trường, TypeScript không báo lỗi.
  - `MovieCardProps.id: string | number` (`fe/components/MovieCard.tsx:6`) trong khi ID thực tế luôn là chuỗi UUID.
- **Hướng xử lý:** mục 4.5.

### CODE-04: Frontend không bật `strict`

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận (`seatify-frontend/tsconfig.app.json` không có `"strict": true` từ commit `5257fd1`)
- **Ảnh hưởng:** `strictNullChecks` đang tắt, nên TypeScript không cảnh báo khi truy cập thuộc tính của giá trị có thể là `null`/`undefined`. Đây là loại lỗi gây trắng màn hình phổ biến nhất. **Đính chính báo cáo lần trước:** chỉ backend bật strict; frontend thì không.
- **Hướng xử lý:** thêm `"strict": true` và `"noUncheckedIndexedAccess": true`, rồi sửa các lỗi phát sinh. Nên làm **trước** khi tái cấu trúc, để trình biên dịch giúp phát hiện chỗ hỏng khi di chuyển code.

### CODE-05: Điều hướng và ngữ nghĩa HTML

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**

  | Vị trí | Vấn đề |
  |---|---|
  | `fe/components/Footer.tsx:33-44` | 4 thẻ `<li>` tên rạp có `cursor-pointer` và hiệu ứng hover nhưng **không phải `Link`**, bấm vào không có gì xảy ra. Tên rạp viết cứng ("Seatify Hai Bà Trưng", "Seatify Đà Lạt") **không khớp dữ liệu** (seed chỉ có "Cinestar Quốc Thanh" và "Cinestar Landmark 81") |
  | `fe/components/Footer.tsx:52-63` | 4 thẻ `<li>` (FAQ, Chính sách bảo mật, Điều khoản, Liên hệ) trông như link nhưng không phải link; các trang đích **cũng chưa tồn tại** (DOC-03) |
  | `fe/components/Footer.tsx:21-23` | 3 icon mạng xã hội có `cursor-pointer` nhưng không có link |
  | `fe/components/Footer.tsx:74-76` | Hotline và email là văn bản thường, không phải `tel:`/`mailto:` |
  | `fe/components/MovieCard.tsx:31-98` | Cả thẻ phim được bọc trong `<Link>`, nhưng bên trong có 2 `<button>`. Phần tử tương tác lồng trong `<a>` là **HTML không hợp lệ**. Nút "Đặt Vé" không có handler, chỉ chạy được nhờ sự kiện nổi lên thẻ Link; nút "Trailer" phải gọi `preventDefault` để chặn việc chuyển trang |
  | `fe/components/Header.tsx:94-97` | Icon tìm kiếm là `<svg>` có `onClick`, không phải `<button>`, nên không focus được bằng bàn phím và không có nhãn cho trình đọc màn hình |
  | `fe/components/Header.tsx:57-77, 110-152` | Menu "Khám Phá" và menu tài khoản chỉ mở bằng `hover`, nên **không dùng được bằng bàn phím và khó dùng trên màn hình cảm ứng** |
  | `fe/pages/NotFoundPage.tsx:7` | Câu "Trang này tìm không tồn tại" sai ngữ pháp; màu `yellow-400` lệch với tông `amber` của toàn trang |
  | `fe/components/QuickBooking.tsx` | Form đặt vé nhanh với dữ liệu viết cứng, không được dùng ở đâu (CODE-01) |

- **Hướng xử lý:** mọi thứ **trông như link** thì phải **là link** (`Link` cho route nội bộ, `<a href>` cho ngoài, `tel:`/`mailto:`). Thứ gì chưa có trang đích thì bỏ hiệu ứng hover và `cursor-pointer`, hoặc ẩn đi. Tách `MovieCard` thành: `Link` bao phần poster và tiêu đề, còn các nút nằm ngoài `Link`. Danh sách rạp ở Footer lấy từ `/api/cinemas` hoặc bỏ đi. Menu thả xuống dùng `<button aria-expanded>` và mở được bằng cả click và bàn phím.

## 3. Cấu trúc đích đề xuất

```text
fe/
├── main.tsx
├── app/
│   ├── App.tsx                        # gắn các provider + <RouterProvider>
│   ├── providers/
│   │   └── AppProviders.tsx           # QueryClientProvider, Toaster
│   └── router/
│       ├── index.tsx                  # createBrowserRouter([...clientRoutes, ...adminRoutes, notFound])
│       ├── client.routes.tsx
│       ├── admin.routes.tsx
│       └── guards/
│           ├── RequireAuth.tsx
│           └── RequireAdmin.tsx
├── layouts/
│   ├── client/                        # ClientLayout, Header/, Footer/
│   └── admin/                         # AdminLayout, AdminSidebar
├── pages/                             # trang MỎNG: chỉ lắp ghép component của các feature
│   ├── client/                        # HomePage, MovieListPage, MovieDetailPage, SearchPage,
│   │                                  # BookingPage, CheckoutPage, PaymentResultPage, ProfilePage
│   ├── admin/                         # DashboardPage, MoviesPage, ShowtimesPage
│   └── common/                        # NotFoundPage, ErrorPage, (FaqPage, PolicyPage… khi có DOC-03)
├── features/
│   ├── auth/            api.ts · hooks/ · store.ts · schemas.ts · types.ts · components/ · index.ts
│   ├── movies/          api.ts · hooks/useMovies.ts, useMovie.ts · types.ts · components/MovieCard, MovieGrid, HeroBanner, TrailerModal
│   ├── showtimes/       api.ts · hooks/useShowtimes.ts, useShowtimeSeats.ts · components/DateTabs, ShowtimeList
│   ├── booking/         api.ts · hooks/useHoldSeats.ts, useSeatSelection.ts, useCountdown.ts · schemas.ts · components/SeatMap, TicketSelector, BookingSummary, GuestCheckoutForm
│   ├── payment/         api.ts · hooks/useCreatePaymentUrl.ts, useBookingStatus.ts · components/
│   ├── profile/         hooks/useMyBookings.ts · components/BookingHistoryTable, ProfileForm
│   └── admin/
│       ├── movies/      api.ts · hooks/ · schemas.ts · components/MovieForm, MovieTable
│       └── showtimes/   api.ts · hooks/ · schemas.ts · components/ShowtimeForm
└── shared/
    ├── api/             http-client.ts · query-client.ts · types.ts (ApiResponse<T>, ApiError)
    ├── config/          env.ts (validate VITE_* bằng zod)
    ├── constants/       routes.ts (ROUTES) · app.ts
    ├── hooks/           useDisclosure.ts
    ├── ui/              Modal, ConfirmDialog, Button, PageLoader, Spinner, EmptyState, Badge
    ├── utils/           format-currency.ts · format-date.ts
    └── types/           common.ts
```

**Quy tắc phụ thuộc:**

1. `pages` → `features` → `shared`. Chiều ngược lại **bị cấm**.
2. Một feature chỉ dùng feature khác qua `index.ts` (public API) của feature đó, không import file nội bộ.
3. Component trong `features/*/components` **không gọi `fetch`**; component chỉ dùng hook.
4. Component trong `shared/ui` không biết gì về nghiệp vụ (không nhắc đến "phim" hay "vé").

**Những gì KHÔNG thêm (YAGNI):** Redux Toolkit, thư viện UI kit lớn, micro-frontend, i18n (chưa có yêu cầu đa ngôn ngữ), code generator cho API client.

## 4. Mẫu định hướng

### 4.1 Router với `createBrowserRouter`, tách theo nhóm

```tsx
// app/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { clientRoutes } from './client.routes';
import { adminRoutes } from './admin.routes';
import ClientLayout from '@/layouts/client/ClientLayout';
import AdminLayout from '@/layouts/admin/AdminLayout';
import RequireAdmin from './guards/RequireAdmin';
import ErrorPage from '@/pages/common/ErrorPage';
import NotFoundPage from '@/pages/common/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <ClientLayout />, errorElement: <ErrorPage />, children: clientRoutes },
  {
    path: '/admin',
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    errorElement: <ErrorPage />,
    children: adminRoutes,
  },
  { path: '*', element: <NotFoundPage /> },
]);
```

```tsx
// app/router/client.routes.tsx
import type { RouteObject } from 'react-router-dom';

export const clientRoutes: RouteObject[] = [
  { index: true, lazy: async () => ({ Component: (await import('@/pages/client/HomePage')).default }) },
  { path: 'movies/:movieId', lazy: async () => ({ Component: (await import('@/pages/client/MovieDetailPage')).default }) },
  // …
];
```

Trong `ClientLayout`, thêm `<ScrollRestoration />` và **xóa `ScrollToTop.tsx`**. Alias `@/` cần được cấu hình trong `vite.config.ts` và `tsconfig`.

### 4.2 zustand cho state phía client

```ts
// features/auth/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './types';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  setSession: (user: AuthUser, token: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      clearSession: () => set({ user: null, token: null }),
    }),
    { name: 'seatify-auth' },
  ),
);
```

`http-client.ts` đọc token bằng `useAuthStore.getState().token`. Khi gặp 401 thì gọi `clearSession()` và `queryClient.clear()`, **không** tải lại cả trang.

### 4.3 TanStack Query và custom hook theo feature

```ts
// features/movies/hooks/useMovies.ts
import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '../api';
import type { MovieStatus } from '../types';

export const movieKeys = {
  all: ['movies'] as const,
  detail: (id: string) => ['movies', id] as const,
};

export const useMovies = (status?: MovieStatus) =>
  useQuery({
    queryKey: movieKeys.all,
    queryFn: moviesApi.getAll,
    staleTime: 5 * 60_000,
    select: (movies) => (status ? movies.filter((m) => m.status === status) : movies),
  });
```

```ts
// features/showtimes/hooks/useShowtimeSeats.ts
export const useShowtimeSeats = (showtimeId: string) =>
  useQuery({
    queryKey: ['showtimes', showtimeId, 'seats'],
    queryFn: () => showtimesApi.getSeats(showtimeId),
    refetchInterval: 15_000, // cập nhật ghế người khác vừa giữ
  });
```

```ts
// features/booking/hooks/useHoldSeats.ts
export const useHoldSeats = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: bookingApi.holdSeats,
    onSuccess: (booking) => navigate(ROUTES.checkout(booking.id)),
    onError: (_err, variables) =>
      queryClient.invalidateQueries({ queryKey: ['showtimes', variables.showtimeId, 'seats'] }),
  });
};
```

**Kết quả:** 4 trang dùng chung một cache `/movies`; mỗi ngày trong `MovieDetailPage` có cache riêng theo `queryKey`, nên **race condition biến mất**; không còn mẫu `isLoading`/`refreshKey` tự viết; sơ đồ ghế tự cập nhật.

### 4.4 Trang mỏng

```tsx
// pages/client/BookingPage.tsx: chỉ lắp ghép
const BookingPage = () => {
  const { showtimeId = '' } = useParams();
  const selection = useSeatSelection();
  const { data: seats, isPending } = useShowtimeSeats(showtimeId);
  if (isPending) return <PageLoader />;
  return (
    <>
      <TicketSelector {...selection} />
      <SeatMap seats={seats} {...selection} />
      <BookingSummary showtimeId={showtimeId} {...selection} />
    </>
  );
};
```

### 4.5 Tập trung types

- **Kiểu nghiệp vụ** đặt ở `features/<feature>/types.ts`, ví dụ `Movie`, `MovieStatus`, `Showtime`, `Seat`, `Booking`. Chỉ khai báo **một lần**.
- **Kiểu của API** đặt ở `shared/api/types.ts`:
  ```ts
  export type ApiResponse<T> = { success: true; message: string; data: T };
  export type ApiErrorBody = { success: false; message: string; error: { code: string; details: unknown } };
  ```
- `http-client` là hàm generic `request<T>(…): Promise<T>`, nên không còn `any` ngầm.
- **Kiểu của form** suy ra từ schema zod bằng `z.infer<typeof registerSchema>`, không viết tay (xem `10-VALIDATION-VA-FORM.md`).
- Hằng số dạng union dùng `as const`: `export const MOVIE_STATUS = ['NOW_PLAYING', 'COMING_SOON', 'ARCHIVED'] as const; export type MovieStatus = typeof MOVIE_STATUS[number];`

### 4.6 UI dùng chung loại bỏ trùng lặp

| Thành phần dùng chung | Thay cho |
|---|---|
| `shared/ui/Modal` | 8 lớp phủ `fixed inset-0 … backdrop-blur-sm` viết tay |
| `shared/ui/ConfirmDialog` | Modal xác nhận đăng xuất (Header, ProfilePage), modal hủy đơn (CheckoutPage), popup HSSV (BookingPage) |
| `shared/ui/PageLoader`, `Spinner` | Khoảng 10 kiểu màn hình "ĐANG TẢI…" khác nhau |
| `shared/utils/format-currency` | Ít nhất 7 lần gọi `toLocaleString('vi-VN')` kèm "đ" / "VNĐ" / " đ" không thống nhất |
| `features/movies` + `useUiStore` (trailer) | State trailer (`isTrailerOpen`, `currentTrailerUrl`, `handlePlayTrailer`) lặp ở 4 trang |
| `shared/hooks/useCountdown` | `setInterval` tự viết trong `CheckoutPage` |

## 5. Thứ tự tái cấu trúc

1. Bật `strict` (CODE-04), sửa lỗi kiểu phát sinh.
2. Cài `@tanstack/react-query`, `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`; cấu hình alias `@/`.
3. Tạo `shared/api/http-client.ts` có kiểu, `useAuthStore`, `QueryClientProvider`. Bỏ `AuthContext`.
4. Chuyển sang `createBrowserRouter` với `client.routes`/`admin.routes`, thêm `ErrorPage` và `ScrollRestoration`.
5. Chuyển **từng feature**: `movies` → `showtimes` → `auth` → `booking` → `payment` → `profile` → `admin/*`. Mỗi feature chuyển xong thì trang cũ được thay bằng trang mỏng, rồi `build` và `lint`.
6. Tạo `shared/ui` **khi gặp lần lặp thứ hai**, không tạo trước "cho đủ bộ".
7. Sửa điều hướng và ngữ nghĩa HTML (CODE-05) khi chuyển `layouts/client`.
