const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n').filter(Boolean).map(l => {
    const parts = l.split('=');
    return [parts[0].trim(), parts.slice(1).join('=').trim()];
}));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const sql = `
    -- 1. Limpar nomes dos planos para evitar problemas de busca
    UPDATE public.plans 
    SET name = jsonb_build_object('pt', 'Trial 14 Dias', 'en', '14-Day Trial', 'es', 'Prueba 14 Días')
    WHERE name->>'pt' ILIKE '%Trial%';

    -- 2. Atualizar a função do trigger para ser mais robusta e usar o Role correto
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      default_role text := 'Sócio Administrador';
      user_role text;
      user_name text;
      user_plan_id uuid;
      generated_group_id uuid;
    BEGIN
      -- 1. Extrair metadados do Auth
      user_role := coalesce(new.raw_user_meta_data->>'role', default_role);
      user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
      user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

      -- 2. Definir Plano de Trial se não houver um (Busca por nome limpo)
      IF user_plan_id IS NULL THEN 
        SELECT id INTO user_plan_id FROM public.plans WHERE (name->>'pt' ILIKE '%Trial%' OR name->>'en' ILIKE '%Trial%') LIMIT 1; 
      END IF;

      -- 3. Criar o usuário na tabela pública
      INSERT INTO public.users (id, name, email, role, active, avatar_url, parent_user_id, plan_id, access_group_id)
      VALUES (
        new.id, 
        user_name, 
        new.email, 
        user_role, 
        TRUE, 
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), 
        (new.raw_user_meta_data->>'parent_user_id')::uuid, 
        user_plan_id, 
        (new.raw_user_meta_data->>'access_group_id')::uuid
      )
      ON CONFLICT (id) DO UPDATE SET 
        role = EXCLUDED.role, 
        name = EXCLUDED.name, 
        plan_id = EXCLUDED.plan_id, 
        access_group_id = EXCLUDED.access_group_id;

      -- 4. Criar assinatura inicial
      IF user_plan_id IS NOT NULL THEN
         INSERT INTO public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
         VALUES (
           new.id, 
           user_plan_id, 
           NOW(), 
           CASE WHEN (new.raw_user_meta_data->>'parent_user_id') IS NOT NULL THEN NULL ELSE NOW() + INTERVAL '14 days' END, 
           'active', 
           CASE WHEN (new.raw_user_meta_data->>'parent_user_id') IS NOT NULL THEN FALSE ELSE TRUE END
         )
         ON CONFLICT (user_id) DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            end_date = EXCLUDED.end_date,
            status = 'active',
            is_trial = EXCLUDED.is_trial;
      END IF;

      -- 5. Sincronizar metadados do Auth (Primeira carga)
      UPDATE auth.users 
      SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'role', user_role, 
          'full_name', user_name, 
          'name', user_name, 
          'plan_id', user_plan_id, 
          'access_group_id', (new.raw_user_meta_data->>'access_group_id')
        ) 
      WHERE id = new.id;
      
      -- 6. Gerar workspace inicial (Access Groups e Roles)
      -- PERFROM public.seed_user_workspace(new.id); -- Chamada removida se der erro, mas deve funcionar se o script maior foi rodado
      
      -- 7. Organização para Admin Root
      IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
          INSERT INTO public.organizations (admin_id, company_name)
          VALUES (new.id, user_name || ' - Escritório')
          ON CONFLICT (admin_id) DO NOTHING;
      END IF;
      
      -- 8. Vincular ao grupo Sócio-Administrador e Atualizar Token Final
      IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
          -- Tenta buscar o grupo gerado (o seed já deve ter rodado via RPC ou trigger secundário)
          SELECT id INTO generated_group_id FROM public.access_groups 
          WHERE admin_id = new.id AND (name->>'pt' ILIKE '%Sócio%Admin%' OR name->>'pt' ILIKE '%Sócio-Administrador%') LIMIT 1;
          
          IF generated_group_id IS NOT NULL THEN
              UPDATE public.users 
              SET access_group_id = generated_group_id, role = 'Sócio Administrador'
              WHERE id = new.id;
              
              UPDATE auth.users 
              SET raw_user_meta_data = 
                COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                jsonb_build_object(
                  'access_group_id', generated_group_id, 
                  'role', 'Sócio Administrador'
                )
              WHERE id = new.id;
          END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 3. Corrigir o usuário recente se necessário
    DO $$
    DECLARE
       trial_id uuid;
    BEGIN
       SELECT id INTO trial_id FROM public.plans WHERE name->>'pt' ILIKE '%Trial%' LIMIT 1;
       
       IF trial_id IS NOT NULL THEN
           -- Atualiza o alexandregms
           UPDATE public.users 
           SET plan_id = trial_id, role = 'Sócio Administrador' 
           WHERE email = 'alexandregms@gmail.com' AND plan_id IS NULL;

           INSERT INTO public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
           SELECT id, trial_id, NOW(), NOW() + INTERVAL '14 days', 'active', TRUE
           FROM public.users WHERE email = 'alexandregms@gmail.com'
           ON CONFLICT (user_id) DO NOTHING;
       END IF;
    END $$;
    `;

    const { error } = await supabase.rpc('run_sql', { sql });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success: Trigger updated and user fixed.');
    }
}

run();
