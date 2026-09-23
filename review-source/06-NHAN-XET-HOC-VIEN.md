# 06. Nhận xét dành cho học viên

Gửi em,

Thầy đã đọc cả hai repo backend và frontend, cùng 40 commit của em trong khoảng hai tháng. Nhận xét dưới đây thẳng thắn, vì em đã làm được một dự án đủ nghiêm túc để xứng đáng được đánh giá theo chuẩn nghiêm túc.

## 1. Đánh giá tổng quát

| Tiêu chí | Mức | Ghi chú ngắn |
|---|---|---|
| Phạm vi chức năng | Khá tốt | Đủ luồng chính: xem phim → chọn suất → giữ ghế → thanh toán → nhận vé qua email |
| Xử lý tranh chấp dữ liệu | **Tốt** | Transaction + `FOR UPDATE`, kiểm tra trạng thái sau khi khóa. Đây là điểm sáng nhất của dự án |
| Tổ chức code, kiến trúc | Khá | Phân tầng rõ ràng; quy tắc tính giá lại đặt ở frontend |
| Bảo mật, phân quyền | Yếu | Tin client ở hai điểm trọng yếu nhất |
| Tích hợp thanh toán | Yếu | Chưa nắm được cách xác nhận một khoản thanh toán |
| Database | Khá | Mô hình đúng; thiếu migration, index và lịch sử đơn |
| Kiểm thử | Chưa có | |
| Tài liệu, vận hành | Yếu | Không có README, không có file env mẫu |
| Giao diện, trải nghiệm | **Tốt** | Có loading, toast, đồng hồ đồng bộ với server, lazy load |

## 2. Những điều em đã làm tốt

1. **Em giải quyết đúng bài toán khó nhất.** Khi hai người cùng chọn một ghế, em không làm theo kiểu "đọc xem ghế trống không rồi ghi" như phần lớn học viên. Em mở transaction, dùng `SELECT … FOR UPDATE` để khóa dòng, rồi **kiểm tra lại trạng thái sau khi đã có khóa** (`be/services/booking.service.ts:64-81`). Em còn thêm `@@unique([showtimeId, seatId])` làm lớp bảo vệ cuối ở database. Đây là tư duy của người đã hiểu race condition là gì chứ không chỉ biết cái tên.
2. **Mô hình dữ liệu đúng.** Tách `Seat` (ghế vật lý) và `TicketSeat` (vé của từng suất) là cách các hệ thống đặt chỗ thật vẫn làm.
3. **Transaction được dùng nhất quán** cho mọi thao tác ghi nhiều bước: giữ ghế, hủy đơn, chốt đơn, cron, tạo suất chiếu cùng 180 vé.
4. **Không lưu thứ có thể suy ra.** Trạng thái phim được tính từ ngày chiếu thay vì lưu thành cột (commit `da54a90`). Đồng hồ đếm ngược ở checkout lấy mốc từ server thay vì tự đếm 5 phút ở trình duyệt.
5. **Kỷ luật công cụ.** TypeScript strict, ESLint cấm `any`, Prettier, và toàn bộ code không có `any` nào. Em tự đặt luật cho mình và tuân thủ được.
6. **Phân quyền admin làm ở backend**, không chỉ ẩn nút ở giao diện. Mật khẩu hash bằng bcrypt và được loại khỏi response.
7. **Lịch sử git sạch.** Commit nhỏ, đặt tên theo quy ước (`feat:`, `refactor:`, `chore:`), đi dần theo từng tính năng. Người đọc có thể theo dõi quá trình em làm dự án.

## 3. Tư duy đúng cần phát huy

- **Nghĩ về tình huống đồng thời.** Em đã tự hỏi "nếu hai người bấm cùng lúc thì sao?". Hãy mang câu hỏi đó sang mọi chỗ có tiền hoặc có thời gian: nếu khách trả tiền chậm, nếu khách đóng tab, nếu một API bị gọi hai lần thì sao?
- **Đặt ràng buộc ở tầng thấp nhất có thể.** Em đã dùng `@@unique` ở DB. Hãy áp dụng tiếp: số tiền do backend tính, trạng thái đơn chuyển bằng update có điều kiện.
- **Suy ra thay vì lưu trữ.** Tiếp tục giữ tư duy này.

