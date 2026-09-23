# 09. Clean Code, nguyên tắc comment và quy ước code

> Bổ sung ngày 24/09/2026. `be/` = `seatify-backend/src/`, `fe/` = `seatify-frontend/src/`.
> File này đánh giá hai phía theo từng nguyên tắc, trình bày chi tiết **CODE-03** (mở rộng), **CODE-06**, **CODE-07**, và đề xuất bộ quy ước chung.

## 1. Đánh giá theo từng nguyên tắc

Thang đánh giá: **Tốt**, **Khá**, **Trung bình**, **Yếu**. Mỗi ô có bằng chứng; không chấm theo cảm tính.

| Nguyên tắc | Backend | Frontend | Bằng chứng chính |
|---|---|---|---|
| **KISS**: giữ mọi thứ đơn giản | Khá | Trung bình | BE: service gọi thẳng Prisma, không có tầng thừa. FE: tự viết `CustomDropdown` dùng `setTimeout(…, 200)` để đóng khi mất focus (`fe/pages/Admin/AdminShowtimePage.tsx:28-71`), cùng bộ chọn giờ/phút tự dựng, trong khi `<input type="datetime-local" step="300">` đã đủ. Ghế được định danh bằng chuỗi `"A1"` rồi tách chuỗi ở backend (`be/services/booking.service.ts:26-29`) thay vì gửi ID |
| **DRY**: không lặp lại | Trung bình | Yếu | BE: tính `computedStatus` 2 lần, 17 khối `try/catch` giống nhau, phụ thu ghế ở 3 nơi. FE: 8 lớp phủ modal, 2 modal đăng xuất, state trailer lặp ở 4 trang, gọi `/movies` rồi lọc ở 4 trang, định dạng tiền ở 7+ chỗ, khoảng 10 kiểu loading, `interface Movie` ở 7 file (CODE-06) |
| **YAGNI**: chưa cần thì chưa làm | Khá | Trung bình | BE: route thử nghiệm, 2 cột DB chưa dùng. FE: `QuickBooking` không được dùng, dashboard với số liệu giả, 3 form giả lập. Giao diện được làm **trước** khi backend có API tương ứng (CODE-01, ERR-04) |
| **SRP / Separation of Concerns** | Khá | Yếu | BE: phân tầng tốt, nhưng `mail.service` làm 4 việc, `server.ts` làm 8 việc, `payment.controller` truy vấn DB. FE: `BookingPage` 666 dòng với 9 `useState`; trang vừa gọi API, vừa chứa logic, vừa vẽ giao diện (ARCH-15) |
| **Đặt tên** | Khá | Trung bình | Xem mục 2 |
| **Hàm ngắn, một mức trừu tượng** | Trung bình | Yếu | `holdSeats` khoảng 94 dòng gộp tách tên ghế, khóa, kiểm tra, tạo đơn, cập nhật vé. `sendTicketEmail` khoảng 95 dòng. Component frontend dài 340–666 dòng |
| **Không dùng magic number** | Yếu | Yếu | Xem CODE-07 |
| **Fail fast** | Yếu | Yếu | 4 lần ép `process.env.X as string` (`be/server.ts:17`, `be/middlewares/auth.middleware.ts:24`, `be/services/auth.service.ts:55`, `be/services/payment.service.ts:8`) thay vì kiểm tra lúc khởi động. FE dùng `import.meta.env.VITE_API_URL` mà không kiểm tra (`fe/utils/apiClient.ts:1`) |
| **Ít gây bất ngờ (Least Astonishment)** | Yếu | Yếu | Lỗi validate trả **404**; thông báo "khởi tạo **180** vé" viết cứng (`be/controllers/showtime.controller.ts:88`, `fe/pages/Admin/AdminShowtimePage.tsx:347`) dù số vé tùy phòng; nhãn "VNPAY" cho luồng Stripe; toast "thành công" cho tính năng giả lập |
| **Xử lý lỗi nhất quán** | Yếu | Trung bình | BE: 5 định dạng response, mã HTTP tùy tiện (ARCH-03, ARCH-09). FE: lỗi luôn hiện qua toast; có chỗ lỗi bị bỏ qua (`SearchPage` chỉ `console.error`) |
| **Comment** | Yếu | Yếu | Xem mục 3 |
| **An toàn kiểu** | Tốt | Yếu | BE: strict, không có `any`. FE: không bật strict, `fetchClient` trả `any` ngầm (CODE-04, ARCH-16) |
| **Không dùng class, viết theo hàm** | Đạt | Đạt | Không có định nghĩa `class` nào ở cả hai phía |
| **Định dạng tự động (Prettier/ESLint)** | Tốt | Tốt | Cấu hình đầy đủ, code đồng nhất về hình thức |

