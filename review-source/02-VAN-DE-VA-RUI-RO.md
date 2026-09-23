# 02. Vấn đề và rủi ro

> `be/` = `seatify-backend/src/`, `fe/` = `seatify-frontend/src/`.
> File này chứa bảng tổng hợp **đủ 59 vấn đề** (36 từ lần review 23/09/2026 cộng 23 vấn đề bổ sung ngày 24/09/2026) và phân tích chi tiết nhóm **ERR** và **ARCH-01 → ARCH-05**.
> Chi tiết các nhóm khác: **SEC/DB** ở `03`; **OPS-01 → OPS-04**, **CODE-01 → CODE-03** ở `04`; **ARCH-06 → ARCH-10** ở `07`; **ARCH-11 → ARCH-16**, **CODE-04**, **CODE-05** ở `08`; **CODE-06**, **CODE-07** và phần mở rộng của CODE-03 ở `09`; **VAL** ở `10`; **OPS-05**, **OPS-06** ở `11`; **DOC** và **OPS-07** ở `12`.
> Việc cần làm được theo dõi ở `../CHECKLIST.md`.

## 1. Bảng tổng hợp

| Mã | Mức độ | Nhóm | Vị trí | Vấn đề | Ảnh hưởng | Hướng xử lý |
|---|---|---|---|---|---|---|
| SEC-01 | **Critical** | Bảo mật / Thanh toán | `be/routes/payment.routes.ts:8`, `be/services/payment.service.ts:45-89`, `fe/pages/PaymentSucces.tsx:26-43` | API chốt đơn là công khai, không xác minh với Stripe | Lấy được vé miễn phí chỉ bằng cách mở URL success | Xác minh Checkout Session với Stripe, hoặc dùng webhook |
| SEC-02 | **Critical** | Bảo mật / Nghiệp vụ | `be/controllers/booking.controller.ts:15-21`, `be/services/booking.service.ts:90`, `fe/pages/BookingPage.tsx:75-90` | Backend dùng `totalPrice` do client gửi | Mua vé với giá tùy ý | Backend tự tính giá từ loại vé và ghế |
| SEC-03 | **High** | Bảo mật / Tính sẵn sàng | `be/routes/booking.routes.ts:12`, `be/server.ts` | Giữ ghế không cần đăng nhập, không có rate limit, server không giới hạn số ghế | Một script có thể giam toàn bộ ghế của mọi suất | Giới hạn 8 ghế ở backend, thêm rate limit, giới hạn số đơn `PENDING` |
| ERR-01 | **High** | Logic / Thanh toán | `be/services/payment.service.ts:14-39, 51, 60-66`, `be/services/booking.service.ts:75-78, 96` | Giữ ghế 5 phút nhưng phiên Stripe sống 24 giờ; `confirm` nhận cả đơn `FAILED` | Khách trả tiền nhưng đơn không có ghế; đơn đã hủy lại thành `SUCCESS` | Chỉ cho chuyển `PENDING → SUCCESS`, kiểm tra ghế còn được giữ, đồng bộ thời hạn, dùng webhook |
| ERR-02 | **High** | Logic / Nghiệp vụ | `be/services/showtime.service.ts:103-153`, `be/controllers/showtime.controller.ts:80` | Tạo suất chiếu không kiểm tra trùng lịch phòng, không kiểm tra `endTime > startTime` | Hai suất cùng phòng cùng giờ, một ghế vật lý bị bán hai lần | Kiểm tra chồng lấn trong transaction, tính `endTime` ở server |
| SEC-04 | Medium | Phân quyền | `be/routes/booking.routes.ts:14-15`, `be/services/booking.service.ts:112-149, 181-207` | Chỉ cần biết `bookingId` là xem hoặc hủy được đơn | Lộ tên, email, SĐT; hủy được đơn của người khác | Che thông tin cá nhân, kiểm tra chủ đơn hoặc token của đơn |
| SEC-05 | Medium | Phân quyền | `be/controllers/booking.controller.ts:15`, `fe/pages/BookingPage.tsx:56` | `userId` lấy từ body thay vì từ JWT | Gắn đơn vào tài khoản người khác | Middleware xác thực tùy chọn, lấy `userId` từ token |
| SEC-06 | Medium | Bảo mật | `be/services/mail.service.ts:72, 85-102` | Chèn thẳng dữ liệu người dùng vào HTML email | Kết hợp với SEC-01, Gmail của hệ thống có thể bị dùng để gửi email lừa đảo | Escape HTML, validate tên và email |
| SEC-07 | Medium | Bảo mật | `be/services/mail.service.ts:35-38` | Tắt kiểm tra chứng chỉ TLS khi kết nối SMTP | Bị tấn công MITM có thể lộ mật khẩu ứng dụng Gmail | Bỏ `rejectUnauthorized: false` |
| SEC-08 | Medium | Xác thực | `be/services/auth.service.ts:43-51`, `be/routes/auth.routes.ts:7-8` | Đăng nhập không có rate limit; thông báo lỗi cho biết email có tồn tại hay không | Dò được email đã đăng ký, brute-force mật khẩu | Dùng một thông báo chung, thêm rate limit |
| SEC-09 | Medium | Validation | `be/controllers/*.ts`, `fe/components/AuthModal.tsx:38` | Backend gần như không validate input; quy tắc mật khẩu ở FE và BE lệch nhau | Dữ liệu rác vào DB; lỗi Prisma lộ ra client | Dùng schema validate (zod) cho mọi endpoint |
| ERR-03 | Medium | Logic / Thời gian | `be/services/mail.service.ts:50-54`, `be/services/showtime.service.ts:6-9` | Định dạng giờ và xác định "ngày" theo múi giờ của server | Server chạy UTC: email ghi sai giờ chiếu 7 tiếng, suất khuya hiện sai ngày | Chỉ định rõ `Asia/Ho_Chi_Minh` |
| ERR-04 | Medium | Logic / UX | `fe/pages/ProfilePage.tsx:77-87`, `fe/pages/PaymentSucces.tsx:46-59` | Tính năng giả lập nhưng vẫn báo thành công | Người dùng tưởng đã đổi mật khẩu hoặc đã có tài khoản | Ẩn đi hoặc làm thật |
| DB-01 | Medium | Database | `seatify-backend/prisma/` | Không có thư mục migrations | Không tái lập hoặc nâng cấp schema an toàn khi deploy | Dùng `prisma migrate` |
| DB-02 | Medium | Database | `be/services/booking.service.ts:196-203`, `be/services/cron.service.ts:30-40` | Nhả ghế bằng cách đặt `bookingId = null` | Đơn đã hủy hoặc hết hạn mất thông tin phim, ghế; lịch sử hiện "N/A" | Thêm bảng `BookingItem` lưu snapshot |
| DB-03 | Medium | Database / Thanh toán | `seatify-backend/prisma/schema.prisma:128-129`, `be/services/payment.service.ts:14` | Không lưu mã phiên hay mã giao dịch Stripe | Không đối soát được, không hoàn tiền được | Lưu `session.id` và `payment_intent` |
| ARCH-01 | Medium | Kiến trúc | 8 file có `new PrismaClient()` | Mỗi file tạo một connection pool riêng | Cạn kết nối DB, nhất là với DB gói miễn phí | Một instance dùng chung trong `lib/prisma.ts` |
| ARCH-02 | Medium | Kiến trúc | `fe/pages/BookingPage.tsx:75-90, 252-254`, `be/seed.ts:86-88`, `be/services/showtime.service.ts:134-136` | Bảng giá và sơ đồ ghế viết cứng ở frontend, lặp lại ở 3 nơi | Đổi giá hoặc thêm phòng phải sửa nhiều chỗ, dễ lệch nhau | Backend là nguồn sự thật, frontend vẽ theo dữ liệu API |
| ARCH-03 | Medium | Kiến trúc | Mọi file trong `be/controllers/` | Xử lý lỗi lặp lại, mã HTTP tùy tiện, trả `error.message` thô | Client nhận 404 cho lỗi validate; lộ chi tiết nội bộ | Lớp `AppError` và error middleware tập trung |
| OPS-01 | Medium | Kiểm thử | Toàn dự án | Không có test nào | Không phát hiện được lỗi hồi quy ở luồng giữ ghế và thanh toán | Test tích hợp cho hold, confirm, cancel, cron |
| OPS-02 | Medium | Vận hành | `be/seed.ts:15-51` | Seed xóa sạch DB mà không chặn theo môi trường; admin có mật khẩu yếu; chứa dữ liệu cá nhân thật | Mất dữ liệu nếu chạy nhầm DB; mật khẩu admin dễ đoán | Chặn chạy ở production, lấy mật khẩu từ env, dùng dữ liệu giả |
| SEC-10 | Low | Bí mật | `seatify-frontend/.env`, `seatify-frontend/.gitignore` | `.env` của frontend được commit; `.gitignore` không có `.env` | Secret thêm vào sau này sẽ bị đẩy lên git | Bỏ khỏi git, thêm `.env.example` |
| SEC-11 | Low | Bảo mật | `fe/contexts/AuthContext.tsx:56`, `be/services/auth.service.ts:53-57`, `be/server.ts` | JWT lưu ở localStorage, role trong token tồn tại 1 ngày, không có helmet, không có error handler | Thiệt hại lớn hơn nếu có XSS; hạ quyền không có hiệu lực ngay | Chấp nhận tạm thời, nhưng cần hiểu rõ đánh đổi |
| ERR-05 | Low | Logic | `be/services/payment.service.ts:47-85` | Gửi email bên trong transaction; kiểm tra "đã SUCCESS" không nguyên tử | Email vẫn được gửi dù transaction rollback; gửi trùng khi có request đồng thời | Update có điều kiện, gửi mail sau khi commit |
| ERR-06 | Low | Logic | `be/services/movie.service.ts:30-38, 59-67` | Phim có `releaseDate` nhưng thiếu `endDate` luôn là `COMING_SOON`; logic lặp ở 2 nơi | Phim đang chiếu bị xếp sai nhóm | Hàm `computeMovieStatus` dùng chung |
| ERR-07 | Low | Logic | `be/services/movie.service.ts:6-20, 117-118` | Update không gửi ngày thì ngày bị xóa; không sửa được `backdropUrl`, `movieContent` | Mất dữ liệu khi cập nhật một phần | Chỉ cập nhật trường được gửi; bổ sung trường còn thiếu |
| ERR-08 | Low | UX | `fe/pages/CheckoutPage.tsx:114, 186` | Giao diện ghi "Thanh toán qua VNPAY" nhưng thực tế dùng Stripe | Người dùng bối rối | Sửa nhãn |
| ERR-09 | Low | Frontend | `fe/components/Admin/AdminRoute.tsx:10`, `fe/utils/apiClient.ts:29` | Gọi toast trong lúc render; `response.json()` khi lỗi không phải JSON | Toast lặp; lỗi khó hiểu khi server trả HTML | Chuyển side effect ra khỏi render; bọc parse trong try/catch |
| DB-04 | Low | Database | `seatify-backend/prisma/schema.prisma` | Không có `@@index` cho khóa ngoại và truy vấn của cron | Hệ thống chậm dần khi dữ liệu tăng | Thêm index |
| ARCH-04 | Low | Kiến trúc | `be/server.ts:3-8`, `be/middlewares/auth.middleware.ts:12` | Biến môi trường được nạp nhờ thứ tự import; không kiểm tra env khi khởi động | Đổi thứ tự import là Stripe/Gmail mất key | Đặt `import 'dotenv/config'` đầu tiên, validate env |
| ARCH-05 | Low | Kiến trúc | `be/controllers/payment.controller.ts:5, 16-23`, `be/controllers/booking.controller.ts:9-11` | Controller gọi thẳng Prisma; kiểu `AuthRequest` khai báo ở 2 nơi | Phá vỡ quy ước phân tầng đã đặt ra | Chuyển truy vấn vào service, dùng chung type |
| OPS-03 | Low | Vận hành | Gốc repo, `seatify-backend/package.json:49` | Không có README, `.env.example`, CI; seed dùng `tsx` nhưng không khai báo trong devDependencies | Người khác khó chạy được dự án | Viết README, `.env.example`, CI tối thiểu |
| OPS-04 | Low | Vận hành | `be/services/cron.service.ts`, `be/services/mail.service.ts:131` | Log bằng `console`, ghi cả email khách vào log | Khó điều tra sự cố; thông tin cá nhân nằm trong log | Dùng logger có cấp độ, che thông tin cá nhân |
| CODE-01 | Low | Chất lượng | `fe/components/QuickBooking.tsx`, `fe/pages/Admin/AdminDashboardPage.tsx`, `be/routes/auth.routes.ts:10-21` | Code chết, dữ liệu viết cứng, route thử nghiệm còn sót | Gây hiểu nhầm, tăng khối lượng bảo trì | Xóa hoặc đánh dấu rõ |
| CODE-02 | Low | Chất lượng | `fe/pages/BookingPage.tsx` (666 dòng), `interface Movie` ở 7 file | Component quá lớn, type bị khai báo lặp | Khó đọc, khó sửa | Tách component và hook, gom type về một chỗ |
| CODE-03 | Low | Chất lượng | Nhiều file | Comment mang giọng hội thoại hoặc quảng cáo; có comment sai sự thật | Comment đánh lừa người đọc | Comment giải thích "vì sao" (xem `09`, mục 3) |

