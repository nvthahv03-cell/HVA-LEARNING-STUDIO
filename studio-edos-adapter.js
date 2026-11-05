/**
 * HVA LEARNING STUDIO — Hợp đồng adapter EDOS, bản chưa kích hoạt.
 * Không thực hiện fetch, không giữ sessionToken/API key/bridgeToken trong trình duyệt.
 * Backend EDOS phải xác thực phiên và quyền độc lập.
 */
export const STUDIO_AI_ACTION = 'hva_studio_ai_generate';
export const STUDIO_AI_READY = false; // CHỈ bật sau kiểm thử tích hợp EDOS thật.

const TASKS = Object.freeze({
  lesson_plan: 'Kế hoạch bài dạy',
  slides: 'Bài giảng trình chiếu',
  worksheet: 'Phiếu học tập',
  question_bank: 'Ngân hàng câu hỏi',
  exam: 'Đề kiểm tra',
  infographic: 'Học liệu trực quan',
  game: 'Trò chơi giáo dục',
  video_script: 'Kịch bản video học liệu'
});
const PROGRAMS = ['GDPT_2018','HSG_THANH_PHO','HSG_QUOC_GIA'];
const SUBJECTS = ['Toán','Ngữ văn','Tiếng Anh','Vật lí','Hóa học','Sinh học','Lịch sử','Địa lí','Tin học','Công nghệ','GD Kinh tế và Pháp luật','Giáo dục thể chất','GDQP&AN','Hoạt động trải nghiệm'];
const tidy = x => typeof x === 'string' ? x.trim() : '';
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);

export function validateStudioTask(task) {
  if (!task || typeof task !== 'object' || Array.isArray(task)) throw Error('Yêu cầu học liệu không hợp lệ.');
  const taskType=tidy(task.taskType), program=tidy(task.program),
    subject=tidy(task.subject), grade=String(task.grade ?? ''), topic=tidy(task.topic),
    input=tidy(task.input), outputFormat=tidy(task.outputFormat||'markdown');
  if (!own(TASKS,taskType)) throw Error('Loại học liệu chưa được hỗ trợ.');
  if (!PROGRAMS.includes(program)) throw Error('Chưa xác định đúng chế độ chương trình.');
  if (!SUBJECTS.includes(subject) || !['10','11','12'].includes(grade)) throw Error('Môn học hoặc lớp chưa được hỗ trợ.');
  if (!topic || topic.length>300) throw Error('Tên chủ đề không hợp lệ.');
  if (!input || input.length>12000) throw Error('Yêu cầu học liệu phải có nội dung và không quá 12.000 ký tự.');
  if (outputFormat!=='markdown') throw Error('Chỉ hỗ trợ bản nháp Markdown ở giai đoạn này.');
  // Không sao chép bất kỳ trường do trình duyệt tự khai báo nào về quyền, model, khóa.
  return {action:STUDIO_AI_ACTION,taskType,program,subject,grade,topic,input,outputFormat};
}

export function makeStudioRequest(task, requestId) {
  const id=tidy(requestId);
  if (!/^studio-[A-Za-z0-9-]{12,96}$/.test(id)) throw Error('Mã yêu cầu không hợp lệ.');
  return {...validateStudioTask(task),requestId:id};
}

export function normalizeStudioAnswer(response, expectedRequestId) {
  if (!response || typeof response!=='object'||Array.isArray(response)) throw Error('Phản hồi máy chủ không hợp lệ.');
  if (response.success!==true) return {success:false,message:tidy(response.message).slice(0,250)||'Không thể tạo học liệu. Vui lòng thử lại.',draft:true,reviewRequired:true};
  if (response.requestId!==expectedRequestId) throw Error('Phản hồi không khớp mã yêu cầu.');
  if (response.draft!==true || response.reviewRequired!==true) throw Error('Backend phải đánh dấu học liệu là bản nháp cần thẩm định.');
  if (typeof response.answer!=='string' || !response.answer.trim() || response.answer.length>300000) throw Error('Nội dung trả về không hợp lệ.');
  return {success:true,answer:response.answer,draft:true,reviewRequired:true,requestId:response.requestId,provider: response.provider==='gemini'?'gemini':response.provider==='openai'?'openai':'không xác định'};
}

/**
 * Sau khi có SSO chính thức, EDOS sẽ cấp một hàm authorizedSend bằng cơ chế
 * ủy quyền đã được kiểm chứng. Hàm này thuộc lớp kết nối an toàn, KHÔNG phải
 * fetch trực tiếp từ GitHub Pages, không lấy token từ URL hoặc localStorage.
 * Hiện tại mọi lời gọi được CHẶN.
 */
export async function generateWithEdos(task, authorizedSend) {
  if (!STUDIO_AI_READY) return {success:false,message:'Trợ lý AI đang chờ kết nối phiên an toàn với EDOS.',draft:true,reviewRequired:true};
  if (typeof authorizedSend!=='function') return {success:false,message:'Chưa có kết nối EDOS được xác thực.',draft:true,reviewRequired:true};
  const id='studio-'+crypto.randomUUID();
  const request=makeStudioRequest(task,id);
  // Chỉ EDOS được cung cấp và xác minh phiên; không truyền token vào giao diện Studio.
  return normalizeStudioAnswer(await authorizedSend(request),id);
}
