# 07. Kiến trúc backend: hiện trạng và đề xuất modular

> Bổ sung ngày 24/09/2026. `be/` = `seatify-backend/src/`.
> File này trình bày chi tiết **ARCH-06 → ARCH-10** và thay đổi cách sửa ARCH-03 cho đúng quy ước **không dùng class**.

## 1. Hiện trạng: tổ chức theo tầng kỹ thuật

```text
be/
├── server.ts            # env + app + cors + parser + route test + mount + cron + listen
├── seed.ts
├── controllers/         # 6 file, mỗi file thuộc một nghiệp vụ khác nhau
├── services/            # 8 file: nghiệp vụ lẫn hạ tầng (mail, cron)
├── routes/              # 7 file
└── middlewares/         # 1 file
```

Code đang được nhóm theo **loại file** (controller, service, route) thay vì theo **nghiệp vụ** (auth, movies, bookings…). Muốn sửa luồng đặt vé phải mở 3 thư mục khác nhau. `services/` chứa lẫn nghiệp vụ (`booking.service`) và hạ tầng (`mail.service`, `cron.service`). Ngoài ra dự án chưa có chỗ nào dành cho phần dùng chung như cấu hình, thư viện bọc ngoài, tiện ích hay kiểu dữ liệu.

**Đánh giá khách quan:** với 6 nghiệp vụ và khoảng 1.460 dòng code, cách tổ chức này **vẫn chạy được**, nhưng không có **ranh giới** giữa các nghiệp vụ. Khi thêm các nghiệp vụ mới (hoàn tiền, khuyến mãi, quản lý phòng, soát vé…), mỗi thư mục sẽ phình ra và các file sẽ phụ thuộc chéo nhau. Tách module lúc này **rẻ hơn nhiều** so với tách sau.

## 2. Vấn đề chi tiết

### ARCH-06: Không có module nghiệp vụ và thư mục `shared`

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** cây thư mục ở mục 1. `AuthRequest` bị khai báo hai lần (`be/middlewares/auth.middleware.ts:5-10`, `be/controllers/booking.controller.ts:9-11`) vì không có `shared/types`. Mỗi service tự tạo Prisma client riêng (ARCH-01) vì không có `shared/lib`.
- **Ảnh hưởng:** khó tìm code, khó giao việc theo nghiệp vụ, dễ phụ thuộc vòng khi dự án lớn lên.

### ARCH-07: `server.ts` gánh quá nhiều trách nhiệm, không tách `app` và `server`

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng (`be/server.ts`, 34 dòng nhưng làm 8 việc):**

  | Dòng | Việc | Vấn đề |
  |---|---|---|
  | 3, 8 | Nạp `.env` | Chạy **sau** khi các import đã được thực thi (ARCH-04) |
  | 11 | `PORT` | Giá trị mặc định viết cứng, chưa được validate |
  | 14 | `// app.use(cors());` | **Code chết** để lại dưới dạng comment |
  | 15-20 | CORS | Origin `http://localhost:5173` viết cứng; `FRONTEND_URL` ép kiểu `as string` dù có thể `undefined` |
  | 24-26 | Route `/` | Route chào mừng dùng để thử; nên thay bằng `/health` |
  | 28 | Gắn router | Ổn |
  | 30 | `startCronJobs()` | Cron chạy **ngay khi module được nạp**. Muốn import `app` để test thì cron cũng chạy theo |
  | 32-34 | `listen` | Không có handler 404, không có error handler, không đóng kết nối khi tắt server (graceful shutdown) |

- **Ảnh hưởng:** không thể `import app` vào supertest mà không mở cổng và không khởi động cron, nên **chặn luôn việc viết test** (OPS-01).

