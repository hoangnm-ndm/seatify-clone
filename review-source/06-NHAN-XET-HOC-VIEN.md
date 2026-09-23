# 06. Nhận xét dành cho học viên

> Viết ngày 23/09/2026, **bổ sung ngày 24/09/2026**: thêm nhận xét về kiến trúc, Clean Code, validation, kiểm thử, tài liệu, và đính chính một điểm về TypeScript.

Gửi em,

Thầy đã đọc cả hai repo backend và frontend, cùng 40 commit của em trong khoảng hai tháng. Nhận xét dưới đây thẳng thắn, vì em đã làm được một dự án đủ nghiêm túc để xứng đáng được đánh giá theo chuẩn nghiêm túc.

## 1. Đánh giá tổng quát

| Tiêu chí | Mức | Ghi chú ngắn |
|---|---|---|
| Phạm vi chức năng | Khá tốt | Đủ luồng chính: xem phim → chọn suất → giữ ghế → thanh toán → nhận vé qua email |
| Xử lý tranh chấp dữ liệu | **Tốt** | Transaction + `FOR UPDATE`, kiểm tra trạng thái sau khi khóa. Đây là điểm sáng nhất của dự án |
| Mẫu kiến trúc | Khá | Phân tầng ở backend và SPA ở frontend là lựa chọn đúng cho quy mô này |
| Tổ chức code để mở rộng | Trung bình (BE) · Yếu (FE) | Backend nhóm theo loại file, không có `shared`. Frontend không có feature hay hook; trang vừa là giao diện vừa là logic |
| Clean Code | Trung bình (BE) · Yếu (FE) | Định dạng và đặt tên tốt; nhưng trùng lặp nhiều, magic number, component quá lớn, comment chất lượng thấp |
| Bảo mật, phân quyền | Yếu | Tin client ở hai điểm trọng yếu nhất |
| Tích hợp thanh toán | Yếu | Chưa nắm được cách xác nhận một khoản thanh toán |
| Validation | Yếu | Không dùng thư viện; backend gần như không kiểm tra; quy tắc lệch nhau giữa các nơi |
| Database | Khá | Mô hình đúng; thiếu migration, index và lịch sử đơn |
| Kiểm thử | Chưa có | 0 test ở cả hai phía |
| Tài liệu | Chưa có | Không có tài liệu cho người phát triển, người vận hành hay người dùng cuối |
| Giao diện, trải nghiệm | Khá | Có loading, toast, đồng hồ đồng bộ với server, lazy load; nhưng nhiều thứ trông như link mà không phải link, menu không dùng được bằng bàn phím |

## 2. Những điều em đã làm tốt

1. **Em giải quyết đúng bài toán khó nhất.** Khi hai người cùng chọn một ghế, em không làm theo kiểu "đọc xem ghế trống không rồi ghi" như phần lớn học viên. Em mở transaction, dùng `SELECT … FOR UPDATE` để khóa dòng, rồi **kiểm tra lại trạng thái sau khi đã có khóa** (`be/services/booking.service.ts:64-81`). Em còn thêm `@@unique([showtimeId, seatId])` làm lớp bảo vệ cuối ở database. Đây là tư duy của người đã hiểu race condition là gì chứ không chỉ biết cái tên.
2. **Mô hình dữ liệu đúng.** Tách `Seat` (ghế vật lý) và `TicketSeat` (vé của từng suất) là cách các hệ thống đặt chỗ thật vẫn làm.
3. **Transaction được dùng nhất quán** cho mọi thao tác ghi nhiều bước: giữ ghế, hủy đơn, chốt đơn, cron, tạo suất chiếu cùng 180 vé.
4. **Không lưu thứ có thể suy ra.** Trạng thái phim được tính từ ngày chiếu thay vì lưu thành cột (commit `da54a90`). Đồng hồ đếm ngược ở checkout lấy mốc từ server thay vì tự đếm 5 phút ở trình duyệt.
5. **Kỷ luật công cụ.** Backend bật TypeScript strict; ESLint cấm `any` ở cả hai phía; Prettier chạy khi lưu file; code không có chữ `any` nào. Em cũng **không dùng class** ở bất kỳ đâu, đúng với phong cách viết theo hàm mà dự án hướng tới.
   *Đính chính so với bản trước:* frontend **chưa bật `strict`**, và `fetchClient` trả về `any` ngầm định. Vì vậy phần an toàn kiểu ở frontend mới chỉ là hình thức (CODE-04, ARCH-16).
