const $ = id => document.getElementById(id);

function removeAcentos(texto){
 return texto.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function limparTexto(texto,max){
 return removeAcentos(texto)
 .toUpperCase()
 .replace(/[^A-Z0-9 ]/g,"")
 .substring(0,max);
}

function campo(id,valor){
 const tamanho = valor.length.toString().padStart(2,"0");
 return id + tamanho + valor;
}

function crc16(payload){
 let polinomio = 0x1021;
 let resultado = 0xFFFF;

 for(let i=0;i<payload.length;i++){
   resultado ^= payload.charCodeAt(i) << 8;
   for(let bit=0;bit<8;bit++){
     if((resultado & 0x8000)!==0){
       resultado = (resultado << 1) ^ polinomio;
     }else{
       resultado <<= 1;
     }
     resultado &= 0xFFFF;
   }
 }
 return resultado.toString(16).toUpperCase().padStart(4,"0");
}

function gerarPix({chave,nome,cidade,valor,descricao}){
 nome = limparTexto(nome,25);
 cidade = limparTexto(cidade,15);
 descricao = limparTexto(descricao || "***",25);

 let merchantAccount =
   campo("00","BR.GOV.BCB.PIX") +
   campo("01",chave);

 if(descricao && descricao !== "***"){
   merchantAccount += campo("02",descricao);
 }

 let payload =
   campo("00","01") +
   campo("26",merchantAccount) +
   campo("52","0000") +
   campo("53","986");

 if(valor){
   const valorFormatado = Number(valor).toFixed(2);
   payload += campo("54",valorFormatado);
 }

 payload +=
   campo("58","BR") +
   campo("59",nome) +
   campo("60",cidade) +
   campo("62",campo("05","***"));

 payload += "6304";
 payload += crc16(payload);

 return payload;
}

$("gerar").onclick = () => {
 const chave = $("chave").value.trim();
 const nome = $("nome").value.trim();
 const cidade = $("cidade").value.trim();
 const valor = $("valor").value.trim();
 const descricao = $("descricao").value.trim();

 $("erro").textContent = "";

 if(!chave || !nome || !cidade){
   $("erro").textContent = "Preencha chave Pix, nome e cidade.";
   return;
 }

 if(valor && Number(valor) <= 0){
   $("erro").textContent = "O valor precisa ser maior que zero.";
   return;
 }

 const pix = gerarPix({chave,nome,cidade,valor,descricao});
 $("pixCode").value = pix;
 $("resultado").style.display = "block";

 QRCode.toCanvas($("canvas"), pix, {
   width: 280,
   margin: 2,
   errorCorrectionLevel: "M"
 });
};

$("copiar").onclick = async () => {
 if(!$("pixCode").value) return;
 await navigator.clipboard.writeText($("pixCode").value);
 $("copiar").textContent = "Código copiado!";
 setTimeout(()=>$("copiar").textContent="Copiar código Pix",1800);
};

$("baixar").onclick = () => {
 const canvas = $("canvas");
 const link = document.createElement("a");
 link.download = "qrcode-pix.png";
 link.href = canvas.toDataURL("image/png");
 link.click();
};