# CHECKLIST cải thiện Seatify

> **File sống**, cập nhật sau mỗi phiên làm việc.
> **Nguồn:** `review-source/` (review lần 1 ngày 23/09/2026, bổ sung ngày 24/09/2026). Mã trong ngoặc (`SEC-01`, `ARCH-06`…) trỏ tới phân tích chi tiết trong `review-source/02-VAN-DE-VA-RUI-RO.md`.
> **Cập nhật lần cuối:** 24/09/2026

## Cách dùng

| Ký hiệu | Ý nghĩa                                          |
| ------- | ------------------------------------------------ |
| `[ ]`   | Chưa làm                                         |
| `[~]`   | Đang làm (ghi tên người làm hoặc nhánh sau dòng) |
| `[x]`   | Đã xong **và** đạt điều kiện "Xong khi"          |
| `[-]`   | Bỏ, không làm nữa (bắt buộc ghi lý do)           |

**Quy tắc cập nhật**

1. Chỉ đánh `[x]` khi đạt đủ điều kiện ở dòng **Xong khi**. Ghi thêm ngày và commit/PR ở cuối dòng, ví dụ `— xong 2026-10-02, be#a1b2c3d`.
2. **Không xóa dòng.** Việc không làm nữa thì đánh `[-]` và ghi lý do.
3. Việc mới thêm vào cuối giai đoạn phù hợp, đánh số tiếp theo (ví dụ `2.10`). Nếu việc đó xuất phát từ một vấn đề mới, thêm mã vấn đề vào `review-source/02` trước.
4. Mỗi PR chỉ giải quyết **một** mục, và ghi số mục trong tiêu đề PR (ví dụ `fix(bookings): tính giá ở server [1.2]`).
5. Cuối mỗi phiên, cập nhật bảng **Tiến độ** và thêm một dòng vào **Nhật ký cập nhật**.

**Nguyên tắc thứ tự**

- Vá lỗi Critical/High (giai đoạn 1) **trước** khi tái cấu trúc, vì các lỗi này nhỏ, cục bộ, và hiện đang cho phép lấy vé miễn phí.
- Tái cấu trúc **từng module, từng feature**. Sau mỗi bước, `build` và `test` phải xanh. **Không làm một lần cho tất cả.**
- Test được viết **song song** trong giai đoạn 1–3. Giai đoạn 5 chỉ là phần hoàn thiện cho đủ.

## Tiến độ

| Giai đoạn | Mục tiêu                                                         | Xong / Tổng |
| --------- | ---------------------------------------------------------------- | ----------- |
| 0         | Nền móng: repo, công cụ, cấu hình, hạ tầng test                  | 0 / 11      |
| 1         | Vá lỗi nghiêm trọng: luồng mua vé đáng tin cậy                   | 0 / 9       |
| 2         | Tái cấu trúc backend theo module                                 | 0 / 9       |
| 3         | Tái cấu trúc frontend theo feature                               | 0 / 13      |
| 4         | Dữ liệu và hoàn thiện nghiệp vụ                                  | 0 / 7       |
| 5         | Kiểm thử phủ đủ và CI                                            | 0 / 6       |
| 6         | Tài liệu                                                         | 0 / 4       |
| 7         | Khi hệ thống tăng trưởng (chỉ làm khi có số liệu chứng minh cần) | 0 / 6       |
| **Tổng**  |                                                                  | **0 / 65**  |

**Phiên tiếp theo nên bắt đầu từ:** hoàn tất mục `0.1` (đang làm dở), rồi đến `0.2`.

---

## Giai đoạn 0: Nền móng

- [~] **0.1** Quyết định cách quản lý repo: repo nào là nơi phát triển chính; có nhập lại 40 commit cũ của hai repo gốc hay không (`git subtree`/`filter-repo`); thêm `.gitignore` ở gốc (`OPS-07`)
  - Hiện trạng 24/09: thư mục gốc đã là repo `seatify-clone` (commit `76f17e0 init`); `review-source/` đã được commit; `CHECKLIST.md` và các thay đổi trong `review-source/` **chưa được commit**.
  - Xong khi: quyết định được ghi vào Nhật ký; có `.gitignore` gốc; `CHECKLIST.md` đã được commit.