6. **Phân quyền admin làm ở backend**, không chỉ ẩn nút ở giao diện. Mật khẩu hash bằng bcrypt và được loại khỏi response.
7. **Lịch sử git sạch.** Commit nhỏ, đặt tên theo quy ước (`feat:`, `refactor:`, `chore:`), đi dần theo từng tính năng. Người đọc có thể theo dõi quá trình em làm dự án.
8. **Backend đã có ý thức phân tầng.** Route, controller, service tách riêng, tên file nhất quán. Đây là nền tốt để chuyển sang cấu trúc module mà không phải viết lại.

## 3. Tư duy đúng cần phát huy

- **Nghĩ về tình huống đồng thời.** Em đã tự hỏi "nếu hai người bấm cùng lúc thì sao?". Hãy mang câu hỏi đó sang mọi chỗ có tiền hoặc có thời gian: nếu khách trả tiền chậm, nếu khách đóng tab, nếu một API bị gọi hai lần thì sao?
- **Đặt ràng buộc ở tầng thấp nhất có thể.** Em đã dùng `@@unique` ở DB. Hãy áp dụng tiếp: số tiền do backend tính, trạng thái đơn chuyển bằng update có điều kiện.
- **Suy ra thay vì lưu trữ.** Tiếp tục giữ tư duy này.

## 4. Những lỗi mang tính hệ thống

Thầy không liệt kê lại 59 vấn đề ở đây. Đa số chúng bắt nguồn từ **tám thói quen** dưới đây. Sửa được thói quen thì lần sau em sẽ không mắc lại những lỗi đó.

### 4.1 Chưa xác định ranh giới tin cậy

Liên quan: SEC-01, SEC-02, SEC-05, SEC-09, VAL-02.

Mọi thứ đến từ trình duyệt chỉ là **lời khai**: giá tiền, `userId`, việc "tôi đã thanh toán xong", dữ liệu form. Người dùng có thể mở DevTools hoặc Postman và gửi bất cứ thứ gì. Backend phải tự kiểm chứng: tự tính tiền, tự lấy danh tính từ token, tự hỏi Stripe, tự validate mọi input.

Một cách tự kiểm tra: với mỗi endpoint, em liệt kê từng trường trong request và hỏi "nếu trường này bị sửa thành giá trị khác thì chuyện gì xảy ra?". Validate ở frontend là để **người dùng dễ chịu**; validate ở backend là để **hệ thống an toàn**. Hai việc này không thay thế được cho nhau.

### 4.2 Chỉ nghĩ đến trường hợp suôn sẻ

Liên quan: ERR-01, ERR-05, ARCH-13.

Luồng thanh toán của em chạy đúng khi khách làm đúng thứ tự và đúng thời gian. Nhưng ngoài thực tế, khách trả tiền sau 7 phút, khách đóng tab ngay sau khi trả, React gọi `useEffect` hai lần, người dùng bấm đổi ngày thật nhanh. Với dữ liệu liên quan đến tiền, hãy **vẽ máy trạng thái trước khi code**: đơn hàng có những trạng thái nào, được chuyển từ đâu sang đâu, và **chuyển nào bị cấm**. `FAILED → SUCCESS` là một chuyển bị cấm mà code hiện tại vẫn cho phép.

### 4.3 Quy tắc nghiệp vụ nằm ở giao diện

