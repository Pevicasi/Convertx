const input = document.getElementById("videos");
const botao = document.getElementById("converter");
const statusEl = document.getElementById("status");
const barra = document.getElementById("progress-bar");
const lista = document.getElementById("fila");

let arquivos = [];

function progresso(valor, texto) {
  barra.style.width = valor + "%";
  statusEl.textContent = texto;
}

function atualizarLista(indiceAtual = -1, textoAtual = "") {
  lista.innerHTML = "";

  arquivos.forEach((file, i) => {
    const li = document.createElement("li");

    if (i < indiceAtual) {
      li.textContent = "✅ " + file.name;
    } else if (i === indiceAtual) {
      li.textContent = "🔄 " + file.name + (textoAtual ? " — " + textoAtual : "");
    } else {
      li.textContent = "⏳ " + file.name;
    }

    lista.appendChild(li);
  });
}

input.addEventListener("change", () => {
  arquivos = Array.from(input.files || []);
  progresso(0, arquivos.length ? arquivos.length + " vídeo(s) na fila." : "Aguardando vídeos...");
  atualizarLista();
});

botao.addEventListener("click", async () => {
  if (!arquivos.length) {
    alert("Selecione um ou mais vídeos.");
    return;
  }

  botao.disabled = true;

  for (let i = 0; i < arquivos.length; i++) {
    atualizarLista(i, "enviando");
    await converterArquivo(arquivos[i], i);
  }

  progresso(100, "Fila concluída.");
  atualizarLista(arquivos.length);
  botao.disabled = false;
});

function converterArquivo(file, indice) {
  return new Promise((resolve) => {
    progresso(0, "Enviando " + (indice + 1) + " de " + arquivos.length);

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
        progresso(0, "Erro ao enviar: " + file.name);
        atualizarLista(indice, "erro");
        resolve();
        return;
      }

      acompanhar(xhr.response.id, indice, resolve);
    };

    xhr.onerror = () => {
      progresso(0, "Erro de conexão.");
      atualizarLista(indice, "erro");
      resolve();
    };

    const dados = new FormData();
    dados.append("video", file);
    xhr.send(dados);
  });
}

function acompanhar(id, indice, resolve) {
  const timer = setInterval(async () => {
    try {
      const resposta = await fetch("/progress/" + id);
      const dados = await resposta.json();

      if (dados.status === "erro") {
        clearInterval(timer);
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
        progresso(100, "Baixando...");
        atualizarLista(indice, "baixando");

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = "/download/" + id;
        document.body.appendChild(iframe);

        setTimeout(() => {
          iframe.remove();
          atualizarLista(indice + 1);
          resolve();
        }, 2500);
      }
    } catch {
      clearInterval(timer);
      progresso(0, "Erro ao acompanhar conversão.");
      atualizarLista(indice, "erro");
      resolve();
    }
  }, 1000);
}
