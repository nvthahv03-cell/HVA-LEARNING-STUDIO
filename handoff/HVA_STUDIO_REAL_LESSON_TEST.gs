/**
 * HVA LEARNING STUDIO — MỘT GIÁO ÁN TOÁN 10 BẰNG GEMINI THẬT
 *
 * Chạy DUY NHẤT trên bản sao Apps Script THỬ NGHIỆM (không đặt trong EDOS chính thức).
 * Dự án Apps Script THỬ NGHIỆM ĐỘC LẬP: chỉ cần dán tệp này và đặt
 * Script Properties GEMINI_API_KEY. Tùy chọn HVA_STUDIO_GEMINI_MODEL.
 * Không cần sao chép Backend EDOS hay thêm doPost.
 *
 * Không có doGet/doPost, không sửa Sheet, không đọc dữ liệu nhân sự,
 * không gửi khóa lên trình duyệt, không tự công bố học liệu.
 *
 * HƯỚNG DẪN: chọn hàm hvaStudioChayThuGiaoAnToan10 rồi bấm Run.
 * Hàm sử dụng Gemini thật, tạo một Google Docs BẢN NHÁP trong Drive của
 * người thực thi và trả URL cùng báo cáo phi nhạy cảm.
 */
function hvaStudioTaoGiaoAnToan10_() {
  const scriptProps=PropertiesService.getScriptProperties();
  const key=String(scriptProps.getProperty('GEMINI_API_KEY')||'').trim();
  const model=String(scriptProps.getProperty('HVA_STUDIO_GEMINI_MODEL')||'gemini-2.5-flash').trim();
  const fail=(step,message,extra)=>Object.assign({
    success:false,step:step,message:message
  },extra||{});
  if (!key) return fail('CONFIG','Thiếu GEMINI_API_KEY trong Script Properties của bản THỬ.');
  if (!/^[A-Za-z0-9._-]+$/.test(model)) return fail('CONFIG','Tên mô hình không hợp lệ.');

  const instructions=[
    'Bạn soạn BẢN NHÁP KẾ HOẠCH BÀI DẠY môn Toán lớp 10, chủ đề MỆNH ĐỀ VÀ TẬP HỢP.',
    'Viết tiếng Việt, theo định hướng phát triển phẩm chất và năng lực trong CT GDPT 2018.',
    'Không bịa trích dẫn nguyên văn yêu cầu cần đạt, số trang hoặc văn bản chưa được cung cấp.',
    'Nêu rõ nội dung giáo viên cần đối chiếu với chương trình chính thức và sách giáo khoa sử dụng.',
    'Bố cục: (1) Thông tin bài dạy và thời lượng dự kiến; (2) Mục tiêu gồm kiến thức,',
    'năng lực toán học, phẩm chất; (3) Thiết bị/học liệu; (4) Tiến trình: Khởi động,',
    'Hình thành kiến thức, Luyện tập, Vận dụng; mỗi hoạt động nêu mục tiêu, giao việc,',
    'sản phẩm dự kiến, tổ chức thực hiện và đánh giá; (5) Câu hỏi đánh giá/đáp án;',
    '(6) Điều chỉnh sau bài dạy; (7) Danh mục nội dung giáo viên cần xác minh.',
    'Đảm bảo toán đúng: phân biệt câu khẳng định có giá trị đúng/sai với câu hỏi;',
    'nêu ví dụ về mệnh đề phủ định; trình bày tập hợp bằng liệt kê hoặc tính chất đặc trưng.',
    'Nêu rõ các phần là đề xuất, không tự phê duyệt hoặc đưa lên hệ thống.',
    'Bắt đầu bằng dòng: BẢN NHÁP AI – GIÁO VIÊN CẦN THẨM ĐỊNH.',
    'Xuất nội dung Markdown có tiêu đề và các mục rõ ràng.'
  ].join('\n');
  const request={
    systemInstruction:{parts:[{text:instructions}]},
    contents:[{role:'user',parts:[{text:
      'Hãy tạo 01 kế hoạch bài dạy Toán 10 về Mệnh đề và tập hợp. '+
      'Dự kiến 2 tiết, có hoạt động khám phá, ví dụ chính xác, bài tập luyện tập và đáp án. '+
      'Đề xuất điều chỉnh phù hợp học sinh có mức độ tiếp thu khác nhau. '+
      'Không sử dụng dữ liệu học sinh hoặc thông tin cá nhân.'
    }]}],
    generationConfig:{temperature:0.25,maxOutputTokens:4800}
  };

  const started=Date.now();
  try {
    const apiResponse=UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',
      {method:'post',contentType:'application/json',
       headers:{'x-goog-api-key':key},payload:JSON.stringify(request),muteHttpExceptions:true});
    const status=apiResponse.getResponseCode();
    if(status<200||status>=300)
      return fail('GEMINI','Gemini trả HTTP không thành công. Kiểm tra model, hạn mức và quyền API.',
        {httpStatus:status,modelAttempted:model,elapsedMs:Date.now()-started});
    const result=JSON.parse(apiResponse.getContentText());
    const answer=(result.candidates||[]).flatMap(c=>c.content&&c.content.parts||[])
      .map(part=>typeof part.text==='string'?part.text:'').join('\n').trim();
    if(answer.length<500) return fail('CONTENT','Gemini phản hồi quá ngắn hoặc không có nội dung.',
      {httpStatus:status,chars:answer.length,elapsedMs:Date.now()-started});
    const name='HVA STUDIO - BAN NHAP GIAO AN TOAN 10 - '+
      Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','yyyyMMdd-HHmmss');
    const doc=DocumentApp.create(name);
    doc.getBody().setText(
      'BẢN NHÁP AI – GIÁO VIÊN CẦN THẨM ĐỊNH\n'+
      'Môn: Toán 10 | Chủ đề: Mệnh đề và tập hợp\n'+
      'Nguồn sinh: Gemini qua Apps Script THỬ NGHIỆM; chưa duyệt, chưa phát hành.\n\n'+answer);
    doc.saveAndClose();
    return {success:true,step:'GEMINI_AND_GOOGLE_DOC',
      httpStatus:status,modelUsed:model,
      elapsedMs:Date.now()-started,chars:answer.length,
      documentUrl:doc.getUrl(),draft:true,reviewRequired:true,
      message:'Gemini thật đã tạo giáo án và lưu bản nháp Google Docs. Chưa nối giao diện Studio.'};
  } catch(error) {
    // Cố ý không ghi lỗi gốc: URL nội bộ/chi tiết từ API có thể nhạy cảm.
    return fail('EXECUTION','Không hoàn tất việc tạo giáo án. Kiểm tra quyền Google Docs/UrlFetchApp và nhật ký quyền truy cập.',
      {elapsedMs:Date.now()-started});
  }
}

/** Chọn hàm này trong Run để thấy KẾT QUẢ KHÔNG NHẠY CẢM trong Execution log. */
function hvaStudioChayThuGiaoAnToan10() {
  const result=hvaStudioTaoGiaoAnToan10_();
  console.log(JSON.stringify(result));
  return result;
}