## 4. Những lỗi mang tính hệ thống

Thầy không liệt kê lại 36 vấn đề ở đây. Đa số chúng bắt nguồn từ **năm thói quen** dưới đây. Sửa được thói quen thì lần sau em sẽ không mắc lại những lỗi đó.

### 4.1 Chưa xác định ranh giới tin cậy

Liên quan: SEC-01, SEC-02, SEC-05, SEC-09.

Mọi thứ đến từ trình duyệt chỉ là **lời khai**: giá tiền, `userId`, việc "tôi đã thanh toán xong", dữ liệu form. Người dùng có thể mở DevTools hoặc Postman và gửi bất cứ thứ gì. Backend phải tự kiểm chứng: tự tính tiền, tự lấy danh tính từ token, tự hỏi Stripe.

Một cách tự kiểm tra: với mỗi endpoint, em liệt kê từng trường trong request và hỏi "nếu trường này bị sửa thành giá trị khác thì chuyện gì xảy ra?". Validate ở frontend là để **người dùng dễ chịu**; validate ở backend là để **hệ thống an toàn**. Hai việc này không thay thế được cho nhau.

### 4.2 Chỉ nghĩ đến trường hợp suôn sẻ

Liên quan: ERR-01, ERR-05.

Luồng thanh toán của em chạy đúng khi khách làm đúng thứ tự và đúng thời gian. Nhưng ngoài thực tế, khách trả tiền sau 7 phút, khách đóng tab ngay sau khi trả, React gọi `useEffect` hai lần. Với dữ liệu liên quan đến tiền, hãy **vẽ máy trạng thái trước khi code**: đơn hàng có những trạng thái nào, được chuyển từ đâu sang đâu, và **chuyển nào bị cấm**. `FAILED → SUCCESS` là một chuyển bị cấm mà code hiện tại vẫn cho phép.

### 4.3 Quy tắc nghiệp vụ nằm ở giao diện

Liên quan: ARCH-02, SEC-02.

Giá vé, hàng ghế VIP, sơ đồ phòng đang nằm trong `BookingPage.tsx`. Khi quy tắc nằm ở frontend, nó vừa **không an toàn** (người dùng sửa được) vừa **bị lặp lại** (em phải chép sang `seed.ts` và `showtime.service.ts`). Nguyên tắc: **backend quyết định, frontend hiển thị.**

### 4.4 Giao diện nói những điều hệ thống chưa làm

Liên quan: ERR-04, CODE-01, ERR-08.

"Tạo tài khoản thành công! Mật khẩu đã được lưu", dashboard với doanh thu "125.5M VNĐ", nhãn "Thanh toán qua VNPAY": không điều nào đúng. Thầy hiểu em muốn sản phẩm trông hoàn chỉnh. Nhưng trong sản phẩm thật, **một giao diện nói sai sự thật gây hại nhiều hơn một tính năng còn thiếu**, vì người dùng sẽ hành động dựa trên điều họ thấy. Tính năng chưa làm thì ghi "Sắp ra mắt", thế là đủ.

### 4.5 Comment thay cho kiểm chứng

Liên quan: CODE-03, OPS-01.

Có những comment khẳng định điều mà code chưa đảm bảo: "Chống gọi API 2 lần", "gọi bưu tá khi transaction thành công", "CHUẨN SENIOR". Nhiều comment khác mang dấu vết hội thoại, như "Đã xóa import rác", "Bỏ chữ `: any` đi vì…", "ĐÃ VÁ LỖI". Thầy đoán một phần code được dán từ cuộc trò chuyện với AI hoặc từ tài liệu hướng dẫn. **Dùng AI không sai.** Chỗ cần sửa là: sau khi dán, em phải tự hỏi "làm sao mình **biết** đoạn này đúng?", và câu trả lời đáng tin nhất là **một bài test**. Dự án hiện có 0 test, nên mọi khẳng định trong comment đều chưa được kiểm chứng.

## 5. Kiến thức còn thiếu và thứ tự nên học

