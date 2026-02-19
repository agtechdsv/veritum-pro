-- Clear existing plans before seeding
truncate table public.plans;

-- 💎 COMBOS (is_combo = true)
insert into public.plans (name, short_desc, monthly_price, monthly_discount, yearly_price, yearly_discount, features, recommended, active, order_index, is_combo)
values 
(
  'Plano START', 
  '{"pt": "A base sólida para advogados autônomos e pequenos escritórios entrarem na era digital.", "en": "The solid foundation for solo attorneys and small firms to enter the digital age.", "es": "La base sólida para abogados autónomos y pequeños despachos para entrar en la era digital."}', 
  149.00, 5, 1490.00, 15, 
  '{"pt": ["NEXUS PRO (Básico)", "VALOREM PRO (Financeiro)", "Gestão de Processos (Kanban)", "Agenda e Prazos", "Emissão de Boletos/Recibos", "Suporte via Ticket"], "en": ["NEXUS PRO (Basic)", "VALOREM PRO (Financial)", "Case Management (Kanban)", "Calendar and Deadlines", "Billing/Receipts", "Ticket Support"], "es": ["NEXUS PRO (Básico)", "VALOREM PRO (Financiero)", "Gestión de Casos (Kanban)", "Agenda y Plazos", "Emisión de Boletos/Recibos", "Soporte vía Ticket"]}', 
  false, true, 0, true
),
(
  'Plano GROWTH', 
  '{"pt": "O ecossistema completo para alta performance jurídica com IA e automação de atendimento.", "en": "The complete ecosystem for high legal performance with AI and service automation.", "es": "El ecosistema completo para alto rendimiento legal con IA y automatización de procesos."}', 
  450.00, 5, 4500.00, 20, 
  '{"pt": ["Tudo do Plano START", "SCRIPTOR PRO (IA de Redação)", "SENTINEL PRO (Monitoramento Tribunais)", "VOX CLIENTIS (Canal do Cliente)", "Envio Automático WhatsApp", "IA Ilimitada (BYODB)"], "en": ["Everything in START", "SCRIPTOR PRO (AI Writing)", "SENTINEL PRO (Court Monitoring)", "VOX CLIENTIS (Client Portal)", "Automatic WhatsApp Messaging", "Unlimited AI (BYODB)"], "es": ["Todo lo de START", "SCRIPTOR PRO (IA de Redacción)", "SENTINEL PRO (Monitoreo Tribunales)", "VOX CLIENTIS (Canal del Cliente)", "Envío Automático WhatsApp", "IA Ilimitada (BYODB)"]}', 
  true, true, 1, true
),
(
  'Plano STRATEGY', 
  '{"pt": "Infraestrutura estratégica para grandes bancas. Foco em inteligência preditiva e dados.", "en": "Strategic infrastructure for large firms. Focus on predictive intelligence and data.", "es": "Infraestructura estratégica para grandes despachos. Foco en inteligencia predictiva y datos."}', 
  1500.00, 5, 15000.00, 20, 
  '{"pt": ["Tudo do Plano GROWTH", "COGNITIO PRO (Jurimetria)", "SENTINEL 360 (Clipping de Mídia)", "NEXUS Advanced (Workflows)", "Nível de Serviço (SLA) VIP", "Auditoria de Risco Mensal"], "en": ["Everything in GROWTH", "COGNITIO PRO (Jurimetrics)", "SENTINEL 360 (Media Clipping)", "NEXUS Advanced (Workflows)", "VIP Service Level (SLA)", "Monthly Risk Audit"], "es": ["Todo lo de GROWTH", "COGNITIO PRO (Jurimetría)", "SENTINEL 360 (Clipping de Medios)", "NEXUS Advanced (Workflows)", "Nivel de Servicio (SLA) VIP", "Auditoria de Riesgo Mensual"]}', 
  false, true, 2, true
);

-- 📦 STANDALONE (is_combo = false)
insert into public.plans (name, short_desc, monthly_price, monthly_discount, yearly_price, yearly_discount, features, recommended, active, order_index, is_combo)
values 
(
  'Sentinel Radar', 
  '{"pt": "Monitoramento inteligente de processos e diários oficiais com Captura Antecipada.", "en": "Smart case and official gazette monitoring with Early Capture.", "es": "Monitoreo inteligente de procesos y diarios oficiales con Captura Anticipada."}', 
  89.90, 5, 899.00, 15, 
  '{"pt": ["Monitoramento de Processos", "Recortes de Diários Oficiais", "Captura na Distribuição", "Alertas via E-mail/Push"], "en": ["Case Monitoring", "Official Gazette Snippets", "Distribution Capture", "Email/Push Alerts"], "es": ["Monitoreo de Procesos", "Recortes de Diarios Oficiales", "Captura en la Distribución", "Alertas vía E-mail/Push"]}', 
  false, true, 3, false
),
(
  'Sentinel 360º', 
  '{"pt": "Inteligência total: Tribunais + Clipping de notícias, jornais e monitoramento de marca.", "en": "Total intelligence: Courts + News clipping, newspapers and brand monitoring.", "es": "Inteligencia total: Tribunales + Clipping de noticias, periódicos y monitoreo de marca."}', 
  249.00, 5, 2490.00, 15, 
  '{"pt": ["Tudo do Sentinel Radar", "Clipping de Web e Jornais", "Rastreamento de Marca/Nomes", "Relatórios de Reputação"], "en": ["Everything in Radar", "Web and Newspaper Clipping", "Brand/Name Tracking", "Reputation Reports"], "es": ["Todo lo de Radar", "Clipping de Web y Periódicos", "Seguimiento de Marca/Nombres", "Informes de Reputación"]}', 
  false, true, 4, false
),
(
  'Cognitio Pro', 
  '{"pt": "Jurimetria de entrada para decisões baseadas em dados e probabilidade de êxito.", "en": "Entry-level jurimetrics for data-driven decisions and success probability.", "es": "Jurimetría básica para decisiones basadas en datos y probabilidad de éxito."}', 
  399.00, 5, 3990.00, 15, 
  '{"pt": ["Perfil de Juízes e Comarcas", "Probabilidade de Êxito", "Dashboards de BI Integrados", "Análise de Jurisprudência IA"], "en": ["Judge and District Profile", "Success Probability", "Integrated BI Dashboards", "AI Jurisprudence Analysis"], "es": ["Perfil de Jueces y Distritos", "Probabilidad de Éxito", "Dashboards de BI Integrados", "Análisis de Jurisprudencia IA"]}', 
  false, true, 5, false
),
(
  'Scriptor Pro', 
  '{"pt": "O copiloto definitivo para elaboração de peças processuais com IA generativa.", "en": "The ultimate copilot for drafting procedural pieces with generative AI.", "es": "El copiloto definitivo para la elaboración de piezas procesales con IA generativa."}', 
  149.00, 5, 1490.00, 15, 
  '{"pt": ["Gerador de Peças via IA", "Analisador de Documentos", "Revisão Jurídica Inteligente", "Exportação Multi-formato"], "en": ["AI Writing Assistant", "Document Analyzer", "Smart Legal Review", "Multi-format Export"], "es": ["Generador de Piezas vía IA", "Analizador de Documentos", "Revisión Jurídica Inteligente", "Exportación Multi-formato"]}', 
  true, true, 6, false
);
