const input = document.getElementById("videos");
const linkInput = document.getElementById("youtube-link");
const btnLink = document.getElementById("adicionar-link");
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
    const nome = item.type === "url" ? "YouTube: " + item.url : item.name;

    if (item.erro) {
      li.innerHTML = "❌ <span class='erro'>" + nome + " — erro</span>";
    } else if (item.downloadId) {
      li.innerHTML = "✅ " + nome + "<br><a class='download-link' href='/download/" + item.downloadId + "'>Baixar AVI</a>";
    } else if (i < indiceAtual) {
      li.textContent = "✅ " + nome;
    } else if (i === indiceAtual) {
      li.textContent = "🔄 " + nome + (textoAtual ? " — " + textoAtual : "");
    } else {
      li.textContent = "⏳ " + nome;
    }

    lista.appendChild(li);
  });
}

input.addEventListener("change", () => {
  const novos = Array.from(input.files || []).map(file => ({
    type: "file",
    file,
    name: file.name,
    downloadId: null,
    erro: false
  }));

  fila = fila.concat(novos);
  input.value = "";

  progresso(0, fila.length + " item(ns) na fila.");
  atualizarLista();
});

btnLink.addEventListener("click", () => {
  const url = linkInput.value.trim();

  if (!url) {
    alert("Cole um link do YouTube.");
    return;
  }

  fila.push({
    type: "url",
    url,
    downloadId: null,
    erro: false
  });

  linkInput.value = "";
  progresso(0, fila.length + " item(ns) na fila.");
  atualizarLista();
});

botao.addEventListener("click", async () => {
  if (!fila.length) {
    alert("Adicione vídeos ou links.");
    return;
  }

  botao.disabled = true;
  btnLink.disabled = true;

  for (let i = 0; i < fila.length; i++) {
    if (fila[i].downloadId || fila[i].erro) continue;

    if (fila[i].type === "file") {
      await converterArquivo(fila[i], i);
    } else {
      await converterLink(fila[i], i);
    }
  }

  progresso(100, "Fila concluída. Toque em Baixar AVI.");
  atualizarLista(fila.length);
  botao.disabled = false;
  btnLink.disabled = false;
});

function converterArquivo(item, indice) {
  return new Promise((resolve) => {
    progresso(0, "Enviando arquivo...");
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
        progresso(0, "Erro ao enviar.");
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

function converterLink(item, indice) {
  return new Promise(async (resolve) => {
    try {
      progresso(0, "Enviando link...");
      atualizarLista(indice, "preparando link");

      const resposta = await fetch("/convert-url", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ url: item.url })
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.id) {
        item.erro = true;
        progresso(0, dados.erro || "Erro no link.");
        atualizarLista(indice, "erro");
        resolve();
        return;
      }

      acompanhar(dados.id, item, indice, resolve);
    } catch {
      item.erro = true;
      progresso(0, "Erro ao enviar link.");
      atualizarLista(indice, "erro");
      resolve();
    }
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

      if (dados.status === "baixando") {
        progresso(10, "Baixando do YouTube...");
        atualizarLista(indice, "baixando do YouTube");
        return;
      }

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

      if (falhas <= 10) {
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
