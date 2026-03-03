CREATE TABLE IF NOT EXISTS public.cloud_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code_name varchar(50) UNIQUE NOT NULL,
  name jsonb NOT NULL DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  badge jsonb DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  subtitle jsonb DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  price_monthly numeric NOT NULL DEFAULT 0,
  discounts jsonb DEFAULT '{"quarterly": 0, "semiannual": 0, "yearly": 0}'::jsonb,
  credits jsonb DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  need_more jsonb DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  features_title jsonb DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.cloud_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cloud plans are visible to everyone" ON public.cloud_plans;
CREATE POLICY "Cloud plans are visible to everyone"
ON public.cloud_plans FOR SELECT
USING (true);

-- Create a policy to allow master users
-- Adjusted to use user_metadata to match Supabase Auth settings
DROP POLICY IF EXISTS "Cloud plans modifiable by Master" ON public.cloud_plans;
CREATE POLICY "Cloud plans modifiable by Master"
ON public.cloud_plans FOR ALL
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Sócio-Administrador');

-- Insert initial data based on UI screenshots
INSERT INTO public.cloud_plans (code_name, name, badge, subtitle, price_monthly, discounts, credits, need_more, features_title, features)
VALUES 
('cloud_pro', 
 '{"pt": "Cloud Professional", "en": "Cloud Professional", "es": "Cloud Professional"}', 
 '{"pt": "ESCOLHA DO GESTOR", "en": "MANAGER CHOICE", "es": "ELECCIÓN DEL GERENTE"}', 
 '{"pt": "Alta performance e recursos avançados para escritórios em fase de expansão.", "en": "High performance and advanced features for expanding law firms.", "es": "Alto rendimiento y funciones avanzadas para despachos en expansión."}', 
 249.90, 
 '{"quarterly": 0, "semiannual": 0, "yearly": 0}', 
 '{"pt": "Créditos Veritum (R$ 55,00) inclusos", "en": "Veritum Credits ($10) included", "es": "Créditos Veritum ($10) incluidos"}', 
 '{"pt": "Escalabilidade sob demanda", "en": "Scalability on demand", "es": "Escalabilidad a pedido"}', 
 '{"pt": "Recursos Inclusos no Plano:", "en": "Features Included in the Plan:", "es": "Funciones incluidas en el plan:"}', 
 '[{"category": "compute", "text": "100.000 Usuários Ativos (MAU)", "isSub": false}, {"category": "compute", "text": "após, R$ 0,05 por MAU", "isSub": true}, {"category": "storage", "text": "8 GB de Disco Dedicado", "isSub": false}, {"category": "storage", "text": "após, R$ 1,25 por GB", "isSub": true}, {"category": "storage", "text": "250 GB de Tráfego Egresso", "isSub": false}, {"category": "storage", "text": "após, R$ 0,95 por GB", "isSub": true}, {"category": "storage", "text": "250 GB de Rede em Cache", "isSub": false}, {"category": "storage", "text": "após, R$ 0,40 por GB", "isSub": true}, {"category": "storage", "text": "100 GB de Storage de Arquivos", "isSub": false}, {"category": "storage", "text": "após, R$ 0,25 por GB", "isSub": true}, {"category": "security", "text": "Suporte Técnico Prioritário", "isSub": false}, {"category": "security", "text": "Backups Diários (7 dias de retenção)", "isSub": false}, {"category": "security", "text": "Logs de Sistema (7 dias)", "isSub": false}]'
),
('cloud_enterprise', 
 '{"pt": "Cloud Enterprise", "en": "Cloud Enterprise", "es": "Cloud Enterprise"}', 
 '{"pt": "COMPLIANCE TOTAL", "en": "FULL COMPLIANCE", "es": "CUMPLIMIENTO TOTAL"}', 
 '{"pt": "Segurança de nível bancário e conformidade rigorosa para grandes corporações.", "en": "Bank-grade security and strict compliance for large corporations.", "es": "Seguridad de nivel bancario y cumplimiento estricto para grandes corporaciones."}', 
 4399.90, 
 '{"quarterly": 0, "semiannual": 0, "yearly": 0}', 
 '{"pt": "Créditos Veritum (R$ 55,00) inclusos", "en": "Veritum Credits ($10) included", "es": "Créditos Veritum ($10) incluidos"}', 
 '{"pt": "Soluções Enterprise", "en": "Enterprise Solutions", "es": "Soluciones Empresariales"}', 
 '{"pt": "Tudo do Professional, mais:", "en": "Everything in Professional, plus:", "es": "Todo en Profesional, más:"}', 
 '[{"category": "security", "text": "Certificação SOC2", "isSub": false}, {"category": "security", "text": "Acesso Restrito (Read-only / Project-scope)", "isSub": false}, {"category": "security", "text": "Compatibilidade HIPAA (Add-on)", "isSub": false}, {"category": "security", "text": "Single Sign-On (SSO) para Gestores", "isSub": false}, {"category": "security", "text": "SLAs de Atendimento Prioritário", "isSub": false}, {"category": "security", "text": "Backups Estendidos (14 dias)", "isSub": false}, {"category": "security", "text": "Retenção de Logs em Massa (28 dias)", "isSub": false}, {"category": "security", "text": "Monitoramento de Drenos de Log", "isSub": false}, {"category": "security", "text": "após, R$ 479,90 por dreno extra", "isSub": true}]'
)
ON CONFLICT (code_name) DO UPDATE SET 
  name = EXCLUDED.name,
  badge = EXCLUDED.badge,
  subtitle = EXCLUDED.subtitle,
  price_monthly = EXCLUDED.price_monthly,
  features_title = EXCLUDED.features_title,
  features = EXCLUDED.features;
