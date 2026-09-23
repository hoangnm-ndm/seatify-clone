# 05. Lộ trình cải thiện

> **Công sức:** S = dưới nửa ngày · M = 1–2 ngày · L = từ 3 ngày trở lên (ước lượng cho một người đang học).
> Thứ tự bên dưới đã tính đến phụ thuộc giữa các việc. Ví dụ ARCH-01 làm trước vì mọi thay đổi sau đều đụng đến Prisma.

## Giai đoạn 1: Làm ngay (luồng mua vé phải đáng tin cậy)

Mục tiêu: sau giai đoạn này, **không ai lấy được vé mà không trả đúng số tiền**, và khách đã trả tiền thì luôn có ghế.

| # | Việc | Mã | Công sức |
|---|---|---|---|
| 1 | Tạo `src/lib/prisma.ts`, thay 8 chỗ `new PrismaClient()` | ARCH-01 | S |
| 2 | Chuẩn bị test: tách `app.ts` khỏi `server.ts`, cài Vitest + supertest, tạo DB test. Viết **trước** test giữ ghế đồng thời và test "confirm khi chưa trả tiền" (test thứ hai sẽ chạy đỏ, chứng minh SEC-01 tồn tại) | OPS-01 | M |
| 3 | Backend tự tính giá; frontend gửi `seats` + `tickets: { adult, student }`; giới hạn 8 ghế ở server | SEC-02, SEC-03 (một phần) | M |
| 4 | Lưu `session.id` vào `gatewayTransactionId`; `confirm` lấy lại phiên từ Stripe, chỉ chốt khi `payment_status === 'paid'` và số tiền khớp | SEC-01, DB-03 | M |
| 5 | Chốt đơn bằng update có điều kiện (`PENDING → SUCCESS`), kiểm tra ghế còn giữ, gửi email **sau** khi commit; gia hạn giữ ghế khi tạo phiên Stripe và đặt `expires_at` | ERR-01, ERR-05 | M |
| 6 | Ẩn các tính năng giả lập (đổi mật khẩu, cập nhật hồ sơ, tạo tài khoản sau thanh toán), sửa nhãn VNPAY | ERR-04, ERR-08 | S |
| 7 | Bỏ `rejectUnauthorized: false`; escape HTML trong email | SEC-06, SEC-07 | S |

**Dấu hiệu hoàn thành:** test ở bước 2 chạy xanh; tự thử sửa `totalPrice` bằng Postman và mở thẳng URL success đều không lấy được vé.

## Giai đoạn 2: Trước khi deploy thật

| # | Việc | Mã | Công sức |
|---|---|---|---|
| 8 | `import 'dotenv/config'` ở dòng đầu, file `config/env.ts` kiểm tra đủ biến môi trường khi khởi động | ARCH-04 | S |
| 9 | Lớp `AppError` + error middleware + handler 404; bỏ `try/catch` lặp trong controller | ARCH-03 | M |
| 10 | Validate bằng `zod` cho mọi endpoint ghi dữ liệu; thống nhất quy tắc mật khẩu FE/BE | SEC-09 | M |
| 11 | `express-rate-limit` cho `/auth/*` và `/bookings/hold`; giới hạn số đơn `PENDING` theo email/IP; thông báo đăng nhập chung | SEC-03, SEC-08 | S |
| 12 | Middleware `optionalAuth`; lấy `userId` từ token; kiểm tra chủ đơn khi xem/hủy; che thông tin cá nhân | SEC-04, SEC-05 | M |
| 13 | Webhook `checkout.session.completed` / `expired`; trang success chỉ đọc trạng thái | SEC-01, ERR-01 (kịch bản 3) | M |
| 14 | Kiểm tra trùng lịch khi tạo suất chiếu; tính `endTime` ở server | ERR-02 | S |
| 15 | Định dạng giờ với `timeZone: 'Asia/Ho_Chi_Minh'`; tính khoảng ngày theo +07:00 | ERR-03 | S |
| 16 | `prisma migrate dev --name init`, commit migrations; deploy bằng `migrate deploy` | DB-01 | S |
| 17 | Chặn seed khi `NODE_ENV=production`; mật khẩu admin lấy từ env; thay dữ liệu cá nhân bằng dữ liệu giả | OPS-02 | S |
| 18 | README, `.env.example` (backend và frontend); bỏ `.env` frontend khỏi git; `prisma generate` trong build | OPS-03, SEC-10 | S |
| 19 | Bổ sung test cho hủy đơn, cron, phân quyền, tạo suất chiếu | OPS-01 | M |

