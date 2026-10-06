# Veritum PRO - Regras do Agente

Ecossistema juridico modular (SaaS para escritorios de advocacia), parte da familia PRO da AGTech.
Projeto INDEPENDENTE do MetaBuilder PRO: nao compartilhar codigo, `.env`, banco Supabase nem memoria com ele.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind
- Supabase (auth + Postgres) e Drizzle ORM (arquitetura BYODB, ver `ARCHITECTURE_DEBATE_BYODB.md`)
- Gemini (`@google/genai`), Resend (e-mail), Asaas (cobranca/subconta), jsPDF
- Modulos: Nexus, Sentinel, Scriptor, Valorem, Cognitio, Vox Clientis, Intelligence Hub
- Estrutura: `src/app` (rotas e `actions`), `src/components/modules`, `src/lib/db` (repositorios), `src/services`

## Ambiente
- Porta de desenvolvimento: **3002** (o MetaBuilder usa 3000). Nao mudar sem avisar.
- Banco: projeto Supabase "Veritum PRO". Nunca apontar scripts para outro projeto.
- NUNCA ler, imprimir, copiar ou commitar `.env.local` ou qualquer segredo (service role, Asaas, ENCRYPTION_SECRET, Google secret).
- Variaveis `NEXT_PUBLIC_*` vao para o navegador: nunca colocar chave secreta nelas.
- Scripts SQL/`fix_*` que escrevem no banco exigem confirmacao do usuario antes de rodar.

## Regras de execucao
- Respeitar o modelo escolhido pelo usuario na UI. NUNCA trocar ou subir de modelo sem confirmacao.
- NAO criar planos para tarefas simples (ajustes visuais, textos, links). Planos so para mudanca estrutural de banco ou fluxo complexo de autenticacao/cobranca.
- Para ler, buscar ou listar arquivos, usar as ferramentas nativas (Read, Grep, Glob), nao comandos de shell como `cat`, `grep`, `ls`.
- Shell apenas para o que altera estado ou executa o ecossistema: `npm install`, `npm run build`, servidor, `git`.
- NAO criar scripts soltos na raiz (`fix_*`, `tmp*`, `patch_*`, `*_output.txt`). Utilitarios reutilizaveis ficam em `scripts/`; descartaveis nao entram no git.
- Textos em portugues (BR) com acentuacao correta; o projeto ja teve problemas de encoding, salvar sempre em UTF-8.

## Ao concluir qualquer pedido ou alteracao de codigo
1. Rodar `npm run build` e verificar que nao ha erros de compilacao/TypeScript;
2. Se houver erros: diagnosticar e corrigir ate ficar limpo;
3. Se passar: oferecer os comandos git em uma unica linha com `;` (PowerShell), ex.: `git add ...; git commit -m "..."; git push`.

## Contexto de produto
- Foco do MVP: escritorios pequenos e medios (3 a 30 pessoas) em um nicho juridico definido; BYODB e upsell enterprise.
- Cuidado com LGPD e sigilo profissional em qualquer dado de cliente/processo.