Liên quan: ARCH-02, SEC-02.

Giá vé, hàng ghế VIP, sơ đồ phòng đang nằm trong `BookingPage.tsx`. Khi quy tắc nằm ở frontend, nó vừa **không an toàn** (người dùng sửa được) vừa **bị lặp lại** (em phải chép sang `seed.ts` và `showtime.service.ts`). Nguyên tắc: **backend quyết định, frontend hiển thị.**

### 4.4 Giao diện nói những điều hệ thống chưa làm

Liên quan: ERR-04, CODE-01, CODE-05, ERR-08, DOC-03.

"Tạo tài khoản thành công! Mật khẩu đã được lưu", dashboard với doanh thu "125.5M VNĐ", nhãn "Thanh toán qua VNPAY", 8 dòng ở Footer trông như link mà bấm vào không có gì, danh sách rạp ở Footer không khớp với dữ liệu thật, link "Chính sách bảo mật" dẫn tới trang không tồn tại. Thầy hiểu em muốn sản phẩm trông hoàn chỉnh. Nhưng trong sản phẩm thật, **một giao diện nói sai sự thật gây hại nhiều hơn một tính năng còn thiếu**, vì người dùng sẽ hành động dựa trên điều họ thấy. Quy tắc đơn giản: **thứ gì trông như link thì phải là link; tính năng chưa làm thì ghi "Sắp ra mắt".**

### 4.5 Comment thay cho kiểm chứng

Liên quan: CODE-03, OPS-01.

Có những comment khẳng định điều mà code chưa đảm bảo: "Chống gọi API 2 lần", "gọi bưu tá khi transaction thành công", "CHUẨN SENIOR". Nhiều comment mang dấu vết hội thoại, như "LOGO CỦA BẠN (GIỮ NGUYÊN 100%)", "<-- THÊM CÁI NÀY ĐỂ TRUYỀN XUỐNG BE", "Thêm chữ 'type' … để làm vui lòng TypeScript", "ĐÃ VÁ LỖI". Những câu này **không phải do em viết cho người đọc code**; chúng là lời người khác (AI hoặc tài liệu hướng dẫn) nói với em, và em đã dán nguyên vào code.

**Dùng AI không sai.** Chỗ cần sửa là: sau khi dán, em phải đọc lại từng dòng và tự hỏi "làm sao mình **biết** đoạn này đúng?". Câu trả lời đáng tin nhất là **một bài test**. Dự án hiện có 0 test, nên mọi khẳng định trong comment đều chưa được kiểm chứng.

### 4.6 Tổ chức code theo loại file, không theo nghiệp vụ

Liên quan: ARCH-06, ARCH-08, ARCH-11.

Backend có `controllers/`, `services/`, `routes/`; frontend có `pages/`, `components/`, `services/`. Cách chia này dễ hiểu khi dự án còn nhỏ, nhưng khi sửa luồng đặt vé, em phải mở ba bốn thư mục khác nhau. Hạ tầng dùng chung (mã hóa mật khẩu, JWT, gửi mail, Stripe) nằm lẫn trong code nghiệp vụ nên không tái sử dụng được. Hãy tập nhìn dự án theo **nghiệp vụ** (auth, movies, bookings, payments), còn **phần dùng chung** thì tách riêng và không phụ thuộc vào nghiệp vụ nào.

### 4.7 Component làm mọi việc

Liên quan: ARCH-13, ARCH-15, ARCH-16, CODE-02, CODE-06.

`BookingPage.tsx` dài 666 dòng: gọi 3 API, tính giá, giữ quy tắc chọn vé, vẽ sơ đồ ghế, quản lý 2 modal. 11 trang lặp lại cùng mẫu `useState` + `useEffect` + `try/catch` để tải dữ liệu. `interface Movie` được khai báo ở 7 nơi, và mỗi nơi một kiểu. Nguyên tắc: **component chỉ hiển thị; logic nằm trong hook; dữ liệu server do thư viện chuyên dụng quản lý; mỗi kiểu dữ liệu chỉ khai báo một lần.**