### Vấn đề bổ sung ngày 24/09/2026

| Mã | Mức độ | Nhóm | Vị trí | Vấn đề | Ảnh hưởng | Hướng xử lý |
|---|---|---|---|---|---|---|
| ARCH-06 | Medium | Kiến trúc BE | `be/controllers`, `be/services`, `be/routes` | Tổ chức theo loại file, không có module nghiệp vụ và thư mục `shared` | Khó mở rộng, phụ thuộc chéo khi thêm nghiệp vụ | Chuyển sang `modules/*` + `shared/*` (`07`) |
| ARCH-07 | Medium | Kiến trúc BE | `be/server.ts` | Một file làm 8 việc; không tách `app` và `server`; cron chạy khi import; còn code bị comment lại | Không test được bằng supertest; khó đọc | `app.ts` (createApp) + `server.ts` (khởi động, tắt an toàn) |
| ARCH-08 | Medium | Kiến trúc BE | `be/services/auth.service.ts`, `be/middlewares/auth.middleware.ts`, `be/services/mail.service.ts`, `be/services/payment.service.ts` | bcrypt, JWT, mailer, Stripe không được tách thành thư viện nội bộ | Không tái sử dụng được, khó mock, khó đổi nhà cung cấp | `shared/lib/{password,token,mailer,stripe,prisma}.ts` |
| ARCH-09 | Medium | Kiến trúc BE | 68 lời gọi `res.status/res.send` | 5 định dạng response khác nhau; không có mã lỗi | Frontend không xử lý lỗi theo loại được | `sendSuccess`/`sendCreated` + `createHttpError` (function, không class) |
| ARCH-10 | Low | Kiến trúc BE | `seatify-backend/tsconfig.json`, `package.json` | Biên dịch ra CommonJS; dev dùng `ts-node-dev` | Không đồng nhất với frontend (ESM) | `"type": "module"`, `NodeNext`, `tsx` |
| ARCH-11 | Medium | Kiến trúc FE | `fe/pages`, `fe/components` | Thư mục phẳng, trộn trang khách hàng và quản trị, không có `features` | Không có ranh giới tính năng | `features/*`, `pages/{client,admin,common}`, `layouts/{client,admin}` (`08`) |
| ARCH-12 | Medium | Kiến trúc FE | `fe/routes/AppRoutes.tsx`, `fe/App.tsx` | `<Routes>` JSX trong một file; không có error boundary; `ScrollToTop` tự viết | Lỗi render hoặc lỗi tải chunk làm trắng cả app | `createBrowserRouter` + `client.routes`/`admin.routes` + `errorElement` + `ScrollRestoration` |
| ARCH-13 | Medium | Kiến trúc FE | 11 file dùng `useEffect` gọi API | Dữ liệu server quản lý thủ công; không cache; race condition khi đổi ngày; sơ đồ ghế không tự cập nhật | Tải lại thừa, hiển thị sai lịch chiếu, lỗi khi giữ ghế | TanStack Query + custom hook theo feature |
| ARCH-14 | Low | Kiến trúc FE | `fe/contexts/AuthContext.tsx`, `fe/utils/apiClient.ts:4, 23-26` | Auth có hai nguồn sự thật; 401 thì tải lại cả trang; state UI lặp ở 4 trang | Hành vi khó đoán, trải nghiệm giật | zustand (`useAuthStore` persist, `useUiStore`) |
| ARCH-15 | Medium | Kiến trúc FE | `fe/pages/BookingPage.tsx`, `CheckoutPage.tsx`; 4 trang gọi thẳng `fetchClient` | Logic API và nghiệp vụ nằm trong component, không có custom hook | Không tái sử dụng, không test được logic | Hook theo feature; trang chỉ lắp ghép |
| ARCH-16 | Medium | Kiến trúc FE | `interface Movie` ở 7 file; `fe/utils/apiClient.ts` | Types phân tán, lệch nhau; `fetchClient` trả `any` ngầm | Kiểu an toàn chỉ là hình thức | Kiểu theo feature + `ApiResponse<T>` + `z.infer` |
| CODE-04 | Medium | Chất lượng FE | `seatify-frontend/tsconfig.app.json` | Không bật `strict` (đính chính báo cáo lần 1) | Không bắt lỗi null/undefined | `"strict": true` trước khi tái cấu trúc |
| CODE-05 | Medium | UI / Điều hướng | `fe/components/Footer.tsx`, `MovieCard.tsx`, `Header.tsx`, `fe/pages/NotFoundPage.tsx` | 8 thẻ `<li>` giả làm link; `<button>` lồng trong `<Link>`; icon tìm kiếm không phải button; menu chỉ mở bằng hover | Bấm không có tác dụng; HTML không hợp lệ; không dùng được bằng bàn phím | Mọi thứ trông như link thì phải là link; tách MovieCard |
| CODE-06 | Medium | Chất lượng | Nhiều file (`09`, mục 4) | Trùng lặp: 8 modal, 4 bản state trailer, 7+ định dạng tiền, ~10 kiểu loading, 17 try/catch | Sửa một chỗ phải sửa nhiều chỗ | `shared/ui`, `shared/utils`, error middleware |
| CODE-07 | Low | Chất lượng | `09`, mục 4 | Magic number và cấu hình viết cứng (giá, 8 vé, 5 phút, bcrypt 10, `'1d'`, "180 vé"…) | Khó thay đổi, dễ lệch | `config/env.ts`, `config/app.config.ts` |
| VAL-01 | Medium | Validation | `fe/components/AuthModal.tsx`, `GuestCheckoutModal.tsx`, `fe/pages/Admin/*` | Không dùng thư viện validation; kiểm tra thủ công, thiếu nhiều quy tắc; lỗi chỉ hiện qua toast | Dữ liệu sai lọt qua; người dùng không biết ô nào sai | zod + react-hook-form (`10`) |
| VAL-02 | Medium | Validation | FE và BE | Không có hợp đồng validation chung; 3 quy tắc mật khẩu khác nhau | Quy tắc lệch, bỏ qua được bằng cách gọi API trực tiếp | Schema zod cùng quy tắc ở hai phía, về sau dùng `packages/contracts` |
| OPS-05 | Medium | Kiểm thử | `seatify-frontend` | Frontend không có test | Quy tắc chọn vé/ghế chưa được kiểm chứng | Vitest + Testing Library + MSW (`11`) |
| OPS-06 | Medium | Kiểm thử | Cả hai repo | Không có E2E, không có hạ tầng test, không có CI | Luồng mua vé chưa từng được test tự động từ đầu đến cuối | Playwright + GitHub Actions |
| OPS-07 | Low | Vận hành | Thư mục gốc `seatify/` | Cách tổ chức repo chưa được quyết định rõ. Ngày 24/09 gốc đã thành repo `seatify-clone` (1 commit `init`), nhưng không mang theo 40 commit cũ và chưa có `.gitignore` gốc | Mất lịch sử và `git blame` nếu phát triển tiếp trên repo gộp; `.env` frontend vẫn bị commit | Chọn repo phát triển chính; nhập lịch sử bằng `git subtree`/`filter-repo`; thêm `.gitignore` gốc (`12`) |
| DOC-01 | Medium | Tài liệu | Cả hai repo | Thiếu tài liệu cho người phát triển: README, env, API, kiến trúc, DB, quy ước | Người mới không chạy được dự án | `docs/developer/*` (`12`) |
| DOC-02 | Medium | Tài liệu | – | Thiếu tài liệu vận hành: deploy, runbook sự cố thanh toán/email, sao lưu | Không có quy trình khi có sự cố thật | `docs/operations/*` |
| DOC-03 | Medium | Tài liệu | `fe/components/Footer.tsx:52-63` | Không có chính sách bảo mật, điều khoản, chính sách hủy/hoàn tiền, FAQ, hướng dẫn admin | Footer hứa hẹn trang không tồn tại; thu thập dữ liệu cá nhân mà không có chính sách | Trang trong app + `docs/user/*` |