- [ ] **0.2** README tối thiểu cho mỗi repo; `.env.example` cho backend và frontend (chỉ tên biến); gỡ `seatify-frontend/.env` khỏi git và thêm `.env` vào `.gitignore` (`OPS-03`, `SEC-10`, `DOC-01`)
  - Xong khi: một người khác clone về thư mục mới, làm theo README và chạy được cả hai phía.
- [ ] **0.3** Bật `"strict": true` (và `noUncheckedIndexedAccess`) trong `seatify-frontend/tsconfig.app.json`, sửa các lỗi kiểu phát sinh (`CODE-04`)
  - Xong khi: `npm run build` của frontend chạy xanh khi đã bật strict.
- [ ] **0.4** Chuyển backend sang ESM: `"type": "module"`, `NodeNext`, import tương đối có đuôi `.js`; thay `ts-node-dev` bằng `tsx watch`; thêm `tsx` vào devDependencies cho lệnh seed (`ARCH-10`, `OPS-03`)
  - Xong khi: `dev`, `build`, `start`, `prisma db seed` đều chạy được.
- [ ] **0.5** Nạp env bằng `import 'dotenv/config'` ở dòng đầu; tạo `shared/config/env.ts` validate bằng zod ở cả hai phía; bỏ mọi `process.env.X as string` (`ARCH-04`)
  - Xong khi: thiếu một biến bắt buộc thì server dừng ngay với thông báo nêu rõ tên biến.
- [ ] **0.6** Tạo `shared/lib/prisma.ts` và thay 8 chỗ `new PrismaClient()` (`ARCH-01`)
  - Xong khi: `grep "new PrismaClient"` chỉ còn một kết quả (không tính seed).
- [ ] **0.7** Tách `app.ts` (`createApp`) và `server.ts` (listen, bật job, tắt server an toàn); thay route `/` bằng `/health`; xóa code bị comment lại (`ARCH-07`)
  - Xong khi: test import được `createApp()` mà không mở cổng mạng và không chạy cron.
- [ ] **0.8** Hạ tầng test backend: Vitest + supertest, DB `seatify_test` riêng, script `test`, helper reset DB (`OPS-01`, `OPS-06`)
  - Xong khi: `npm test` chạy được một test mẫu gọi `GET /health`.
- [ ] **0.9** Tạo migration gốc bằng `prisma migrate dev --name init` và commit `prisma/migrations` (`DB-01`)
  - Xong khi: DB trống tạo được đầy đủ bằng `prisma migrate deploy`.
- [ ] **0.10** Viết `docs/developer/conventions.md` dựa trên `review-source/09`, mục 3 và 5: không class, ESM, named export, comment trả lời "vì sao", không magic number, định dạng response (`CODE-03`, `DOC-01`)
  - Xong khi: file tồn tại và được link từ README.
- [ ] **0.11** Chặn `seed.ts` khi `NODE_ENV=production`; mật khẩu admin lấy từ `SEED_ADMIN_PASSWORD`; thay email/SĐT cá nhân thật bằng dữ liệu giả (`OPS-02`)
  - Xong khi: chạy seed với `NODE_ENV=production` bị từ chối; trong repo không còn thông tin cá nhân thật.

## Giai đoạn 1: Vá lỗi nghiêm trọng

- [ ] **1.1** Viết test tái hiện lỗi: gọi `POST /payments/confirm` mà không qua Stripe (hiện sẽ **đỏ**); 20 request giữ cùng một ghế cùng lúc chỉ 1 request thành công (hiện nên **xanh**) (`OPS-01`)
  - Xong khi: cả hai test nằm trong repo, và test thứ nhất đỏ đúng như mong đợi.
- [ ] **1.2** Backend tự tính giá (`pricing.ts`); frontend gửi `seats` + `tickets: { adult, student }` thay cho `totalPrice`; server giới hạn tối đa 8 ghế và yêu cầu số vé bằng số ghế (`SEC-02`, `SEC-03`)
  - Xong khi: gửi `totalPrice` tùy ý không ảnh hưởng số tiền; có test cho giá và giới hạn.
- [ ] **1.3** Lưu `session.id` vào `gatewayTransactionId`; `confirm` lấy lại phiên từ Stripe và chỉ chốt khi `payment_status === 'paid'` và số tiền khớp; lưu `payment_intent`, `paymentMethod` (`SEC-01`, `DB-03`)
  - Xong khi: test ở mục 1.1 chuyển sang xanh (request bị từ chối); mở thẳng URL success không lấy được vé.
