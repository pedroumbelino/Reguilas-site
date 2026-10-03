# Reguilas — site

Site estático (HTML + CSS + JS sem frameworks) da Reguilas, animação infantil.

## Páginas
Início · Casamentos e Batizados · Festas de Aniversário · Eventos Corporativos · Sobre nós · Blog · Feedback · Contactos (pedido de orçamento) · Política de Privacidade · Obrigado · 404

## Desenvolvimento
```sh
npm install
npm run dev        # gera dist/ e serve em http://localhost:4321
npm run build      # só gera dist/
```
O código-fonte está em `src/` (layout, partes comuns e páginas) e `assets/` (CSS, JS, imagens, tipos de letra alojados localmente). `build.mjs` junta tudo em `dist/`.

## Publicação (Netlify)
Pré-visualização: https://reguilas.netlify.app (fora do Google enquanto `INDEXAR` não for `1`).

`netlify.toml` já está configurado (`node build.mjs` → `dist`). Os formulários de orçamento e feedback usam **Netlify Forms**: os pedidos ficam guardados no painel do Netlify (*Project → Forms*). Não há notificações por e-mail configuradas.

Para o lançamento com domínio próprio, definir no Netlify as variáveis `SITE_URL=https://dominio-final.pt` e `INDEXAR=1`.

## Jev (TypeSafe) — decisões e avaliação de qualidade
```sh
export TYPESAFE_API_KEY=...
npm run jev:decisoes   # o Jev escolhe entre alternativas de design → tools/jev/decisoes.md
npm run jev:avaliar    # o Jev avalia cada página (clareza, CTA, tom, confiança, SEO, PT-PT, erros) → tools/jev/relatorio.md
```
`jev:avaliar` termina com erro se alguma página ficar abaixo dos limites definidos em `tools/jev/avaliar.mjs`, por isso pode ser usado antes de publicar.

## Por fazer (marcado com `TODO` no código)
- Endereços reais de Instagram, Facebook e TikTok
- Testemunhos reais (com autorização)
- Vídeo promocional (Eventos Corporativos)
- Logótipos oficiais dos parceiros
- Artigos do blog
- Fotografias originais em alta resolução e logótipo em SVG
- Domínio final (variáveis `SITE_URL` e `INDEXAR` no Netlify)
- Identificação completa na Política de Privacidade
