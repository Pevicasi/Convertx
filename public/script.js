const f=document.getElementById('video');const s=document.getElementById('status');
document.getElementById('converter').onclick=async()=>{
if(!f.files.length)return alert('Selecione um vídeo');
let d=new FormData();d.append('video',f.files[0]);s.textContent='Convertendo...';
const r=await fetch('/convert',{method:'POST',body:d});
if(!r.ok){s.textContent='Erro';return;}
const b=await r.blob();const u=URL.createObjectURL(b);
let a=document.createElement('a');a.href=u;a.download='video_convertido.mp4';a.click();
URL.revokeObjectURL(u);s.textContent='Concluído';
};