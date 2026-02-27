// src/lib/asaas-sub-account-manager.ts

/**
 * Script para gerenciamento de Subcontas no Asaas (White Label / Marketplace)
 * Este serviço permite criar contas filhas sob o mesmo CNPJ da AGTech,
 * garantindo branding personalizado (ex: VERITUM PRO) nos boletos e PIX.
 */

const ASAAS_API_URL = process.env.ASAAS_URL || "https://api.asaas.com/v3";
const ASAAS_MASTER_KEY = process.env.ASAAS_API_KEY;

interface SubAccountProfile {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  province?: string;
  postalCode?: string;
}

/**
 * Cria uma nova subconta no Asaas vinculada ao CNPJ Master
 * @param profile Dados da subconta (Branding Name, CNPJ da AGTech, etc)
 * @returns Dados da nova conta criada, incluindo a API Key da subconta
 */
export async function createAsaasSubAccount(profile: SubAccountProfile) {
  if (!ASAAS_MASTER_KEY) throw new Error("ASAAS_API_KEY não configurada.");

  console.log(`Iniciando criação de subconta: ${profile.name}`);

  const payload = {
    name: profile.name,
    email: profile.email,
    cpfCnpj: profile.cpfCnpj.replace(/\D/g, ""), // Limpar pontuação
    mobilePhone: profile.phone,
    // Configurações importantes para White Label
    companyType: "LIMITED", // ou conforme o contrato da AGTech
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
      console.error("Erro Asaas:", data);
      throw new Error(data.errors?.[0]?.description || "Falha ao criar subconta.");
    }

    console.log("Subconta criada com sucesso!", data.id);
    
    // Retorna o ID da conta e a API Key (apiKey é o campo da resposta do Asaas)
    return {
      asaasId: data.id,
      apiKey: data.apiKey,
      walletId: data.walletId,
    };
  } catch (err) {
    console.error("Erro na criação da subconta:", err);
    throw err;
  }
}

/**
 * Exemplo de uso para criar o VERITUM PRO
 */
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
