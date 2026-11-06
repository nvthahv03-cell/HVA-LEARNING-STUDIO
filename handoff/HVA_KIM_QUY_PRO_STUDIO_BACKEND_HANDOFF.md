# BÀN GIAO KỸ THUẬT – KIM QUY PRO → KIM QUY 2

**Ngày:** 06/11/2026 · **Phạm vi:** HVA Learning Studio ↔ HVA–EDOS  
**Trạng thái:** Có mã action thử nghiệm, chưa được triển khai Web App/SSO; **CHƯA PASS** luồng Gemini từ giao diện Studio.

## I. Hiện vật đã tạo

- `handoff/HVA_EDOS_STUDIO_ACTION_PILOT.gs`: hàm `hvaStudioGeneratePilot_(payload)` độc lập, **không có doGet/doPost**, không ghi đè đối tượng, không đọc khóa từ frontend.
- `studio-edos-adapter.js`: giữ nguyên adapter Kim Quy 2, sử dụng `generateWithEdos(task, authorizedSend)`; `STUDIO_AI_READY=false` khi chưa PASS môi trường thực tế.
- `handoff/HVA_STUDIO_PILOT_WEBAPP.gs`: dự án pilot Gemini độc lập của Kim Quy 2, không được sao chép doGet vào EDOS.
- `docs/HVA_EDOS_GEMINI_API_CONTRACT.md`: hợp đồng dữ liệu và ranh giới xác thực.

## II. Xác minh trước khi triển khai

1. **Sao lưu** dự án GAS EDOS và tạo bản sao thử nghiệm. Tìm `doGet`, `doPost`, `nvsIntegratedPost_`, `nvsActor_`, `hvaTraCuuNhanSuTheoUser_`, `nvsResp_` trên đúng **phiên bản Backend đang chạy**, không dựa vào bản xuất mã cũ.
2. Trong bản thử xác nhận `nvsActor_(payload)` thật sự xác minh **phiên do EDOS cấp, có TTL và thẩm quyền máy chủ**. Nếu trả danh tính từ dữ liệu do trình duyệt tự khai thì dừng.
3. Đối chiếu nguồn nhân sự; hàm `hvaTraCuuNhanSuTheoUser_` phải tìm nhân sự hợp lệ đang công tác. Danh sách username pilot chỉ là **cửa kiểm soát bổ sung**, chưa phải RBAC hoàn chỉnh.
4. Xác định Web App thật có cách trao đổi token qua cầu nối an toàn hoặc chỉ cho phép thao tác trong phiên origin EDOS; **GitHub Pages khác origin không thể tự lấy phiên EDOS**.
5. Kiểm tra Gemini model/khóa ở Script Properties máy chủ thử nghiệm. Không in/log khóa, token, prompt chứa thông tin riêng tư hoặc phản hồi nguyên văn nếu có dữ liệu nhạy cảm.

## III. Thiết lập bản GAS thử nghiệm

Đặt mã tại `handoff/HVA_EDOS_STUDIO_ACTION_PILOT.gs` vào **BẢN SAO** Apps Script sau khi kiểm tra không trùng hàm.

Script Properties cần có (chỉ đặt trên server):

| Khóa | Vai trò |
|---|---|
| `GEMINI_API_KEY` | Khóa Gemini trên máy chủ |
| `HVA_STUDIO_GEMINI_MODEL` | Model chính được kiểm thử (ví dụ `gemini-3.1-flash-lite`) |
| `HVA_STUDIO_GEMINI_FALLBACK_MODEL` | Model dự phòng tùy chọn, chỉ thử khi 503 |
| `HVA_STUDIO_TEST_USERS` | Danh sách username EDOS được cấp quyền thử nghiệm |
| `HVA_STUDIO_PILOT_SCOPE` | Mặc định chỉ mở giáo án Toán 10. Giá trị `approved_expanded` chỉ dùng khi nghiệp vụ và quyền đã được phê duyệt |

**Bản pilot không tự xác minh vai trò GV độc lập theo thuộc tính chuẩn** vì chưa được cung cấp cấu trúc nhân sự đã chuẩn hóa. Trước khi đưa vào vận hành phải kiểm tra vai trò/đơn vị/chức danh ngay tại server và giới hạn truy cập đúng phạm vi. Chưa có phần lưu học liệu bền vững.

## IV. Router – CHỈ là chỗ chèn thử sau khi đã kiểm tra router thật

Trong hàm xử lý POST của **bản thử**, phía sau tầng xác thực đang có và trước nhánh không nhận diện action, nối đúng một nhánh:

```js
if (String(payload.action || '') === 'hva_studio_ai_generate') {
  return nvsResp_(hvaStudioGeneratePilot_(payload));
}
```

`nvsResp_` là helper đang có trong một bản Backend được bàn giao trước; **nếu phiên bản thật không có hoặc khác hợp đồng thì phải điều chỉnh theo router thật**. Không được tạo thêm `doPost`, thay toàn bộ router, hoặc nhập code trực tiếp vào Backend production.

### Luồng phản hồi