### ARCH-08: Hạ tầng dùng chung chưa được tách thành thư viện nội bộ

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:**

  | Hạ tầng | Hiện nằm ở | Vấn đề |
  |---|---|---|
  | Mã hóa mật khẩu | `be/services/auth.service.ts:23, 47` gọi `bcrypt` trực tiếp | Số vòng băm `10` viết cứng; module khác muốn đổi mật khẩu thì phải chép lại |
  | JWT | `jwt.sign` ở `be/services/auth.service.ts:53-57`, `jwt.verify` ở `be/middlewares/auth.middleware.ts:24` | Secret đọc ở 2 nơi, `expiresIn: '1d'` viết cứng, kiểu payload ép bằng `as` |
  | Gửi mail | `be/services/mail.service.ts`, 137 dòng | Một file gộp 4 việc: cấu hình transport, dựng template HTML (khoảng 60 dòng), tạo URL QR, định dạng ngày giờ |
  | Stripe | `be/services/payment.service.ts:8` | Client khởi tạo ngay trong service nghiệp vụ |
  | Prisma | 8 nơi (ARCH-01) | |
  | Cron | `be/services/cron.service.ts` | Tác vụ nền nằm trong thư mục service |

- **Ảnh hưởng:** không tái sử dụng được, khó mock khi test, và khi đổi nhà cung cấp (Gmail sang Resend chẳng hạn) phải sửa ngay trong code nghiệp vụ.

### ARCH-09: Định dạng response và lỗi trả về client không thống nhất

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** backend đang trả về 5 dạng khác nhau:

  | Dạng | Ví dụ |
  |---|---|
  | `{ message, data }` | Phần lớn API thành công |
  | `{ message }` | `be/controllers/booking.controller.ts:75`, `be/controllers/payment.controller.ts:53` |
  | `{ message, error }` | `be/controllers/showtime.controller.ts:29, 54, 93`, `be/controllers/movie.controller.ts:14-17` (lộ thông báo lỗi nội bộ) |
  | `{ message, user }` | `be/routes/auth.routes.ts:11-14` |
  | Chuỗi văn bản thuần | `be/server.ts:25` (`res.send(...)`) |

  Mỗi controller, route và middleware tự viết `res.status(...).json(...)`, tổng cộng 68 lời gọi rải rác. Không có **mã lỗi** (error code) để frontend phân biệt "ghế đã có người giữ" với "suất chiếu không tồn tại". Frontend hiện chỉ biết hiển thị `message`.
- **Ảnh hưởng:** frontend không thể xử lý lỗi theo từng loại; đổi định dạng thì phải sửa 68 chỗ; tài liệu API không có định dạng chuẩn để mô tả.

### ARCH-10: Backend biên dịch ra CommonJS

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** `seatify-backend/tsconfig.json` đặt `"module": "CommonJS"`; `package.json` không có `"type": "module"`. Lệnh dev dùng `ts-node-dev` (hỗ trợ ESM kém), còn lệnh seed lại dùng `tsx`. Mã nguồn **đã viết bằng cú pháp `import/export`**, và không có `require`/`module.exports` nào, nhưng TypeScript chuyển tất cả sang `require` khi build. Frontend và file cấu hình ESLint (`eslint.config.mjs`) thì đã là ESM.
- **Ảnh hưởng:** hai phía của dự án dùng hai hệ module khác nhau. Một số thư viện mới chỉ phát hành bản ESM. Chuyển sang ESM **không sửa được** ARCH-04, vì import trong ESM cũng được thực thi trước code thân module.

### Cập nhật cách sửa ARCH-03: không dùng class

Báo cáo lần trước đề xuất `class AppError extends Error`. Cách này **được thay thế** bằng factory function để tuân theo quy ước "không định nghĩa class trong dự án". Chi tiết ở mục 4.3.

**Phạm vi của quy ước:** không tự định nghĩa `class`, kể cả `class X extends Error`. Việc khởi tạo instance của thư viện hoặc đối tượng dựng sẵn (`new PrismaClient()`, `new Stripe()`, `new Error()`, `new Date()`) là ngoại lệ không tránh được. Hiện trạng: **cả backend và frontend đều không có định nghĩa class nào**, nên dự án đã tuân thủ quy ước này sẵn.

## 3. Cấu trúc đích đề xuất