- [ ] **1.4** Chốt đơn bằng update có điều kiện `PENDING → SUCCESS`; kiểm tra ghế còn được giữ; đơn không hợp lệ thì đánh dấu cần hoàn tiền; gửi email **sau** khi commit; khi tạo phiên Stripe thì gia hạn giữ ghế và đặt `expires_at` (`ERR-01`, `ERR-05`)
  - Xong khi: có test cho các trường hợp `FAILED → SUCCESS` bị chặn, gọi 2 lần chỉ gửi 1 email, trả tiền sau khi hết hạn.
- [ ] **1.5** Rate limit cho `/bookings/hold` và `/auth/*`; giới hạn số đơn `PENDING` cùng lúc theo email/IP; đăng nhập dùng một thông báo lỗi chung (`SEC-03`, `SEC-08`)
  - Xong khi: vượt ngưỡng thì nhận 429; có test.
- [ ] **1.6** Kiểm tra trùng lịch khi tạo suất chiếu; tính `endTime` ở server từ thời lượng phim và thời gian dọn phòng (`ERR-02`)
  - Xong khi: tạo suất trùng giờ trong cùng phòng nhận 409 `SHOWTIME_OVERLAP`; có test.
- [ ] **1.7** Escape HTML trong email vé; bỏ `rejectUnauthorized: false` (`SEC-06`, `SEC-07`)
  - Xong khi: tên khách chứa `<a>` hiển thị đúng dạng chữ trong email; SMTP kết nối có kiểm tra chứng chỉ.
- [ ] **1.8** Ẩn hoặc gắn nhãn "Sắp ra mắt" cho các tính năng giả lập (cập nhật hồ sơ, đổi mật khẩu, tạo tài khoản sau thanh toán); sửa nhãn "VNPAY" thành đúng cổng đang dùng (`ERR-04`, `ERR-08`)
  - Xong khi: không còn toast "thành công" nào cho hành động không gọi API.
- [ ] **1.9** Kiểm thử thủ công toàn bộ luồng mua vé với thẻ test của Stripe và ghi kết quả vào Nhật ký
  - Xong khi: luồng khách vãng lai và luồng thành viên đều chạy đúng, kể cả các trường hợp hủy đơn và hết hạn.

## Giai đoạn 2: Tái cấu trúc backend theo module

> Chi tiết: `review-source/07-KIEN-TRUC-BACKEND-DE-XUAT.md`

- [ ] **2.1** Tạo khung thư mục `src/shared/{config,lib,middlewares,utils,types}`, `src/modules/`, và `src/routes/index.ts` để gộp router của các module (`ARCH-06`)
  - Xong khi: khung tồn tại, app vẫn chạy với code cũ.
- [ ] **2.2** Thư viện nội bộ `shared/lib`: `password.ts`, `token.ts`, `mailer.ts` (chỉ lo việc gửi), `stripe.ts`, `logger.ts` (`ARCH-08`)
  - Xong khi: không còn chỗ nào gọi thẳng `bcrypt`, `jwt`, `nodemailer`, `new Stripe` ngoài `shared/lib`.
- [ ] **2.3** `shared/utils/http-response.ts` (`sendSuccess`, `sendCreated`) và `shared/utils/http-error.ts` (`createHttpError`, `isHttpError`, `notFound`, `conflict`…), **viết bằng function, không dùng class** (`ARCH-09`, `ARCH-03`)
  - Xong khi: có unit test; định dạng response được ghi trong `docs/developer/api.md`.
- [ ] **2.4** `shared/middlewares`: `errorHandler` (xử lý HttpError, ZodError, Prisma P2002/P2025, JSON sai cú pháp, lỗi lạ trả 500 không lộ chi tiết), `notFound`, `authenticate`, `optionalAuth`, `authorize`, `validate`, `rateLimit`, `helmet` (`ARCH-03`, `SEC-11`)
  - Xong khi: có test integration cho từng nhánh của `errorHandler`.
- [ ] **2.5** `shared/config/app.config.ts` chứa hằng số nghiệp vụ: giá vé, phụ thu, thời gian giữ ghế, số vé tối đa, số vòng bcrypt, thời hạn JWT, lịch chạy job, thời gian dọn phòng (`CODE-07`)
  - Xong khi: không còn magic number nào trong `modules/`.
