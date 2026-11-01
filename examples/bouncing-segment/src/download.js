(function(){
'use strict';
document.getElementById('download-html').addEventListener('click',()=>{
 try{
  const copy=document.documentElement.cloneNode(true);
  copy.querySelectorAll('script:not([data-offline])').forEach(n=>n.remove());
  copy.querySelectorAll('base').forEach(n=>n.remove());
  const stage=copy.querySelector('#lesson-stage');if(stage)stage.innerHTML='';
  const nav=copy.querySelector('#step-nav');if(nav)nav.innerHTML='';
  const status=copy.querySelector('#download-status');if(status)status.textContent='';
  const blob=new Blob(['<!doctype html>\n'+copy.outerHTML],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='bouncing-segment-lesson.html';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  document.getElementById('download-status').textContent='已生成HTML文件。下载后可离线打开，重新从第1步开始。';
 }catch(e){document.getElementById('download-status').textContent='未能自动下载，请使用对话中的HTML下载链接。';}
});
})();