```text
seatify-backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/                     # DB-01
│   └── seed.ts                         # chuyển từ src/seed.ts, có chặn production (OPS-02)
├── src/
│   ├── server.ts                       # khởi động: listen, bật job, tắt server an toàn
│   ├── app.ts                          # createApp(): middleware chung, routes, 404, errorHandler
│   ├── routes/
│   │   └── index.ts                    # gộp router của các module dưới /api
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts          # zod: register, login
│   │   ├── movies/
│   │   │   ├── movies.routes.ts · movies.controller.ts · movies.service.ts · movies.schema.ts
│   │   │   └── movie-status.ts         # computeMovieStatus (ERR-06)
│   │   ├── cinemas/
│   │   ├── showtimes/
│   │   ├── bookings/
│   │   │   ├── bookings.routes.ts · bookings.controller.ts · bookings.service.ts · bookings.schema.ts
│   │   │   ├── pricing.ts              # tính giá ở server (SEC-02)
│   │   │   └── release-expired-holds.job.ts
│   │   └── payments/
│   │       ├── payments.routes.ts · payments.controller.ts · payments.service.ts
│   │       ├── stripe-webhook.controller.ts
│   │       └── ticket-email.template.ts
│   └── shared/
│       ├── config/
│       │   ├── env.ts                  # đọc và validate process.env bằng zod, fail fast
│       │   └── app.config.ts           # hằng số nghiệp vụ: giá, thời gian giữ ghế, số vé tối đa…
│       ├── lib/
│       │   ├── prisma.ts               # một client duy nhất (ARCH-01)
│       │   ├── password.ts             # hashPassword, verifyPassword
│       │   ├── token.ts                # signAccessToken, verifyAccessToken
│       │   ├── mailer.ts               # sendMail({ to, subject, html }), không chứa template
│       │   ├── stripe.ts
│       │   └── logger.ts
│       ├── middlewares/
│       │   ├── authenticate.ts         # bắt buộc đăng nhập
│       │   ├── optional-auth.ts        # đăng nhập nếu có token (SEC-05)
│       │   ├── authorize.ts            # authorize('ADMIN')
│       │   ├── validate.ts             # validate({ body, params, query })
│       │   ├── rate-limit.ts
│       │   ├── not-found.ts
│       │   └── error-handler.ts
│       ├── utils/
│       │   ├── http-response.ts        # sendSuccess, sendCreated, sendNoContent
│       │   ├── http-error.ts           # createHttpError, isHttpError, notFound, conflict…
│       │   ├── escape-html.ts
│       │   └── date.ts                 # tính ranh giới ngày theo Asia/Ho_Chi_Minh
│       └── types/
│           └── express.d.ts            # mở rộng Request.user
└── tests/
    ├── unit/
    ├── integration/
    └── helpers/
```

**Quy tắc phụ thuộc** (không cần công cụ, chỉ cần tuân thủ khi review code):

1. `modules/*` được import từ `shared/*`. `shared/*` **không bao giờ** import ngược từ `modules/*`.
2. Module này không import file **bên trong** module khác. Nếu `payments` cần dữ liệu đặt vé thì gọi hàm được export từ `bookings.service.ts`, không truy cập thẳng bảng của module kia khi đã có hàm sẵn.
3. Controller chỉ làm ba việc: đọc input đã được validate, gọi service, trả response bằng helper. Không truy vấn Prisma trong controller (ARCH-05).
4. Service không biết đến `req`/`res`. Service nhận tham số thuần và ném lỗi bằng `createHttpError`.

**Những gì KHÔNG thêm vào (YAGNI):** tầng repository bọc quanh Prisma, DI container, base controller, generic CRUD factory, tách module thành package riêng. Prisma đã là tầng truy cập dữ liệu, và với 6 module, thêm tầng sẽ chỉ tăng số file mà không có lợi ích nào đo được.

### Ánh xạ file hiện tại sang cấu trúc đích