- [ ] **2.6** Chuyển từng module sang `modules/<tên>/` gồm `*.routes.ts`, `*.controller.ts` (không `try/catch`), `*.service.ts`, `*.schema.ts` (zod). Mỗi module phải có test integration **trước khi** xóa code cũ (`ARCH-06`, `ARCH-05`, `SEC-09`, `VAL-01`)
  - [ ] `cinemas`
  - [ ] `movies`: thêm `computeMovieStatus` dùng chung (`ERR-06`); update chỉ ghi trường được gửi và bổ sung `backdropUrl`, `movieContent` (`ERR-07`)
  - [ ] `auth`: schema cho đăng ký và đăng nhập, quy tắc mật khẩu thống nhất (`VAL-02`)
  - [ ] `showtimes`: tính ranh giới ngày theo `Asia/Ho_Chi_Minh` (`ERR-03`)
  - [ ] `bookings`: `optionalAuth` lấy `userId` từ token (`SEC-05`); kiểm tra chủ đơn và che thông tin cá nhân khi xem hoặc hủy (`SEC-04`); `release-expired-holds.job.ts`
  - [ ] `payments`: bỏ truy vấn Prisma trong controller (`ARCH-05`); tách `ticket-email.template.ts`, định dạng giờ có `timeZone` (`ERR-03`)
  - Xong khi: mọi ô con đã được đánh dấu; `build` và `test` xanh.
- [ ] **2.7** Webhook Stripe cho `checkout.session.completed` và `checkout.session.expired`, xác minh chữ ký; trang success chỉ **đọc** trạng thái đơn (`SEC-01`, `ERR-01`)
  - Xong khi: trả tiền rồi đóng tab ngay, đơn vẫn chuyển sang `SUCCESS`; có test cho trường hợp sai chữ ký.
- [ ] **2.8** Dọn comment backend theo `conventions.md`; xóa route thử nghiệm `/auth/profile` và `/auth/admin-dashboard` (`CODE-03`, `CODE-01`)
  - Xong khi: `grep` không còn các cụm "ĐÃ VÁ", "SỬA LỖI", "CHUẨN SENIOR", "Bưu tá", "Đầu bếp".
- [ ] **2.9** Xóa các thư mục cũ `controllers/`, `services/`, `middlewares/` và các file `routes/*.routes.ts`
  - Xong khi: cấu trúc khớp với `review-source/07`, mục 3.

## Giai đoạn 3: Tái cấu trúc frontend theo feature

> Chi tiết: `review-source/08-KIEN-TRUC-FRONTEND-DE-XUAT.md`

- [ ] **3.1** Cài `@tanstack/react-query`, `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`; cấu hình alias `@/` trong `vite.config.ts` và `tsconfig`
  - Xong khi: `build` xanh.
- [ ] **3.2** Tạo khung thư mục `app/{providers,router}`, `layouts/{client,admin}`, `pages/{client,admin,common}`, `features/`, `shared/{api,config,constants,hooks,ui,utils,types}` (`ARCH-11`)
  - Xong khi: khung tồn tại; quy tắc phụ thuộc được ghi trong `conventions.md`.
- [ ] **3.3** `shared/api/http-client.ts` dạng generic `request<T>()`, kèm `ApiResponse<T>` và `ApiErrorBody`; parse lỗi an toàn khi server không trả JSON (`ARCH-16`, `ERR-09`)
  - Xong khi: không còn `any` ngầm từ tầng API (kiểm tra bằng rule `no-unsafe-*` của typescript-eslint).
- [ ] **3.4** zustand: `useAuthStore` (persist) và `useUiStore` (modal đăng nhập, trailer); bỏ `AuthContext`; khi gặp 401 thì xóa session và cache, **không** tải lại cả trang (`ARCH-14`)
  - Xong khi: không còn chỗ nào đọc `localStorage` trực tiếp ngoài store.
- [ ] **3.5** Chuyển sang `createBrowserRouter`, tách `client.routes.tsx` và `admin.routes.tsx`; thêm guard `RequireAuth`/`RequireAdmin` (không gọi toast trong render); `errorElement` và `ErrorPage`; dùng `ScrollRestoration` thay cho `ScrollToTop.tsx`; hằng số `ROUTES` (`ARCH-12`, `ERR-09`)
  - Xong khi: một component ném lỗi chỉ làm hiện `ErrorPage`, không làm trắng cả app.
