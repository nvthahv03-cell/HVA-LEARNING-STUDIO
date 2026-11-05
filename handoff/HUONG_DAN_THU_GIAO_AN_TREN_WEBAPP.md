# HVA STUDIO — KIỂM THỬ TẠO GIÁO ÁN TRỰC TIẾP (KHÔNG ĐỤNG EDOS)

**Mục tiêu:** giáo viên được cấp quyền mở trang thử nghiệm, bấm **Tạo giáo án bằng AI**, nhận **Gemini thật** (theo bằng chứng server API), biên tập, lưu cục bộ và mở lại.

## Hai file cần sao chép vào cùng một Apps Script MỚI

1. `HVA_STUDIO_PILOT_WEBAPP.gs` → dán vào **Code.gs** (tệp .gs).
2. `StudioPilot.html` → tạo tệp HTML với tên chính xác **StudioPilot**, dán nội dung.

**Không dán vào Apps Script EDOS production!** `Code.gs` này có `doGet()` riêng; dán vào dự án EDOS sẽ tạo xung đột.

## Thuộc tính tập lệnh (Project Settings → Script Properties)

- `GEMINI_API_KEY`: khóa Google AI Studio thật; không chụp/đăng giá trị.
- `HVA_STUDIO_TEST_EMAILS`: email Google của người thử nghiệm, nhiều người cách nhau dấu phẩy. Bắt buộc; thiếu thì ứng dụng **từ chối tất cả**.
- `HVA_STUDIO_GEMINI_MODEL`: tùy chọn; khuyến nghị `gemini-3.1-flash-lite`, vì trong thử nghiệm 05/11/2026 của thầy mô hình này đã trả HTTP 200 khi thử ở bước server-side. Không bảo đảm thành công mọi lượt; 503 có thể xảy ra.

## Triển khai

1. Lưu hai tệp; nhấn **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**.
2. **Thực thi với tư cách (Execute as): Người dùng truy cập ứng dụng (User accessing the web app)**. Không chọn `Me`: chế độ `Me` có thể không trả email người truy cập và cũng thay đổi quyền thực thi.
3. **Người có quyền truy cập (Who has access):** chọn phạm vi hẹp nhất có thể cho phép tài khoản thử nghiệm; **không mở Anyone công khai** trong giai đoạn này.
4. Cấp đúng quyền OAuth theo màn hình sau khi kiểm tra. Ứng dụng dùng `UrlFetchApp` gọi Gemini; đọc email người dùng Google để kiểm tra quyền; `CacheService` / `LockService`. Không yêu cầu Google Drive, Sheets hay Docs.
5. Mở URL Web App đã triển khai, đợi xác thực tài khoản → bấm **Tạo giáo án bằng AI** → sửa → **Lưu bản nháp** → **Mở lại**.

Nếu nút bị khóa và thông báo chưa được cấp quyền: xem email người dùng Google đang đăng nhập, `HVA_STUDIO_TEST_EMAILS` và `Execute as User accessing`. Không vô hiệu hóa xác thực để cho chạy.

## Điều kiện PASS

- Backend xác thực người thử và từ chối tài khoản không được phép.
- Nhấn tạo → phản hồi `success:true`, `provider:'gemini'`, `draft:true`, `reviewRequired:true`; không phải nội dung mô phỏng.
- Giáo viên sửa được, lưu nháp, mở lại trên **cùng trình duyệt**.
- Không công bố hoặc lưu khóa/tokens trong giao diện.

## Giới hạn hiện tại

Đây là **trang thử nghiệm Apps Script riêng**, chưa phải nút trong GitHub Pages Learning Studio, chưa SSO EDOS, chưa Kho học liệu đám mây. Lưu cục bộ có thể mất khi xóa dữ liệu trình duyệt; dùng Xuất .md để sao lưu. Không đưa dữ liệu cá nhân học sinh vào phép thử.

**Phần còn lại sau khi thử thành công:** quyết định cách kết nối EDOS ↔ Studio có xác thực, rồi chuyển tuyến `hva_studio_ai_generate` vào Backend thử nghiệm được kiểm toán. Không gửi khóa/token qua URL/GitHub.
