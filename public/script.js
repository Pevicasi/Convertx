const input = document.getElementById("videos");
const botao = document.getElementById("converter");
const statusEl = document.getElementById("status");
const barra = document.getElementById("progress-bar");
const lista = document.getElementById("fila");

let fila = [];

function progresso(valor, texto) {
  barra.style.width = valor + "%";
  statusEl.textContent = texto;
}

function atualizarLista(indiceAtual = -1, textoAtual = "") {
  lista.innerHTML = "";

  fila.forEach((item, i) => {
    const li = document.createElement("li");

    if (item.erro) {
      li.innerHTML = "❌ <span class='erro'>" + item.name + " — erro</span>";
    } else if (item.downloadId) {
      li.innerHTML = "✅ " + item.name + "<br><a class='download-link' href='/download/" + item.downloadId + "'>Baixar AVI</a>";
    } else if (i < indiceAtual) {
      li.textContent = "✅ " + item.name;
    } else if (i === indiceAtual) {
      li.textContent = "🔄 " + item.name + (textoAtual ? " — " + textoAtual : "");
    } else {
      li.textContent = "⏳ " + item.name;
    }

    lista.appendChild(li);
  });
}

input.addEventListener("change", () => {
  fila = Array.from(input.files || []).map(file => ({
    type: "file",
    file,
    name: file.name,
    downloadId: null,
    erro: false
  }));

  progresso(0, fila.length ? fila.length + " vídeo(s) na fila." : "Aguardando vídeos...");
  atualizarLista();
});

botao.addEventListener("click", async () => {
  if (!fila.length) {
    alert("Selecione um ou mais vídeos.");
    return;
  }

  botao.disabled = true;

  for (let i = 0; i < fila.length; i++) {
    if (!fila[i].downloadId && !fila[i].erro) {
      await converterArquivo(fila[i], i);
    }
  }

  progresso(100, "Fila concluída. Toque em Baixar AVI em cada vídeo.");
  atualizarLista(fila.length);
  botao.disabled = false;
});

function converterArquivo(item, indice) {
  return new Promise((resolve) => {
    progresso(0, "Enviando " + (indice + 1) + " de " + fila.length);
    atualizarLista(indice, "enviando");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/convert");
    xhr.responseType = "json";

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progresso(Math.round(pct * 0.35), "Enviando: " + pct + "%");
        atualizarLista(indice, "enviando " + pct + "%");
      }
    };

    xhr.onload = () => {
      if (xhr.status !== 200 || !xhr.response || !xhr.response.id) {
        item.erro = true;
        progresso(0, "Erro ao enviar: " + item.name);
        atualizarLista(indice, "erro");
        resolve();
        return;
      }

      acompanhar(xhr.response.id, item, indice, resolve);
    };

    xhr.onerror = () => {
      item.erro = true;
      progresso(0, "Erro de conexão.");
      atualizarLista(indice, "erro");
      resolve();
    };

    const dados = new FormData();
    dados.append("video", item.file);
    xhr.send(dados);
  });
}

function acompanhar(id, item, indice, resolve) {
  let falhas = 0;

  const timer = setInterval(async () => {
    try {
      const resposta = await fetch("/progress/" + id);

      if (!resposta.ok) throw new Error("falha");

      const dados = await resposta.json();
      falhas = 0;

      if (dados.status === "erro") {
        clearInterval(timer);
        item.erro = true;
        progresso(0, dados.erro || "Erro na conversão.");
        atualizarLista(indice, "erro");
        resolve();
        return;
      }

      if (dados.status === "testando") {
        progresso(98, "Testando vídeo convertido...");
        atualizarLista(indice, "testando");
        return;
      }

      const p = 35 + Math.round((dados.progresso || 0) * 0.63);
      progresso(p, "Convertendo: " + (dados.progresso || 0) + "%");
      atualizarLista(indice, "convertendo " + (dados.progresso || 0) + "%");

      if (dados.status === "concluido") {
        clearInterval(timer);
        item.downloadId = id;
        progresso(100, "Convertido. Toque em Baixar AVI.");
        atualizarLista(indice + 1);
        resolve();
      }
    } catch {
      falhas++;

      if (falhas <= 8) {
        progresso(90, "Aguardando servidor...");
        atualizarLista(indice, "aguardando servidor");
        return;
      }

      clearInterval(timer);
      item.erro = true;
      progresso(0, "Erro ao acompanhar conversão.");
      atualizarLista(indice, "erro");
      resolve();
    }
  }, 1500);
}