## 2. Chi tiết nhóm ERR (lỗi logic / runtime)

### ERR-01: Trạng thái thanh toán và trạng thái đơn có thể lệch nhau

- **Mức độ:** High · **Độ chắc chắn:** Đã xác nhận qua phân tích luồng. Thời hạn mặc định 24 giờ của Stripe lấy theo tài liệu Stripe.
- **Bằng chứng:**
  - `be/services/payment.service.ts:14-39`: tạo Checkout Session nhưng không đặt `expires_at`, nên phiên thanh toán sống mặc định 24 giờ.
  - `be/services/booking.service.ts:96`: ghế chỉ được giữ 5 phút.
  - `be/services/booking.service.ts:75-78`: ghế `HOLDING` đã quá `lockedUntil` được coi là còn trống và có thể được gán sang đơn khác.
  - `be/services/payment.service.ts:51`: `confirmPaymentSuccess` chỉ dừng khi đơn đã `SUCCESS`. Đơn `FAILED` vẫn bị chuyển thành `SUCCESS`.
  - `be/services/payment.service.ts:60-66`: cập nhật ghế theo `bookingId`. Nếu ghế đã bị nhả hoặc đã thuộc đơn khác thì lệnh này cập nhật 0 dòng, và **không có gì phát hiện ra điều đó**.
