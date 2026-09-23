# 11. Kiểm thử: hiện trạng và chiến lược

> Bổ sung ngày 24/09/2026. File này trình bày chi tiết **OPS-01** (backend), **OPS-05** (frontend), **OPS-06** (E2E và hạ tầng test), và mở rộng mục 2 của `04-CHAT-LUONG-VA-VAN-HANH.md`.

## 1. Kết luận: thiếu hoàn toàn

| Hạng mục | Backend | Frontend |
|---|---|---|
| File test (`*.test.*`, `*.spec.*`, `__tests__/`) | 0 | 0 |
| Framework test trong `package.json` | Không có | Không có |
| Script `test` | Không có | Không có |
| Database hoặc môi trường riêng cho test | Không có | – |
| Mock API (MSW…) | – | Không có |
| Test end-to-end | Không có | Không có |
| CI chạy test | Không có | Không có |
| Tỷ lệ bao phủ | 0% | 0% |

Dự án **không có bất kỳ hình thức kiểm thử tự động nào**. Mọi kiểm tra hiện nay đều làm bằng tay qua giao diện. Đây không phải trường hợp "thiếu một phần": **mọi tính năng** đều chưa có test.

## 2. Vấn đề chi tiết

### OPS-01: Backend không có test

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Ảnh hưởng:** phần giá trị nhất của dự án (khóa ghế đồng thời) chưa có bằng chứng nào cho thấy nó chạy đúng. Các lỗi SEC-01, SEC-02, ERR-01, ERR-05 đều thuộc loại mà một test integration đơn giản sẽ phát hiện ngay. Tái cấu trúc sang modular (ARCH-06) **mà không có test** là rủi ro rất cao.
- **Rào cản kỹ thuật hiện tại:** chưa tách `app` và `server` (ARCH-07); 8 Prisma client (ARCH-01); cron tự chạy khi import.

### OPS-05: Frontend không có test

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Ảnh hưởng:** các quy tắc phức tạp ở giao diện (chọn vé/ghế, ghế đôi, giới hạn 8 vé, popup HSSV, đồng hồ đếm ngược) chưa được kiểm chứng. Logic nằm trong component (ARCH-15) nên hiện tại **rất khó viết test**; phải tách thành hook trước.

### OPS-06: Không có test end-to-end và không có hạ tầng test

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Ảnh hưởng:** luồng mua vé đi qua 3 hệ thống (frontend → backend → Stripe) nhưng chưa từng được kiểm thử tự động từ đầu đến cuối. Không có CI nên không có gì ngăn một commit làm hỏng build được đẩy lên.

## 3. Ma trận test theo tính năng

Mức ưu tiên: **P0** làm cùng lúc với việc sửa lỗi Critical/High · **P1** làm khi tái cấu trúc module tương ứng · **P2** làm sau.