- [ ] **3.6** TanStack Query và custom hook theo từng feature; trang không còn gọi API trong `useEffect` (`ARCH-13`, `ARCH-15`)
  - [ ] `movies`: `useMovies`, `useMovie`
  - [ ] `showtimes`: `useShowtimes` (theo ngày), `useShowtimeSeats` (có `refetchInterval`)
  - [ ] `auth`: `useLogin`, `useRegister`
  - [ ] `booking`: `useHoldSeats`, `useBooking`, `useCancelBooking`, `useSeatSelection`, `useCountdown`
  - [ ] `payment`: `useCreatePaymentUrl`, `useBookingStatus`
  - [ ] `profile`: `useMyBookings`
  - [ ] `admin`: `useCreateMovie`, `useUpdateMovie`, `useCreateShowtime`
  - Xong khi: mọi ô con đã được đánh dấu; `grep "useEffect" pages/` không còn lời gọi API nào.
- [ ] **3.7** Tập trung types vào `features/*/types.ts` và `shared/api/types.ts`; xóa 7 bản `interface Movie`; kiểu của form suy ra bằng `z.infer` (`ARCH-16`)
  - Xong khi: mỗi kiểu nghiệp vụ chỉ được khai báo một lần.
- [ ] **3.8** UI và tiện ích dùng chung: `Modal`, `ConfirmDialog`, `PageLoader`, `EmptyState`, `Button`; `formatCurrency`, `formatDateTime` (có `timeZone`) (`CODE-06`)
  - Xong khi: không còn lớp phủ `fixed inset-0` viết tay ngoài `shared/ui/Modal`.
- [ ] **3.9** Viết lại các form bằng zod + react-hook-form, hiện lỗi dưới từng ô và gắn lỗi validate từ server vào đúng ô: đăng nhập, đăng ký, khách vãng lai, admin phim, admin suất chiếu (`VAL-01`, `VAL-02`)
  - Xong khi: quy tắc của mỗi form khớp với schema ở backend; có unit test cho từng schema.
- [ ] **3.10** Tách `BookingPage` thành `TicketSelector`, `SeatMap`, `SeatButton`, `BookingSummary` (`CODE-02`)
  - Xong khi: mỗi component dưới 200 dòng.
- [ ] **3.11** Điều hướng và ngữ nghĩa HTML: Footer dùng `Link`, `tel:`, `mailto:`, danh sách rạp lấy từ API hoặc bỏ; `MovieCard` không lồng `<button>` trong `<Link>`; nút tìm kiếm là `<button>` có nhãn; menu thả xuống mở được bằng bàn phím; sửa câu chữ ở `NotFoundPage` (`CODE-05`)
  - Xong khi: mọi thứ có `cursor-pointer` đều thực sự làm được việc gì đó; dùng được toàn bộ bằng bàn phím.
- [ ] **3.12** Xóa `QuickBooking.tsx`; dashboard admin hiển thị số liệu thật hoặc gắn nhãn "Dữ liệu minh họa" (`CODE-01`)
  - Xong khi: không còn component nào không được dùng.
- [ ] **3.13** Dọn comment frontend theo `conventions.md` (`CODE-03`)
  - Xong khi: không còn comment biểu ngữ `{/* ==== */}` và comment còn sót từ hội thoại.

## Giai đoạn 4: Dữ liệu và hoàn thiện nghiệp vụ

- [ ] **4.1** Bảng `BookingItem` lưu snapshot ghế, giá và loại vé; nhả ghế không làm mất lịch sử đơn (`DB-02`)
  - Xong khi: đơn đã hủy vẫn hiện đúng tên phim và ghế trong lịch sử.
- [ ] **4.2** Thêm index: `TicketSeat(status, lockedUntil)`, `TicketSeat(bookingId)`, `Booking(userId, createdAt)`, `Showtime(movieId, startTime)`, `Showtime(roomId, startTime)` (`DB-04`)
  - Xong khi: có migration tương ứng.
- [ ] **4.3** API trả sơ đồ ghế đầy đủ (loại, phụ thu, trạng thái); frontend vẽ sơ đồ từ dữ liệu; ghế đôi bán theo cặp (`ARCH-02`)
  - Xong khi: frontend không còn khai báo cứng hàng ghế, loại ghế hay giá.
- [ ] **4.4** Làm thật các tính năng đang giả lập: cập nhật hồ sơ, đổi mật khẩu (kiểm tra mật khẩu cũ), tạo tài khoản từ đơn của khách (có xác minh email) (`ERR-04`)
  - Xong khi: có API, có test, và gỡ nhãn "Sắp ra mắt".