**Tổng kết:** hình thức code (định dạng, kiểu, cách đặt tên cơ bản) **tốt**. Tổ chức code và kỷ luật về trùng lặp, magic number, comment **chưa đạt**. Frontend yếu hơn backend rõ rệt, chủ yếu vì component quá lớn và không có tầng hook/feature.

## 2. Đặt tên: những chỗ gây hiểu nhầm

| Vị trí | Tên | Vấn đề | Gợi ý |
|---|---|---|---|
| `be/services/showtime.service.ts:63, 80` | `getBookedSeats`, `bookedSeatIds` | Trả về cả ghế đang `HOLDING`; giá trị là **tên** ghế (`"A1"`), không phải ID | `getUnavailableSeatLabels` |
| `fe/pages/BookingPage.tsx:75, 149` | tham số `seatId` | Giá trị thực tế là nhãn ghế `"A1"` | `seatLabel` |
| `fe/pages/Admin/AdminMoviePage.tsx:24` | file `AdminMoviePage`, component `AdminMoviesPage` | Tên file và tên component không khớp | Thống nhất một tên |
| `fe/pages/PaymentSucces.tsx` | tên file | Sai chính tả | `PaymentResultPage.tsx` |
| `fe/services/movie.service.ts:16` | `getAllMovie` | Số ít cho một danh sách | `getAll` hoặc `getMovies` |
| `be/controllers/booking.controller.ts` | `cancelBookingController` và `holdBooking`, `getBooking` | Quy ước hậu tố không nhất quán trong cùng file | Bỏ hậu tố `Controller`, vì tên thư mục/module đã nói lên điều đó |
| `fe/components/MovieCard.tsx:6` | `id: string \| number` | Kiểu rộng hơn thực tế | `id: string` |

## 3. Comment (CODE-03, mở rộng)

### 3.1 Số liệu

| | Backend (không tính seed) | Frontend |
|---|---|---|
| Dòng comment | Khoảng 85 trên 1.460 dòng | Khoảng 310 trên 4.900 dòng |
| Comment dạng biểu ngữ `{/* ==== */}` | – | `Header.tsx` 6, `ProfilePage.tsx` 6, `HomePage.tsx` 4 |
| Code bị comment lại | `be/server.ts:14` | – |

Mật độ comment **không phải vấn đề**. Vấn đề nằm ở **nội dung** của comment.

### 3.2 Phân loại comment hiện có

| Loại | Ví dụ (vị trí) | Nên làm gì |
|---|---|---|
| **Dấu vết hội thoại với AI hoặc người hướng dẫn** | "LOGO CỦA BẠN (GIỮ NGUYÊN 100%)" (`fe/components/Header.tsx:44`); "<-- THÊM CÁI NÀY ĐỂ TRUYỀN XUỐNG BE" (`fe/components/GuestCheckoutModal.tsx:13`); "Thêm chữ 'type' … để làm vui lòng TypeScript" (`fe/contexts/AuthContext.tsx:1`); "Khởi tạo Bưu tá với tài khoản Gmail của bạn" (`be/services/mail.service.ts:26`) | **Xóa hết.** Đây là lời nhắn của người khác gửi cho em, không phải tài liệu của code |
| **Nhật ký sửa lỗi** | "ĐÃ VÁ LỖI" (`be/seed.ts:540`), "ĐÃ SỬA LỖI Ở ĐÂY" (`be/seed.ts:55`), "VÁ LỖI THIẾU END DATE" (`be/services/movie.service.ts:94`), "Đã xóa import MovieStatus rác" (`be/services/movie.service.ts:1`), "SỬA LỖI ANY", "SỬA LỖI UNUSED VAR" (`fe/pages/Admin/AdminShowtimePage.tsx:8, 102, 194`), "Đã bổ sung trường endDate" (`fe/pages/Admin/AdminMoviePage.tsx:34`) | **Xóa.** Lịch sử thay đổi thuộc về commit message |
| **Quảng cáo, cường điệu** | "CHUẨN SENIOR" (`be/services/booking.service.ts:115, 155`), "PHÉP MÀU CỦA PRISMA" (`be/services/showtime.service.ts:29`), "Bật chế độ TỬ HÌNH" (`seatify-backend/eslint.config.mjs:30`), "chuẩn quốc tế" (`fe/contexts/AuthContext.tsx:70`), "Tuyệt vời!", "siêu đẹp", "cực chuyên nghiệp" (`be/services/payment.service.ts:22-41`) | **Xóa.** Comment không đánh giá chất lượng code |
| **Ẩn dụ** | "Đầu bếp Stripe", "Bưu tá", "Lính canh tự cuộn chuột", "Trạm phát sóng User", "Robot dọn rác" | **Xóa**, hoặc viết lại bằng thuật ngữ kỹ thuật |
| **Nói lại điều code đã nói** | "Lấy chữ cái đầu (A, B, C...)", "Gọi API", "Đóng modal", "Bay sang trang thanh toán" | **Xóa** |
| **Sai sự thật** | "KHI TRANSACTION THÀNH CÔNG" (`be/services/payment.service.ts:81`), "Chống gọi API 2 lần" (dòng 50), "Mặc định chọn ngày 30/07" (`fe/pages/MovieDetailPage.tsx:99`), "SANG VNPAY" (`fe/pages/CheckoutPage.tsx:114`) | **Sửa code hoặc xóa comment.** Comment sai còn có hại hơn không có comment |
| **Biểu ngữ phân vùng JSX** | `{/* ========== CỤM TRÁI: LOGO & MENU ========== */}` | **Tách thành component** (`<HeaderNav/>`, `<HeaderAccount/>`); tên component thay cho comment |
| **Code bị comment lại** | `// app.use(cors());` (`be/server.ts:14`) | **Xóa.** Git đã lưu lại code cũ |
| **Giải thích lý do: NÊN GIỮ** | Đoạn giải thích `FOR UPDATE` (`be/services/booking.service.ts:59-63`); "Với VND, truyền thẳng số tiền, không cần nhân 100" (`be/services/payment.service.ts:27`) | **Giữ**, chỉ bỏ phần cường điệu |

