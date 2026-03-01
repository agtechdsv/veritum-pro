# 🏛️ Veritum Pro: Planejamento de Arquitetura BYODB
**Documento de Estratégia: Agnosticismo de Dados e Multiterminalidade**

---

## 1. Visão Geral (O Debate)
Este documento consolida o debate estratégico sobre a evolução do **Veritum Pro** para suportar o modelo **BYODB (Bring Your Own Database)**. O objetivo é permitir que clientes corporativos utilizem sua própria infraestrutura de banco de dados (Oracle, SQL Server, Postgres Local, etc.) mantendo a aplicação centralizada na nuvem.

## 2. Pilares Técnicos Escolhidos

### 2.1. Camada de Abstração: Drizzle vs. Prisma
*   **Escolha Estratégica**: **Drizzle ORM**.
*   **Racional**: 
    *   **Performance**: Inicialização (cold start) quase instantânea na Vercel.
    *   **Dinamismo**: Facilidade extrema para abrir novas conexões com strings de conexão diferentes em tempo real.
    *   **Flexibilidade**: Suporte nativo a drivers de bancos tradicionais (Oracle/MSSQL) sem o peso de binários extras.

### 2.2. Modelo de Gestão de Infraestrutura (Híbrido)
Para garantir paz mental no suporte e controle do cliente:
1.  **Modo Automático**: O Veritum Pro gerencia as migrações (ALTER TABLE) se tiver permissão.
2.  **Modo Manual (Enterprise)**: Um **Painel de Saúde da Infraestrutura** avisa quando o banco está defasado e fornece o script SQL para o TI do cliente executar manualmente.

## 3. O Cofre de Configurações (`tenant_configs`)
Tabela central para gerenciar a infraestrutura de cada "Inquilino" (Cliente).

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `owner_id` | UUID | Referência ao dono da conta na tabela `users`. |
| `db_provider` | Enum | Tipo de banco (postgres, oracle, mssql, etc). |
| `db_connection` | Encrypted Text | String de conexão (Host, User, Pass) com AES-256. |
| `custom_supabase_url`| Text | URL para clientes que usam Supabase próprio. |
| `custom_supabase_key`| Encrypted Text | Chave de API do Supabase do cliente. |
| `custom_gemini_key` | Encrypted Text | Chave de IA (Gemini) do próprio cliente. |
| `migration_mode` | Enum | Define se a atualização é 'auto' ou 'manual'. |

## 4. Roteiro de Implementação (Os 3 Passos)

### Passo 1: Desacoplamento (O "Brain")
Isolar todas as chamadas do Supabase em uma pasta `src/services`. Os componentes da aplicação não saberão mais qual banco estão usando; eles apenas pedirão dados para o serviço.

### Passo 2: Registro de Inquilinos
Criação da tabela de configuração e da lógica de criptografia/descriptografia de chaves no servidor.

### Passo 3: Health Check
Implementação de um teste de conectividade no login, garantindo que o banco do cliente está acessível e na versão correta antes da aplicação carregar.

---
**Nota Técnica**: A criptografia das chaves deve utilizar uma `MASTER_ENCRYPTION_KEY` armazenada nas variáveis de ambiente da Vercel para garantir segurança total dos dados sensíveis dos clientes.