| Hiện tại | Đích |
|---|---|
| `server.ts` | `app.ts` + `server.ts` + `shared/config/env.ts` + `shared/middlewares/{not-found,error-handler}.ts` |
| `routes/index.ts` | `routes/index.ts` (giữ nguyên vai trò, import từ `modules/*`) |
| `routes/auth.routes.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts` | `modules/auth/*` + `shared/lib/{password,token}.ts` |
| `middlewares/auth.middleware.ts` | `shared/middlewares/{authenticate,optional-auth,authorize}.ts` |
| `*movie*` | `modules/movies/*` |
| `*cinema*` | `modules/cinemas/*` |
| `*showtime*` | `modules/showtimes/*` |
| `*booking*` | `modules/bookings/*` |
| `services/cron.service.ts` | `modules/bookings/release-expired-holds.job.ts` |
| `*payment*` | `modules/payments/*` + `shared/lib/stripe.ts` |
| `services/mail.service.ts` | `shared/lib/mailer.ts` + `modules/payments/ticket-email.template.ts` + `shared/utils/escape-html.ts` |
| `seed.ts` | `prisma/seed.ts` |

## 4. Mẫu code tham khảo

Các đoạn dưới đây là **mẫu định hướng** giúp học viên hình dung, không phải code để chép nguyên.

### 4.1 Tách `app.ts` và `server.ts`

```ts
// src/app.ts
import express from 'express';
import cors from 'cors';
import { env } from './shared/config/env.js';
import { apiRouter } from './routes/index.js';
import { notFoundHandler } from './shared/middlewares/not-found.js';
import { errorHandler } from './shared/middlewares/error-handler.js';

export const createApp = () => {
  const app = express();
  app.use(cors({ origin: env.CORS_ORIGINS }));
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
```

```ts
// src/server.ts
import { createApp } from './app.js';
import { env } from './shared/config/env.js';
import { prisma } from './shared/lib/prisma.js';
import { startReleaseExpiredHoldsJob } from './modules/bookings/release-expired-holds.job.js';

const server = createApp().listen(env.PORT, () => console.log(`API chạy tại cổng ${env.PORT}`));
const job = startReleaseExpiredHoldsJob();

const shutdown = async () => {
  job.stop();
  server.close();
  await prisma.$disconnect();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

Nhờ tách như vậy, test chỉ cần `createApp()`: không mở cổng mạng, không chạy cron.

### 4.2 Chuẩn hóa response bằng function

```ts
// src/shared/utils/http-response.ts
import type { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, message = 'Thành công', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const sendCreated = <T>(res: Response, data: T, message = 'Tạo thành công') =>
  sendSuccess(res, data, message, 201);
```

**Định dạng thống nhất:**

```jsonc
// Thành công
{ "success": true, "message": "Giữ ghế thành công", "data": { "id": "…" } }
// Lỗi
{ "success": false, "message": "Ghế đã có người giữ", "error": { "code": "SEAT_TAKEN", "details": null } }
```

### 4.3 Lỗi HTTP bằng factory function (thay cho class `AppError`)

```ts
// src/shared/utils/http-error.ts
export type HttpError = Error & { status: number; code: string; details?: unknown };

export const createHttpError = (status: number, code: string, message: string, details?: unknown): HttpError =>
  Object.assign(new Error(message), { status, code, details });

export const isHttpError = (err: unknown): err is HttpError =>
  err instanceof Error && typeof (err as HttpError).status === 'number';

export const badRequest = (message: string, details?: unknown) => createHttpError(400, 'BAD_REQUEST', message, details);
export const unauthorized = (message = 'Bạn chưa đăng nhập') => createHttpError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Bạn không có quyền') => createHttpError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Không tìm thấy dữ liệu') => createHttpError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string) => createHttpError(409, code, message);
```

```ts
// src/shared/middlewares/error-handler.ts
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { isHttpError } from '../utils/http-error.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isHttpError(err)) {
    return res.status(err.status).json({ success: false, message: err.message, error: { code: err.code, details: err.details ?? null } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: { code: 'VALIDATION_ERROR', details: err.flatten() } });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau', error: { code: 'INTERNAL_ERROR', details: null } });
};
```

Nên có thêm một nhánh xử lý lỗi Prisma: `P2002` (trùng khóa) → 409, `P2025` (không tìm thấy) → 404, và body JSON sai cú pháp (`err.type === 'entity.parse.failed'`) → 400.

**Danh sách mã lỗi đề xuất:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `SEAT_TAKEN`, `SHOWTIME_OVERLAP`, `BOOKING_NOT_PENDING`, `PAYMENT_NOT_COMPLETED`, `RATE_LIMITED`, `INTERNAL_ERROR`. Nên liệt kê trong `docs/developer/api.md` (DOC-01).

### 4.4 Controller sau khi chuẩn hóa

Express 5 tự chuyển promise bị reject tới `errorHandler`, nên controller không cần `try/catch`:

```ts
// src/modules/bookings/bookings.controller.ts
import type { Request, Response } from 'express';
import * as bookingsService from './bookings.service.js';
import { sendCreated } from '../../shared/utils/http-response.js';