## Giai đoạn 3: Phiên bản sau

| Việc | Mã | Công sức |
|---|---|---|
| Bảng `BookingItem` lưu snapshot ghế và giá; không mất lịch sử khi nhả ghế | DB-02 | M |
| API trả sơ đồ ghế đầy đủ (loại ghế, phụ thu, trạng thái); frontend vẽ theo dữ liệu; quy tắc ghế đôi bán theo cặp | ARCH-02 | M |
| Tách `BookingPage` thành component con và hook; gom type về `fe/types/` | CODE-02 | M |
| Thêm các index cần thiết | DB-04 | S |
| Hàm `computeMovieStatus` dùng chung; update phim chỉ ghi trường được gửi; thêm `backdropUrl`, `movieContent` vào form admin | ERR-06, ERR-07 | S |
| Chuyển truy vấn khỏi `payment.controller`; dùng chung `AuthRequest` | ARCH-05 | S |
| Sửa toast trong lúc render ở `AdminRoute`; parse lỗi an toàn trong `apiClient` | ERR-09 | S |
| Xóa code chết, route thử nghiệm; viết lại comment theo hướng "vì sao" | CODE-01, CODE-03 | S |
| Làm thật các tính năng đang giả lập: cập nhật hồ sơ, đổi mật khẩu, tạo tài khoản từ đơn khách vãng lai | ERR-04 | M |
| Admin: sửa/xóa suất chiếu (chặn khi đã có vé `BOOKED`), quản lý rạp và phòng | – | M |
| Tự sinh QR bằng thư viện `qrcode`; lưu `emailSentAt`, có nút gửi lại vé | OPS-04 | S |

## Giai đoạn 4: Khi hệ thống tăng trưởng

**Chỉ làm khi có số liệu chứng minh là cần**:

- Chuyển từ Gmail cá nhân sang dịch vụ email giao dịch (Resend, SendGrid, Amazon SES) khi số đơn mỗi ngày vượt hạn mức gửi của Gmail.
- Logger có cấu trúc (`pino`) cùng công cụ theo dõi lỗi (Sentry) khi bắt đầu có người dùng thật (OPS-04).
- Tách cron sang process hoặc worker riêng khi backend chạy nhiều instance.
- Phân trang và tìm kiếm phía server cho `/movies` khi số phim lên đến hàng trăm.
- Đưa việc gửi email vào hàng đợi có cơ chế thử lại khi lượng đơn lớn.
- Cân nhắc lưu JWT trong cookie `httpOnly` (kèm chống CSRF) khi hệ thống có dữ liệu nhạy cảm hơn (SEC-11).

## Những việc KHÔNG nên làm lúc này

| Đừng làm | Vì sao |
|---|---|
| Viết lại bằng NestJS hoặc tách microservice | Kiến trúc phân tầng hiện tại đã đủ. Lỗi nằm ở **logic và ranh giới tin cậy**, đổi framework không giải quyết được |
| Thêm Redis hoặc distributed lock cho việc giữ ghế | `SELECT … FOR UPDATE` của PostgreSQL **đã đúng và đủ** cho quy mô này. Thêm Redis là thêm một nơi có thể hỏng |
| Chuyển sang optimistic locking, event sourcing, CQRS | Không có vấn đề nào trong báo cáo cần đến chúng |
| Dockerize hoặc dùng Kubernetes trước khi có README, migration và test | Đóng gói một hệ thống chưa đúng chỉ làm việc sửa lỗi khó hơn |
| Thêm Redux hoặc Zustand | Context kết hợp state cục bộ đang đủ dùng. Chưa có dấu hiệu prop drilling hay state phức tạp |
| Tối ưu hiệu năng frontend (memo, virtualization) | Chưa có dấu hiệu chậm; sơ đồ 180 ghế không cần virtualization |
| Làm chức năng thiết kế sơ đồ phòng bằng kéo thả | Chỉ cần API trả sơ đồ (ARCH-02). Sơ đồ phòng hiếm khi thay đổi |
| Tích hợp thêm VNPAY song song với Stripe | Hãy làm cho **một** cổng thanh toán chạy đúng trước |
| Sửa lỗi hàng loạt mà không có test | Rất dễ làm hỏng luồng giữ ghế, phần đang chạy tốt nhất của dự án |
