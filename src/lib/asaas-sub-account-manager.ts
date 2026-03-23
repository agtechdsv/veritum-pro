// src/lib/asaas-sub-account-manager.ts

/**
 * Script para gerenciamento de Subcontas no Asaas (White Label / Marketplace)
 * Este serviço permite criar contas filhas sob o mesmo CNPJ da AGTech,
 * garantindo branding personalizado (ex: VERITUM PRO) nos boletos e PIX.
 */

interface SubAccountProfile {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  personType?: 'FISICA' | 'JURIDICA';
  companyType?: string;
  birthDate?: string;
  incomeValue?: number;
}

/**
 * Cria uma nova subconta no Asaas vinculada ao CNPJ Master
 * @param profile Dados da subconta (Branding Name, CNPJ da AGTech, etc)
 * @returns Dados da nova conta criada, incluindo a API Key da subconta
 */
export async function createAsaasSubAccount(profile: SubAccountProfile) {
  // Ler variáveis dinamicamente dentro da função
  const rawUrl = process.env.ASAAS_URL || "https://api.asaas.com/v3";
  const ASAAS_API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
  
  // Estratégia de leitura robusta: 
  // 1. Tentar ler Base64 (ignora bugs de cifrão no Windows)
  // 2. Tentar ler CHAVE_ASAAS_MESTRE
  // 3. Tentar ler ASAAS_API_KEY
  let ASAAS_MASTER_KEY = process.env.ASAAS_API_KEY || process.env.CHAVE_ASAAS_MESTRE;

  if (process.env.ASAAS_KEY_B64) {
      ASAAS_MASTER_KEY = Buffer.from(process.env.ASAAS_KEY_B64, 'base64').toString('utf-8');
      console.log('[DEBUG] Chave Base64 detectada e decodificada.');
  }

  if (!ASAAS_MASTER_KEY || ASAAS_MASTER_KEY === "") {
      console.error("ERRO: Nenhuma chave ASAAS (ou B64) foi encontrada no process.env");
      throw new Error("Chave ASAAS não configurada. Defina ASAAS_KEY_B64 no .env.local e reinicie o servidor.");
  }

  console.log(`Iniciando criação de subconta: ${profile.name}`);

  const payload = {
    name: profile.name,
    email: profile.email,
    cpfCnpj: profile.cpfCnpj.replace(/\D/g, ""),
    phone: profile.phone,
    mobilePhone: profile.mobilePhone || profile.phone,
    address: profile.address,
    addressNumber: profile.addressNumber,
    complement: profile.complement,
    province: profile.province,
    city: profile.city,
    state: profile.state,
    postalCode: profile.postalCode?.replace(/\D/g, ""),
    personType: profile.personType || (profile.cpfCnpj.replace(/\D/g, "").length === 11 ? 'FISICA' : 'JURIDICA'),
    companyType: profile.companyType || 'LIMITED',
    birthDate: profile.birthDate,
    incomeValue: profile.incomeValue || 50000, // Valor padrão de faturamento (R$ 50.000,00)
  };

  try {
    const response = await fetch(`${ASAAS_API_URL}/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_MASTER_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
 
     if (!response.ok) {
      const errorMsg = data.errors?.[0]?.description || "";
      
      // Se o erro for de duplicidade (e-mail ou documento), tentamos re-vincular
      if (errorMsg.includes("email") && errorMsg.includes("uso")) {
          console.log("Detectado e-mail em uso. Tentando re-vincular conta existente...");
          return await relinkExistingSubAccount(payload.email, ASAAS_MASTER_KEY, ASAAS_API_URL);
      }
      
      if (errorMsg.includes("CPF/CNPJ") && errorMsg.includes("uso")) {
          console.log("Detectado CPF/CNPJ em uso. Tentando re-vincular conta existente...");
          return await relinkExistingSubAccount(payload.cpfCnpj, ASAAS_MASTER_KEY, ASAAS_API_URL, true);
      }

      throw new Error(errorMsg || "Falha ao criar subconta.");
     }

    console.log("Subconta criada com sucesso!", data.id);
    
    // Extrair dados bancários da conta criada
    const bankData = data.accountNumber || {};

    // 4. Se a onboardingUrl veio nula, tentar gerar agora manualmente
    let onboardingUrl = data.onboardingUrl;
    if (!onboardingUrl && data.id) {
        try {
            console.log(`Buscando URL de onboarding para subconta ${data.id}...`);
            const onboardingResponse = await fetch(`${ASAAS_API_URL}/accounts/${data.id}/documentation/onboardingUrl`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "access_token": ASAAS_MASTER_KEY,
                }
            });
            const onboardingData = await onboardingResponse.json();
            if (onboardingResponse.ok && onboardingData.onboardingUrl) {
                onboardingUrl = onboardingData.onboardingUrl;
                console.log("URL de Onboarding gerada manualmente:", onboardingUrl);
            }
        } catch (e) {
            console.warn("Falha ao gerar URL de Onboarding manualmente:", e);
        }
    }

    return {
      asaasId: data.id,
      apiKey: data.apiKey,
      walletId: data.walletId,
      onboardingUrl: onboardingUrl,
      agency: bankData.agency,
      accountNumber: bankData.account,
      accountDigit: bankData.accountDigit,
    };
  } catch (err) {
    console.error("Erro na criação da subconta:", err);
    throw err;
  }
}

/**
 * Exemplo de uso para criar o VERITUM PRO
 */
/**
 * Tenta buscar uma subconta existente e gerar uma nova chave de API para ela
 */
async function relinkExistingSubAccount(identifier: string, masterKey: string, apiUrl: string, isCnpj = false) {
    const searchParam = isCnpj ? `cpfCnpj=${identifier.replace(/\D/g, "")}` : `email=${identifier}`;
    console.log(`Buscando conta existente por ${isCnpj ? 'CNPJ' : 'E-mail'}: ${identifier}`);

    // 1. Buscar a conta
    const searchRes = await fetch(`${apiUrl}/accounts?${searchParam}`, {
        method: "GET",
        headers: { "access_token": masterKey }
    });
    const searchData = await searchRes.json();
    const existingAccount = searchData.data?.[0];

    if (!existingAccount) {
        throw new Error("Conta detectada como existente, mas não foi encontrada na busca gerenciada.");
    }

    console.log(`Conta encontrada! ID: ${existingAccount.id}. Gerando nova API Key...`);

    // 2. Gerar nova API Key para essa subconta usando a Master Key
    // Conforme documentação corrigida: POST /v3/accounts/{id}/accessTokens
    const keyUrl = `${apiUrl}/accounts/${existingAccount.id}/accessTokens`;
    console.log(`Chamando URL para gerar chave (Corrigida): ${keyUrl}`);
    
    const keyRes = await fetch(keyUrl, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "access_token": masterKey 
        },
        body: JSON.stringify({ name: "Chave Veritum PRO" })
    });
    
    const keyText = await keyRes.text();
    console.log(`Status geração de chave: ${keyRes.status}`);

    if (!keyRes.ok) {
        console.error("Erro ao gerar chave Asaas:", keyText);
        throw new Error(`Falha ao gerar nova chave: ${keyRes.status}`);
    }

    const keyData = JSON.parse(keyText);

    // 3. Buscar dados bancários e Onboarding da conta recuperada
    const bankData = existingAccount.accountNumber || {};
    
    return {
        asaasId: existingAccount.id,
        apiKey: keyData.accessToken || keyData.apiKey, // Suporta os dois nomes (accessToken é o padrão no endpoint /accessTokens)
        walletId: existingAccount.walletId,
        onboardingUrl: existingAccount.onboardingUrl,
        agency: bankData.agency,
        accountNumber: bankData.account,
        accountDigit: bankData.accountDigit,
    };
}

/*
async function test() {
  const result = await createAsaasSubAccount({
     name: "VERITUM PRO",
     email: "financeiro@veritumpro.com",
     cpfCnpj: "00.000.000/0001-00", // CNPJ da AGTech
     phone: "11999999999"
  });
  console.log("Guarde esta API KEY:", result.apiKey);
}
*/

/**
 * Revoga a API Key de uma subconta (Invalida o acesso)
 * Usando o endpoint oficial: DELETE /v3/accounts/{id}/accessTokens/{accessTokenId}
 * Importante: Requer Whitelist de IPs no Asaas.
 */
export async function deleteAsaasSubAccountKey(subAccountId: string, subAccountApiKey: string) {
  const rawUrl = process.env.ASAAS_URL || "https://api.asaas.com/v3";
  const ASAAS_API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

  try {
    // 1. Em White Label, a própria subconta pode revogar sua chave enviando o token dela
    // OU a Master pode gerenciar via ID. Como não temos o accessTokenId salvo, 
    // a forma mais comum é a subconta invalidar a própria chave atual:
    const response = await fetch(`${ASAAS_API_URL}/accounts/apiKey`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "access_token": subAccountApiKey,
      },
    });

    return response.ok;
  } catch (err) {
    console.error("Erro ao revogar API Key:", err);
    return false;
  }
}
