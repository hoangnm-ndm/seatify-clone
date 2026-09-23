# Báo cáo review dự án Seatify

> **Review lần 1:** 23/09/2026 · **Bổ sung:** 24/09/2026 (kiến trúc modular, Clean Code, validation, kiểm thử, tài liệu, CHECKLIST)
> **Phạm vi:** `seatify-backend` (commit `c604410`, 20 commit, 02/07 → 04/09/2026) và `seatify-frontend` (commit `8475639`, 20 commit, đến 05/09/2026). Các mã commit này thuộc **hai repo gốc của học viên**. Từ 24/09/2026, bản sao dùng để review nằm trong repo `seatify-clone` (commit `76f17e0 init`), và repo này không chứa lịch sử cũ (xem OPS-07). Source code **không thay đổi** giữa hai lần review.
> **Quy mô:** backend khoảng 1.460 dòng TypeScript (chưa tính `seed.ts` 562 dòng), frontend khoảng 4.900 dòng TSX/TS, 6 bảng nghiệp vụ trong Prisma.
> **Danh sách việc cần làm, cập nhật liên tục:** [`../CHECKLIST.md`](../CHECKLIST.md)

---

## Bối cảnh và giả định

- Repo không có đề bài hay tài liệu yêu cầu. Mục tiêu hệ thống suy ra từ code: **website đặt vé xem phim trực tuyến**, có giữ ghế theo thời gian thực, thanh toán qua Stripe, gửi vé điện tử qua email, và trang quản trị phim/suất chiếu.
- Báo cáo đánh giá theo chuẩn **một hệ thống bán vé có thu tiền thật**, vì code đã tích hợp cổng thanh toán.
- Từ lần bổ sung 24/09/2026, báo cáo dùng các **định hướng kiến trúc sau làm chuẩn đích**, theo yêu cầu của người hướng dẫn:
  - Backend: modular monolith (`modules/*` + `shared/*`), ESM, response và lỗi được chuẩn hóa bằng function, **không dùng class**.
  - Frontend: tổ chức theo feature, `createBrowserRouter` tách theo nhóm route, zustand cho state toàn cục phía client, TanStack Query cho dữ liệu server, custom hook, types tập trung.
  - Validation: zod ở cả hai phía.

## Tóm tắt

**Điểm mạnh:** phạm vi chức năng khá đầy đủ; phần khó nhất (tranh chấp ghế khi nhiều người đặt cùng lúc) được giải quyết **đúng hướng** bằng transaction và `SELECT ... FOR UPDATE`; backend phân tầng rõ, bật strict, lịch sử commit sạch; không dùng class ở đâu cả.

**Điểm yếu nghiêm trọng:** hệ thống **tin trình duyệt ở những chỗ không được phép tin**: dùng giá tiền do client gửi, và chốt đơn "đã thanh toán" mà không hỏi Stripe. Hai lỗi này cho phép lấy vé miễn phí hoặc mua với giá tùy ý. Ngoài ra, trạng thái đơn và trạng thái thanh toán có thể lệch nhau.

**Điểm yếu về khả năng mở rộng (bổ sung 24/09):**

- Backend tổ chức theo loại file, không có `shared`; `server.ts` gánh 8 việc; response có 5 định dạng khác nhau.
- Frontend không có feature hay hook, 11 trang tự tải dữ liệu thủ công, types phân tán, **chưa bật `strict`**.
- Không có thư viện validation ở cả hai phía; **không có bất kỳ test nào**; **không có tài liệu** cho người phát triển, người vận hành hay người dùng cuối.

**Kết luận:** nền tảng tốt, nhưng **chưa sẵn sàng thu tiền thật** và **chưa đủ sạch để mở rộng**. Thứ tự đề xuất: nền móng (giai đoạn 0) → vá lỗi Critical/High (giai đoạn 1) → tái cấu trúc dần backend và frontend (giai đoạn 2, 3), kèm test ở từng bước. Không viết lại từ đầu.

## Thống kê vấn đề

| Mức độ | Lần 1 (23/09) | Bổ sung (24/09) | Tổng |
|---|---|---|---|
| **Critical** | 2 | 0 | **2** |
| **High** | 3 | 0 | **3** |
| **Medium** | 16 | 19 | **35** |
| **Low** | 15 | 4 | **19** |
| **Tổng** | 36 | 23 | **59** |

| Tiền tố | Nhóm | Số lượng | Chi tiết ở file |
|---|---|---|---|
| `SEC` | Bảo mật & phân quyền | 11 | `03` |
| `ERR` | Lỗi logic / runtime | 9 | `02` |
| `DB` | Database | 4 | `03` |
| `ARCH` | Kiến trúc | 16 (01–05: `02` · 06–10: `07` · 11–16: `08`) | `02`, `07`, `08` |
| `CODE` | Chất lượng code | 7 (01–03: `04` · 04–05: `08` · 06–07: `09`) | `04`, `08`, `09` |
| `VAL` | Validation | 2 | `10` |
| `OPS` | Kiểm thử & vận hành | 7 (01–04: `04` · 05–06: `11` · 07: `12`) | `04`, `11`, `12` |
| `DOC` | Tài liệu | 3 | `12` |

