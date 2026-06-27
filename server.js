const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

for (const dir of ["uploads", "output"]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 500 * 1024 * 1024 }
});

const jobs = {};

function tempoParaSegundos(t) {
  const partes = t.split(":");
  return Number(partes[0]) * 3600 + Number(partes[1]) * 60 + Number(partes[2]);
}

function limpar(arquivo) {
  try {
    if (arquivo && fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
  } catch {}
}

function nomeSeguro(nome) {
  return String(nome || "video")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 70);
}

app.post("/convert", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: "Nenhum vídeo enviado." });

  const id = crypto.randomBytes(8).toString("hex");
  const entrada = req.file.path;
  const nomeBase = nomeSeguro(path.parse(req.file.originalname).name);
  const saida = path.join("output", id + ".avi");

  jobs[id] = {
    status: "convertendo",
    progresso: 0,
    saida,
    nomeDownload: nomeBase + "_central.avi",
    erro: null
  };

  const ffmpeg = spawn("ffmpeg", [
    "-y",
    "-i", entrada,
    "-vf", "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2",
    "-r", "30000/1001",
    "-c:v", "libxvid",
    "-vtag", "XVID",
    "-q:v", "4",
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-ac", "2",
    "-ar", "44100",
    "-map_metadata", "-1",
    saida
  ]);

  let duracao = null;

  ffmpeg.stderr.on("data", data => {
    const texto = data.toString();

    const dur = texto.match(/Duration: (\d+:\d+:\d+\.\d+)/);
    if (dur) duracao = tempoParaSegundos(dur[1]);

    const atual = texto.match(/time=(\d+:\d+:\d+\.\d+)/);
    if (atual && duracao) {
      const segundos = tempoParaSegundos(atual[1]);
      jobs[id].progresso = Math.min(95, Math.round((segundos / duracao) * 100));
    }
  });

  ffmpeg.on("close", code => {
    limpar(entrada);

    if (code !== 0) {
      jobs[id].status = "erro";
      jobs[id].erro = "Erro na conversão.";
      limpar(saida);
      return;
    }

    jobs[id].status = "testando";
    jobs[id].progresso = 98;

    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height,r_frame_rate",
      "-show_entries", "format=format_name",
      "-of", "json",
      saida
    ]);

    let dados = "";
    ffprobe.stdout.on("data", d => dados += d.toString());

    ffprobe.on("close", probeCode => {
      if (probeCode !== 0) {
        jobs[id].status = "erro";
        jobs[id].erro = "Falha ao testar o vídeo convertido.";
        limpar(saida);
        return;
      }

      try {
        const info = JSON.parse(dados);
        const stream = info.streams && info.streams[0];
        const formato = info.format && info.format.format_name;

        if (
          formato &&
          formato.includes("avi") &&
          stream &&
          stream.codec_name === "mpeg4" &&
          Number(stream.width) === 640 &&
          Number(stream.height) === 360
        ) {
          jobs[id].status = "concluido";
          jobs[id].progresso = 100;
        } else {
          jobs[id].status = "erro";
          jobs[id].erro = "O vídeo não ficou no padrão da central.";
          limpar(saida);
        }
      } catch {
        jobs[id].status = "erro";
        jobs[id].erro = "Erro ao verificar o vídeo.";
        limpar(saida);
      }
    });
  });

  res.json({ id });
});

app.get("/progress/:id", (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ erro: "Conversão não encontrada." });

  res.json({
    status: job.status,
    progresso: job.progresso,
    erro: job.erro
  });
});

app.get("/download/:id", (req, res) => {
  const job = jobs[req.params.id];
  if (!job || job.status !== "concluido") {
    return res.status(404).send("Arquivo não disponível.");
  }

  res.download(job.saida, job.nomeDownload, () => {
    limpar(job.saida);
    delete jobs[req.params.id];
  });
});

app.listen(PORT, () => {
  console.log("Servidor iniciado na porta " + PORT);
});
