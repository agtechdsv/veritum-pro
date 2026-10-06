# Veritum PRO - Passagem de bastao (retomada em 2026-10-06)

Contexto: o projeto estava parado desde mar/2026. Foi retomado, e este arquivo registra o estado
para a proxima sessao nao precisar redescobrir nada. Leia junto com `AGENTS.md`.

## Decisao estrategica
- Veritum PRO foi escolhido (em vez do TradeMaster PRO) como proximo produto da familia PRO da AGTech.
  Motivos: B2B recorrente, churn baixo, risco regulatorio menor, BYODB combina com advocacia, encaixa na venda B2B do autor.
- MetaBuilder PRO segue como prioridade de lancamento (previsto para o fim de out/2026). O Veritum trabalha em janelas curtas e definidas.
- Risco principal: querer atender "dos pequenos aos grandes". Recorte do MVP: escritorios de 3 a 30 pessoas, UMA area do direito
  (a definir pelo dono), BYODB como upsell enterprise. Aposta de modulos do MVP: Nexus (processos/tarefas) + Valorem (honorarios) + Sentinel (prazos/publicacoes).
- PENDENTE (decisao do dono): area do direito, tamanho de escritorio, 3 a 5 advogados para piloto.

## Mapa dos bancos (Supabase) - NAO misturar
| Funcao | Projeto | Observacao |
|---|---|---|
| Master do Veritum (users, plans, suites, tenant_configs, payments) | "Veritum PRO" (ref `rmcjx...`) | env `NEXT_PUBLIC_SUPABASE_URL` no Vercel e no `.env.local` |
| Cliente/tenant do Veritum (persons, lawsuits, tasks...) | "veritum-cliente-dev" (ref `asrli...`) | conta Supabase separada (Free); cadastrado em Infraestrutura -> tenant_configs |
| MetaBuilder | "metabuilder-pro" (ref `chmst...`) | OUTRO produto; o MCP do Supabase da sessao do MetaBuilder aponta para ele |

- O banco de cliente foi recriado em 2026-10-06 rodando `src/lib/_2_CLIENT_SCHEMA.sql` (23 tabelas). O banco antigo (outra conta) foi apagado.
- `_2_CLIENT_SCHEMA.sql` NUNCA deve rodar no master: o `DROP SCHEMA public CASCADE` do topo agora esta comentado de proposito.
- Teste ponta a ponta feito: cadastrar pessoa no Nexus grava em `persons` do banco de cliente. Usar dados FICTICIOS (o banco tem RLS aberto).
- Projeto Free do Supabase pausa apos 1 semana sem uso; a org AGTech esta com aviso de cota excedida (Pro e decisao pendente, necessario antes de producao do MetaBuilder).

## Ambiente
- Dev na porta 3002 (`npm run dev`); MetaBuilder usa 3000.
- `ENCRYPTION_SECRET` precisa ser IDENTICO no Vercel e no `.env.local` (criptografa a config do tenant). Nunca trocar com dados ja criptografados.
- Faltam no Vercel (existem no `.env.local`): `ASAAS_URL`, `CHAVE_ASAAS_MESTRE`, `ASAAS_KEY_B64` - cobranca/fintech nao funciona em producao sem elas.
- No Vercel, marcar como Sensitive: `ENCRYPTION_SECRET`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

## Problemas conhecidos (prioridade para a auditoria)
1. **SEGURANCA - chave Gemini no navegador.** `NEXT_PUBLIC_GEMINI_API_KEY` vai para o bundle, e `getTenantCredentials`
   (`src/app/actions/tenant-actions.ts`) devolve a chave Gemini DESCRIPTOGRAFADA do tenant ao client. Seis componentes criam
   `GeminiService` no browser: cognitio, vox, scriptor, plan-management, suite-management, cloud-manager.
   Correcao: mover as chamadas de IA para o servidor (rotas `/api/ai/*` ou Server Actions), usar variavel sem `NEXT_PUBLIC_`,
   nunca enviar chaves ao client, rotacionar a chave atual e restringir por referrer enquanto o refator nao sai.
2. **SEGURANCA - RLS aberto** no schema do cliente (`USING (TRUE)` em tudo) e credenciais do tenant trafegando para o browser.
   Aceitavel so para teste; bloqueia clientes reais. Precisa de modelo de acesso por sessao/tenant.
3. Raiz suja: `fix_*`, `patch_*`, `tmp*`, `tsc-error*`, `run_sql*`, `check_webhook.js`, `diagnose_*`, `count_divs.py` etc. Triar: util -> `scripts/`, resto apagar.
4. `user_meta.json` ja foi removido do git e ignorado (historico antigo ainda o contem; verificar se o repo e publico).
5. Bug pequeno de i18n: aparece a chave crua `modules.nexus.description` no Nexus.
6. Aviso de WebSocket Realtime fechado no master (provavel efeito da cota do Supabase) - reavaliar apos resolver o plano.

## Primeira tarefa sugerida para a sessao do Veritum
"Audite o projeto e monte o roadmap ate o MVP": rodar `npm run build` (passou limpo em 2026-10-06), mapear cada modulo
(pronto / parcial / fachada), tratar primeiro os itens 1 e 2 acima, listar o que falta para vender
(multi-escritorio, cobranca Asaas, prazos e publicacoes, LGPD/sigilo) e propor o recorte do MVP.
