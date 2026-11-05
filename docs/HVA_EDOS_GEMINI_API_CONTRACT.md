# HỢP ĐỒNG API – HVA LEARNING STUDIO ↔ HVA–EDOS
**Bàn giao Kim Quy Pro → Kim Quy 2 · 05/11/2026 · Không chứa khóa bí mật**

> **TRẠNG THÁI:** Bàn giao kỹ thuật theo mã Backend EDOS ngày 03/11/2026 và mã GitHub hiện có. **CHƯA TRIỂN KHAI** action dành riêng cho Studio; **CHƯA PASS** tích hợp SSO, Gemini Studio hoặc OpenAI dự phòng. Không dùng mẫu này để bật trên production khi chưa kiểm tra Backend thực.

## 1. Nguồn đối chiếu

1. EDOS (GitHub): `nvthahv03-cell/NghiepVuSo_THPT_Hoa_Vang/HVA_Assistant_Shared.js` – frontend hiện có hai API `ask(...)`, `draftReport(...)` và lấy token từ phiên trình duyệt EDOS.
2. Bản Backend do nhà trường cung cấp: `HVA_EDOS_Backend_TichHop_Chat_20261103.gs` – các router `doPost`, `nvsIntegratedPost_`, `nvsActor_`, `nvsAssistantGeminiV1_`, `nvsReportAIDraft_`, `nvsGeminiFallbackV441_`, `HVA_MEETING_AI_V1`. Đây là **bản tệp đối chiếu ngày 03/11**, không phải xác nhận bản triển khai hiện thời.
3. Module độc lập `HVA_AI_SERVICE_GEMINI_V2.gs` – `HVA_AI_SERVICE.ask({question})` đã được xây dựng. Một bản Backend tổng hợp ngày 03/11 cũng có tên `HVA_AI_SERVICE` sử dụng OpenAI; vì thế **không nạp đè object hoặc giả định object Gemini V2 đang chạy trong cùng Backend**.
4. Ghi nhận thiết kế từ Kim Quy 2: `BAN_GIAO_KIM_QUY_PRO.md`, Studio đã dự kiến action `hva_studio_ai_generate` và giao thức server-to-server, nhưng chưa có xác nhận endpoint được triển khai.

## 2. Dịch vụ có thực trong mã Backend đã đối chiếu

| Action / hàm | Đầu vào | Đầu ra thành công | Kiểm soát |
|---|---|---|---|
| `askVirtualAssistant` → `nvsAssistantGeminiV1_(p,actor)` | `question` (hoặc `prompt`), `context`, `sessionToken` | `{success:true,answer:string,draft:true,context:string}`; có thể có `mathVerification` | Cần phiên máy chủ và hồ sơ nhân sự |
| `generateReportAIDraft` → `nvsReportAIDraft_(p,actor)` | `prompt`, `reportType`, `sessionToken` | Dự thảo văn bản `draft` | Phiên máy chủ |
| `generateMeetingAIDraft` → `nvsMeetingAIDraft_(p)` | `prompt`, `sessionToken` | Dự thảo `draft` JSON | Router chỉ cho nhóm quản lý |
| `HVA_MEETING_AI_V1.generate(payload,identity)` | `prompt` (<= 3.000 ký tự), danh tính từ router | `{success:true,draft:{title,content,note,date,startTime,endTime,meetingMode,place,chairperson,secretary,attendeeSuggestion,warnings}}` | Nội bộ Apps Script |

Frontend đang dùng đường `POST` đến Web App EDOS, header `Content-Type: text/plain;charset=utf-8`, body JSON với action và sessionToken; cần xác minh trình duyệt chạy thật trong môi trường Studio vì **Studio trên domain GitHub Pages khác không tự đọc được sessionStorage/localStorage EDOS**.

**Thông số đã thấy trong mã:** `GEMINI_API_KEY` được đọc trong `PropertiesService.getScriptProperties()` (tuyệt đối không cung cấp giá trị). Model chính ở tuyến NVS từ `GEMINI_MEETING_MODEL` hoặc giá trị mặc định tại mã; tuyến chuyển Gemini khác sử dụng `NVS_GEMINI_FALLBACK_MODEL`, chỉ khi lỗi 429/503. Tuyến Gemini V2 độc lập dùng `GEMINI_ASSISTANT_MODEL`. **Tên biến cấu hình không phải bằng chứng model thực tế đang chạy.**

## 3. Hợp đồng API MỚI đề xuất cho Learning Studio (CHƯA CÓ TRÊN ROUTER)