- [ ] **4.5** Admin: sửa/xóa suất chiếu (chặn khi đã có vé `BOOKED`), quản lý rạp và phòng
  - Xong khi: không cần `seed.ts` để thêm rạp hoặc phòng mới.
- [ ] **4.6** Tự sinh QR bằng thư viện `qrcode` rồi đính kèm vào email; thêm cột `emailSentAt` và chức năng gửi lại vé; log `bookingId` thay cho email khách (`OPS-04`)
  - Xong khi: QR hiển thị được trong Gmail; biết được đơn nào chưa gửi vé.
- [ ] **4.7** Hợp đồng validation dùng chung trong `packages/contracts` (cấu hình npm workspaces ở repo gốc). **Chỉ làm nếu** mục 0.1 chọn phát triển tiếp trên repo gộp (`VAL-02`)
  - Xong khi: backend và frontend import cùng một schema.

## Giai đoạn 5: Kiểm thử phủ đủ và CI

> Chi tiết và ma trận test: `review-source/11-KIEM-THU.md`

- [ ] **5.1** Unit test backend: `pricing`, `computeMovieStatus`, tính ngày theo giờ VN, `http-error`, `http-response`, các schema zod, template email (`OPS-01`)
  - Xong khi: `modules/*` và `shared/*` đạt ≥ 80% bao phủ.
- [ ] **5.2** Test integration backend theo ma trận ở `review-source/11`, mục 3: giữ ghế, thanh toán, hủy đơn, job nhả ghế, phân quyền, admin (`OPS-01`)
  - Xong khi: mọi dòng P0/P1 của ma trận đã có test.
- [ ] **5.3** Frontend: Vitest + Testing Library + MSW; test các hook (`useSeatSelection`, `useCountdown`), form, `SeatMap`, guard (`OPS-05`)
  - Xong khi: bao phủ tổng thể frontend ≥ 60%.
- [ ] **5.4** E2E bằng Playwright: khách vãng lai đặt vé và thanh toán bằng thẻ test Stripe; admin tạo phim và suất chiếu (`OPS-06`)
  - Xong khi: hai kịch bản chạy xanh trên máy local.
- [ ] **5.5** CI bằng GitHub Actions cho cả hai phía: `lint` → `typecheck` → `test` → `build`; chặn merge khi đỏ (`OPS-06`)
  - Xong khi: một PR cố tình làm hỏng test bị chặn merge.
- [ ] **5.6** husky + lint-staged chạy `lint` và `typecheck` trước khi commit
  - Xong khi: commit có lỗi lint bị từ chối.

## Giai đoạn 6: Tài liệu

> Chi tiết: `review-source/12-TAI-LIEU.md`

- [ ] **6.1** `docs/developer/`: `getting-started`, `architecture`, `conventions` (từ 0.10), `api` (endpoint, định dạng response, mã lỗi), `database` (ERD, vòng đời trạng thái), `testing`, `adr/` (`DOC-01`)
  - Xong khi: một người mới hiểu và chạy được dự án chỉ bằng tài liệu.
- [ ] **6.2** `docs/operations/`: `deployment`, `environment` (ma trận biến theo môi trường), `runbook` (khách trả tiền mà không có vé, email không đến, ghế bị giữ mãi, hết kết nối DB), `backup-restore`, cách xoay vòng secret (`DOC-02`)
  - Xong khi: mỗi sự cố đã biết có quy trình xử lý từng bước.
- [ ] **6.3** Các trang cho người dùng trong app: FAQ và hướng dẫn đặt vé, chính sách bảo mật, điều khoản sử dụng, chính sách hủy và hoàn tiền, liên hệ; nối các trang này với Footer (`DOC-03`, `CODE-05`)
  - Xong khi: mọi link ở Footer mở ra một trang có nội dung thật.
- [ ] **6.4** `docs/user/huong-dan-quan-tri.md` cho admin (`DOC-03`)
  - Xong khi: admin mới tự thêm được phim và suất chiếu chỉ bằng tài liệu.

## Giai đoạn 7: Khi hệ thống tăng trưởng

> **Chỉ làm khi có số liệu chứng minh là cần.** Làm sớm là vi phạm YAGNI.

