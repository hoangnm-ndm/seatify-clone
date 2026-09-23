# 12. Tài liệu: hiện trạng và đề xuất

> Bổ sung ngày 24/09/2026. File này trình bày chi tiết **DOC-01**, **DOC-02**, **DOC-03** và **OPS-07**.

## 1. Kết luận: thiếu gần như hoàn toàn cho cả ba nhóm người đọc

| Nhóm người đọc | Đang có | Đánh giá |
|---|---|---|
| **Người phát triển** | `seatify-frontend/README.md` là template mặc định của Vite, không nói gì về Seatify. Comment trong code (chất lượng thấp, xem CODE-03). Commit message rõ ràng | **Thiếu hoàn toàn** tài liệu về dự án |
| **Người vận hành** (deploy, xử lý sự cố) | Không có | **Thiếu hoàn toàn** |
| **Người dùng cuối** (khách mua vé, admin) | Popup quy định vé HSSV trong trang đặt vé (`seatify-frontend/src/pages/BookingPage.tsx:621-650`); dòng hướng dẫn "kiểm tra hộp thư Spam" ở trang thanh toán thành công | **Gần như thiếu hoàn toàn.** Footer có mục FAQ, Chính sách bảo mật, Điều khoản, Liên hệ nhưng **không trang nào tồn tại** |

## 2. Vấn đề chi tiết

### DOC-01: Thiếu tài liệu cho người phát triển

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Còn thiếu:**
  - README cho từng repo: giới thiệu, yêu cầu cài đặt (phiên bản Node, PostgreSQL), các bước chạy, script, tài khoản demo.
  - Danh sách biến môi trường: ý nghĩa, bắt buộc hay tùy chọn, ví dụ (`.env.example`).
  - Tài liệu kiến trúc: sơ đồ, quy tắc phụ thuộc giữa các module (có thể lấy từ `01`, `07`, `08`).
  - **Tài liệu API:** danh sách endpoint, request/response, mã lỗi. Hiện frontend phải đọc code backend mới biết API trả về gì.
  - Tài liệu database: sơ đồ ERD, ý nghĩa các trạng thái, vòng đời đơn hàng và vé.
  - Quy ước code và quy trình đóng góp (xem `09`, mục 5).
  - Hướng dẫn chạy test (sau khi có OPS-01/05/06).
  - Ghi chép quyết định kiến trúc (ADR): vì sao chọn `SELECT … FOR UPDATE`, vì sao giữ ghế 5 phút, vì sao Stripe…
- **Ảnh hưởng:** người mới (bạn cùng nhóm, người chấm bài, nhà tuyển dụng xem portfolio) không chạy được dự án nếu không hỏi trực tiếp tác giả.

### DOC-02: Thiếu tài liệu cho người vận hành

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Còn thiếu:**
  - Hướng dẫn deploy: build, `prisma migrate deploy`, biến môi trường theo từng môi trường (dev/staging/production), cấu hình CORS, Stripe webhook.
  - Runbook xử lý sự cố cho các tình huống **đã biết sẽ xảy ra**: khách báo đã trả tiền mà không có vé (ERR-01); email vé không đến; ghế bị giữ mãi không nhả; hết kết nối DB (ARCH-01).
  - Quy trình sao lưu và khôi phục DB. Cảnh báo về `seed.ts` (OPS-02).
  - Xoay vòng secret: đổi `JWT_SECRET`, đổi Stripe key, đổi mật khẩu ứng dụng Gmail.
  - Theo dõi hệ thống: xem log ở đâu, dấu hiệu nào là bất thường.
- **Ảnh hưởng:** khi có sự cố thanh toán thật, không có quy trình nào để làm theo và không có dữ liệu để đối soát (DB-03).

### DOC-03: Thiếu tài liệu và trang thông tin cho người dùng cuối

- **Mức độ:** Medium · **Độ chắc chắn:** Đã xác nhận
- **Còn thiếu:**
  - **Chính sách bảo mật:** hệ thống thu thập email, số điện thoại, **ngày sinh** và lịch sử mua vé. Một website thu thập dữ liệu cá nhân cần công bố dữ liệu nào được thu thập, dùng để làm gì, lưu bao lâu, và người dùng yêu cầu xóa thế nào. Nên tham chiếu các quy định hiện hành về bảo vệ dữ liệu cá nhân tại Việt Nam (ví dụ Nghị định 13/2023/NĐ-CP và các văn bản thay thế hoặc bổ sung). Báo cáo này **không đưa ra tư vấn pháp lý**; cần kiểm tra lại văn bản đang có hiệu lực.
  - **Điều khoản sử dụng** và **chính sách hủy vé, hoàn tiền:** hiện khách có thể hủy đơn đang chờ thanh toán, nhưng không có chính sách nào cho đơn đã thanh toán. Khi xảy ra ERR-01 (trả tiền mà không có vé), khách không biết phải làm gì.
  - **Hướng dẫn đặt vé và FAQ:** giữ ghế trong bao lâu, loại vé HSSV cần giấy tờ gì, không nhận được email thì làm gì, khách vãng lai xem lại vé bằng cách nào.
  - **Trang liên hệ** với kênh hỗ trợ thật: hotline và email trong Footer hiện là dữ liệu mẫu.
  - **Hướng dẫn cho admin:** cách thêm phim, tạo suất chiếu, những điều cần tránh (trùng lịch, sửa phim đang có suất chiếu).