## Trả lời nhanh các câu hỏi của lần bổ sung

| Câu hỏi | Trả lời ngắn | Chi tiết |
|---|---|---|
| Kiến trúc backend có đủ sạch để mở rộng? | **Chưa.** Tổ chức theo loại file, không có `shared`, hạ tầng lẫn trong nghiệp vụ, response không thống nhất, vẫn là CommonJS | `07` |
| Kiến trúc frontend có đủ sạch để mở rộng? | **Chưa.** Thư mục phẳng, routing JSX một file không có error boundary, dữ liệu server quản lý thủ công, không có hook, types phân tán, Footer dùng `<li>` thay cho link | `08` |
| Clean Code (KISS, DRY, YAGNI, SRP…) và comment? | Hình thức tốt; tổ chức và kỷ luật chưa đạt. Frontend yếu hơn backend. Comment có nhiều dấu vết hội thoại và comment sai sự thật | `09` |
| Form có validation đủ tốt? Dùng thư viện gì? | **Không đủ. Không dùng thư viện nào**, chỉ kiểm tra thủ công. Khuyến nghị zod cho cả hai phía (kèm react-hook-form ở frontend) | `10` |
| Có thiếu kiểm thử không? | **Thiếu hoàn toàn**: 0 test, 0 framework, 0 script, 0 CI ở cả hai phía | `11` |
| Có thiếu tài liệu không? | **Thiếu gần như hoàn toàn** cho cả ba nhóm: người phát triển, người vận hành, người dùng cuối | `12` |

## Năm việc nên làm trước tiên

1. **CHECKLIST 0.1–0.8:** nền móng (quyết định quản lý repo, bật `strict` cho frontend, ESM, env, Prisma singleton, tách `app`/`server`, hạ tầng test).
2. **SEC-01:** chỉ chốt đơn sau khi đã xác minh với Stripe.
3. **SEC-02:** backend tự tính tiền, bỏ qua `totalPrice` do client gửi.
4. **ERR-01:** chỉ cho phép chuyển đơn từ `PENDING` sang `SUCCESS`; đồng bộ thời hạn giữ ghế với phiên Stripe.
5. **OPS-01:** viết test tái hiện lỗi **trước** khi sửa 3 lỗi trên.

## Mục lục

| File | Nội dung |
|---|---|
| [01-TONG-QUAN-VA-KIEN-TRUC.md](01-TONG-QUAN-VA-KIEN-TRUC.md) | Mục tiêu, actor, chức năng thật/giả lập, sơ đồ kiến trúc, luồng thanh toán, đánh giá kiến trúc (đã cập nhật 24/09) |
| [02-VAN-DE-VA-RUI-RO.md](02-VAN-DE-VA-RUI-RO.md) | **Bảng tổng hợp đủ 59 vấn đề**; chi tiết ERR và ARCH-01 → ARCH-05 |
| [03-BAO-MAT-VA-DATABASE.md](03-BAO-MAT-VA-DATABASE.md) | Ma trận phân quyền, chuỗi khai thác, chi tiết SEC; mô hình dữ liệu, khóa, chi tiết DB |
| [04-CHAT-LUONG-VA-VAN-HANH.md](04-CHAT-LUONG-VA-VAN-HANH.md) | Chất lượng code (lần 1), vận hành, checklist trước khi lên production |
| [05-LO-TRINH-CAI-THIEN.md](05-LO-TRINH-CAI-THIEN.md) | 8 giai đoạn, lý do về thứ tự, những việc KHÔNG nên làm |
| [06-NHAN-XET-HOC-VIEN.md](06-NHAN-XET-HOC-VIEN.md) | Nhận xét của giảng viên: điểm mạnh, 8 thói quen gây lỗi, thứ tự học bổ sung, bài tập |
| [07-KIEN-TRUC-BACKEND-DE-XUAT.md](07-KIEN-TRUC-BACKEND-DE-XUAT.md) | **Mới.** Modular monolith: cấu trúc đích, `shared/lib`, response/lỗi bằng function, tách `app`/`server`, ESM |
| [08-KIEN-TRUC-FRONTEND-DE-XUAT.md](08-KIEN-TRUC-FRONTEND-DE-XUAT.md) | **Mới.** Kiến trúc theo feature, `createBrowserRouter`, zustand, TanStack Query, custom hook, types, điều hướng |
| [09-CLEAN-CODE-VA-QUY-UOC.md](09-CLEAN-CODE-VA-QUY-UOC.md) | **Mới.** Chấm theo KISS/DRY/YAGNI/SRP…, phân loại comment, bộ quy ước code |
| [10-VALIDATION-VA-FORM.md](10-VALIDATION-VA-FORM.md) | **Mới.** Kiểm kê từng form và endpoint, khuyến nghị zod dùng chung |
| [11-KIEM-THU.md](11-KIEM-THU.md) | **Mới.** Hiện trạng (thiếu hoàn toàn), ma trận test theo tính năng, bộ công cụ |
| [12-TAI-LIEU.md](12-TAI-LIEU.md) | **Mới.** Tài liệu cho người phát triển, người vận hành, người dùng cuối; cấu trúc `docs/` |
| [../CHECKLIST.md](../CHECKLIST.md) | **Mới.** 65 việc thuộc 8 giai đoạn, có tiêu chí hoàn thành, bảng tra mã → mục, nhật ký cập nhật |