### 4.8 Không để lại gì cho người đến sau

Liên quan: DOC-01, DOC-02, DOC-03, OPS-03.

Không README, không file env mẫu, không tài liệu API, không hướng dẫn deploy, không chính sách cho người dùng. Hiện tại chỉ **em** chạy được dự án này. Một dự án chỉ tác giả chạy được thì chưa phải là sản phẩm. Hãy tập thói quen: **mỗi thay đổi về API hay cấu hình đi kèm cập nhật tài liệu trong cùng một commit.**

## 5. Kiến thức còn thiếu và thứ tự nên học

Thứ tự dưới đây khớp với các giai đoạn trong `CHECKLIST.md`: học cái gì thì áp dụng ngay vào Seatify.

| # | Chủ đề | Áp dụng vào | Gợi ý tài liệu |
|---|---|---|---|
| 1 | **Ranh giới tin cậy và OWASP API Security Top 10** (BOLA/IDOR, Broken Authentication, Unrestricted Resource Consumption) | SEC-01 → SEC-05 · giai đoạn 1 | OWASP API Security Top 10 (2023) |
| 2 | **Kiểm thử backend cơ bản:** unit, integration với supertest, DB riêng cho test, test chạy đồng thời | OPS-01 · giai đoạn 0–1 | Tài liệu Vitest, supertest |
| 3 | **Tích hợp thanh toán đúng cách:** webhook, xác minh chữ ký, idempotency, đối soát | SEC-01, ERR-01, DB-03 · giai đoạn 1–2 | Stripe Docs: "Fulfill orders", "Webhooks" |
| 4 | **Máy trạng thái và transaction:** READ COMMITTED, khóa dòng, update có điều kiện | ERR-01, ERR-05 · giai đoạn 1 | Tài liệu PostgreSQL: "Transaction Isolation", "Explicit Locking" |
| 5 | **Node.js ESM và cách tổ chức modular monolith:** module theo nghiệp vụ, `shared`, quy tắc phụ thuộc, tách `app` và `server` | ARCH-06 → ARCH-10 · giai đoạn 0, 2 | Tài liệu Node.js "ECMAScript modules"; TypeScript "Modules: NodeNext" |
| 6 | **Validate bằng zod và xử lý lỗi tập trung** (factory function, không class) | SEC-09, VAL-01, ARCH-03, ARCH-09 · giai đoạn 2 | Tài liệu Zod; Express 5 "Error handling" |
| 7 | **React theo hướng feature:** custom hook, TanStack Query (query key, mutation, invalidation), zustand (chỉ cho state phía client), React Router data API (`createBrowserRouter`, `errorElement`, `lazy`) | ARCH-11 → ARCH-16 · giai đoạn 3 | TanStack Query Docs "Overview", "Query Keys"; zustand README; React Router "Data routers" |
| 8 | **Form với react-hook-form + zod** và cách gắn lỗi từ server vào đúng ô | VAL-01, VAL-02 · giai đoạn 3 | React Hook Form "Schema Validation" |
| 9 | **Clean Code và quy ước:** KISS, DRY (áp dụng cho tri thức, không phải mọi đoạn code giống nhau), YAGNI, SRP, đặt tên, nguyên tắc comment | CODE-03, CODE-06, CODE-07 · xuyên suốt | `review-source/09`; sách *Clean Code* (chọn lọc), *A Philosophy of Software Design* |
| 10 | **Khả năng truy cập (a11y) cơ bản:** HTML ngữ nghĩa, điều hướng bằng bàn phím, không lồng phần tử tương tác | CODE-05 · giai đoạn 3 | MDN "Accessibility"; WAI-ARIA Authoring Practices (Menu Button) |
| 11 | **Kiểm thử frontend và E2E:** Testing Library, MSW, Playwright | OPS-05, OPS-06 · giai đoạn 5 | Testing Library "Guiding Principles"; Playwright Docs |
| 12 | **Prisma migrate, index, dữ liệu lịch sử (snapshot)** | DB-01, DB-02, DB-04 · giai đoạn 0, 4 | Prisma Docs "Migrate", "Indexes" |
| 13 | **Thời gian và múi giờ:** lưu UTC, hiển thị theo múi giờ, locale khác với timezone | ERR-03 · giai đoạn 2 | MDN `Intl.DateTimeFormat` |
| 14 | **Viết tài liệu kỹ thuật:** README, tài liệu API, runbook, ADR | DOC-01 → DOC-03 · giai đoạn 0, 6 | "Documentation System" (Diátaxis) |