- **Ba kịch bản** (người dùng bình thường cũng gặp, không cần ai tấn công):
  1. Khách mở trang Stripe, 7 phút sau mới trả tiền. Lúc đó cron đã đánh đơn `FAILED` và nhả ghế. Stripe vẫn thu tiền rồi redirect về trang success. `confirm` chuyển đơn `FAILED` thành `SUCCESS`, nhưng **đơn không còn ghế nào**. Gửi email bị lỗi (`ticketSeats[0]` là `undefined`, lỗi bị nuốt trong `catch`), còn trang web vẫn báo "Thanh toán thành công".
  2. Giống kịch bản 1, nhưng một khách khác đã giữ đúng ghế đó. Khách thứ nhất mất tiền, khách thứ hai có ghế.
  3. Khách trả tiền xong nhưng đóng tab trước khi Stripe redirect về. Không ai gọi `confirm`, 5 phút sau cron đánh đơn `FAILED`. Khách mất tiền, mất ghế, và hệ thống không có dữ liệu để đối soát (DB-03).
- **Nguyên nhân gốc:** đơn hàng không có máy trạng thái rõ ràng, và **nguồn sự thật về thanh toán đang là trình duyệt, không phải Stripe**.
- **Hướng xử lý:**
  1. Chỉ cho phép chuyển `PENDING → SUCCESS`, dùng update có điều kiện:
     ```ts
     const { count } = await tx.booking.updateMany({
       where: { id: bookingId, status: 'PENDING' },
       data: { status: 'SUCCESS' },
     });
     if (count === 0) {
       // Đơn không còn ở trạng thái chờ → đánh dấu cần hoàn tiền, KHÔNG báo thành công
     }
     ```
  2. Trước khi chốt, đếm số ghế `HOLDING` còn thuộc đơn. Nếu thiếu, đánh dấu đơn cần hoàn tiền (thêm trạng thái `REFUND_REQUIRED` hoặc gọi `stripe.refunds.create`).
  3. Đồng bộ thời hạn. Stripe yêu cầu `expires_at` tối thiểu 30 phút. Cách đơn giản: vẫn giữ ghế 5 phút khi khách đang chọn, nhưng khi khách bấm "Thanh toán" thì gia hạn `lockedUntil` lên khoảng 35 phút và đặt `expires_at` là 30 phút. **Thời hạn giữ ghế phải dài hơn thời hạn của phiên Stripe.**
  4. Dùng webhook `checkout.session.completed` để xử lý kịch bản 3, và `checkout.session.expired` để nhả ghế sớm (xem SEC-01).

