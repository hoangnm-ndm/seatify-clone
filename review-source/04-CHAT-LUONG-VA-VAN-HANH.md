# 04. Chất lượng code, kiểm thử và vận hành

> `be/` = `seatify-backend/src/`, `fe/` = `seatify-frontend/src/`.

## 1. Chất lượng code

### 1.1 Điểm làm tốt

- **Kỷ luật công cụ:** TypeScript ở chế độ `strict` cho cả hai phần. ESLint backend đặt `no-explicit-any` ở mức `error`. Prettier dùng chung một cấu hình, VS Code tự format khi lưu. Kết quả là toàn bộ code **không có `any` nào**. Đây là mức kỷ luật tốt so với giai đoạn học hiện tại.
- **Đặt tên** rõ ràng, nhất quán bằng tiếng Anh (`holdSeats`, `getBookedSeats`, `confirmPaymentSuccess`). Thông báo cho người dùng viết bằng tiếng Việt.
- **Bắt lỗi an toàn về kiểu:** dùng `error instanceof Error` thay vì `catch (e: any)`.
- **Prisma `select`** chỉ lấy đúng các cột cần dùng (`be/services/booking.service.ts:116-144, 156-175`).
- **Frontend:** mọi lời gọi API đi qua `services/`. Có trạng thái loading, nút bị vô hiệu hóa khi đang gửi request (`isHolding`, `isSubmitting`), trang được lazy load. Việc gọi song song hai API bằng `Promise.all` (`fe/pages/BookingPage.tsx:97-100`) cũng làm đúng.

### 1.2 Số liệu nhanh

| Chỉ số | Giá trị |
|---|---|
| Backend (không tính seed) | ~1.460 dòng; file lớn nhất là `booking.service.ts` (209 dòng) |
| Frontend | ~4.900 dòng |
| Các file frontend lớn nhất | `BookingPage.tsx` 666 · `ProfilePage.tsx` 455 · `AdminMoviePage.tsx` 421 · `MovieDetailPage.tsx` 385 · `AdminShowtimePage.tsx` 360 · `CheckoutPage.tsx` 343 |
| Khối `try/catch` trong controller | 17, gần như giống hệt nhau (ARCH-03) |
| `interface Movie` khai báo lại | 7 file frontend |
| Test | 0 |

### 1.3 Chi tiết vấn đề

#### CODE-01: Code chết, dữ liệu viết cứng, route thử nghiệm

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- `fe/components/QuickBooking.tsx`: **không được import ở đâu**. Các dropdown chứa tên rạp và tên phim viết cứng không có trong DB.
- `fe/pages/Admin/AdminDashboardPage.tsx`: bốn thẻ thống kê là số liệu viết cứng (doanh thu, số vé, tỷ lệ tăng trưởng). Comment trong file ghi rõ "Chỉ làm giao diện tĩnh cho đẹp mắt". Admin nhìn vào sẽ tưởng đó là số liệu thật.
- `be/routes/auth.routes.ts:10-21`: hai route `/profile` và `/admin-dashboard` còn sót từ giai đoạn thử middleware.
- Hai cột `Booking.paymentMethod` và `gatewayTransactionId` chưa được dùng (sẽ dùng khi sửa DB-03).
- Tên file `PaymentSucces.tsx` sai chính tả (thiếu chữ "s").
- **Hướng xử lý:** xóa những gì không dùng. Nếu muốn giữ để làm tiếp, gắn nhãn "Demo / Sắp ra mắt" rõ ràng trên giao diện.

#### CODE-02: Component quá lớn và type bị lặp

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- `fe/pages/BookingPage.tsx` (666 dòng) gộp chung: gọi API, tính giá, quy tắc chọn vé, popup HSSV, vẽ sơ đồ ghế (logic ghế đôi và ghế đơn lặp lại cấu trúc gần giống nhau ở các dòng 174-246), thanh tóm tắt và 2 modal.
- `interface Movie` được khai báo lại ở 7 file (`HomePage`, `SearchPage`, `MovieListPage`, `HeroBanner`, `AdminMoviePage`, `AdminShowtimePage`, `services/movie.service.ts`) và các bản không giống nhau. Ví dụ `posterUrl` ở chỗ là `string`, ở chỗ là `string | null`.
- **Hướng xử lý:** tách `BookingPage` thành `TicketSelector`, `SeatMap`, `SeatButton`, `BookingSummary`, và gom logic vào hook `useSeatSelection`. Gom các type dùng chung vào `fe/types/`. Nên làm **sau** ARCH-02, vì khi đó sơ đồ ghế được vẽ từ dữ liệu API và phần code vẽ ghế sẽ gọn đi đáng kể.