**Tên action thống nhất với Kim Quy 2:** `hva_studio_ai_generate`.

```json
{
  "action": "hva_studio_ai_generate",
  "sessionToken": "<EDOS_SESSION_TOKEN_AT_RUNTIME>",
  "taskType": "lesson_plan",
  "program": "GDPT_2018",
  "subject": "Toán",
  "grade": "12",
  "topic": "Khảo sát sự biến thiên của hàm số",
  "input": "Tạo dàn ý bài giảng theo yêu cầu...",
  "outputFormat": "markdown",
  "requestId": "studio-unique-request-id"
}
```

**Quy tắc:** `sessionToken` trên đây chỉ là placeholder, không được đưa token thật vào GitHub, đường dẫn URL, nhật ký, ảnh chụp hoặc tài liệu. Giao diện Studio chỉ lấy token qua cơ chế SSO/ủy quyền đã triển khai; không tự đọc bộ nhớ trang EDOS ở origin khác. `taskType`/môn/lớp/chế độ phải được phía server kiểm tra và giới hạn. Không cho client điều khiển tùy ý `model`, `systemInstruction`, API key hoặc URL dịch vụ AI. Các yêu cầu về định dạng sẽ do server quyết định.

**Phản hồi thành công đề xuất:**
```json
{
  "success": true,
  "answer": "Bản nháp học liệu...",
  "draft": true,
  "reviewRequired": true,
  "requestId": "studio-unique-request-id",
  "provider": "gemini"
}
```

**Phản hồi lỗi đề xuất:** `{ "success": false, "message": "Phiên không hợp lệ hoặc không có quyền." }`. Các mã lỗi nội bộ, thông tin model, hạn mức và log phải được xử lý an toàn, không trả khóa hoặc stack trace cho trình duyệt.

**Những giá trị không được tin từ client:** `username`, `role`, `className`, `isAdmin`, `apiKey`, `bridgeToken`, `systemInstruction`, `model`. Người dùng có thể chọn loại học liệu và môn/lớp nhưng phía server phải xác thực quyền tương ứng.

## 4. Cơ chế xác thực & phân quyền bắt buộc

Backend bản 03/11 có `nvsActor_(p)`: truy vấn `CacheService.getScriptCache()` theo khóa `NVS_MEET_SESSION_ + sessionToken`, phiên được cấp khi đăng nhập có TTL 21.600 giây. Đây là phiên **server-side**, không phải việc tin vào `username` từ JSON của trình duyệt. Với Studio phải kiểm tra hồ sơ nhân sự `hvaTraCuuNhanSuTheoUser_(actor.username)` và quyền dùng Studio.

### Hai phương án kết nối

**Ưu tiên A – phiên EDOS hợp lệ:** Mở Studio từ EDOS bằng cơ chế SSO chính thức. Vì hai trang hiện khác origin, phải có quy trình cấp quyền từ EDOS sang Studio (ví dụ mã ủy quyền một lần, TTL ngắn, ràng buộc đích và xác minh trên máy chủ). Không truyền sessionToken trong querystring, localStorage công khai, referrer hoặc postMessage không kiểm tra origin. Chỉ sau khi hoàn thiện trao đổi phiên mới bật action Studio.

**B – server-to-server:** Chỉ phù hợp nếu Studio có một backend riêng giữ được bí mật. Khi đó backend Studio xác thực người dùng của mình và gọi backend EDOS bằng chứng thực máy-chủ đã cấp và ràng buộc theo danh tính/quyền người dùng; EDOS kiểm tra signature/token, thời hạn, chống phát lại và phạm vi quyền. `HVA_STUDIO_BRIDGE_TOKEN` nếu dùng **chỉ lưu trong Script Properties hoặc kho bí mật máy chủ**, tuyệt đối không đặt trong HTML/JS GitHub Pages. Mã nguồn Studio hiện là site tĩnh nên **chưa đủ điều kiện dùng phương án này**.

Không dùng action `askVirtualAssistant` cho mọi loại học liệu một cách mù quáng: instruction của action đó viết cho trợ lý NVS, context giới hạn ở các nhóm nghiệp vụ, không phải xưởng sản xuất học liệu.

## 5. Bộ xử lý Backend mới – mã giả để triển khai sau kiểm thử