### ERR-02: Tạo suất chiếu không kiểm tra trùng lịch phòng

- **Mức độ:** High · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** `be/services/showtime.service.ts:103-153` tạo suất chiếu mà không truy vấn các suất khác trong cùng phòng. `be/controllers/showtime.controller.ts:80` chỉ kiểm tra có đủ 4 trường hay không. Giá trị `endTime` do frontend tự tính (`fe/pages/Admin/AdminShowtimePage.tsx:154-156`, lấy `duration + 15` phút) và backend tin luôn. Backend cũng không kiểm tra phim có tồn tại không (nếu không sẽ lỗi khóa ngoại, trả về HTTP 500 kèm thông báo của Prisma), hay suất chiếu có nằm trong khoảng `releaseDate…endDate` của phim không.
- **Ảnh hưởng:** mỗi suất chiếu có bộ vé riêng. Nếu hai suất trùng giờ trong cùng một phòng, **cùng một ghế vật lý sẽ được bán cho hai người**. Sau quy tắc "một ghế một vé", đây là bất biến quan trọng nhất của một rạp chiếu phim.
- **Hướng xử lý:**
  ```ts
  const overlap = await tx.showtime.findFirst({
    where: { roomId, startTime: { lt: end }, endTime: { gt: start } },
  });
  if (overlap) throw conflict('SHOWTIME_OVERLAP', 'Phòng đã có suất chiếu trong khung giờ này');
  ```
  Tính `endTime = startTime + movie.duration + thời gian dọn phòng` ở backend, không nhận từ client. Trường hợp hai admin tạo suất cùng một giây rất hiếm, chưa cần dùng exclusion constraint của PostgreSQL.