**Thành công:**
```json
{"success":true,"answer":"BẢN NHÁP AI – GIÁO VIÊN CẦN THẨM ĐỊNH...","draft":true,"reviewRequired":true,"provider":"gemini","requestId":"studio-123456789012"}
```

**Thất bại:** `{success:false,code:"UNAUTHORIZED"|"FORBIDDEN"|"INVALID_INPUT"|"RATE_LIMIT"|"REPLAY"|"PROVIDER_UNAVAILABLE"|"SERVER_ERROR",message:"..."}`.

Không trả khóa, access token, stack trace hoặc bản prompt gốc ra ngoài.

## V. Cầu nối EDOS → Studio

**Không thực hiện các cách sau:** đặt sessionToken trong query/fragment URL; `postMessage` bừa bãi với `*`; để Studio đọc localStorage EDOS; đặt API key hay bridge token trong JavaScript tĩnh; gắn `window.HVA_STUDIO_AUTHORIZED_SEND` toàn cục từ một file Github không được xác thực.

**Hướng khuyến nghị để triển khai thực tế:** tạo điểm mở Studio từ vùng ứng dụng **đang được EDOS xác thực**, kết hợp một lớp bridge cùng origin EDOS hoặc một backend riêng kiểm soát phiên, xác minh origin, CSRF, CORS và phạm vi quyền. Một phương án an toàn là dùng authorization code dùng một lần với PKCE/cơ chế ràng buộc người nhận, đổi mã qua kênh server-to-server; site tĩnh thuần túy không thể tự giữ client secret. Mã ủy quyền cũng là thông tin nhạy cảm; không đưa vào nhật ký hay truyền bằng URL nếu quy chuẩn triển khai cấm truyền mã qua URL.

Sau khi có cầu nối, EDOS cung cấp hàm `authorizedSend(request)` qua kênh đã xác thực; Kim Quy 2 kết nối `generateWithEdos`. Backend mới là nơi xác định actor, quyền, quota; không tin vào cờ `STUDIO_AI_READY`.

**Nếu chưa có phương án cầu nối qua origin/Backend đáng tin cậy:** giữ `STUDIO_AI_READY=false`, không bật nút Gemini thật cho giáo viên trên site tĩnh.

## VI. Lưu học liệu theo tài khoản

Chưa có tuyến lưu học liệu bền vững. Đề xuất dữ liệu tối thiểu:
```json
{
  "documentId":"server-id",
  "ownerPersonId":"server-resolved",
  "taskType":"lesson_plan",
  "program":"GDPT_2018",
  "subject":"Toán",
  "grade":"10",
  "topic":"Mệnh đề và tập hợp",
  "content":"Markdown draft",
  "status":"DRAFT",
  "revision":1,
  "createdAt":"server-timestamp",
  "updatedAt":"server-timestamp"
}
```
Tạo các action **đề xuất** `hva_studio_save_draft`, `hva_studio_list_mine`, `hva_studio_get_draft`, `hva_studio_update_draft` và `hva_studio_export_document`; cần kiểm soát owner, revision, xung đột cập nhật, quota bộ nhớ và quyền khi phát hành. Tên action là thiết kế, chưa được triển khai.

Học liệu có bản nháp AI phải được **GV xem – chỉnh sửa – thẩm định** trước khi công bố. Xuất Word/PDF theo chuẩn hồ sơ điện tử HVA nhưng lựa chọn mẫu **giáo án, phiếu học tập, đề kiểm tra** phù hợp; không máy móc gắn quốc hiệu vào từng phiếu.

## VII. Kiểm thử đã thực hiện và chờ thực hiện

**Kiểm thử mô phỏng đã thực hiện trực tiếp với code pilot:**
- JavaScript parse PASS.
- Không phiên `UNAUTHORIZED`.
- Yêu cầu hợp lệ từ username được cấp thử trả `success:true`, `draft:true`, `reviewRequired:true` với mô phỏng HTTP 200 của Gemini.
- Gửi lặp requestId trả `REPLAY`.
- Loại học liệu không hợp lệ trả `INVALID_INPUT`.

**Chưa thực hiện:**
- Dán vào router Web App thử nghiệm thực và gọi Gemini thật qua action này.
- Kiểm thử phiên EDOS ↔ Studio giữa hai origin.
- Kiểm thử quyền giáo viên thật, phản hồi 429/503, quota thực tế, lưu/mở lại từ thiết bị khác.
- Hồi quy toàn bộ EDOS các phân hệ PASS và nghiệm thu xuất DOCX/PDF.

## VIII. Phối hợp

**Kim Quy Pro:** nhận Backend, bảo mật, SSO, kho lưu trữ và kiểm thử kết nối.

**Kim Quy 2:** giữ giao diện Studio, chuẩn học liệu, kiểm định sản phẩm; cần bàn giao mẫu JSON request đúng loại và bộ ca kiểm thử quy trình sản xuất học liệu.

**Chốt:** Có module Backend pilot kiểm thử bằng mock. Chưa triển khai action lên GAS; chưa có Gemini chạy thật từ UI Studio, không được gắn nhãn PASS.
