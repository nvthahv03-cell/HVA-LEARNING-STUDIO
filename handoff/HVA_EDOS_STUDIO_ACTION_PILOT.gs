/**
 * HVA–EDOS ↔ HVA LEARNING STUDIO — action thử nghiệm do Kim Quy Pro chuẩn bị.
 * PHẠM VI: Chỉ ghép vào BẢN SAO Backend EDOS, SAU KHI đối chiếu router thật.
 * Không định nghĩa doGet/doPost, không ghi đè CONFIG hoặc dịch vụ AI đã PASS.
 *
 * Contract: action hva_studio_ai_generate
 * Requires existing server funcs: nvsActor_(payload), hvaTraCuuNhanSuTheoUser_(username).
 * Requires Apps Script services: PropertiesService, CacheService, LockService, UrlFetchApp.
 * Server-side Script Properties: GEMINI_API_KEY, HVA_STUDIO_GEMINI_MODEL,
 * HVA_STUDIO_TEST_USERS (comma-separated allowed EDOS usernames).
 * Note: calling server functions is NOT evidence the action is deployed.
 */
function hvaStudioGeneratePilot_(p) {
  var fail=function(code,msg){return {success:false,code:code,message:msg,draft:true,reviewRequired:true,requestId:typeof p?.requestId==='string'?p.requestId.slice(0,110):''};};
  try{
    if(!p||typeof p!=='object'||p.action!=='hva_studio_ai_generate')return fail('INVALID_ACTION','Yêu cầu không hợp lệ.');
    // This actor MUST originate from the existing EDOS session resolver, not from p.username, p.role or p.email.
    if(typeof nvsActor_!=='function'||typeof hvaTraCuuNhanSuTheoUser_!=='function')return fail('NOT_CONFIGURED','Máy chủ thử nghiệm chưa có dịch vụ xác thực nhân sự.');
    var actor=nvsActor_(p);
    if(!actor||!actor.username)return fail('UNAUTHORIZED','Phiên không hợp lệ hoặc đã hết hạn.');
    var staff=hvaTraCuuNhanSuTheoUser_(actor.username);
    if(!staff)return fail('FORBIDDEN','Tài khoản không thuộc danh sách nhân sự được xác thực.');
    var props=PropertiesService.getScriptProperties();
    var usernames=String(props.getProperty('HVA_STUDIO_TEST_USERS')||'').split(',').map(function(x){return x.trim().toLowerCase();}).filter(Boolean);
    var username=String(actor.username).toLowerCase();
    if(usernames.indexOf(username)<0)return fail('FORBIDDEN','Tài khoản chưa được cấp quyền thử nghiệm Studio.');
    // Pilot allowlist is a server-side authorization control. When scaled, replace with RBAC/ABAC and active-role verification.
    var requestId=String(p.requestId||'').trim();
    if(!/^studio-[A-Za-z0-9-]{12,96}$/.test(requestId))return fail('INVALID_INPUT','Mã yêu cầu không hợp lệ.');
    var tasks=['lesson_plan','slides','worksheet','question_bank','exam','infographic','game','video_script'];
    var programs=['GDPT_2018','HSG_THANH_PHO','HSG_QUOC_GIA'];
    var subjects=['Toán','Ngữ văn','Tiếng Anh','Vật lí','Hóa học','Sinh học','Lịch sử','Địa lí','Tin học','Công nghệ','GD Kinh tế và Pháp luật','Giáo dục thể chất','GDQP&AN','Hoạt động trải nghiệm'];
    var type=String(p.taskType||''),program=String(p.program||''),subject=String(p.subject||''),grade=String(p.grade||'');
    var topic=String(p.topic||'').trim(),input=String(p.input||'').trim();
    if(tasks.indexOf(type)<0||programs.indexOf(program)<0||subjects.indexOf(subject)<0||['10','11','12'].indexOf(grade)<0)
      return fail('INVALID_INPUT','Loại học liệu, môn, lớp hoặc chương trình không được hỗ trợ.');
    if(String(p.outputFormat||'')!=='markdown'||!topic||topic.length>300||!input||input.length>12000)
      return fail('INVALID_INPUT','Định dạng hoặc nội dung yêu cầu không hợp lệ.');
    // Enforce the extra-restrictive scope from server config; never let the browser enable pilot features by itself.
    var allowAll=props.getProperty('HVA_STUDIO_PILOT_SCOPE')==='approved_expanded';
    if(!allowAll && !(type==='lesson_plan'&&program==='GDPT_2018'&&subject==='Toán'&&grade==='10'))
      return fail('PILOT_SCOPE','Đợt thử chỉ mở giáo án Toán lớp 10.');
    var key=String(props.getProperty('GEMINI_API_KEY')||'').trim();
    var model=String(props.getProperty('HVA_STUDIO_GEMINI_MODEL')||'gemini-3.1-flash-lite').trim();
    if(!key||!/^[a-zA-Z0-9._-]{3,100}$/.test(model))return fail('NOT_CONFIGURED','Gemini chưa cấu hình trên Backend thử nghiệm.');
    var hash=function(v){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v)).slice(0,40);};
    var cache=CacheService.getScriptCache(),lock=LockService.getScriptLock();
    var replayKey='HVA_STUDIO_R_'+hash(username+'|'+requestId);
    var quotaKey='HVA_STUDIO_Q_'+hash(username);
    if(!lock.tryLock(5000))return fail('BUSY','Hệ thống đang bận, vui lòng thử lại.');
    try {
      if(cache.get(replayKey))return fail('REPLAY','Mã yêu cầu đã được sử dụng.');
      var usage=Number(cache.get(quotaKey)||'0');
      if(!Number.isFinite(usage)||usage>=5)return fail('RATE_LIMIT','Đã hết 5 lượt thử trong 6 giờ.');
      cache.put(replayKey,'1',600);
      cache.put(quotaKey,String(usage+1),21600);
    } finally {lock.releaseLock();}
    var descriptions={lesson_plan:'Kế hoạch bài dạy',slides:'Dàn ý bài trình chiếu',worksheet:'Phiếu học tập',question_bank:'Ngân hàng câu hỏi',exam:'Đề kiểm tra',infographic:'Kịch bản học liệu trực quan',game:'Trò chơi giáo dục',video_script:'Kịch bản video'};
    var advanced=program==='GDPT_2018'?'':'Đây là chế độ nâng cao. Kiểm định mức độ, độ đúng toán học và tính phù hợp chương trình trước khi sử dụng.';
    var examRule=type==='exam'?'Trước khi soạn đề phải có ma trận và bảng đặc tả được giáo viên xác nhận. Nếu dữ liệu này chưa có trong yêu cầu, chỉ xuất đề nghị hoàn thiện ma trận và đặc tả, không sinh đề.':'';
    var systemText=[
      'Bạn là Trợ lý soạn '+descriptions[type]+' DỰ THẢO phục vụ giáo viên THPT Hòa Vang.',
      'Chương trình: '+program+'. Môn: '+subject+'. Lớp: '+grade+'.',
      advanced,examRule,
      'Không tự nhận đã đối chiếu nguyên văn chương trình hoặc tài liệu khi không được cung cấp.',
      'Không tạo dữ liệu học sinh thật, không phát hành, không phê duyệt, không tự đặt dấu và chữ ký.',
      'Cần nêu rõ các nội dung còn phải giáo viên xác minh về yêu cầu cần đạt, kiến thức và bản quyền.',
      'Chỉ trả về Markdown tiếng Việt, mở đầu: BẢN NHÁP AI – GIÁO VIÊN CẦN THẨM ĐỊNH.'
    ].filter(Boolean).join('\n');
    var prompt='Chủ đề: '+topic+'\nYêu cầu của giáo viên:\n'+input;
    var body={systemInstruction:{parts:[{text:systemText}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.25,maxOutputTokens:4800}};
    var models=[model];
    var fallback=String(props.getProperty('HVA_STUDIO_GEMINI_FALLBACK_MODEL')||'').trim();
    if(fallback&&fallback!==model&&/^[a-zA-Z0-9._-]{3,100}$/.test(fallback))models.push(fallback);
    var response=null,http=0,used=model,attempts=0;
    for(var i=0;i<models.length;i++){
      used=models[i];
      for(var j=0;j<2;j++){
        attempts++;
        response=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(used)+':generateContent',{
          method:'post',contentType:'application/json',headers:{'x-goog-api-key':key},payload:JSON.stringify(body),muteHttpExceptions:true
        });
        http=response.getResponseCode();
        if(http!==503)break;
        if(j===0)Utilities.sleep(800);
      }
      if(http!==503)break;
    }
    if(http===429)return fail('PROVIDER_RATE_LIMIT','Dịch vụ AI đang giới hạn lượt gọi.');
    if(http===503)return fail('PROVIDER_UNAVAILABLE','Dịch vụ AI tạm thời không sẵn sàng.');
    if(http<200||http>=300)return fail('PROVIDER_FAILURE','Chưa tạo được học liệu từ dịch vụ AI.');
    var raw=JSON.parse(response.getContentText());
    var answer=(raw.candidates||[]).flatMap(function(x){return x.content&&x.content.parts||[];}).map(function(x){return typeof x.text==='string'?x.text:'';}).join('\n').trim();
    if(!answer||answer.length>300000)return fail('EMPTY_ANSWER','Dịch vụ AI không trả nội dung hợp lệ.');
    return {success:true,answer:answer,draft:true,reviewRequired:true,provider:'gemini',requestId:requestId};
  }catch(e){
    // Never expose internal stack, prompts, username, API key, service URLs, or token in responses.
    return fail('SERVER_ERROR','Không thể xử lý yêu cầu tạo học liệu trong lần thử này.');
  }
}