### ERR-03: Thời gian phụ thuộc múi giờ của server

- **Mức độ:** Medium · **Độ chắc chắn:** Rủi ro tiềm ẩn, chỉ xảy ra khi server không chạy múi giờ Việt Nam. Phần lớn nền tảng cloud mặc định dùng UTC.
- **Bằng chứng:**
  - `be/services/mail.service.ts:50-54`: `toLocaleDateString('vi-VN')` và `toLocaleTimeString('vi-VN', …)` **không truyền `timeZone`**. `'vi-VN'` chỉ là *locale* (quy định cách định dạng), **không phải múi giờ**. Server chạy UTC sẽ in giờ UTC vào vé, ví dụ suất 19:00 thành "12:00".
  - `be/services/showtime.service.ts:6-9`: `new Date('2026-09-23')` là 00:00 UTC, sau đó `setHours(0,0,0,0)` theo giờ server. Trên máy dev ở Việt Nam kết quả là 00:00 giờ VN, đúng. Trên server UTC, khoảng lọc thành 07:00 hôm đó đến 07:00 hôm sau (giờ VN), nên các suất 00:00–06:59 hiện vào ngày hôm trước. Dữ liệu seed chỉ có suất từ 9h đến 21h nên lỗi này **sẽ không lộ ra khi test**.
- **Hướng xử lý:** thêm `timeZone: 'Asia/Ho_Chi_Minh'` khi định dạng giờ. Khi lọc theo ngày, tính mốc rõ ràng: `new Date(\`${date}T00:00:00+07:00\`)` rồi cộng 24 giờ. Đặt biến `TZ=Asia/Ho_Chi_Minh` khi deploy cũng chạy được, nhưng chỉ che lỗi chứ không sửa lỗi.

### ERR-04: Giao diện báo thành công cho tính năng chưa làm

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**
  - `fe/pages/ProfilePage.tsx:77-87`: "Cập nhật thông tin" và "Đổi mật khẩu" chỉ hiện toast "… thành công! (Giả lập)".
  - `fe/pages/PaymentSucces.tsx:46-59`: form "Tạo tài khoản nhanh" nhận mật khẩu, chạy `setTimeout` 1,5 giây, rồi báo *"Tạo tài khoản thành công! Mật khẩu đã được lưu."* Thực tế không có API nào được gọi và mật khẩu bị bỏ đi.
- **Ảnh hưởng:** khách vãng lai tin rằng mình đã có tài khoản. Lần sau đăng nhập sẽ thất bại, khách mất niềm tin vào hệ thống. Trong sản phẩm thật, **giao diện nói sai sự thật là lỗi nghiêm trọng hơn việc thiếu tính năng**.
- **Hướng xử lý:** ẩn các form này, hoặc hiện nhãn "Sắp ra mắt" và vô hiệu hóa nút. Khi làm thật, cần có `PUT /auth/me`, `PUT /auth/password` (kiểm tra mật khẩu cũ) và API tạo tài khoản từ đơn của khách (xác minh email trước khi gắn các đơn cũ vào tài khoản).

### ERR-05: Gửi email trước khi commit; kiểm tra idempotency không nguyên tử

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** `be/services/payment.service.ts:82-85` gọi `sendTicketEmail` **bên trong** callback của `$transaction`. Comment ở dòng 81 viết "KHI TRANSACTION THÀNH CÔNG", nhưng thực tế lúc đó transaction **chưa commit**. Dòng 51 kiểm tra "đã SUCCESS thì bỏ qua" bằng cách đọc rồi mới ghi, không có khóa. Hai request đồng thời có thể cùng đọc thấy `PENDING` và cùng gửi email. `StrictMode` của React ở môi trường dev gọi `useEffect` hai lần (`fe/pages/PaymentSucces.tsx:26-43`), nên trường hợp này dễ gặp khi dev.
- **Hướng xử lý:** dùng update có điều kiện như ở ERR-01 (`count === 1` thì mới là lần chốt đầu tiên), và chỉ gửi email sau khi `await prisma.$transaction(...)` đã trả về.

