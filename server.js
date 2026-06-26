const express=require('express');
const multer=require('multer');
const {exec}=require('child_process');
const fs=require('fs');
const path=require('path');
const app=express();
const upload=multer({dest:'uploads/'});
app.use(express.static('public'));
app.post('/convert',upload.single('video'),(req,res)=>{
 const inFile=req.file.path;
 const outFile=path.join('uploads',req.file.filename+'.mp4');
 const cmd=`ffmpeg -y -i "${inFile}" -c:v libx264 -c:a aac "${outFile}"`;
 exec(cmd,e=>{
   if(e)return res.status(500).send('Erro');
   res.download(outFile,'video_convertido.mp4',()=>{
     try{fs.unlinkSync(inFile);fs.unlinkSync(outFile);}catch{}
   });
 });
});
app.listen(process.env.PORT||3000);