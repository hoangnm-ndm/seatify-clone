# Báo cáo review dự án Seatify

> **Ngày review:** 23/09/2026 · **Lần review:** lần đầu (trước đó `review-source/` chưa có báo cáo nào)
> **Phạm vi:** `seatify-backend` (commit `c604410`, 20 commit, 02/07 → 04/09/2026) và `seatify-frontend` (commit `8475639`, 20 commit, đến 05/09/2026)
> **Quy mô:** backend ~1.460 dòng TypeScript (chưa tính `seed.ts` 562 dòng), frontend ~4.900 dòng TSX/TS, 6 bảng nghiệp vụ trong Prisma.

---

## Bối cảnh và giả định

- Repo không có đề bài hay tài liệu yêu cầu. README của frontend là template mặc định của Vite, còn backend không có README. Mục tiêu hệ thống được suy ra từ code: **website đặt vé xem phim trực tuyến**, có giữ ghế theo thời gian thực, thanh toán qua Stripe, gửi vé điện tử qua email và trang quản trị phim/suất chiếu.
- Trình độ học viên được suy ra từ lịch sử commit và độ phức tạp của code: đã qua phần nền tảng, đang làm một dự án full-stack hoàn chỉnh.
- Báo cáo đánh giá theo chuẩn của **một hệ thống bán vé có thu tiền thật**, vì code đã tích hợp cổng thanh toán. Nếu đề bài chỉ yêu cầu bản demo, có thể hạ ưu tiên một số mục Medium/Low. Riêng 2 lỗi Critical vẫn giữ nguyên mức, vì chúng phá vỡ đúng nghiệp vụ cốt lõi của hệ thống: bán vé và thu tiền.

## Tóm tắt

Seatify có phạm vi chức năng khá đầy đủ, và phần khó nhất của bài toán đặt vé (tranh chấp ghế khi nhiều người đặt cùng lúc) được giải quyết **đúng hướng** bằng transaction và `SELECT ... FOR UPDATE`. Backend phân tầng rõ ràng, TypeScript để chế độ strict, lịch sử commit sạch.

Tuy nhiên, hệ thống đang **tin trình duyệt ở những chỗ không được phép tin**:

1. Backend dùng luôn giá tiền do client gửi lên.
2. Đơn hàng được chốt "đã thanh toán" chỉ vì client gọi một API công khai. Backend không hề hỏi Stripe xem tiền đã được thu hay chưa.

Hai lỗi này cho phép lấy vé miễn phí hoặc mua với giá tùy ý. Ngoài ra, trạng thái đơn hàng và trạng thái thanh toán có thể lệch nhau (khách trả tiền nhưng đơn không có ghế), dự án chưa có test nào, và schema database chưa có migration.

**Kết luận:** nền tảng tốt, nhưng **chưa sẵn sàng thu tiền thật**. Sửa 2 lỗi Critical và ERR-01 là đủ để luồng mua vé đáng tin cậy. Phần còn lại có thể làm dần theo lộ trình.

## Thống kê vấn đề

| Mức độ | Số lượng | Mã |
|---|---|---|
| **Critical** | 2 | SEC-01, SEC-02 |
| **High** | 3 | SEC-03, ERR-01, ERR-02 |
| **Medium** | 16 | SEC-04 → SEC-09, ERR-03, ERR-04, DB-01 → DB-03, ARCH-01 → ARCH-03, OPS-01, OPS-02 |
| **Low** | 15 | SEC-10, SEC-11, ERR-05 → ERR-09, DB-04, ARCH-04, ARCH-05, OPS-03, OPS-04, CODE-01 → CODE-03 |
| **Tổng** | **36** | |

| Tiền tố | Nhóm | Số lượng | Chi tiết ở file |
|---|---|---|---|
| `SEC` | Bảo mật & phân quyền | 11 | `03-BAO-MAT-VA-DATABASE.md` |
| `ERR` | Lỗi logic / runtime | 9 | `02-VAN-DE-VA-RUI-RO.md` |
| `DB` | Database | 4 | `03-BAO-MAT-VA-DATABASE.md` |
| `ARCH` | Kiến trúc | 5 | `02-VAN-DE-VA-RUI-RO.md` |
| `OPS` | Kiểm thử & vận hành | 4 | `04-CHAT-LUONG-VA-VAN-HANH.md` |
| `CODE` | Chất lượng code | 3 | `04-CHAT-LUONG-VA-VAN-HANH.md` |

## Năm việc nên làm trước tiên