#### CODE-03: Comment mang giọng hội thoại và comment sai sự thật

- **Mức độ:** Low · **Độ chắc chắn:** Việc có các comment này là đã xác nhận. Nhận định về nguồn gốc của chúng chỉ là **dấu hiệu, không phải kết luận**.
- **Comment mang giọng quảng cáo hoặc kể chuyện:** "CHUẨN SENIOR" (`be/services/booking.service.ts:115, 155`), "Bật chế độ TỬ HÌNH với chữ any" (`seatify-backend/eslint.config.mjs:30`), "PHÉP MÀU CỦA PRISMA" (`be/services/showtime.service.ts:29`), "Gọi Đầu bếp Stripe", "GỌI BƯU TÁ", "Lính canh tự cuộn chuột"…
- **Comment mô tả việc đã sửa chứ không mô tả code:** "Đã xóa import MovieStatus rác" (`be/services/movie.service.ts:1`), "Bỏ chữ ': any' ở ts đi vì…" (`be/services/mail.service.ts:46`), "ĐÃ VÁ LỖI: …" (`be/seed.ts:540`), "VÁ LỖI THIẾU END DATE" (`be/services/movie.service.ts:94`), "SỬA LỖI UNUSED VAR" (`fe/pages/Admin/AdminShowtimePage.tsx`).
- **Comment sai so với code:**
  - "GỌI BƯU TÁ ĐI GIAO THƯ KHI TRANSACTION THÀNH CÔNG" (`be/services/payment.service.ts:81`), nhưng lời gọi nằm **trong** transaction, trước khi commit (ERR-05).
  - "Chống gọi API 2 lần" (`be/services/payment.service.ts:50`), nhưng cách kiểm tra này không chống được hai request đồng thời.
  - "Mặc định chọn ngày 30/07 để có data" (`fe/pages/MovieDetailPage.tsx:99`), nhưng code thực tế chọn ngày hôm nay.
  - "ÉP TRÌNH DUYỆT CHUYỂN HƯỚNG SANG VNPAY" (`fe/pages/CheckoutPage.tsx:114`), nhưng thực tế chuyển sang Stripe.
- **Nhận định:** kiểu comment "đã vá / đã xóa / bỏ chữ any đi vì…" là dấu vết của code được **dán từ một cuộc hội thoại** (với AI hoặc người hướng dẫn) mà chưa được đọc lại. Dùng AI không có gì sai. Vấn đề là comment khẳng định những điều code chưa đảm bảo, khiến người đọc sau (kể cả chính em) tin nhầm.
- **Hướng xử lý:** comment nên trả lời câu hỏi **"vì sao"** (ví dụ vì sao cần `FOR UPDATE`), không kể lại lịch sử sửa code (việc đó thuộc về commit message). Rà lại toàn bộ comment trước khi nộp bài.

---

## 2. Kiểm thử

### 2.1 Hiện trạng

- **Không có file test nào**, không có script `test` trong cả hai `package.json`, không có framework test trong dependencies.
- Chưa chạy được `lint` hay `build` trong lần review này (chưa có `node_modules`), nên **chưa xác minh được** code hiện tại có build sạch hay không.

#### OPS-01: Không có test cho luồng quan trọng

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Ảnh hưởng:** phần giá trị nhất của dự án (khóa ghế đồng thời) **chưa có bằng chứng nào** cho thấy nó chạy đúng, ngoài việc đọc code. Các lỗi ERR-01, ERR-05 thuộc đúng loại mà test sẽ phát hiện ngay. Khi sửa SEC-01, SEC-02, ERR-01, không có test thì rất dễ làm hỏng luồng đang chạy mà không biết.

### 2.2 Các luồng cần test, theo thứ tự ưu tiên

