# Conversor Central

Site simples para converter vídeos para central multimídia antiga.

## Saída

- AVI
- Xvid / MPEG-4 ASP
- FourCC XVID
- 640x360
- 29,97 FPS
- MP3 CBR 128 kbps
- Teste automático com ffprobe antes do download

## Rodar localmente

Instale Node.js e FFmpeg.

```bash
npm install
npm start
```

Acesse:

```text
http://localhost:3000
```

## Render Free

O projeto inclui Dockerfile para instalar FFmpeg automaticamente.

No Render:
1. New Web Service
2. Conecte o GitHub
3. Escolha este repositório
4. Environment: Docker
5. Plan: Free
6. Deploy

Teste primeiro com vídeos pequenos.
