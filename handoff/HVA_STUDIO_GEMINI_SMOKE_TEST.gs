/**
 * HVA LEARNING STUDIO — KIỂM TRA GEMINI THẬT TỪ APPS SCRIPT THỬ NGHIỆM.
 * Chạy hàm hvaStudioGeminiSmokeTest_ thủ công trong trình soạn thảo Apps Script.
 * KHÔNG có doGet/doPost; KHÔNG ghi bảng tính, không in API key hoặc token.
 * Chỉ gắn vào bản sao dự án thử nghiệm sau khi kiểm tra trùng hàm.
 * Phụ thuộc: nvsGeminiFallbackV441_(request,key,model).
 */
function hvaStudioGeminiSmokeTest_() {
  const props = PropertiesService.getScriptProperties();
  const key = String(props.getProperty('GEMINI_API_KEY') || '').trim();
  const model = String(props.getProperty('HVA_STUDIO_GEMINI_MODEL') ||
    props.getProperty('GEMINI_MEETING_MODEL') || 'gemini-2.5-flash').trim();
  if (!key) return {success:false,phase:'configuration',message:'Backend thử nghiệm chưa có GEMINI_API_KEY.'};
  if (!/^[A-Za-z0-9._-]+$/.test(model))
    return {success:false,phase:'configuration',message:'Tên mô hình không hợp lệ.'};
  if (typeof nvsGeminiFallbackV441_ !== 'function')
    return {success:false,phase:'integration',message:'Thiếu hàm gọi Gemini của Backend EDOS.'};
  const started = Date.now();
  try {
    const response = nvsGeminiFallbackV441_({
      contents:[{role:'user',parts:[{text:'Trả lời chính xác bằng một câu ngắn tiếng Việt: Hai cộng ba bằng bao nhiêu?'}]}],
      generationConfig:{temperature:0,maxOutputTokens:100}
    },key,model);
    const http = response && response.response && response.response.getResponseCode();
    if (!(http >= 200 && http < 300)) {
      return {
        success:false,phase:'gemini_http',httpStatus:http || null,
        modelAttempted:response && response.model || model,
        elapsedMs:Date.now()-started,
        message:'Gemini chưa phản hồi HTTP 2xx. Kiểm tra quyền khóa, hạn mức và tên model trong dự án thử nghiệm.'
      };
    }
    const body = JSON.parse(response.response.getContentText());
    const answer=(body.candidates||[]).flatMap(c=>c.content&&c.content.parts||[])
      .map(x=>typeof x.text==='string'?x.text:'').join(' ').trim();
    if (!answer) return {success:false,phase:'gemini_answer',httpStatus:http,elapsedMs:Date.now()-started,message:'HTTP thành công nhưng Gemini không trả văn bản.'};
    return {success:true,phase:'gemini_server',httpStatus:http,
      modelUsed:response.model||model,elapsedMs:Date.now()-started,
      answerPreview:answer.slice(0,120),
      message:'Gemini thật đã phản hồi trên máy chủ thử nghiệm; CHƯA chứng minh kết nối Studio.'};
  }catch(e){
    return {success:false,phase:'server_error',elapsedMs:Date.now()-started,
      message:'Không gọi được Gemini từ Apps Script thử nghiệm. Kiểm tra quyền UrlFetchApp và cấu hình.'};
  }
}

/**
 * Dùng nút Run và xem Nhật ký thực thi. Chỉ in trạng thái phi nhạy cảm.
 * Kết quả không chứa khóa API hay mã phiên.
 */
function hvaStudioRunGeminiSmokeTest_() {
  const report=hvaStudioGeminiSmokeTest_();
  console.log(JSON.stringify(report));
  return report;
}
