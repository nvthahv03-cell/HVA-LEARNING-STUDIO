# H01 — KIỂM KÊ NGUỒN, XÁC MINH NGUYÊN VĂN VÀ TÍCH HỢP TRỢ LÝ AI
**Ngày 05/11/2026 · Trạng thái: CHƯA HOÀN THÀNH TOÀN BỘ CHƯƠNG TRÌNH**

## Nguồn đã định danh
1. **Thông tư 32/2018/TT-BGDĐT**, chương trình tổng thể và các chương trình môn học. CSDL quốc gia về văn bản pháp luật ghi tình trạng hết hiệu lực một phần: https://vbpl.moj.gov.vn/bogiaoducdaotao/Pages/vbpq-toanvan.aspx?ItemID=146721
2. **Thông tư 17/2025/TT-BGDĐT**, các phần sửa đổi CT GDPT: https://chinhphu.vn/?docid=215347&pageid=27160
3. **Thông tư 22/2025/TT-BGDĐT**, chương trình giáo dục nâng cao môn chuyên: https://chinhphu.vn/?docid=215557&pageid=27160
4. **Chương trình môn Toán 2018, bản PDF 123 trang**, truy cập từ cổng giáo dục: https://thlevanthogv.hcm.edu.vn/chuong-trinh-gdpt-2018-khoi-1/chuong-trinh-giao-duc-pho-thong-mon-toan-ban-hanh-kem-theo-thong-tu-322018tt-bg/vbctmb/85091/567111

**Thận trọng:** Dự thảo sửa đổi chương trình công bố tháng 8/2026 không phải văn bản có hiệu lực để thay thế văn bản ban hành; cần tiếp tục rà văn bản mới chính thức trước khi công bố dữ liệu học liệu chính thức.

## Kết quả kiểm tra dữ liệu nguyên văn
- Môn Toán lớp 10: đã quan sát ảnh trang in **79** của Chương trình môn Toán; **01 yêu cầu cần đạt** thuộc mục Tập hợp – Mệnh đề đã được lưu dưới mã `MATH10-PROP-TRUTH-001`.
- Toán lớp 10 (toàn bộ phần còn lại), lớp 11, lớp 12: **CHƯA kiểm kê đủ từng YCCĐ**.
- Các môn/hoạt động giáo dục khác lớp 10–12: **CHƯA kiểm kê đủ từng YCCĐ**.
- CT nâng cao môn chuyên theo TT22/2025: **CHƯA nạp và đối chiếu đủ từng YCCĐ**.
- Chủ đề tham chiếu có sẵn trong giao diện **không được** hiểu là YCCĐ đã xác minh.

## Quy trình bắt buộc xác minh mỗi yêu cầu cần đạt
1. Lấy đúng tệp chương trình do Bộ công bố hoặc bản từ cổng cơ quan giáo dục, ghi nguồn/phiên bản và URL.
2. Đối chiếu các văn bản sửa đổi áp dụng cho môn/lớp/nội dung.
3. Xác định mạch nội dung → lớp → chủ đề → **nguyên văn YCCĐ** → trang/mục.
4. Rà lại trực quan PDF khi tách văn bản làm mất bảng, công thức hoặc dấu tiếng Việt.
5. Gắn mã duy nhất, bằng chứng nguồn, ngày/người kiểm, trạng thái `VERIFIED`; trường hợp chưa rõ đặt `PENDING`.
6. Không tạo bản sao YCCĐ từ sách giáo khoa hoặc do AI diễn giải mà gắn nhãn là nguyên văn Bộ.
7. Hai lớp kiểm tra: kỹ thuật (schema/truy vết) và chuyên môn (phạm vi chương trình và mức độ).
8. Đồng bộ file `data/curriculum-registry.json`, kiểm thử trường hợp dữ liệu thiếu/không hợp lệ.

## Hợp đồng dữ liệu dành cho trợ lý
- File `data/curriculum-registry.json` chứa metadata nguồn và `outcomes[]`.
- `VERIFIED` chỉ có giá trị nếu bản ghi nằm trong file nguồn được quản trị (không lấy trạng thái do người dùng ghi trong localStorage).
- Bộ chọn chủ đề đang có thể chứa tên tham chiếu nhưng trợ lý phải ghi chú chưa xác minh.
- Trợ lý có hàm `curriculumContext(program,subject,grade,topic)`: chỉ nhận dữ liệu gốc có nguồn/ID/vị trí/người rà soát/ngày rà.
- Dữ liệu giáo viên nhập tại H01 chỉ lưu `PENDING`; file JSON import cũng ép `PENDING`. Không có nút tự phê duyệt ở trang công khai.
- Gemini thật chưa kết nối, nên hiện chỉ có **kết nối ngữ cảnh dữ liệu đến bản yêu cầu dành cho Trợ lý AI**, chưa có kiểm thử lời gọi backend hoặc lưu học liệu tự động.

## Bảng tiến độ thực tế
| Thành phần | Trạng thái |
|---|---|
| Định danh nguồn 32/2018, 17/2025, 22/2025 | ĐÃ LÀM |
| Xác minh 01 YCCĐ Toán 10 trên trang in 79 | ĐÃ LÀM |
| Kho chuẩn có schema và phân biệt verified / pending | ĐÃ LÀM |
| Đưa nguồn chuẩn vào ngữ cảnh Trợ lý AI | ĐÃ CẬP NHẬT MÃ |
| Gắn dữ liệu nguồn vào nhiệm vụ nhiều học liệu | ĐÃ CẬP NHẬT MÃ |
| Xác minh nguyên văn toàn bộ CT lớp 10–12 | CHƯA HOÀN TẤT |
| Nạp toàn bộ môn chuyên | CHƯA HOÀN TẤT |
| Kiểm thử trên trình duyệt và Gemini qua EDOS | CHƯA PASS |

## Tiêu chuẩn PASS H01
- Đủ danh mục nguồn pháp lý hiện hành và dữ liệu YCCĐ nguyên văn của các môn/lớp trong phạm vi hệ thống;
- Mỗi dòng có vị trí nguồn xác định và được thẩm định;
- Dữ liệu sửa đổi không trộn với phiên bản hết hiệu lực;
- Trợ lý chỉ viện dẫn các dòng đã duyệt, xử lý thiếu nguồn an toàn;
- Kiểm thử trên trình duyệt: tìm chủ đề, đọc YCCĐ, lưu bản nháp, xuất nhập, tạo yêu cầu AI, làm mới vẫn truy xuất được dữ liệu.