| # | Luồng | Loại test | Khẳng định chính |
|---|---|---|---|
| 1 | Giữ ghế đồng thời | Integration với DB thật | 20 request cùng giữ ghế A1 thì chỉ đúng 1 request thành công |
| 2 | Chốt đơn | Integration | Chỉ chốt khi Stripe xác nhận đã trả; đơn `FAILED` không thể thành `SUCCESS`; gọi 2 lần thì chỉ gửi 1 email |
| 3 | Tính giá | Unit | Giá do backend tính, không phụ thuộc giá client gửi; số vé phải bằng số ghế; tối đa 8 ghế |
| 4 | Cron nhả ghế | Integration | Ghế quá hạn trở về `AVAILABLE`; ghế vừa được giữ lại thì không bị nhả |
| 5 | Hủy đơn | Integration | Chỉ hủy được đơn `PENDING` của chính mình |
| 6 | `computeMovieStatus` | Unit | 5 trường hợp: chưa có ngày, sắp chiếu, đang chiếu, đã hết, thiếu `endDate` |
| 7 | Tạo suất chiếu | Integration | Từ chối suất trùng giờ trong cùng phòng; sinh đủ số vé theo số ghế |
| 8 | Phân quyền | Integration | Không có token hoặc role `USER` gọi API admin thì nhận 401/403 |

### 2.3 Bộ công cụ tối thiểu

- **Backend:** Vitest (hoặc Jest) + `supertest` + một database PostgreSQL riêng cho test (có thể chạy bằng Docker, hoặc tạo DB `seatify_test` trên máy). Để test được, cần tách `app` ra khỏi `app.listen()` (tạo `app.ts` export `app`, còn `server.ts` chỉ gọi `listen` và `startCronJobs`).
- **Frontend:** chưa cần ưu tiên. Khi có thời gian, dùng Vitest + Testing Library cho `BookingPage` (quy tắc chọn vé và ghế).
- Ví dụ test cho điểm mạnh nhất của dự án:
  ```ts
  // Payload theo API sau khi sửa SEC-02 (client gửi loại vé, không gửi giá)
  it('chỉ một request giữ được ghế A1 khi 20 request đến cùng lúc', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        request(app).post('/api/bookings/hold').send({ showtimeId, seats: ['A1'], tickets: { adult: 1, student: 0 }, guestInfo }),
      ),
    );
    const ok = results.filter((r) => r.status === 'fulfilled' && r.value.status === 201);
    expect(ok).toHaveLength(1);
  });
  ```

---

## 3. Build, deploy và vận hành

### 3.1 Hiện trạng

