const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Sincroniza metadados para garantir integridade do RBAC no JWT
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'full_name', NEW.name,
      'parent_user_id', NEW.parent_user_id,
      'active', NEW.active,
      'plan_id', NEW.plan_id
    )
  WHERE id = NEW.id;

  -- 2. Cascateamento de Status: Se desativar o Header, desativa os Operadores
  IF (OLD.active IS DISTINCT FROM NEW.active) THEN
    UPDATE public.users SET active = NEW.active WHERE parent_user_id = NEW.id;
  END IF;

  -- 3. 💎 AUTO-SYNC PLANO: Se o plano mudar no perfil, atualiza a assinatura e mata o Trial
  IF (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
     UPDATE public.user_subscriptions
     SET 
       plan_id = NEW.plan_id,
       status = 'active',
       is_trial = EXISTS (SELECT 1 FROM public.plans WHERE id = NEW.plan_id AND name::text ILIKE '%Trial%'),
       updated_at = NOW()
     WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
    method: 'POST',
    headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        query: sql
    })
}).then(async r => {
    console.log(r.status, await r.text());
}).catch(console.error);

// ALSO we need to manually fix the user who bought the real plan.
s.from('users').update({ plan_id: 'c38ea923-bc7a-4b1d-ad67-728bbe955cd3' })
    .eq('id', '2fb66d73-8f19-4485-bc6b-3d1083489ef9')
    .then(r => console.log("User updated manually", r));
