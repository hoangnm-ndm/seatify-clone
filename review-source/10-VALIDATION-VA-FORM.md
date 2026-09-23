# 10. Validation và form

> Bổ sung ngày 24/09/2026. `be/` = `seatify-backend/src/`, `fe/` = `seatify-frontend/src/`.
> File này trình bày chi tiết **VAL-01**, **VAL-02**, và bổ sung cho **SEC-09** (backend thiếu validate).

## 1. Kết luận nhanh

- **Thư viện validation đang dùng: không có**, ở cả hai phía. `package.json` của backend và frontend đều không có `zod`, `yup`, `joi`, `express-validator`, `react-hook-form` hay `formik`.
- **Frontend** kiểm tra bằng các câu `if` và regex viết tay trong hàm submit. Lỗi hiển thị bằng toast, **không** hiện ngay dưới ô nhập. Mỗi form một kiểu.
- **Backend** chỉ kiểm tra "có hay không" (`!email || !password`), không kiểm tra kiểu, định dạng hay giới hạn (SEC-09).
- **Quy tắc lệch nhau giữa hai phía:** cùng một trường nhưng frontend và backend (và giữa các form frontend với nhau) dùng quy tắc khác nhau.
- **Mức đánh giá:** chưa đạt. Validation hiện có chỉ phục vụ trải nghiệm ở trường hợp suôn sẻ, không bảo vệ được dữ liệu.

## 2. Kiểm kê form ở frontend

| Form | Vị trí | Đang kiểm tra | Còn thiếu |
|---|---|---|---|
| Đăng nhập | `fe/components/AuthModal.tsx:44-51` | Bắt buộc; regex email | Chưa `trim()`; lỗi chỉ hiện qua toast |
| Đăng ký | `fe/components/AuthModal.tsx:66-86` | Bắt buộc; regex email; mật khẩu `^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$`; mật khẩu nhập lại khớp | Regex **cấm ký tự đặc biệt**, nên từ chối cả `Abc123!@`. Không giới hạn độ dài tối đa (bcrypt chỉ dùng 72 byte đầu). SĐT không kiểm tra định dạng Việt Nam. Ngày sinh không chặn ngày trong tương lai. Họ tên không giới hạn độ dài |
| Thông tin khách vãng lai | `fe/components/GuestCheckoutModal.tsx:36-39` | Chỉ kiểm tra bắt buộc; `type="email"` nhờ trình duyệt kiểm tra | Email là **nơi nhận vé** nhưng chỉ dựa vào trình duyệt. SĐT không kiểm tra định dạng. Tên có thể chứa HTML (SEC-06) |
| Admin: thêm/sửa phim | `fe/pages/Admin/AdminMoviePage.tsx:112-116` | Bắt buộc `title`, `duration`, `posterUrl` | `duration` phải là số nguyên dương; URL poster/trailer phải hợp lệ (trailer phải là link YouTube vì `TrailerModal` chỉ hiểu YouTube); `endDate ≥ releaseDate`; `ageRating` thuộc tập hợp lệ; form gửi thêm trường `status` mà backend bỏ qua |
| Admin: thêm suất chiếu | `fe/pages/Admin/AdminShowtimePage.tsx:168-170` | Bắt buộc 4 trường; `min` của ô ngày là hôm nay | Giờ bắt đầu phải ở tương lai (hiện chỉ chặn theo ngày); phải nằm trong thời gian chiếu của phim; kiểm tra trùng lịch (chỉ backend làm được, ERR-02) |
| Hồ sơ, đổi mật khẩu | `fe/pages/ProfilePage.tsx:77-89` | Mật khẩu nhập lại khớp | Chỉ là giả lập (ERR-04); không kiểm tra độ mạnh của mật khẩu mới |
| Tạo tài khoản sau thanh toán | `fe/pages/PaymentSucces.tsx:48-50` | Tối thiểu 6 ký tự | Lệch với quy tắc 8 ký tự khi đăng ký; là giả lập (ERR-04) |
| Tìm kiếm | `fe/components/Header.tsx:24-29` | `trim()` và không rỗng | Không giới hạn độ dài (chấp nhận được) |
| Chọn vé và ghế | `fe/pages/BookingPage.tsx:115-166, 600` | Tối đa 8 vé; số ghế bằng số vé (nút bị vô hiệu hóa) | Backend không kiểm tra lại (SEC-02, SEC-03); ghế đôi có thể mua lẻ |

**Vấn đề chung về trải nghiệm:** mọi lỗi hiện bằng một toast chung chung, nên người dùng không biết ô nào sai. Không có `aria-invalid` hay `aria-describedby` cho trình đọc màn hình. Form không bị khóa trong lúc đang gửi request (trừ `GuestCheckoutModal` và form admin).

## 3. Kiểm kê endpoint ở backend

| Endpoint | Đang kiểm tra | Còn thiếu |
|---|---|---|
| `POST /auth/register` | Có đủ 5 trường | Định dạng email, độ dài và độ mạnh mật khẩu, SĐT, ngày sinh hợp lệ (ngày sai gây lỗi Prisma) |
| `POST /auth/login` | Có email và mật khẩu | Định dạng, độ dài tối đa |
| `POST /movies`, `PUT /movies/:id` | **Không kiểm tra gì**, truyền nguyên `req.body` | Toàn bộ các trường; `:id` phải là UUID |
| `GET /showtimes` | Có `movieId` và `date` | `date` đúng dạng `YYYY-MM-DD`; UUID; `req.query` bị ép `as string` dù có thể là mảng |
| `POST /showtimes` | Có đủ 4 trường | Ngày hợp lệ, `endTime > startTime`, tồn tại, trùng lịch |
| `POST /bookings/hold` | Có trường và `seatNames.length > 0` | Kiểu mảng, định dạng `A1`, số ghế ≤ 8, không trùng lặp, email/SĐT/tên khách, **không nhận `totalPrice` và `userId`** |
| `GET /bookings/:id`, `POST /bookings/:id/cancel`, `POST /payments/*` | Không có | `id` phải là UUID |

