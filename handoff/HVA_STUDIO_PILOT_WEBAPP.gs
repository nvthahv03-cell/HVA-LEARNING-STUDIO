/**
 * HVA STUDIO - GEMINI PILOT WEBAPP (independent test project only).
 * Deploy "execute as user accessing", restrict access, configure:
 * GEMINI_API_KEY and HVA_STUDIO_TEST_EMAILS in Script Properties.
 * NEVER add to EDOS backend (this file defines doGet).
 */
function doGet() {
 return HtmlService.createHtmlOutputFromFile('StudioPilot')
  .setTitle('HVA Studio - Giao an Toan 10');
}
function hvaPilotAccount_(){
 var email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
 var list=String(PropertiesService.getScriptProperties().getProperty('HVA_STUDIO_TEST_EMAILS')||'')
  .split(',').map(x=>x.trim().toLowerCase());
 return email&&list.indexOf(email)>=0?email:'';
}
function hvaPilotStatus(){
 var email=hvaPilotAccount_();
 return {authorized:!!email,email:email,message:email?'Tai khoan thu nghiem hop le.':'Chua duoc cap quyen. Kiem tra HVA_STUDIO_TEST_EMAILS va Execute as user.'};
}
function hvaPilotGenerate(p){
 var fail=(status,message,extra)=>Object.assign({success:false,status:status,message:message},extra||{});
 var email=hvaPilotAccount_();
 if(!email)return fail('AUTH','Chua xac thuc tai khoan thu nghiem.');
 if(!p||p.taskType!=='lesson_plan'||p.subject!=='Toán'||String(p.grade)!=='10'||p.topic!=='Mệnh đề và tập hợp')return fail('INPUT','Chi ho tro giao an Toan 10 - Menh de va tap hop.');
 var id=String(p.requestId||''),input=String(p.input||'').trim();
 if(!/^studio-[a-zA-Z0-9-]{12,96}$/.test(id)||!input||input.length>2500)return fail('INPUT','Ma yeu cau hoac noi dung khong hop le.');
 var props=PropertiesService.getScriptProperties(),key=String(props.getProperty('GEMINI_API_KEY')||'').trim();
 if(!key)return fail('CONFIG','Chua co Gemini API Key tai may chu.');
 var primary=String(props.getProperty('HVA_STUDIO_GEMINI_MODEL')||'gemini-3.1-flash-lite').trim();
 if(!/^[a-zA-Z0-9._-]{3,90}$/.test(primary))return fail('CONFIG','Model khong hop le.');
 var hash=x=>Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,x)).slice(0,40);
 var cache=CacheService.getScriptCache(),q='STUDIO_Q_'+hash(email),r='STUDIO_ID_'+hash(email+'|'+id);
 var lock=LockService.getScriptLock();
 if(!lock.tryLock(5000))return fail('BUSY','May chu dang ban.');
 try{
  if(cache.get(r))return fail('REPLAY','Ma yeu cau da su dung.');
  var c=Number(cache.get(q)||0);
  if(c>=5)return fail('QUOTA','Da het 5 luot thu trong 6 gio.');
  cache.put(r,'1',600);cache.put(q,String(c+1),21600);
 }finally{lock.releaseLock()}
 var system=[
  'Soan ban nhap ke hoach bai day Toan 10: Menh de va tap hop, du kien 2 tiet.',
  'Dinh huong CT GDPT 2018, KHONG tu nhan da kiem chung nguyen van yeu cau can dat.',
  'Muc tieu: kien thuc, nang luc Toan hoc, pham chat. Thiet bi va hoc lieu.',
  'Hoat dong: khoi dong, hinh thanh kien thuc, luyen tap, van dung. Moi hoat dong co muc tieu,',
  'giao nhiem vu, to chuc, san pham, tieu chi danh gia, thoi luong.',
  'Vi du va dap an dung ve menh de, phu dinh, tap hop. Neu noi dung giao vien can tham dinh.',
  'Bat dau bang BẢN NHÁP AI – GIÁO VIÊN CẦN THẨM ĐỊNH. Viet tieng Viet Markdown.'
 ].join('\n');
 var body={systemInstruction:{parts:[{text:system}]},
  contents:[{role:'user',parts:[{text:input}]}],
  generationConfig:{temperature:0.2,maxOutputTokens:4500}};
 var models=[primary];if(primary!=='gemini-3.1-flash-lite')models.push('gemini-3.1-flash-lite');
 var http=0,attempts=0,used=primary,response=null;
 try{
  for(var m of models){
   used=m;
   for(var retry=0;retry<2;retry++){
    attempts++;
    response=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(m)+':generateContent',
      {method:'post',contentType:'application/json',headers:{'x-goog-api-key':key},
       payload:JSON.stringify(body),muteHttpExceptions:true});
    http=response.getResponseCode();
    if(http!==503)break;
    if(retry===0)Utilities.sleep(1200);
   }
   if(http!==503)break;
  }
  if(http<200||http>=300)return fail('GEMINI',http===503?'Gemini tam thoi khong san sang.':http===429?'Vuot han muc Gemini.':'Gemini tra loi HTTP '+http,{httpStatus:http,attempts:attempts});
  var parsed=JSON.parse(response.getContentText());
  var answer=(parsed.candidates||[]).flatMap(x=>x.content&&x.content.parts||[])
    .map(x=>typeof x.text==='string'?x.text:'').join('\n').trim();
  if(answer.length<200)return fail('CONTENT','Noi dung Gemini qua ngan.');
  return {success:true,answer:answer,requestId:id,draft:true,reviewRequired:true,provider:'gemini',modelUsed:used,attempts:attempts};
 }catch(e){return fail('CONNECTION','Khong goi duoc Gemini. Kiem tra ket noi va quyen script.')}
}