| Tính năng | Unit (BE) | Integration (BE) | Unit / Component (FE) | E2E | Ưu tiên |
|---|---|---|---|---|---|
| Giữ ghế | `pricing.ts`: giá theo loại vé và phụ thu | 20 request đồng thời chỉ 1 thành công; > 8 ghế bị từ chối; giá do server tính; ghế không tồn tại | `useSeatSelection`: số ghế = số vé, tối đa 8 | Khách vãng lai đặt vé | **P0** |
| Thanh toán | – | `confirm` từ chối khi Stripe chưa xác nhận (mock Stripe); `FAILED` không thành `SUCCESS`; gọi 2 lần thì chỉ gửi 1 email; webhook sai chữ ký bị từ chối | Trang kết quả hiển thị đúng 3 trạng thái | Thanh toán bằng thẻ test của Stripe | **P0** |
| Hủy đơn, nhả ghế tự động | – | Chỉ chủ đơn hủy được; chỉ hủy được đơn `PENDING`; job nhả ghế quá hạn nhưng không nhả ghế vừa được giữ lại | `useCountdown` | – | P1 |
| Email vé | Template escape HTML; định dạng giờ theo `Asia/Ho_Chi_Minh` | Gửi mail **sau** khi commit (mock mailer) | – | – | P1 |
| Đăng ký, đăng nhập | `password.ts`, `token.ts`, `registerSchema` | Đăng ký trùng email; sai mật khẩu; rate limit; 401/403 | `LoginForm`, `RegisterForm` hiển thị lỗi theo ô | Đăng nhập → vào trang hồ sơ | P1 |
| Phân quyền | – | USER gọi API admin nhận 403; không có token nhận 401; xem đơn của người khác bị từ chối | `RequireAdmin` chuyển hướng | USER không vào được `/admin` | P1 |
| Admin: suất chiếu | Hàm kiểm tra chồng lấn | Trùng giờ trả 409 `SHOWTIME_OVERLAP`; sinh đủ vé theo số ghế | `ShowtimeForm` | Admin tạo suất chiếu | P1 |
| Admin: phim | `movieSchema` | Tạo/sửa; cập nhật một phần không xóa ngày | `MovieForm` | Admin thêm phim | P1 |
| Danh sách, chi tiết phim | `computeMovieStatus` (5 trường hợp) | `GET /movies`, `GET /movies/:id` (404) | `MovieCard` (không lồng button trong link), `useMovies` | Trang chủ → chi tiết | P2 |
| Suất chiếu theo ngày | Tính ranh giới ngày theo +07:00 | Suất 00:30 thuộc đúng ngày | `DateTabs` | – | P2 |
| Lịch sử đặt vé | – | Chỉ trả đơn của chính người dùng | `BookingHistoryTable` với đơn đã hủy | – | P2 |
| Định dạng response và lỗi | `createHttpError`, `sendSuccess` | `errorHandler`: ZodError → 400, lỗi Prisma P2002 → 409, lỗi lạ → 500 không lộ chi tiết | – | – | P1 |

## 4. Bộ công cụ đề xuất

| Tầng | Công cụ | Ghi chú |
|---|---|---|
| Unit và integration (BE) | Vitest + supertest | Vitest chạy ESM trực tiếp, hợp với việc chuyển sang ESM (ARCH-10) |
| Database cho test | PostgreSQL riêng (`seatify_test`) chạy bằng Docker hoặc cài sẵn trên máy | Chạy `prisma migrate reset --force` trước mỗi lần chạy bộ test; **không bao giờ** trỏ vào DB dev hay production |
| Stripe | Mock `shared/lib/stripe.ts` bằng `vi.mock`; dùng Stripe CLI để thử webhook bằng tay | Không gọi Stripe thật trong test tự động |
| Email | Mock `shared/lib/mailer.ts` | Kiểm tra mailer được gọi đúng số lần, đúng thời điểm |
| Unit và component (FE) | Vitest + @testing-library/react + @testing-library/user-event | Test hook bằng `renderHook` |
| Mock API (FE) | MSW (Mock Service Worker) | Dùng chung handler cho test và cho chạy dev khi không có backend |
| End-to-end | Playwright | Chạy với backend thật, DB test và Stripe ở chế độ test |
| CI | GitHub Actions | `lint` → `typecheck` → `test` → `build` cho mỗi PR |

## 5. Mục tiêu và nguyên tắc

- **Bao phủ:** `modules/*/…service.ts` và `shared/*` ở backend từ 80% trở lên; tổng thể frontend từ 60% trở lên. **Không chạy theo 100%.** Test có giá trị là test bảo vệ quy tắc nghiệp vụ, không phải test cho đủ số dòng.
- **Viết test tái hiện lỗi trước khi sửa lỗi:** với mỗi mục Critical/High trong CHECKLIST, viết test chạy đỏ trước, sau đó sửa code cho đến khi test chạy xanh.
- **Mỗi module chuyển sang cấu trúc mới** (ARCH-06, ARCH-11) phải có test integration tối thiểu trước khi xóa code cũ.
- **Test độc lập nhau:** mỗi test tự tạo dữ liệu cần dùng và không phụ thuộc vào thứ tự chạy.
- **CI chặn merge** khi test đỏ.