Thứ tự dưới đây đi theo nguyên tắc: học cái gì thì áp dụng ngay vào Seatify.

| # | Chủ đề | Áp dụng vào | Gợi ý tài liệu |
|---|---|---|---|
| 1 | **Ranh giới tin cậy và OWASP API Security Top 10** (tập trung vào BOLA/IDOR, Broken Authentication, Unrestricted Resource Consumption) | SEC-01 → SEC-05 | OWASP API Security Top 10 (2023) |
| 2 | **Kiểm thử backend cơ bản:** unit test, integration test với supertest, DB riêng cho test, test chạy đồng thời | OPS-01; làm song song với mục 3 để chứng minh mình sửa đúng | Tài liệu Vitest, supertest |
| 3 | **Tích hợp thanh toán đúng cách:** webhook, xác minh chữ ký, idempotency, đối soát | SEC-01, ERR-01, DB-03 | Stripe Docs: "Fulfill orders", "Webhooks" |
| 4 | **Validate đầu vào và xử lý lỗi tập trung** | SEC-09, ARCH-03 | zod; tài liệu "Error handling" của Express 5 |
| 5 | **Máy trạng thái và transaction:** READ COMMITTED, khóa dòng, update có điều kiện | ERR-01, ERR-05 | Tài liệu PostgreSQL: "Transaction Isolation", "Explicit Locking" |
| 6 | **Prisma migrate, index, thiết kế dữ liệu lịch sử (snapshot)** | DB-01, DB-02, DB-04 | Prisma Docs: "Migrate", "Indexes" |
| 7 | **Thời gian và múi giờ:** lưu UTC, hiển thị theo múi giờ, locale khác với timezone | ERR-03 | MDN: `Intl.DateTimeFormat` |
| 8 | **Chuẩn bị deploy:** biến môi trường, README, CI tối thiểu | OPS-02, OPS-03, ARCH-04 | GitHub Actions: "Building and testing Node.js" |

## 6. Bài tập gợi ý

1. **Chứng minh điểm mạnh của mình.** Viết test bắn 20 request giữ cùng một ghế cùng lúc, và khẳng định chỉ đúng 1 request thành công. Em làm phần này đúng rồi, giờ hãy có **bằng chứng** cho nó.
2. **Tái hiện lỗi trước khi sửa.** Viết test gọi `POST /payments/confirm` mà không qua Stripe. Hiện tại test sẽ báo thành công, chính là lỗi SEC-01. Sau đó sửa code cho đến khi hệ thống từ chối request đó. Thói quen "viết test tái hiện lỗi → sửa → test chạy xanh" đáng giá hơn bất kỳ thư viện nào.
3. **Vẽ máy trạng thái trên giấy.** Vẽ cho `Booking` và `TicketSeat`, liệt kê mọi chuyển trạng thái hợp lệ, rồi đối chiếu từng chuyển với dòng code thực hiện nó. Chuyển nào có trong code mà không có trên giấy là lỗi.
4. **Kiểm tra ranh giới tin cậy.** Với từng endpoint `POST`/`PUT`, lập bảng: tên trường, ai quyết định giá trị (client hay server), backend đã kiểm tra chưa.

## 7. Lời kết

Seatify cho thấy em **đã vượt qua giai đoạn "làm cho chạy được"**. Em biết chia tầng, biết dùng transaction, biết nghĩ đến chuyện hai người cùng bấm một lúc. Bước tiếp theo là chuyển từ "làm cho chạy được" sang **"làm cho không thể chạy sai"**: không tin client, không tin vào trường hợp suôn sẻ, và không tin vào comment khi chưa có test.

Hai lỗi Critical nghe thì nặng, nhưng cách sửa không khó: mỗi lỗi chỉ cần khoảng một đến hai ngày. Hãy bắt đầu từ Giai đoạn 1 trong `05-LO-TRINH-CAI-THIEN.md`, làm từng bước kèm test. Khi xong, em sẽ có một dự án đủ vững để đưa vào portfolio và **tự tin giải thích** với nhà tuyển dụng vì sao hệ thống của mình không bán trùng ghế và không cho ai lấy vé miễn phí.

Thầy chờ xem phiên bản tiếp theo.