## 4. Vấn đề chi tiết

### VAL-01: Không dùng thư viện validation; validation ở frontend thủ công và thiếu

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Ảnh hưởng:** quy tắc nằm rải rác trong các hàm submit, không tái sử dụng được, không test được riêng lẻ, không sinh được kiểu dữ liệu. Người dùng không biết ô nào sai. Dữ liệu sai vẫn lọt xuống backend (vốn cũng không kiểm tra).

### VAL-02: Không có "hợp đồng" validation chung giữa frontend và backend

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** mật khẩu có 3 quy tắc (8 ký tự chữ + số / 6 ký tự / không quy tắc); frontend bắt buộc `posterUrl`, backend thì không; frontend giới hạn 8 vé, backend thì không; frontend tự tính giá, backend tin theo.
- **Ảnh hưởng:** mỗi khi đổi quy tắc phải nhớ sửa ở nhiều nơi. Người gọi API trực tiếp bỏ qua được mọi quy tắc của frontend.

## 5. Khuyến nghị: dùng zod cho cả hai phía

### 5.1 Vì sao chọn zod

- Một schema cho ra **hai thứ**: hàm kiểm tra lúc chạy và kiểu TypeScript (`z.infer`), nên không phải khai báo kiểu lần thứ hai (giải quyết một phần ARCH-16).
- Chạy được ở cả Node và trình duyệt, nên cùng một cách viết cho cả hai phía.
- Kết hợp được với `react-hook-form` qua `@hookform/resolvers/zod` để hiện lỗi ngay dưới từng ô.
- Dùng luôn cho `env.ts` ở cả hai phía (ARCH-04).

### 5.2 Tổ chức schema

| Giai đoạn | Cách làm | Khi nào chuyển |
|---|---|---|
| **Trước mắt** | Mỗi phía có schema riêng: `be/modules/*/*.schema.ts` và `fe/features/*/schemas.ts`, **cùng quy tắc**, ghi lại trong `docs/developer/api.md`. Cả hai phía có test cho schema | Ngay bây giờ |
| **Sau này** | Gộp thành monorepo (npm workspaces), tạo gói `packages/contracts` chứa schema và kiểu dùng chung, backend và frontend cùng import | Khi phát hiện lệch quy tắc lần thứ hai, hoặc khi gộp repo (OPS-07) |

Không nên làm monorepo **chỉ vì** validation. Chỉ gộp khi có đủ lý do (xem OPS-07).

### 5.3 Mẫu schema

```ts
// Quy tắc dùng chung (cú pháp Zod 4; với Zod 3, dùng z.string().email())
import { z } from 'zod';

const phoneVN = z.string().trim().regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, 'Số điện thoại không hợp lệ');
const password = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu cần có chữ cái')
  .regex(/\d/, 'Mật khẩu cần có chữ số');

export const registerSchema = z.object({
  email: z.email('Email không hợp lệ').trim().toLowerCase(),
  password,
  fullName: z.string().trim().min(2).max(100),
  phone: phoneVN,
  birthDay: z.coerce.date().max(new Date(), 'Ngày sinh không hợp lệ'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const holdSeatsSchema = z.object({
  showtimeId: z.uuid(),
  seats: z.array(z.string().regex(/^[A-Z]\d{1,2}$/)).min(1).max(8)
    .refine((s) => new Set(s).size === s.length, 'Ghế bị trùng'),
  tickets: z.object({ adult: z.number().int().min(0), student: z.number().int().min(0) }),
  guestInfo: z.object({ fullName: z.string().trim().min(2).max(100), email: z.email(), phone: phoneVN }),
}).refine((d) => d.tickets.adult + d.tickets.student === d.seats.length, 'Số vé phải bằng số ghế');
```

Frontend dùng `registerSchema` với `react-hook-form`. Backend dùng qua middleware:

```ts
// be/shared/middlewares/validate.ts
import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export const validate = (schemas: { body?: ZodType; params?: ZodType; query?: ZodType }): RequestHandler =>
  (req, res, next) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) Object.assign(req.params, schemas.params.parse(req.params));
    if (schemas.query) res.locals.query = schemas.query.parse(req.query);
    next();
  };
```

> Lưu ý: ở Express 5, `req.query` là getter chỉ đọc, nên query đã validate được lưu vào `res.locals.query`. Đây là **mẫu định hướng**; khi viết thật cần kiểm tra lại với phiên bản Express và Zod đang dùng.

`ZodError` ném ra từ đây được `errorHandler` chuyển thành `400 VALIDATION_ERROR` kèm `details` theo từng trường (xem `07`, mục 4.3). Frontend dùng `details.fieldErrors` để gọi `setError` cho đúng ô nhập.

### 5.4 Nguyên tắc

1. **Backend luôn validate**, bất kể frontend đã kiểm tra hay chưa. Validate ở frontend là cho trải nghiệm; validate ở backend là cho an toàn.
2. **Không nhận từ client những giá trị server tự tính được**: giá tiền, `userId`, `endTime` của suất chiếu, trạng thái đơn.
3. **Lỗi hiển thị tại ô nhập**, toast chỉ dùng cho lỗi chung (mất mạng, lỗi hệ thống).
4. **Chuẩn hóa dữ liệu trong schema** (`trim`, `toLowerCase` cho email), không làm rải rác trong handler.
5. **Mỗi schema có unit test** với ít nhất một trường hợp hợp lệ và các trường hợp biên.
