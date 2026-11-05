import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStudioTask,makeStudioRequest,normalizeStudioAnswer,generateWithEdos,STUDIO_AI_READY} from '../studio-edos-adapter.js';
const task={taskType:'lesson_plan',program:'GDPT_2018',subject:'Toán',grade:'10',topic:'Mệnh đề và tập hợp',input:'Soạn giáo án Toán 10 theo yêu cầu cần đạt.',outputFormat:'markdown'};
test('Validate one allowed test lesson plan',()=>{
 const v=validateStudioTask(task);
 assert.equal(v.action,'hva_studio_ai_generate');
 assert.equal(v.subject,'Toán');
 assert.ok(!('sessionToken' in v));
});
test('Reject unsupported task and privileged fields',()=>{
 assert.throws(()=>validateStudioTask({...task,taskType:'admin_task'}));
 const v=validateStudioTask({...task,apiKey:'secret',role:'admin',username:'fake',model:'custom'});
 for(const key of ['apiKey','role','username','model'])assert.ok(!(key in v));
});
test('Reject unsafe or mismatched responses',()=>{
 const id='studio-123456789012';
 assert.throws(()=>normalizeStudioAnswer({success:true,answer:'X',requestId:'studio-wrong',draft:true,reviewRequired:true},id));
 assert.throws(()=>normalizeStudioAnswer({success:true,answer:'X',requestId:id,draft:false,reviewRequired:true},id));
 assert.throws(()=>normalizeStudioAnswer({success:true,answer:'',requestId:id,draft:true,reviewRequired:true},id));
});
test('Valid Gemini result remains draft requiring teacher approval',()=>{
 const id='studio-123456789012',v=normalizeStudioAnswer({success:true,answer:'BẢN NHÁP AI – GIÁO VIÊN CẦN THẨM ĐỊNH',requestId:id,draft:true,reviewRequired:true,provider:'gemini'},id);
 assert.equal(v.provider,'gemini');assert.equal(v.reviewRequired,true);assert.equal(v.draft,true);
});
test('No authorized bridge does not call AI',async()=>{
 const v=await generateWithEdos(task,null);
 assert.equal(v.success,false);assert.equal(STUDIO_AI_READY,false);
});