## Quy ước

**Mức độ**

- **Critical**: có thể bị khai thác ngay, gây mất tiền hoặc phá vỡ nghiệp vụ cốt lõi.
- **High**: gây sai dữ liệu hoặc gián đoạn dịch vụ trong tình huống thực tế.
- **Medium**: rủi ro thật nhưng cần điều kiện cụ thể mới xảy ra, hoặc gây khó khăn lớn cho bảo trì và mở rộng.
- **Low**: nên cải thiện, ảnh hưởng nhỏ.

**Độ chắc chắn:** **Đã xác nhận** (đọc code, lần theo luồng) · **Rủi ro tiềm ẩn** (cần điều kiện cụ thể) · **Chưa đủ dữ liệu** (không kết luận được nếu chỉ đọc code).

**Đường dẫn:** `be/` = `seatify-backend/src/`, `fe/` = `seatify-frontend/src/`.

## Lịch sử cập nhật và đính chính

| Ngày | Thay đổi |
|---|---|
| 23/09/2026 | Review lần 1: 36 vấn đề, file `00` → `06` |
| 24/09/2026 | Bổ sung 23 vấn đề (ARCH-06 → ARCH-16, CODE-04 → CODE-07, VAL-01 → VAL-02, OPS-05 → OPS-07, DOC-01 → DOC-03); thêm file `07` → `12` và `../CHECKLIST.md`; viết lại `05` và `06` |
| 24/09/2026 | **Đính chính 1:** lần 1 ghi "TypeScript strict cho cả hai phần". Thực tế **frontend không bật strict** (CODE-04); đã sửa trong `01`, `04`, `06` |
| 24/09/2026 | **Đính chính 2:** lần 1 đề xuất `class AppError extends Error`. Đề xuất này được **thay bằng factory function** `createHttpError` để tuân theo quy ước không dùng class; đã sửa trong `02` (ARCH-03, ERR-02) và `03` (SEC-01) |
| 24/09/2026 | **Ghi nhận:** thư mục gốc trở thành repo `seatify-clone` (1 commit `init`), hai `.git` con không còn. OPS-07 được viết lại theo hiện trạng mới (`02`, `12`, CHECKLIST 0.1) |
| 24/09/2026 | **Điều chỉnh 3:** lần 1 kết luận kiến trúc "vừa đủ" và khuyên "không thêm Zustand". Nay làm rõ: **mẫu** kiến trúc vẫn phù hợp, nhưng **cách tổ chức code** chưa đủ để mở rộng; chấp nhận zustand với phạm vi giới hạn cho state phía client (`01`, `05`) |

## Giới hạn của lần review này

- **Chưa chạy build, lint, test hay ứng dụng.** Hai thư mục chưa có `node_modules` và nguyên tắc review không cho phép cài package. Mọi kết luận dựa trên đọc code và lần theo luồng.
- **Không có `.env` backend và database**, nên chưa chạy thử các kịch bản tấn công.
- **Hành vi của Stripe** (phiên mặc định 24 giờ, `expires_at` tối thiểu 30 phút) và **khả năng tương thích ESM của `@prisma/client`, `bcrypt`** lấy theo tài liệu công khai; cần kiểm tra lại khi triển khai.
- **Ảnh QR qua `chart.googleapis.com`**: chưa xác minh được còn hoạt động hay không.
- **Các đoạn code mẫu** trong `07`, `08`, `10` chỉ là mẫu định hướng, chưa được biên dịch hay chạy thử.
- **Nhận định pháp lý** trong DOC-03 (chính sách bảo mật dữ liệu cá nhân) chỉ mang tính nhắc nhở, không phải tư vấn pháp lý.
- **Repo `seatify-clone` được khởi tạo trong lúc đang viết bản bổ sung** (commit `init` lúc 00:17 ngày 24/09). Các thay đổi của lần bổ sung trong `review-source/` và file `CHECKLIST.md` **chưa được commit**; người review không tự commit.