### ERR-06: Tính trạng thái phim sai khi thiếu `endDate`, logic bị lặp

- **Mức độ:** Low · **Bằng chứng:** `be/services/movie.service.ts:30-38` và `59-67` là hai đoạn logic giống hệt nhau. Nếu phim có `releaseDate` trong quá khứ nhưng `endDate = null` (form admin cho phép bỏ trống), phim sẽ **mãi là `COMING_SOON`**.
- **Hướng xử lý:** viết một hàm `computeMovieStatus(movie, now)`, coi phim đã ra mắt mà không có ngày kết thúc là `NOW_PLAYING`, và viết unit test cho hàm này (4–5 trường hợp).

### ERR-07: Cập nhật phim làm mất dữ liệu

- **Mức độ:** Low · **Bằng chứng:** `be/services/movie.service.ts:117-118`: nếu không gửi `releaseDate`/`endDate` thì hai trường này bị ghi `null`. Kiểu `MovieInput` (dòng 6-20) không có `backdropUrl` và `movieContent`, nên admin không sửa được ảnh nền của banner trang chủ.
- **Hướng xử lý:** chỉ đưa vào `data` những trường có trong request (Prisma bỏ qua giá trị `undefined`, chỉ cần không tự đổi thành `null`). Bổ sung các trường còn thiếu vào `MovieInput` và form admin.

### ERR-08: Nhãn "VNPAY" nhưng thực tế thanh toán qua Stripe

- **Mức độ:** Low · **Bằng chứng:** `fe/pages/CheckoutPage.tsx:186` hiện "Thanh toán qua VNPAY" kèm logo VNPAY, comment ở dòng 114 cũng ghi "SANG VNPAY", nhưng backend tạo phiên Stripe. **Hướng xử lý:** sửa nhãn cho đúng.

### ERR-09: Hai lỗi nhỏ ở frontend

- **Mức độ:** Low
- `fe/components/Admin/AdminRoute.tsx:10`: gọi `toast.error` ngay trong lúc render. Render phải là hàm thuần; ở `StrictMode` toast sẽ hiện hai lần. Nên truyền thông báo qua `state` của `<Navigate>` hoặc gọi trong `useEffect`.
- `fe/utils/apiClient.ts:29`: khi `!response.ok` thì luôn gọi `response.json()`. Nếu server hoặc proxy trả về HTML (lỗi 502, 504), người dùng sẽ thấy lỗi "Unexpected token <". Nên bọc lệnh parse trong `try/catch`. Ngoài ra `Content-Type: application/json` đang được gắn cả vào request GET không có body. Không sai, nhưng thừa.

## 3. Chi tiết nhóm ARCH (kiến trúc)

### ARCH-01: Tám `PrismaClient`, tám connection pool

- **Mức độ:** Medium · **Độ chắc chắn:** số instance đã xác nhận; mức ảnh hưởng là rủi ro tiềm ẩn.
- **Bằng chứng:** `new PrismaClient()` xuất hiện ở `be/controllers/payment.controller.ts:5`, `be/services/auth.service.ts:5`, `booking.service.ts:3`, `cinema.service.ts:3`, `cron.service.ts:4`, `movie.service.ts:3`, `payment.service.ts:5`, `showtime.service.ts:3`.
- **Ảnh hưởng:** theo mặc định, mỗi client mở tối đa `số CPU × 2 + 1` kết nối, nên 8 client cần gấp 8 lần. PostgreSQL gói miễn phí (Neon, Supabase, Render…) thường giới hạn số kết nối rất thấp, dễ gặp lỗi "too many connections". Khi chạy `ts-node-dev --respawn`, kết nối cũ có thể chưa kịp đóng.
- **Hướng xử lý:** cách sửa rẻ nhất trong cả báo cáo:
  ```ts
  // src/lib/prisma.ts
  import { PrismaClient } from '@prisma/client';
  export const prisma = new PrismaClient();
  ```
  Sau đó thay 8 dòng `new PrismaClient()` bằng `import { prisma } from '../lib/prisma'`.

### ARCH-02: Quy tắc nghiệp vụ nằm ở frontend

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** cùng một quy tắc xuất hiện ở ba nơi:

  | Quy tắc | `fe/pages/BookingPage.tsx` | `be/services/showtime.service.ts` | `be/seed.ts` |
  |---|---|---|---|
  | Giá cơ bản 80.000 / 55.000 | dòng 83 | không có | không có |
  | Phụ thu VIP 20.000, Couple 25.000 | dòng 77-78 | dòng 135-136 | dòng 539 |
  | Hàng D–I là VIP, hàng J là Couple | dòng 77-78, 174, 221 | không có | dòng 86-88 |
  | Sơ đồ 10 hàng × 18 ghế | dòng 252-254 và các khoảng 1-4, 5-14, 15-18 | không có | dòng 80, 85 |

  API `GET /showtimes/:id/seats` chỉ trả về danh sách ghế đã có người, không trả loại ghế hay giá. Cột `Seat.type` và `TicketSeat.price` có trong DB nhưng frontend không dùng tới.