### 3.3 Nguyên tắc comment đề xuất cho dự án

1. **Comment trả lời câu hỏi "vì sao", không trả lời "làm gì".** Nếu cần comment để giải thích code làm gì, hãy đổi tên biến/hàm hoặc tách hàm.
2. **Nên có comment khi:** có quy tắc nghiệp vụ không hiển nhiên (VND không có phần thập phân); có lựa chọn kỹ thuật cần biện minh (vì sao khóa bằng `FOR UPDATE`); có cách xử lý tạm cho lỗi bên ngoài (kèm link issue); có TODO (kèm mã trong CHECKLIST, ví dụ `// TODO(2.5): …`).
3. **Không bao giờ:** nhật ký sửa lỗi, lời nhắn hội thoại, đánh giá chất lượng ("chuẩn", "xịn"), ẩn dụ, code bị comment lại, biểu ngữ phân vùng.
4. **Hàm export trong `shared/`** có một dòng TSDoc mô tả hợp đồng: tham số, giá trị trả về, lỗi có thể ném.
5. **Ngôn ngữ:** comment tiếng Việt có dấu, câu ngắn và đầy đủ; định danh (tên biến/hàm) bằng tiếng Anh.
6. **Khi review:** đọc từng comment và hỏi "comment này có còn đúng không?". Comment sai thì sửa ngay trong PR đó.

**Ví dụ trước và sau:**

```ts
// Trước
// ====================================================================
// 4. PESSIMISTIC LOCKING (KHÓA BI QUAN BẰNG RAW SQL)
// Lệnh này ép PostgreSQL khóa cứng các dòng TicketSeat này lại.
// Nếu có 2 Request gọi cùng 1 mili-giây, 1 thằng sẽ bị bắt đứng xếp hàng chờ!
// ====================================================================

// Sau
// Khóa các vé trong transaction để request đồng thời phải chờ; trạng thái được kiểm tra lại sau khi có khóa.
```

## 4. Vấn đề chi tiết

### CODE-06: Trùng lặp UI và logic (DRY)

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**

  | Mẫu lặp lại | Số lần | Vị trí |
  |---|---|---|
  | Lớp phủ modal `fixed inset-0 … backdrop-blur-sm` | 8 | `Header`, `ProfilePage`, `CheckoutPage`, `BookingPage`, `AdminMoviePage`, `AuthModal`, `GuestCheckoutModal`, `TrailerModal` |
  | Modal xác nhận đăng xuất | 2 | `Header.tsx:164-195`, `ProfilePage.tsx:420-450` |
  | State trailer và `handlePlayTrailer` | 4 | `HomePage`, `SearchPage`, `MovieListPage`, `MovieDetailPage` |
  | Gọi `/movies` rồi lọc | 4 | `HomePage`, `MovieListPage`, `SearchPage`, `AdminShowtimePage` |
  | Định dạng tiền `toLocaleString('vi-VN')` kèm hậu tố "đ" / " đ" / " VNĐ" | 7+ | `BookingPage`, `CheckoutPage`, `ProfilePage`, `GuestCheckoutModal`, `mail.service`… |
  | Màn hình "ĐANG TẢI…" | ~10 kiểu | Mỗi trang một kiểu |
  | Tính trạng thái phim | 2 | `be/services/movie.service.ts:30-38, 59-67` |
  | Khối `try/catch` trong controller | 17 | `be/controllers/*` |
  | Quy tắc phụ thu, hàng VIP | 3 | ARCH-02 |