- **Ảnh hưởng:** Footer hứa hẹn các trang không tồn tại (CODE-05); khách không có thông tin khi gặp sự cố; hệ thống thu thập dữ liệu cá nhân mà không công bố chính sách.

### OPS-07: Hai repo tách rời, thư mục gốc không được quản lý phiên bản

- **Mức độ:** Low · **Độ chắc chắn:** Đã xác nhận
- **Bằng chứng:** `seatify-backend/` và `seatify-frontend/` là hai repo git độc lập. Thư mục gốc `seatify/`, nơi đặt `review-source/` và `CHECKLIST.md`, **không phải repo git**.
- **Ảnh hưởng:** `CHECKLIST.md`, `review-source/` và tài liệu dùng chung (kiến trúc tổng thể, hợp đồng API) không có lịch sử thay đổi, dễ mất và khó chia sẻ. Không dùng chung được schema zod (VAL-02) hay CI.
- **Hướng xử lý (cần quyết định):**
  - **Phương án A:** gộp thành monorepo (`apps/backend`, `apps/frontend`, `packages/contracts`, `docs/`), giữ lịch sử của cả hai repo bằng `git subtree` hoặc `git filter-repo`. Phù hợp nếu dự án tiếp tục phát triển lâu dài.
  - **Phương án B:** giữ hai repo; tạo repo thứ ba `seatify-docs` cho CHECKLIST và tài liệu dùng chung. Đơn giản hơn nhưng vẫn không dùng chung được code.
  - **Phương án C (tối thiểu):** chạy `git init` ở thư mục gốc chỉ để quản lý CHECKLIST và tài liệu, bỏ qua hai thư mục con bằng `.gitignore`.

## 3. Cấu trúc tài liệu đề xuất

```text
docs/                                   # ở gốc monorepo, hoặc trong repo tài liệu
├── README.md                           # mục lục tài liệu
├── developer/
│   ├── getting-started.md              # cài đặt và chạy trong 10 phút
│   ├── architecture.md                 # sơ đồ + quy tắc phụ thuộc (từ 07, 08)
│   ├── conventions.md                  # quy ước code, comment, commit (từ 09)
│   ├── api.md                          # hoặc openapi.yaml: endpoint, định dạng response, mã lỗi
│   ├── database.md                     # ERD, vòng đời Booking / TicketSeat
│   ├── testing.md
│   └── adr/
│       ├── 0001-khoa-ghe-bang-select-for-update.md
│       └── 0002-xac-nhan-thanh-toan-qua-webhook.md
├── operations/
│   ├── deployment.md
│   ├── environment.md                  # ma trận biến môi trường theo môi trường
│   ├── runbook.md                      # xử lý sự cố thanh toán, email, ghế, DB
│   └── backup-restore.md
└── user/
    ├── huong-dan-dat-ve.md             # nguồn nội dung cho trang FAQ trong app
    └── huong-dan-quan-tri.md
```

**Trang cho người dùng cuối nên nằm trong ứng dụng**, ví dụ các route `/faq`, `/chinh-sach-bao-mat`, `/dieu-khoan`, `/chinh-sach-huy-ve`, `/lien-he` trong `pages/common/`, và được Footer liên kết bằng `Link` (CODE-05).

## 4. Nguyên tắc viết tài liệu

1. **Viết khi thay đổi, không viết dồn cuối kỳ.** PR nào đổi API hay biến môi trường thì cập nhật tài liệu tương ứng trong chính PR đó.
2. **README trả lời được "làm sao chạy dự án" trong dưới 10 phút.** Thử bằng cách clone vào một thư mục mới và làm theo đúng từng bước.
3. **Tài liệu API sinh ra từ nguồn sự thật** khi có thể (ví dụ sinh OpenAPI từ schema zod bằng `zod-openapi`). Nếu chưa làm được thì viết tay, nhưng phải đi cùng từng PR.
4. **Không sao chép code vào tài liệu.** Hãy dẫn đường dẫn đến file.
5. **Tài liệu cho người dùng dùng ngôn ngữ của người dùng**, không dùng thuật ngữ kỹ thuật như `PENDING` hay `HOLDING`.
