const arquivo = document.getElementById("video");
const botao = document.getElementById("converter");
const status = document.getElementById("status");
const barra = document.getElementById("progress-bar");

function progresso(valor, texto) {
  barra.style.width = valor + "%";
  status.textContent = texto;
}

botao.onclick = () => {
  if (!arquivo.files.length) {
    alert("Selecione um vídeo.");
    return;
  }

  botao.disabled = true;
  progresso(0, "Enviando vídeo...");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/convert");
  xhr.responseType = "json";

  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progresso(Math.round(pct * 0.35), "Enviando: " + pct + "%");
    }
  };

  xhr.onload = () => {
    if (xhr.status !== 200 || !xhr.response || !xhr.response.id) {
      botao.disabled = false;
      progresso(0, "Erro ao enviar.");
      return;
    }
    acompanhar(xhr.response.id);
  };

  xhr.onerror = () => {
    botao.disabled = false;
    progresso(0, "Erro de conexão.");
  };

  const dados = new FormData();
  dados.append("video", arquivo.files[0]);
  xhr.send(dados);
};

function acompanhar(id) {
  const timer = setInterval(async () => {
    try {
      const resposta = await fetch("/progress/" + id);
      const dados = await resposta.json();

      if (dados.status === "erro") {
        clearInterval(timer);
        botao.disabled = false;
        progresso(0, dados.erro || "Erro na conversão.");
        return;
      }

      if (dados.status === "testando") {
        progresso(98, "Testando vídeo convertido...");
        return;
      }

      const p = 35 + Math.round((dados.progresso || 0) * 0.63);
      progresso(p, "Convertendo: " + (dados.progresso || 0) + "%");

      if (dados.status === "concluido") {
        clearInterval(timer);
        progresso(100, "Baixando...");
        window.location.href = "/download/" + id;
        setTimeout(() => {
          botao.disabled = false;
          progresso(100, "Conversão concluída.");
        }, 1200);
      }
    } catch {
      clearInterval(timer);
      botao.disabled = false;
      progresso(0, "Erro ao acompanhar conversão.");
    }
  }, 1000);
}
