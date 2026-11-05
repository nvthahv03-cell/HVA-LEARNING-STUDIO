# ADAPTER – HVA LEARNING STUDIO ↔ HVA–EDOS

Căn cứ: [Hợp đồng kỹ thuật Kim Quy Pro](./HVA_EDOS_GEMINI_API_CONTRACT.md).

## Trạng thái
- Đã tạo module `studio-edos-adapter.js` để chuẩn hóa yêu cầu và phản hồi.
- `STUDIO_AI_READY=false`. Không có request mạng thực tế từ module.
- Chưa có SSO hoặc action `hva_studio_ai_generate` đã triển khai, nên **KHÔNG PASS Gemini**.
- Không lưu API key, sessionToken hay bridgeToken trong repository.

## Trách nhiệm phía Studio
- Gắn giao diện tạo học liệu với `validateStudioTask`, `makeStudioRequest` và `normalizeStudioAnswer`.
- Giáo viên chỉ xem bản nháp, sửa và phê duyệt; kết quả AI không được tự động phát hành.
- Trường dữ liệu không hợp lệ hoặc trường đặc quyền do trình duyệt tự đưa vào sẽ không được chuyển tiếp qua payload chuẩn.

## Cần Kim Quy Pro bàn giao tiếp
1. Xác nhận action `hva_studio_ai_generate` đã được triển khai trên **backend thử nghiệm**, không sửa backend production đang PASS.
2. Cơ chế ủy quyền một lần/SSO để Studio hoạt động khác origin; không dùng token qua URL, không dùng chung localStorage.
3. Giao diện kết nối an toàn `authorizedSend` và chính sách kiểm tra origin/phiên.
4. Kiểm thử quyền giáo viên, giới hạn tần suất, payload lớn, 429/503, timeout, hồi quy EDOS.
5. Xác nhận cấu hình và chính sách OpenAI đối chiếu; không tự bật khi chưa có quyền.

## Ghi chú
Phạm vi module hiện chỉ bao gồm adapter và kiểm tra dữ liệu, không thay thế các hàm AI của EDOS. Không sửa `doGet`, `doPost`, `CONFIG`, `HVA_AI_SERVICE`.
