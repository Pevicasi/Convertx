module.exports = {
  mp4: {
    extension: 'mp4',
    type: 'video',
    args: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart']
  },
  avi: {
    extension: 'avi',
    type: 'video',
    args: ['-c:v', 'mpeg4', '-vtag', 'XVID', '-qscale:v', '4', '-bf', '0', '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2']
  },
  mkv: {
    extension: 'mkv',
    type: 'video',
    args: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k']
  },
  mov: {
    extension: 'mov',
    type: 'video',
    args: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k']
  },
  webm: {
    extension: 'webm',
    type: 'video',
    args: ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-c:a', 'libopus', '-b:a', '96k']
  },
  mp3: {
    extension: 'mp3',
    type: 'audio',
    args: ['-vn', '-c:a', 'libmp3lame', '-b:a', '192k']
  },
  aac: {
    extension: 'aac',
    type: 'audio',
    args: ['-vn', '-c:a', 'aac', '-b:a', '160k']
  },
  wav: {
    extension: 'wav',
    type: 'audio',
    args: ['-vn', '-c:a', 'pcm_s16le']
  },
  ogg: {
    extension: 'ogg',
    type: 'audio',
    args: ['-vn', '-c:a', 'libvorbis', '-q:a', '5']
  },
  corolla: {
    extension: 'avi',
    type: 'video',
    label: 'Corolla XEi 2013/2014',
    args: [
      '-vf', 'scale=640:360:flags=lanczos,setsar=1,setdar=16/9,fps=30000/1001,format=yuv420p',
      '-c:v', 'mpeg4', '-vtag', 'XVID', '-qscale:v', '4', '-bf', '0', '-g', '300',
      '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2',
      '-f', 'avi'
    ]
  }
};