export const holdSeats = async (req: Request, res: Response) => {
  const booking = await bookingsService.holdSeats({ ...req.body, userId: req.user?.userId });
  return sendCreated(res, booking, 'Giữ ghế thành công');
};
```

```ts
// src/modules/bookings/bookings.routes.ts
bookingsRouter.post('/hold', holdLimiter, optionalAuth, validate({ body: holdSeatsSchema }), holdSeats);
```

So sánh: controller `holdBooking` hiện tại dài 22 dòng (`be/controllers/booking.controller.ts:13-34`); sau khi chuẩn hóa chỉ còn 4 dòng, và validate, xác thực, xử lý lỗi, định dạng response đều nằm ở đúng một chỗ.

### 4.5 Thư viện nội bộ

```ts
// src/shared/lib/password.ts
import bcrypt from 'bcrypt';
import { appConfig } from '../config/app.config.js';

export const hashPassword = (plain: string) => bcrypt.hash(plain, appConfig.auth.bcryptRounds);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
```

```ts
// src/shared/lib/token.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AccessTokenPayload = { userId: string; role: 'USER' | 'ADMIN' };

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
```

Mailer chỉ lo việc gửi; template là một **hàm thuần** nhận dữ liệu và trả về `{ subject, html }`, có escape HTML (SEC-06). Nhờ vậy template test được mà không cần gửi email thật.

## 5. Chuyển sang ESM

| Bước | Thay đổi |
|---|---|
| 1 | `package.json`: thêm `"type": "module"` |
| 2 | `tsconfig.json`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"target": "ES2022"`; có thể bật `"verbatimModuleSyntax": true` để bắt buộc viết `import type` |
| 3 | Mọi import tương đối phải có đuôi `.js` (`'./app.js'`), kể cả khi file gốc là `.ts`. Đây là quy tắc của NodeNext |
| 4 | Thay `ts-node-dev` bằng `tsx watch src/server.ts`; seed dùng `tsx prisma/seed.ts` và thêm `tsx` vào devDependencies |
| 5 | Nạp env bằng `import 'dotenv/config'` ở dòng đầu `server.ts`, hoặc dùng `node --env-file=.env` (Node 20.6 trở lên) |
| 6 | Kiểm tra lại `@prisma/client` và `bcrypt` (hai gói CommonJS) khi import từ ESM. Theo tài liệu thì chạy được, nhưng cần build và chạy thử để xác nhận |
| 7 | Chạy `build` → `start` → `seed` → test để xác nhận |

**Nên làm ESM trước khi di chuyển file.** Như vậy mọi file mới được viết đúng quy tắc import ngay từ đầu, không phải sửa hai lần.

## 6. Thứ tự tái cấu trúc (làm dần, không làm một lần)

1. ESM, `env.ts`, tách `app.ts`/`server.ts`, `shared/lib/prisma.ts`. **Chưa di chuyển nghiệp vụ nào.**
2. Tạo `shared/utils/http-*`, `shared/middlewares/{error-handler,not-found,validate}`.
3. Chuyển **từng module một**, theo thứ tự từ ít phụ thuộc đến nhiều phụ thuộc: `cinemas` → `movies` → `auth` → `showtimes` → `bookings` → `payments`. Mỗi module chuyển xong phải có test integration tối thiểu, `build` và `test` phải xanh, rồi mới commit.
4. Xóa các thư mục cũ `controllers/`, `services/`, `routes/*.routes.ts`, `middlewares/` khi đã trống.

Sau mỗi bước, hệ thống phải **vẫn chạy được**. Nếu một bước làm hỏng luồng đặt vé, lùi lại commit đó thay vì sửa chồng lên.
