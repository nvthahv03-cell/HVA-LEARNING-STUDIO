/* HVA MATH EDITOR – self-contained, no backend secrets. */
(function(){
'use strict';
const el=id=>document.getElementById(id);
let selection=null;
const report=s=>{if(el('hvaMathStatus'))el('hvaMathStatus').textContent=s};
function field(){return el('hvaMathField')}
function insertTemplate(latex){
 const m=field();if(!m)return;
 try{if(typeof m.insert==='function')m.insert(latex,{selectionMode:'placeholder'});else m.value=latex;m.focus();report('Đã nạp ký hiệu. Bấm “Chèn công thức” để đưa vào bản nháp.')}
 catch(e){report('Chưa nạp được bộ ký hiệu. Kiểm tra kết nối tải MathLive.')}
}
function load(){
 const a=el('content'),m=field();if(!a||!m)return;
 const pos=a.selectionStart,txt=a.value;
 const matches=[...txt.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)];
 const found=matches.find(x=>x.index<=pos&&x.index+x[0].length>=pos);
 if(!found){selection=null;report('Đặt con trỏ trong công thức \\(…\\) hoặc \\[…\\] tại ô Nội dung dự thảo.');a.focus();return}
 selection={start:found.index,end:found.index+found[0].length,source:found[0],display:found[0].startsWith('\\[')};
 m.value=found[1]!==undefined?found[1]:found[2];
 report('Đã nạp công thức. Sửa ở ô Toán rồi bấm Chèn để thay thế công thức cũ.');m.focus();
}
function insert(display){
 const a=el('content'),m=field();if(!a||!m)return;
 const latex=String(m.value||'').trim();
 if(!latex||latex.length>12000){report('Công thức trống hoặc quá 12.000 ký tự.');return}
 let start=a.selectionStart,end=a.selectionEnd;
 if(selection&&a.value.slice(selection.start,selection.end)===selection.source){
  start=selection.start;end=selection.end;display=selection.display;
 }
 const content=display?'\n\\['+latex+'\\]\n':'\\('+latex+'\\)';
 a.setRangeText(content,start,end,'end');
 a.dispatchEvent(new Event('input',{bubbles:true}));
 selection=null;report('Đã chèn công thức LaTeX. Có thể lưu bản nháp và mở lại để sửa.');a.focus();
 if(!el('hvaMathPreviewBox').classList.contains('hidden'))renderPreview();
}
async function renderPreview(){
 const source=el('content').value,view=el('hvaMathPreview');
 if(source.length>180000){report('Bản nháp quá dài để xem trước.');return}
 if(window.MathJax&&typeof window.MathJax.typesetClear==='function')window.MathJax.typesetClear([view]);
 view.textContent=source||'Chưa có nội dung học liệu.';
 try{
  if(window.MathJax&&typeof window.MathJax.typesetPromise==='function'){
   await window.MathJax.typesetPromise([view]);
   report('Đã xem trước công thức. Mã LaTeX gốc trong bản nháp không thay đổi.');
  }else report('Chưa tải được MathJax. Bản nháp vẫn an toàn; hãy kiểm tra mạng.');
 }catch(e){report('Có công thức không render được. Kiểm tra cú pháp LaTeX.')}
}
function togglePreview(){const b=el('hvaMathPreviewBox');b.classList.toggle('hidden');if(!b.classList.contains('hidden'))renderPreview()}
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('[data-hva-math-template]').forEach(b=>b.addEventListener('click',()=>insertTemplate(b.dataset.hvaMathTemplate)));
});
window.hvaMathLoadAtCursor=load;
window.hvaMathInsert=insert;
window.hvaMathTogglePreview=togglePreview;
window.hvaMathRenderPreview=renderPreview;
})();