- **Hướng xử lý:** frontend dùng `shared/ui`, `shared/utils`, `features/*/hooks` (xem `08`, mục 4.6); backend dùng error middleware và `movie-status.ts` (xem `07`). **Lưu ý:** DRY áp dụng cho **tri thức** (quy tắc, định dạng, hằng số), không phải cho mọi đoạn code trông giống nhau. Chỉ gom lại khi gặp lần lặp thứ hai **của cùng một ý nghĩa**.

### CODE-07: Magic number và cấu hình viết cứng

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**

  | Giá trị | Ý nghĩa | Vị trí |
  |---|---|---|
  | `80000`, `55000` | Giá vé người lớn / HSSV | `fe/pages/BookingPage.tsx:83` |
  | `20000`, `25000` | Phụ thu VIP / Couple | `fe/pages/BookingPage.tsx:77-78`, `be/services/showtime.service.ts:135-136`, `be/seed.ts:539` |
  | `8` | Số vé tối đa | `fe/pages/BookingPage.tsx:131-132` |
  | `5 * 60000` | Thời gian giữ ghế | `be/services/booking.service.ts:96` |
  | `10` | Số vòng băm bcrypt | `be/services/auth.service.ts:23` |
  | `'1d'` | Thời hạn JWT | `be/services/auth.service.ts:56` |
  | `'* * * * *'` | Lịch chạy cron | `be/services/cron.service.ts:8` |
  | `'http://localhost:5173'` | Origin frontend | `be/server.ts:17`, `be/services/payment.service.ts:11` |
  | `5000` | Cổng mặc định | `be/server.ts:11` |
  | `180` | Số vé mỗi suất (trong thông báo) | `be/controllers/showtime.controller.ts:88`, `fe/pages/Admin/AdminShowtimePage.tsx:347` |
  | `15` | Phút dọn phòng | `fe/pages/Admin/AdminShowtimePage.tsx:155` |
  | `3000` | Thời gian hiển thị toast | `fe/App.tsx:12` |

- **Hướng xử lý:** biến môi trường (URL, secret, cổng) đặt ở `shared/config/env.ts`; hằng số nghiệp vụ (giá, thời gian giữ ghế, số vé tối đa, thời gian dọn phòng) đặt ở `shared/config/app.config.ts` của backend, và frontend **lấy qua API** thay vì tự khai báo lại.

## 5. Bộ quy ước code đề xuất

Nên đưa vào `docs/developer/conventions.md` (DOC-01) và áp dụng khi review mọi PR.

| Chủ đề | Quy ước |
|---|---|
| Hệ module | ESM (`import`/`export`) ở cả hai phía; backend dùng `NodeNext` |
| Class | **Không định nghĩa `class`.** Viết bằng hàm, object literal và factory function. Khởi tạo instance của thư viện hoặc đối tượng dựng sẵn (`new PrismaClient()`, `new Error()`) là ngoại lệ |
| Export | Ưu tiên **named export**. Chỉ dùng default export khi công cụ bắt buộc (component được lazy load theo route) |
| Tên file | Backend: `kebab-case` + hậu tố vai trò (`bookings.service.ts`). Frontend: component `PascalCase.tsx`, hook `useXxx.ts`, còn lại `kebab-case.ts` |
| Kích thước | Hàm ≤ 40 dòng, component ≤ 200 dòng. Vượt quá thì tách, hoặc ghi lý do trong PR |
| Magic number | Không có. Đặt tên trong `config/` hoặc `constants/` |
| Lỗi | Backend chỉ ném lỗi bằng `createHttpError`/`notFound`/`conflict`…; không `res.status` trong service |
| Response | Backend chỉ trả qua `sendSuccess`/`sendCreated`; định dạng `{ success, message, data }` / `{ success, message, error }` |
| Validate | Mọi input từ bên ngoài đi qua schema zod (xem `10`) |
| Kiểu | Không `any`, kể cả `any` ngầm; bật `strict` ở cả hai phía; kiểu nghiệp vụ chỉ khai báo một lần |
| Comment | Theo mục 3.3 |
| Commit | Conventional Commits (đã làm tốt); mỗi PR giải quyết một mục trong CHECKLIST và ghi mã mục đó |
| Trước khi commit | `lint`, `typecheck`, `test` phải xanh (nên tự động hóa bằng husky + lint-staged) |