| Hạng mục | Hiện trạng |
|---|---|
| Script backend | `dev` (ts-node-dev), `build` (tsc), `start` (node dist), `lint`, `format`. Đủ dùng |
| Script frontend | Mặc định của Vite. Đủ dùng |
| Biến môi trường backend cần có | `DATABASE_URL`, `JWT_SECRET_KEY`, `STRIPE_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `FRONTEND_URL`, `PORT` (suy ra từ code; **không có tài liệu nào liệt kê**) |
| README / hướng dẫn cài đặt | Không có |
| `.env.example` | Không có |
| Migration | Không có (DB-01) |
| CI | Không có |
| Docker | Không có. **Chưa cần** |
| Logging | `console.log`/`console.error` (19 chỗ) |
| Giám sát, cảnh báo | Không có |

### 3.2 Chi tiết vấn đề

#### OPS-02: `seed.ts` nguy hiểm nếu chạy ngoài môi trường dev

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**
  - `be/seed.ts:15-22`: `deleteMany()` trên **cả 8 bảng**, không kiểm tra môi trường. Nếu `DATABASE_URL` đang trỏ nhầm sang DB production, toàn bộ đơn hàng và người dùng sẽ mất.
  - `be/seed.ts:27`: tài khoản admin và tài khoản user mẫu dùng chung **một mật khẩu mặc định rất yếu, viết cứng trong code**. Nếu seed chạy trên production, ai đọc được repo cũng đăng nhập được với quyền admin.
  - `be/seed.ts:42-51`: tài khoản user mẫu dùng **email và số điện thoại trông như thông tin cá nhân thật**. Báo cáo không trích lại các giá trị này.
- **Hướng xử lý:** thêm dòng `if (process.env.NODE_ENV === 'production') throw new Error('Không chạy seed trên production')` ở đầu file. Lấy mật khẩu admin từ biến môi trường `SEED_ADMIN_PASSWORD`. Thay dữ liệu cá nhân bằng dữ liệu giả (`user@example.com`, `0900000000`).

#### OPS-03: Thiếu tài liệu và công cụ để người khác chạy được dự án

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- Không có README ở gốc hay ở backend. README của frontend là template của Vite. Không có `.env.example`.
- `seatify-backend/package.json:49`: lệnh seed là `npx tsx src/seed.ts`, nhưng `tsx` không có trong devDependencies (dự án đang dùng `ts-node`/`ts-node-dev`). `npx` sẽ tải `tsx` về khi chạy, nên vẫn chạy được, nhưng không ổn định và không nhất quán với phần còn lại.
- Chưa có bước `prisma generate` trong build. Khi deploy lên nền tảng cloud, bước này thường phải khai báo riêng (ví dụ `"build": "prisma generate && tsc"`).
- Hai repo git riêng nằm trong cùng một thư mục, không có file nào mô tả cách chạy chung.
- **Hướng xử lý:** viết README gồm yêu cầu cài đặt, các bước chạy (`npm i` → tạo `.env` từ `.env.example` → `prisma migrate dev` → `prisma db seed` → `npm run dev`), tài khoản demo (lấy từ env), và sơ đồ luồng ở `01-TONG-QUAN-VA-KIEN-TRUC.md`. Thêm một workflow CI tối thiểu: `npm ci` → `lint` → `build` → `test`.

#### OPS-04: Logging và tác vụ nền

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- Toàn bộ log là `console.*` không có cấp độ, không có mã request, nên khi có sự cố rất khó lần ra đơn nào bị lỗi.
- `be/services/mail.service.ts:131` ghi **email của khách** vào log. Thông tin cá nhân không nên nằm trong log.
- Lỗi gửi mail chỉ được `console.error` (`be/services/mail.service.ts:132-134`). Khách có thể không nhận được vé mà không ai biết, và cũng không có cách gửi lại.
- Cron chạy trong process web (`be/server.ts:30`). Ổn khi chỉ có một instance.
- Ảnh QR tạo qua `chart.googleapis.com` (`be/services/mail.service.ts:57`). API này của Google đã ngừng hỗ trợ; **chưa đủ dữ liệu** để khẳng định nó còn trả ảnh hay không. Cách an toàn là tự sinh QR bằng thư viện `qrcode` rồi đính kèm vào email dưới dạng ảnh CID.
- **Hướng xử lý (khi cần):** logger có cấp độ (`pino`), log `bookingId` thay cho email, thêm cột `emailSentAt` để biết đơn nào chưa gửi được vé. Chưa cần dùng hàng đợi.

### 3.3 Checklist trước khi lên production

| Hạng mục | Trạng thái | Mã liên quan |
|---|---|---|
| Xác nhận thanh toán qua Stripe hoặc webhook | Chưa đạt | SEC-01 |
| Giá do backend tính | Chưa đạt | SEC-02 |
| Máy trạng thái đơn hàng chặt chẽ | Chưa đạt | ERR-01 |
| Rate limit và giới hạn giữ ghế | Chưa đạt | SEC-03, SEC-08 |
| Kiểm tra chủ đơn | Chưa đạt | SEC-04, SEC-05 |
| Validate input ở backend | Chưa đạt | SEC-09 |
| TLS cho SMTP | Chưa đạt | SEC-07 |
| Migration | Chưa đạt | DB-01 |
| Seed không chạy được trên production | Chưa đạt | OPS-02 |
| Múi giờ rõ ràng | Chưa đạt | ERR-03 |
| Một Prisma client | Chưa đạt | ARCH-01 |
| Kiểm tra env khi khởi động | Chưa đạt | ARCH-04 |
| Test cho luồng đặt vé và thanh toán | Chưa đạt | OPS-01 |
| README, `.env.example` | Chưa đạt | OPS-03 |
| Mật khẩu hash bằng bcrypt | **Đạt** | |
| API admin được bảo vệ ở backend | **Đạt** | |
| Secret backend không bị commit | **Đạt** | |
| Khóa ghế đồng thời | **Đạt** | |
| CORS giới hạn theo origin | **Đạt** | |