1. **SEC-01**: Chỉ chốt đơn sau khi đã xác minh với Stripe (lấy lại Checkout Session hoặc dùng webhook).
2. **SEC-02**: Backend tự tính tiền từ loại vé và ghế, bỏ qua `totalPrice` do client gửi.
3. **ERR-01**: Chỉ cho phép chuyển đơn từ `PENDING` sang `SUCCESS`, và đồng bộ thời hạn giữ ghế với thời hạn phiên Stripe.
4. **ARCH-01**: Gom 8 `PrismaClient` về một instance dùng chung. Mất khoảng 15 phút, gần như không có rủi ro.
5. **OPS-01**: Viết test cho luồng giữ ghế, chốt đơn, hủy đơn **song song** với việc sửa 3 lỗi trên, để chứng minh mình đã sửa đúng.

## Mục lục

| File | Nội dung |
|---|---|
| [01-TONG-QUAN-VA-KIEN-TRUC.md](01-TONG-QUAN-VA-KIEN-TRUC.md) | Mục tiêu, actor, chức năng thật/giả lập, sơ đồ kiến trúc, luồng đặt vé và thanh toán, đánh giá kiến trúc |
| [02-VAN-DE-VA-RUI-RO.md](02-VAN-DE-VA-RUI-RO.md) | Bảng tổng hợp đủ 36 vấn đề, chi tiết các vấn đề ERR và ARCH |
| [03-BAO-MAT-VA-DATABASE.md](03-BAO-MAT-VA-DATABASE.md) | Ma trận phân quyền endpoint, chi tiết SEC, mô hình dữ liệu, transaction/locking, chi tiết DB |
| [04-CHAT-LUONG-VA-VAN-HANH.md](04-CHAT-LUONG-VA-VAN-HANH.md) | Chất lượng code, kiểm thử, build/deploy, checklist trước khi lên production |
| [05-LO-TRINH-CAI-THIEN.md](05-LO-TRINH-CAI-THIEN.md) | Việc cần làm ngay, trước khi deploy, ở phiên bản sau, khi hệ thống tăng trưởng, và những việc KHÔNG nên làm |
| [06-NHAN-XET-HOC-VIEN.md](06-NHAN-XET-HOC-VIEN.md) | Nhận xét của giảng viên: điểm mạnh, lỗi mang tính hệ thống, thứ tự học bổ sung |

## Quy ước

**Mức độ**

- **Critical**: có thể bị khai thác ngay, gây mất tiền hoặc phá vỡ nghiệp vụ cốt lõi. Phải sửa trước mọi việc khác.
- **High**: gây sai dữ liệu hoặc gián đoạn dịch vụ trong tình huống thực tế. Phải sửa trước khi đưa lên production.
- **Medium**: rủi ro thật nhưng cần điều kiện cụ thể mới xảy ra, hoặc gây khó khăn lớn cho bảo trì.
- **Low**: nên cải thiện, ảnh hưởng nhỏ.

**Độ chắc chắn**

- **Đã xác nhận**: đọc code và lần theo luồng thấy rõ lỗi.
- **Rủi ro tiềm ẩn**: lỗi chỉ xảy ra khi có điều kiện cụ thể (môi trường deploy, tải lớn…).
- **Chưa đủ dữ liệu**: không thể kết luận nếu chỉ đọc source code.

**Đường dẫn:** trong các bảng, `be/` là viết tắt của `seatify-backend/src/`, còn `fe/` là viết tắt của `seatify-frontend/src/`.

## Giới hạn của lần review này

- **Chưa chạy build, lint hay ứng dụng.** Cả hai thư mục chưa có `node_modules`, và nguyên tắc review không cho phép cài package. Mọi kết luận dựa trên việc đọc code và lần theo luồng. Nhãn "Đã xác nhận" nghĩa là code cho thấy rõ lỗi, chứ không phải đã khai thác thử trên hệ thống đang chạy.
- **Không có `.env` backend và database**, nên chưa chạy thử được các kịch bản tấn công mô tả trong báo cáo.
- **Hành vi của Stripe** (Checkout Session mặc định hết hạn sau 24 giờ, `expires_at` tối thiểu 30 phút) lấy theo tài liệu công khai của Stripe. Nên đối chiếu lại với phiên bản API đang dùng.
- **Ảnh QR trong email** dùng `chart.googleapis.com` (`be/services/mail.service.ts:57`). Đây là API cũ Google đã ngừng hỗ trợ từ lâu. Chưa xác minh được hiện nó còn trả về ảnh hay không (cần mở một email vé thật để kiểm tra).
- **Chưa rõ dự án đã deploy hay chưa.** Commit cuối có sửa CORS cho `FRONTEND_URL`. Rủi ro về múi giờ (ERR-03) chỉ xảy ra khi server chạy ở múi giờ khác Việt Nam.
