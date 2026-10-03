// Pede ao Jev (TypeSafe System One) que escolha entre alternativas de design/conteúdo.
// Cada decisão tem a opção que foi implementada na primeira versão; o relatório mostra
// se o Jev concorda e com que probabilidade, para a decisão final ficar com a dona.
//
// Uso:  TYPESAFE_API_KEY=... node tools/jev/decisoes.mjs
import { writeFileSync } from "node:fs";
import { TypeSafeClient } from "@typesafe-ai/sdk";

const state = {
  marca: {
    nome: "Reguilas",
    negocio: "Empresa portuguesa de animação infantil para eventos (casamentos, batizados, festas de aniversário, eventos corporativos e de municípios).",
    publico: [
      "Noivos e pais que organizam casamentos e batizados e querem que as crianças estejam entretidas e seguras enquanto os adultos aproveitam.",
      "Pais que organizam festas de aniversário.",
      "Responsáveis de RH de empresas e técnicos de municípios que organizam festas de Natal, campos de férias e dias comemorativos.",
    ],
    tom: "Caloroso, alegre e cuidado; português europeu; elegante nos casamentos, divertido nos aniversários, profissional para empresas.",
    identidade_visual: "Coral (#EC605F) e branco, títulos em itálico grosso e brincalhão, fotografias reais de eventos.",
    objetivo_do_site: "Gerar pedidos de orçamento qualificados (data, local, nº de crianças, tipo de evento).",
    restricoes: [
      "Ainda não há testemunhos reais de clientes.",
      "Ainda não há vídeo promocional.",
      "Ainda não há artigos de blog.",
      "Mais de metade das visitas será em telemóvel.",
    ],
  },
};

const decisoes = {
  titulo_inicial: {
    implementado: "memorias",
    question: {
      type: "choice",
      instructions: "Para a secção principal da página inicial de `marca`, qual título deve aparecer primeiro para levar pais e noivos a pedir orçamento?",
      criteria: {
        memorias: "“Juntos, criamos memórias que se tornam inesquecíveis!” (frase original da maquete da dona)",
        tranquilidade: "“Diversão para os mais pequenos, tranquilidade para os pais.”",
        servico: "“Animação infantil para casamentos, batizados, aniversários e empresas.”",
      },
    },
  },
  texto_botao_principal: {
    implementado: "pedir_orcamento",
    question: {
      type: "choice",
      instructions: "Qual texto deve ter o botão principal do site de `marca`, sabendo que o objetivo é receber pedidos de orçamento?",
      criteria: {
        pedir_orcamento: "“Pedir orçamento”",
        orcamento_gratis: "“Pedir orçamento grátis”",
        planear_festa: "“Planear a minha festa”",
        falar_connosco: "“Falar connosco”",
      },
    },
  },
  testemunhos_sem_conteudo: {
    implementado: "convite_feedback",
    question: {
      type: "choice",
      instructions: "Enquanto `marca.restricoes` diz que não há testemunhos reais, o que deve mostrar a secção “Feedback dos clientes” da página inicial?",
      criteria: {
        convite_feedback: "Uma mensagem honesta a convidar quem já celebrou com os Reguilas a deixar feedback, com um botão para o formulário.",
        esconder_secao: "Esconder a secção até haver testemunhos reais.",
        texto_exemplo: "Mostrar testemunhos de exemplo escritos pela equipa até chegarem os reais.",
      },
    },
  },
  descricoes_eventos_corporativos: {
    implementado: "sempre_visiveis",
    question: {
      type: "choice",
      instructions: "Na página de eventos corporativos de `marca`, cada cartão (Natal em família, Campos de férias, Festas temáticas, Datas comemorativas) tem uma descrição. Como deve aparecer, tendo em conta `marca.restricoes`?",
      criteria: {
        sempre_visiveis: "Descrição sempre visível sobre a fotografia.",
        virar_ao_passar: "Cartão que vira e mostra a descrição ao passar o rato (como na maquete).",
        clicar_para_abrir: "Descrição escondida que abre ao tocar ou clicar no cartão.",
      },
    },
  },
  pagina_aniversarios: {
    implementado: "grelha_atividades",
    question: {
      type: "choice",
      instructions: "A dona não desenhou a página de Festas de Aniversário. Qual estrutura é mais coerente com as outras páginas de serviço de `marca` e mais útil para os pais?",
      criteria: {
        grelha_atividades: "Destaque, grelha das atividades mais pedidas e secção de festas temáticas com botão de orçamento (igual às outras páginas de serviço).",
        pacotes_com_preco: "Três pacotes fechados com preços indicativos.",
        so_formulario: "Apenas um texto curto e o formulário de orçamento.",
      },
    },
  },
  ordem_menu: {
    implementado: "servicos_dropdown",
    question: {
      type: "choice",
      instructions: "Na maquete, o menu tem apenas Início, Sobre nós, Blog, Feedback e Contactos; os serviços só aparecem em círculos na página inicial. Como deve ficar o menu principal de `marca`?",
      criteria: {
        servicos_dropdown: "Acrescentar “Serviços” com submenu para as três páginas de serviço.",
        como_maquete: "Manter o menu exatamente como na maquete.",
        servicos_diretos: "Pôr as três páginas de serviço diretamente no menu, sem submenu.",
      },
    },
  },
};

const client = new TypeSafeClient();
const questions = Object.fromEntries(Object.entries(decisoes).map(([k, d]) => [k, d.question]));
const res = await client.systemOne({ state, questions });

const linhas = ["# Decisões avaliadas pelo Jev", "", `Modelo: \`${res.model}\` · tokens: ${res.usage.input_tokens} entrada / ${res.usage.output_tokens} saída`, "",
  "| Decisão | Implementado | Escolha do Jev | Confiança | Concorda? |", "|---|---|---|---|---|"];
for (const [k, d] of Object.entries(decisoes)) {
  const a = res.answers[k];
  const ok = a.choice === d.implementado;
  linhas.push(`| ${k} | ${d.implementado} | ${a.choice} | ${(a.confidence * 100).toFixed(0)}% | ${ok ? "✅" : "⚠️ rever"} |`);
}
linhas.push("", "## Probabilidades", "");
for (const [k] of Object.entries(decisoes)) {
  const p = Object.entries(res.answers[k].probabilities).map(([o, v]) => `${o} ${(v * 100).toFixed(0)}%`).join(" · ");
  linhas.push(`- **${k}**: ${p}`);
}
writeFileSync(new URL("./decisoes.md", import.meta.url), linhas.join("\n") + "\n");
console.log(linhas.join("\n"));