- **Ảnh hưởng:** đổi giá thì phải sửa frontend và deploy lại. Thêm phòng có sơ đồ khác thì frontend vẽ sai. Đổi hàng VIP trong DB thì frontend hiện sai giá. Ghế đôi có thể mua lẻ một chiếc vì không có quy tắc bán theo cặp. Quan trọng nhất: đây là nguyên nhân trực tiếp của **SEC-02**.
- **Hướng xử lý:** cho `GET /showtimes/:id/seats` trả về sơ đồ đầy đủ, ví dụ `[{ label: 'A1', row: 'A', number: 1, type: 'VIP', surcharge: 20000, status: 'AVAILABLE' }]`, để frontend nhóm theo hàng rồi vẽ. Bảng giá cơ bản đặt ở một file cấu hình của backend (chưa cần bảng giá trong DB), và frontend lấy qua API. **Chưa cần** làm trình chỉnh sửa sơ đồ phòng.

### ARCH-03: Xử lý lỗi rời rạc, mã HTTP tùy tiện

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**
  - 17 khối `try/catch` trong 6 controller có cấu trúc gần như giống hệt nhau.
  - Service ném `new Error('…')` chung chung, nên controller không phân biệt được "không tìm thấy", "xung đột" hay "lỗi hệ thống".
  - Hậu quả là mã HTTP bị gán tùy tiện: tạo phim thiếu dữ liệu trả **404** (`be/controllers/movie.controller.ts:53-57`); mọi lỗi của Stripe hay DB khi tạo link thanh toán trả **404** (`be/controllers/payment.controller.ts:41-42`); mất kết nối DB khi giữ ghế trả **400** (`be/controllers/booking.controller.ts:28-29`).
  - `be/controllers/showtime.controller.ts:29, 54, 93` và `movie.controller.ts:16` trả `error: error.message` về client. Thông báo lỗi của Prisma có tên bảng, tên cột và câu truy vấn.
  - Không có handler 404 cho route không tồn tại, và không có error middleware.
- **Hướng xử lý (cập nhật 24/09/2026):** báo cáo lần 1 đề xuất `class AppError extends Error`. Đề xuất này **được thay thế** bằng factory function để tuân theo quy ước "không định nghĩa class":
  ```ts
  // src/shared/utils/http-error.ts
  export type HttpError = Error & { status: number; code: string; details?: unknown };
  export const createHttpError = (status: number, code: string, message: string, details?: unknown): HttpError =>
    Object.assign(new Error(message), { status, code, details });
  export const notFound = (message = 'Không tìm thấy dữ liệu') => createHttpError(404, 'NOT_FOUND', message);
  export const conflict = (code: string, message: string) => createHttpError(409, code, message);
  ```
  Kèm một `errorHandler` đặt **sau** mọi route, xử lý `HttpError`, `ZodError`, lỗi Prisma và lỗi lạ (trả 500, không lộ chi tiết). Chi tiết và định dạng response chuẩn ở `07-KIEN-TRUC-BACKEND-DE-XUAT.md`, mục 4.2–4.4. Express 5 tự chuyển promise bị reject từ async handler vào middleware này, nên controller có thể **bỏ hết `try/catch`** và ngắn đi khoảng một nửa.

### ARCH-04: Biến môi trường được nạp nhờ thứ tự import

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận bằng cách lần theo thứ tự `require` sau khi biên dịch sang CommonJS.
- **Bằng chứng:** `be/server.ts:8` gọi `dotenv.config()` **sau khi** mọi `import` đã chạy xong. `payment.service.ts:8` (`new Stripe(process.env.STRIPE_SECRET_KEY)`) và `mail.service.ts:27` (tạo transporter) đọc biến môi trường **ngay lúc module được nạp**. Hiện tại code vẫn chạy được chỉ vì `auth.middleware.ts:12` cũng gọi `dotenv.config()`, và file này tình cờ được import trước `payment.routes`. Nếu đổi thứ tự dòng trong `routes/index.ts`, Stripe sẽ nhận key `undefined`.
- **Hướng xử lý:** đặt `import 'dotenv/config';` ở **dòng đầu tiên** của `server.ts` và xóa các lời gọi `dotenv.config()` khác. Thêm `src/config/env.ts` kiểm tra đủ `DATABASE_URL`, `JWT_SECRET_KEY`, `STRIPE_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `FRONTEND_URL` ngay khi khởi động. Thiếu biến nào thì dừng server với thông báo rõ ràng (fail fast).

### ARCH-05: Rò rỉ tầng và type bị khai báo lặp

- **Mức độ:** Low · **Bằng chứng:** `be/controllers/payment.controller.ts:5, 16-23` tự tạo Prisma client và truy vấn trực tiếp, trái với quy ước "controller không đụng DB" mà chính dự án đặt ra. `AuthRequest` được khai báo ở `be/middlewares/auth.middleware.ts:5-10` và khai báo lại ở `be/controllers/booking.controller.ts:9-11`.
- **Hướng xử lý:** chuyển truy vấn sang `payment.service.ts`. Dùng lại `AuthRequest` từ middleware, hoặc mở rộng kiểu `Express.Request` trong `src/types/express.d.ts`.