- [ ] **7.1** Chuyển gửi email sang dịch vụ email giao dịch (Resend, SendGrid, SES), khi vượt hạn mức gửi của Gmail
- [ ] **7.2** Logger có cấu trúc (`pino`) cùng công cụ theo dõi lỗi (Sentry), khi có người dùng thật (`OPS-04`)
- [ ] **7.3** Tách job nhả ghế sang worker riêng, khi backend chạy nhiều instance
- [ ] **7.4** Phân trang và tìm kiếm phía server cho `/movies`, khi số phim lên đến hàng trăm
- [ ] **7.5** JWT trong cookie `httpOnly` kèm chống CSRF, khi hệ thống lưu dữ liệu nhạy cảm hơn (`SEC-11`)
- [ ] **7.6** Đưa việc gửi email vào hàng đợi có cơ chế thử lại, khi lượng đơn lớn

## Không làm (trừ khi có lý do mới được ghi vào Nhật ký)

- Viết lại bằng NestJS hoặc tách microservice: kiến trúc modular monolith (giai đoạn 2) là đủ.
- Redis hoặc distributed lock cho việc giữ ghế: `SELECT … FOR UPDATE` đã đúng và đủ.
- Redux Toolkit: zustand cho state phía client, TanStack Query cho dữ liệu server là đủ. **Không** đưa dữ liệu server vào zustand.
- Tầng repository bọc Prisma, DI container, base controller, generic CRUD factory.
- Định nghĩa `class` trong code của dự án.
- Tích hợp cổng thanh toán thứ hai trước khi cổng thứ nhất chạy đúng và có test.
- Dockerize hoặc Kubernetes trước khi xong giai đoạn 0 và 1.

---

## Tra cứu: mã vấn đề → mục checklist

| Nhóm | Ánh xạ                                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC  | 01 → 1.3, 2.7 · 02 → 1.2 · 03 → 1.2, 1.5 · 04 → 2.6 · 05 → 2.6 · 06 → 1.7 · 07 → 1.7 · 08 → 1.5 · 09 → 2.6 · 10 → 0.2 · 11 → 2.4, 7.5                                                             |
| ERR  | 01 → 1.4, 2.7 · 02 → 1.6 · 03 → 2.6 · 04 → 1.8, 4.4 · 05 → 1.4 · 06 → 2.6 · 07 → 2.6 · 08 → 1.8 · 09 → 3.3, 3.5                                                                                   |
| DB   | 01 → 0.9 · 02 → 4.1 · 03 → 1.3 · 04 → 4.2                                                                                                                                                         |
| ARCH | 01 → 0.6 · 02 → 4.3 · 03 → 2.3, 2.4 · 04 → 0.5 · 05 → 2.6 · 06 → 2.1, 2.6, 2.9 · 07 → 0.7 · 08 → 2.2 · 09 → 2.3 · 10 → 0.4 · 11 → 3.2 · 12 → 3.5 · 13 → 3.6 · 14 → 3.4 · 15 → 3.6 · 16 → 3.3, 3.7 |
| OPS  | 01 → 0.8, 1.1, 5.1, 5.2 · 02 → 0.11 · 03 → 0.2, 0.4 · 04 → 4.6, 7.2 · 05 → 5.3 · 06 → 0.8, 5.4, 5.5 · 07 → 0.1                                                                                    |
| CODE | 01 → 2.8, 3.12 · 02 → 3.10 · 03 → 0.10, 2.8, 3.13 · 04 → 0.3 · 05 → 3.11, 6.3 · 06 → 3.8 · 07 → 2.5                                                                                               |
| VAL  | 01 → 2.6, 3.9 · 02 → 2.6, 3.9, 4.7                                                                                                                                                                |
| DOC  | 01 → 0.2, 0.10, 6.1 · 02 → 6.2 · 03 → 6.3, 6.4                                                                                                                                                    |

## Nhật ký cập nhật

| Ngày       | Người cập nhật  | Nội dung                                                                                                                                                                                                                              |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-24 | Review (Claude) | Tạo checklist từ `review-source/` (59 vấn đề: 2 Critical, 3 High, 35 Medium, 19 Low). Chưa có mục nào hoàn thành. Source code chưa bị thay đổi (`git diff HEAD -- seatify-backend seatify-frontend` trống)                            |
| 2026-09-24 | Review (Claude) | Ghi nhận: thư mục gốc đã được khởi tạo thành repo `seatify-clone` (commit `76f17e0 init`, 00:17), hai thư mục `.git` con không còn. Mục 0.1 chuyển sang `[~]`; còn chờ quyết định repo phát triển chính và việc giữ lịch sử commit cũ |