## 6. Bài tập gợi ý

1. **Chứng minh điểm mạnh của mình.** Viết test bắn 20 request giữ cùng một ghế cùng lúc, và khẳng định chỉ đúng 1 request thành công. Em làm phần này đúng rồi, giờ hãy có **bằng chứng** cho nó.
2. **Tái hiện lỗi trước khi sửa.** Viết test gọi `POST /payments/confirm` mà không qua Stripe. Hiện tại test sẽ báo thành công, chính là lỗi SEC-01. Sau đó sửa code cho đến khi hệ thống từ chối request đó.
3. **Vẽ máy trạng thái trên giấy** cho `Booking` và `TicketSeat`, liệt kê mọi chuyển trạng thái hợp lệ, rồi đối chiếu với code. Chuyển nào có trong code mà không có trên giấy là lỗi.
4. **Kiểm tra ranh giới tin cậy.** Với từng endpoint `POST`/`PUT`, lập bảng: tên trường, ai quyết định giá trị (client hay server), backend đã kiểm tra chưa.
5. **Chuyển một module làm mẫu.** Chuyển module `cinemas` (nhỏ nhất) sang cấu trúc `modules/cinemas/` với `sendSuccess` và `errorHandler`, có một test integration. Sau đó tự viết lại quy trình vào `conventions.md` để áp dụng cho các module còn lại.
6. **Thử dùng web chỉ bằng bàn phím.** Rút chuột ra, dùng `Tab`/`Enter`/`Esc` để đặt một vé. Ghi lại mọi chỗ bị kẹt; đó chính là danh sách việc của mục 3.11 trong CHECKLIST.
7. **Viết README cho người lạ.** Nhờ một bạn chưa từng thấy dự án clone về và làm theo README. Mỗi lần bạn đó phải hỏi em một câu là một chỗ README còn thiếu.

## 7. Lời kết

Seatify cho thấy em **đã vượt qua giai đoạn "làm cho chạy được"**. Em biết chia tầng, biết dùng transaction, biết nghĩ đến chuyện hai người cùng bấm một lúc. Bước tiếp theo có hai phần:

- **"Làm cho không thể chạy sai":** không tin client, không tin vào trường hợp suôn sẻ, không tin vào comment khi chưa có test.
- **"Làm cho người khác đọc và mở rộng được":** tổ chức code theo nghiệp vụ, tách logic khỏi giao diện, mỗi thứ chỉ khai báo một lần, và để lại tài liệu cho người đến sau.

Khối lượng việc trong `CHECKLIST.md` trông nhiều, nhưng nó được chia nhỏ để mỗi phiên em chỉ làm một hai mục, kèm test. Hãy bắt đầu từ mục `0.1` và cập nhật checklist sau mỗi buổi. Khi xong giai đoạn 3, em sẽ có một dự án đủ vững để đưa vào portfolio và **tự tin giải thích** với nhà tuyển dụng: vì sao hệ thống không bán trùng ghế, vì sao không ai lấy được vé miễn phí, và vì sao một người mới có thể thêm tính năng mà không làm hỏng những phần đang chạy.

Thầy chờ xem phiên bản tiếp theo.