```javascript
// MÃ MINH HỌA – KHÔNG dán chạy vào production khi chưa kiểm tra router.
function hvaStudioGenerate_(p, actor) {
  // actor phải do nvsActor_(p) xác nhận ở router, KHÔNG lấy từ p.username.
  if (!actor || !actor.username) {
    return { success:false, message:'Phiên đăng nhập không hợp lệ.' };
  }
  const staff = hvaTraCuuNhanSuTheoUser_(actor.username);
  if (!staff || !studioAuthorized_(staff)) {
    return { success:false, message:'Không có quyền sử dụng Học liệu số.' };
  }
  // Cần triển khai: giới hạn tần suất / dung lượng, chống spam,
  // allowlist taskType, outputFormat, subject/grade và chính sách nội dung.
  const request = buildStudioGeminiRequest_(p, staff); // hệ thống tự đặt instruction
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const model = getAllowedStudioModel_(); // cấu hình chỉ ở máy chủ
  const call = nvsGeminiFallbackV441_(request, key, model);
  // Cần triển khai: kiểm tra HTTP, parse candidates[].content.parts[].text,
  // xử lý safety/finishReason; không ghi dữ liệu nếu chưa được phép.
  return normalizeStudioDraft_(call);
}
```

Cần thêm `action === 'hva_studio_ai_generate'` vào router **sau xác thực**, trên bản thử riêng. Các hàm `studioAuthorized_`, `buildStudioGeminiRequest_`, `getAllowedStudioModel_`, `normalizeStudioDraft_` chỉ là tên đề xuất, **chưa tồn tại**.

## 6. Giới hạn nhằm giữ nguyên những gì đã PASS

- Không sửa hoặc nạp đè `doGet/doPost`, `CONFIG`, `HVA_AI_SERVICE`, `HVA_MEETING_AI_V1`, `nvsIntegratedPost_` trên production khi chưa kiểm toán namespace. Mỗi Apps Script project không nên có router trùng tên.
- Không chia sẻ giá trị `GEMINI_API_KEY`, `OPENAI_API_KEY`, sessionToken hay bridgeToken; không ghi prompt nhạy cảm vào log.
- Không tự động lưu/phát hành học liệu, không tự động đưa nội dung AI vào văn bản trường hay CSDL học sinh. Giáo viên thẩm định kiến thức, mức độ, đáp án và bản quyền trước khi sử dụng.
- Tách quota, giới hạn số lần gọi, tần suất, lỗi và nhật ký cho Studio; tránh làm cạn hạn mức Gemini ảnh hưởng Trợ lý, Báo cáo và Cuộc họp đang chạy.
- Chỉ dùng kết quả Gemini để tạo **bản nháp**; có quy trình phản biện, đối chiếu với chương trình GDPT 2018, chuẩn đề và minh chứng.
- OpenAI là **đề xuất đối chiếu/dự phòng** cho Studio, hiện không có bằng chứng rằng fallback OpenAI dùng chung đã PASS trong backend. Nếu kích hoạt, tạo adapter máy chủ riêng với quyền, quota và cơ chế chọn chuyển rõ ràng, không tự coi module cuộc họp OpenAI là fallback chung.

## 7. Kiểm thử nghiệm thu trước khi bật chính thức

1. Chặn hoàn toàn request không có phiên / phiên hết hạn / sai quyền / sai origin / action giả mạo.
2. Kiểm tra từ EDOS mở Studio và xử lý phiên đúng trên trình duyệt máy tính, điện thoại.
3. Ứng dụng Studio thử với giáo viên kiểm thử, không dùng dữ liệu học sinh thật.
4. Chặn prompt quá dài, gửi lặp lại; kiểm tra tần suất, phí và phản hồi lỗi 429/503/5xx.
5. Đối chiếu Gemini bình thường, Gemini fallback, OpenAI đối chiếu (nếu sau này được phê duyệt).
6. Kiểm tra hồi quy các chức năng đã PASS: đăng nhập EDOS, báo cáo DTHT, báo cáo chủ nhiệm, AI cuộc họp, phát hành và lịch.
7. Chỉ gộp/publish khi có kết quả thử thực tế, sao lưu và xác nhận của nhà trường.

## 8. Phân công

**Kim Quy Pro / EDOS:** xác minh phiên bản Backend thật, xây dựng và thử action riêng, giữ khóa trong Apps Script, xác thực và phân quyền, giám sát quota/log.

**Kim Quy 2 / Learning Studio:** dùng contract này để viết adapter và giao diện, KHÔNG tự gửi bridgeToken qua frontend; hiển thị trạng thái “Đang kết nối” trước khi server xác nhận; gắn yêu cầu thẩm định nội dung cho giáo viên.

**Kết luận:** Có cơ sở kỹ thuật để tích hợp. **Chưa PASS kết nối Studio với Gemini EDOS**. Cần test môi trường và kiểm toán trước khi triển khai.
