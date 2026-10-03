// Avaliação de qualidade de cada página gerada em dist/ com o Jev (TypeSafe System One).
// Para cada página faz um conjunto de perguntas independentes (Score e Noul) sobre o mesmo
// estado e aplica limites explícitos. Sai com código 1 se alguma página falhar, para poder
// ser usado como verificação antes de publicar.
//
// Uso:  npm run build && TYPESAFE_API_KEY=... node tools/jev/avaliar.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TypeSafeClient } from "@typesafe-ai/sdk";

const dist = new URL("../../dist/", import.meta.url).pathname;
const SKIP = new Set(["404.html", "obrigado.html", "politica-de-privacidade.html"]);

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
const text = (html) => decode(html.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const all = (html, re) => [...html.matchAll(re)].map((m) => text(m[1])).filter(Boolean);

function pageState(file) {
  const html = readFileSync(join(dist, file), "utf8");
  const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) ?? [, ""])[1].replace(/<!--[\s\S]*?-->/g, "");
  return {
    negocio: "Reguilas: animação infantil para casamentos, batizados, festas de aniversário e eventos corporativos/municípios, em Portugal. Objetivo do site: pedidos de orçamento.",
    tom_pretendido: "Caloroso, alegre e cuidado; português europeu; elegante nos casamentos, divertido nos aniversários, profissional para empresas.",
    pagina: {
      ficheiro: file,
      titulo: text((html.match(/<title>([\s\S]*?)<\/title>/) ?? [, ""])[1]),
      descricao: decode((html.match(/<meta name="description" content="([^"]*)"/) ?? [, ""])[1]),
      titulos: all(main, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g),
      botoes_e_ligacoes: [...new Set(all(main, /<a[^>]*class="[^"]*btn[^"]*"[^>]*>([\s\S]*?)<\/a>/g).concat(all(main, /<button[^>]*type="submit"[^>]*>([\s\S]*?)<\/button>/g)))],
      texto_alternativo_imagens: all(main, /<img[^>]*alt="([^"]*)"/g),
      texto: text(main).slice(0, 6000),
    },
  };
}

const questions = {
  clareza: {
    type: "score",
    instructions: "Um pai, mãe ou responsável de empresa que chega a `pagina` pela primeira vez percebe rapidamente o que os Reguilas oferecem nesta página e para que tipo de evento?",
    criteria: [
      "Não se percebe o que é oferecido nem para quem.",
      "Percebe-se o tema geral, mas faltam informações essenciais ou a mensagem está confusa.",
      "Percebe-se bem o que é oferecido, com pequenas falhas de organização.",
      "Fica imediatamente claro o que é oferecido, para quem e porque é uma boa escolha.",
    ],
  },
  chamada_acao: {
    type: "score",
    instructions: "A `pagina` conduz o visitante para um próximo passo concreto (pedir orçamento, contactar, deixar feedback), com botões ou ligações claros em `pagina.botoes_e_ligacoes`?",
    criteria: [
      "Não há nenhum próximo passo claro.",
      "Há um próximo passo, mas está escondido, é vago ou aparece só uma vez no fim.",
      "Há um próximo passo claro e visível.",
      "O próximo passo é claro, aparece nos momentos certos e é específico para esta página.",
    ],
  },
  tom: {
    type: "score",
    instructions: "O texto de `pagina` corresponde a `tom_pretendido` para o público desta página?",
    criteria: [
      "O tom é inadequado (frio, agressivo, infantilizado ou pouco profissional).",
      "O tom é neutro e genérico, sem a personalidade pretendida.",
      "O tom é quase sempre o pretendido, com algumas frases que destoam.",
      "O tom é consistentemente caloroso, alegre e adequado ao público desta página.",
    ],
  },
  confianca: {
    type: "score",
    instructions: "A `pagina` dá motivos para confiar nos Reguilas com crianças (equipa, cuidado, experiência, fotografias reais, contacto direto), sem promessas exageradas?",
    criteria: [
      "Não há nenhum elemento de confiança, ou há promessas exageradas.",
      "Há poucos elementos de confiança e são genéricos.",
      "Há vários elementos de confiança relevantes.",
      "A página transmite claramente cuidado, experiência e proximidade, com elementos concretos.",
    ],
  },
  seo: {
    type: "score",
    instructions: "`pagina.titulo` e `pagina.descricao` descrevem bem o conteúdo da página, com as palavras que um cliente pesquisaria no Google (ex.: animação infantil, casamentos, batizados, festas de aniversário, eventos para empresas)?",
    criteria: [
      "Título e descrição em falta ou sem relação com o conteúdo.",
      "Relacionados com o conteúdo, mas vagos ou sem as palavras de pesquisa importantes.",
      "Bons, com as palavras principais, mas com pequenas falhas (demasiado longos, repetitivos).",
      "Claros, específicos, com as palavras de pesquisa certas e um convite a clicar.",
    ],
  },
  portugues_europeu: {
    type: "noul",
    instructions: "Todo o texto de `pagina` está escrito em português europeu (de Portugal), sem formas típicas do português do Brasil (ex.: “você”, gerúndio como “estamos fazendo”, “ônibus”, “time” para equipa, “contato”)?",
  },
  erros_ou_marcadores: {
    type: "noul",
    instructions: "O texto de `pagina` contém erros ortográficos ou gramaticais, palavras repetidas por engano, emojis partidos (como “????”) ou texto provisório esquecido (como “lorem ipsum”, “TODO”, “texto aqui”)?",
  },
  promessa_reserva: {
    type: "noul",
    instructions: "O texto de `pagina` dá a entender que enviar um pedido de orçamento garante a reserva da data?",
  },
};

// Política explícita: o que conta como falha.
const policy = {
  clareza: (a) => a.score >= 2,
  chamada_acao: (a) => a.score >= 2,
  tom: (a) => a.score >= 2,
  confianca: (a) => a.score >= 1.5,
  seo: (a) => a.score >= 2,
  portugues_europeu: (a) => a.noul >= 0.7,
  erros_ou_marcadores: (a) => a.noul <= 0.3,
  promessa_reserva: (a) => a.noul <= 0.2,
};
const fmt = (a) => (a.type === "noul" ? `${(a.noul * 100).toFixed(0)}% sim` : `${a.score.toFixed(2)}/3 (conf. ${(a.confidence * 100).toFixed(0)}%)`);

const client = new TypeSafeClient();
const files = readdirSync(dist).filter((f) => f.endsWith(".html") && !SKIP.has(f));
const results = await Promise.all(files.map(async (file) => ({ file, res: await client.systemOne({ state: pageState(file), questions }) })));

let failures = 0;
const out = ["# Avaliação de qualidade pelo Jev", "", `Gerado em ${new Date().toISOString()}`, ""];
out.push(`| Página | ${Object.keys(questions).join(" | ")} |`, `|---|${Object.keys(questions).map(() => "---").join("|")}|`);
for (const { file, res } of results) {
  const cells = Object.keys(questions).map((k) => {
    const ok = policy[k](res.answers[k]);
    if (!ok) failures++;
    return `${ok ? "✅" : "❌"} ${fmt(res.answers[k])}`;
  });
  out.push(`| ${file} | ${cells.join(" | ")} |`);
}
out.push("", failures ? `**${failures} verificação(ões) falharam — rever antes de publicar.**` : "**Todas as páginas passaram.**");
writeFileSync(new URL("./relatorio.md", import.meta.url), out.join("\n") + "\n");
console.log(out.join("\n"));
process.exit(failures ? 1 : 0);
