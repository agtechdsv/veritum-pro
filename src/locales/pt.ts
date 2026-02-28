export const pt = {
    common: {
        loading: 'Carregando...',
        back: 'Voltar',
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        error: 'Erro',
        success: 'Sucesso',
        veritumPro: 'VERITUM PRO',
        backToHome: 'Voltar ao Início',
        privacy: 'Privacidade',
        terms: 'Termos',
        byodb: 'Arquitetura BYODB & Inteligência Jurídica.',
        search: 'Busca global...',
        switchToLight: 'Mudar para tema claro',
        switchToDark: 'Mudar para tema escuro',
        daysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        notApplicable: 'N/A',
        user: 'Usuário',
        loadingEcosystem: 'Carregando ecossistema...',
        selectLanguage: 'Selecionar Idioma'
    },
    nav: {
        home: 'Início',
        modules: 'Módulos',
        pricing: 'Planos',
        story: 'Nossa História',
        login: 'Entrar',
        register: 'Começar Grátis',
        dashboard: 'Veritum Panel',
        admin: 'Administração',
        master: 'Master'
    },
    auth: {
        loginTitle: 'Bem-vindo de volta',
        registerTitle: 'Crie sua conta',
        resetTitle: 'Redefinir Senha',
        loginSubtitle: 'Acesse seu ecossistema jurídico PRO.',
        registerSubtitle: 'Junte-se ao ecossistema jurídico modular de alta performance.',
        resetSubtitle: 'Insira seu e-mail para receber as instruções de redefinição.',
        emailLabel: 'E-mail / Login',
        passwordLabel: 'Senha',
        confirmPasswordLabel: 'Confirmar Senha',
        loginButton: 'Entrar no Ecossistema',
        registerButton: 'Criar Minha Conta',
        resetButton: 'Enviar Instruções',
        googleLogin: 'Entrar com Google',
        noAccount: 'Não tem conta? Cadastre-se',
        hasAccount: 'Já tem conta? Faça Login',
        forgotPassword: 'Esqueceu a senha?',
        signUp: 'Cadastre-se',
        signIn: 'Faça Login',
        backToLogin: 'Voltar ao Login',
        strength: {
            title: 'Força da Senha',
            empty: 'Insira uma senha',
            veryWeak: 'Muito Fraca',
            weak: 'Fraca',
            moderate: 'Moderada',
            strong: 'Forte',
            checks: {
                length: 'Mínimo 6 caracteres',
                upper: 'Letra Maiúscula',
                lower: 'Letra Minúscula',
                number: 'Número',
                symbol: 'Símbolo (!@#$)'
            }
        },
        newPasswordPlaceholder: 'Nova Senha',
        confirmNewPasswordPlaceholder: 'Confirme a Nova Senha',
        errors: {
            passwordsDoNotMatch: 'As senhas não coincidem.',
            passwordTooShort: 'A senha deve ter pelo menos 6 caracteres.',
            resetError: 'Erro ao redefinir senha. Tente novamente.',
            googleError: 'Erro ao entrar com Google.',
            inactive: 'Esta conta está inativa. Entre em contato com o administrador.',
            default: 'Ocorreu um erro na autenticação.'
        }
    },
    modules: {
        title: 'Módulos Especializados',
        subtitle: 'Arquitetura modular projetada para o ciclo de vida jurídico completo.',
        notInPlan: 'Este módulo não faz parte do seu plano atual.',
        acquire: 'Adquirir Módulo',
        learnMore: 'Saiba mais',
        access: 'Acessar Módulo',
        sentinel: {
            title: 'SENTINEL PRO',
            subtitle: 'Monitoramento & Inteligência de Dados',
            newMonitor: 'Novo Monitoramento',
            metrics: {
                active: 'Alertas Ativos',
                risks: 'Riscos Identificados',
                score: 'Score Reputacional',
                captures: 'Capturas (Mês)'
            },
            list: {
                title: 'Monitoramentos',
                empty: 'Nenhum monitoramento ativo.',
                loading: 'Carregando...',
                capturing: 'Capturando...'
            },
            table: {
                title: 'Recortes e Publicações',
                filterPlaceholder: 'Filtrar conteúdo...',
                headers: {
                    statusIA: 'Status IA',
                    source: 'Fonte / Termo',
                    fragment: 'Fragmento do Conteúdo',
                    date: 'Data',
                    actions: 'Ações'
                },
                empty: 'Nenhuma captura encontrada.',
                loading: 'Localizando registros...',
                sentiment: {
                    positive: 'Positivo',
                    negative: 'Negativo',
                    neutral: 'Neutro'
                },
                scoreIA: 'Score IA: {score}%',
                tooltips: {
                    golden: 'Buscar Inteligência Proativa (Golden Alert)',
                    analyze: 'Analisar Sentimento com IA',
                    link: 'Vincular ao NEXUS PRO',
                    view: 'Ver Original',
                    edit: 'Editar'
                }
            },
            modals: {
                link: {
                    title: 'Vincular ao Nexus',
                    subtitle: 'Selecione o processo para anexar o recorte.',
                    empty: 'Nenhum processo cadastrado no Nexus.',
                    noTitle: 'Processo sem título',
                    cancel: 'Cancelar'
                },
                config: {
                    title: 'Configurar Monitoramento',
                    subtitle: 'Busca profunda e análise de sentimento IA.',
                    labelTitle: 'Identificação / Apelido',
                    labelType: 'Tipo de Monitoramento',
                    labelTerm: 'Termo para Busca',
                    placeholderTitle: 'Ex: Monitoramento Banco do Brasil',
                    placeholderTerm: 'CNPJ, OAB ou Termo...',
                    discard: 'Descartar',
                    start: 'Iniciar Tracking',
                    types: {
                        Keyword: 'Palavra-Chave',
                        OAB: 'OAB do Advogado',
                        CNJ: 'Número de Processo',
                        Company: 'Razão Social / CNPJ',
                        Person: 'Nome da Parte'
                    },
                    footer: 'Ao ativar, o Sentinel PRO processará indexações diárias em portais jurídicos e redes sociais, disparando avaliações de sentimento via Gemini AI automaticamente.'
                }
            },
            label: 'Sentinel'
        },
        nexus: {
            label: 'Nexus',
            title: 'NEXUS PRO',
            subtitle: 'Core Operacional & Gestão Processual',
            views: {
                kanban: 'Kanban',
                list: 'Listagem'
            },
            newLawsuit: 'Novo Processo',
            newTask: 'Agendar Tarefa',
            metrics: {
                active: 'Processos Ativos',
                deadlines: 'Prazos Fatais 24h',
                pending: 'Pendências Médias',
                completion: 'Taxa de Conclusão'
            },
            kanban: {
                todo: 'A Fazer',
                doing: 'Em Andamento',
                done: 'Concluído',
                late: 'Atrasado',
                loading: 'Carregando...',
                deleteConfirm: 'Tem certeza que deseja arquivar este processo? Ele poderá ser recuperado pelo administrador.'
            },
            table: {
                headers: {
                    cnj: 'Número CNJ',
                    title: 'Título / Cliente',
                    status: 'Status',
                    lastMovement: 'Último Movimento',
                    actions: 'Ações'
                }
            },
            modals: {
                lawsuit: {
                    title: 'Cadastro de Processo',
                    subtitle: 'Vinculação relacional para automação Sentinel PRO.',
                    labelCnj: 'Número do Processo (CNJ - Estrito)',
                    placeholderCnj: '0000000-00.0000.0.00.0000',
                    labelTitle: 'Título do Caso / Identificação',
                    placeholderTitle: 'Ex: Ação de Cobrança - [Nome do Cliente]',
                    labelAuthor: 'Polo Ativo (Autor)',
                    labelDefendant: 'Polo Passivo (Réu)',
                    selectCrm: 'Selecione do CRM...',
                    advancedShow: 'Ver Campos Avançados',
                    advancedHide: 'Ocultar Campos Avançados',
                    labelLawyer: 'Advogado Responsável',
                    selectTeam: 'Selecione da Equipe...',
                    labelSphere: 'Esfera',
                    placeholderSphere: 'Ex: Trabalhista',
                    labelValue: 'Valor da Causa (R$)',
                    placeholderValue: '0,00',
                    cancel: 'Cancelar',
                    save: 'Salvar Processo no Nexus',
                    validation: {
                        cnj: 'Número CNJ Inválido! Use o formato: 0000000-00.0000.0.00.0000'
                    }
                },
                task: {
                    title: 'Agendar Tarefa',
                    subtitle: 'Vinculação estrita: Equipe & Processos.',
                    labelTitle: 'Título da Tarefa',
                    placeholderTitle: 'Ex: Protocolar Petição Inicial',
                    labelLawsuit: 'Vincular a Processo (Nexus)',
                    selectLawsuit: 'Selecione um processo...',
                    labelResponsible: 'Responsável (Equipe)',
                    selectTeam: 'Selecione da Equipe...',
                    labelDueDate: 'Prazo (Due Date)',
                    labelPriority: 'Prioridade',
                    priorities: {
                        Low: 'Baixa',
                        Medium: 'Média',
                        High: 'Alta',
                        Urgent: 'Urgente'
                    },
                    cancel: 'Cancelar',
                    save: 'Criar Tarefa'
                }
            }
        },
        scriptor: { label: 'Scriptor' },
        valorem: { label: 'Valorem' },
        cognitio: { label: 'Cognitio' },
        vox: { label: 'Vox Clientis' },
        intelligence: { label: 'Intelligence Hub' }
    },
    pricing: {
        title: 'Planos que acompanham o seu crescimento.',
        subtitle: 'Nós não vendemos apenas software, entregamos a arquitetura exata para o seu momento na advocacia.',
        cancelGuarantee: 'O Veritum PRO não tem taxa de adesão, não tem fidelidade e não tem letras miúdas. Você fica porque encontrou a paz mental para advogar, não porque está preso a nós. Escolha o seu plano, cancele quando quiser.',
        compare: 'Comparar Planos e Valores',
        plans: {
            start: {
                title: 'START',
                desc: 'Para advogados autônomos e novos escritórios que precisam organizar a casa e parar de perder prazos.'
            },
            growth: {
                title: 'GROWTH',
                desc: 'Para escritórios em crescimento que exigem automação de tarefas e Inteligência Artificial para ganhar escala.',
                badge: 'Mais Popular'
            },
            strategy: {
                title: 'STRATEGY',
                desc: 'Para departamentos jurídicos corporativos que tomam decisões baseadas em Jurimetria e dados profundos.',
                badge: 'Enterprise'
            }
        }
    },
    dashboard: {
        accessModule: 'Acessar Módulo',
        acquireModule: 'Adquirir Módulo',
        moduleLocked: 'Este módulo não faz parte do seu plano atual.',
        welcome: 'Bem-vindo ao',
        veritumPro: 'Veritum Pro',
        intro: 'Selecione uma área para começar a explorar o ecossistema jurídico modular.',
        suiteTitle: 'Dashboard de Módulos',
        suiteSubtitle: 'Acesse as ferramentas do ecossistema Veritum Pro.',
        adminTitle: 'Gestão de Administração',
        adminSubtitle: 'Controle de acesso e configurações do ecossistema.',
        masterTitle: 'Painel Master',
        masterSubtitle: 'Configurações estruturais de módulos e planos comerciais.',
        groups: {
            modules: {
                title: 'Módulos',
                desc: 'Acesse as ferramentas inteligentes do ecossistema Veritum Pro.'
            },
            admin: {
                title: 'Administração',
                desc: 'Gerencie usuários, permissões e configurações do sistema.'
            },
            master: {
                title: 'Master',
                desc: 'Configurações de infraestrutura, módulos e planos comerciais.'
            }
        },
        search: 'Busca global...',
        accessFunc: 'Acesse as funcionalidades do módulo {name}.',
        adminUserDesc: 'Gerencie a hierarquia de usuários, permissões de acesso e controle de papéis (Master/Admin/Operador).',
        adminSettingsDesc: 'Ajuste as preferências globais do sistema, integrações e parâmetros de interface.',
        masterSuitesDesc: 'Configuração estrutural de módulos, chaves de API e disponibilização no ecossistema.',
        masterPlansDesc: 'Criação e edição de planos comerciais, preços, descontos e vinculação de permissões.',
        masterSchedDesc: 'Gestão de leads, agendamentos de demonstrações VIP e calendário de vendas.',
        masterEmailDesc: 'Configuração de aliases SMTP (FROM) por departamento e localização (JSONB).',
        masterGenericDesc: 'Ajustes estruturais de {name}.'
    },
    hero: {
        title: 'O Ecossistema Jurídico',
        titleAccent: 'Modular & Inteligente',
        subtitle: 'Uma arquitetura BYODB (Bring Your Own Database) completa para escritórios de alta performance. Seu dado, sua infraestrutura, nossos módulos inteligentes.',
        ctaPrimary: 'Começar Agora',
        ctaSecondary: 'Ver planos e preços',
    },
    storyPage: {
        title: 'A Busca pela Clareza.',
        subtitle: 'A Busca pela Verdade.',
        purpose: 'O Propósito',
        pain: {
            title: 'A dor que nos moveu',
            content1: 'Sabemos que a advocacia moderna se tornou um mar de caos. Entre sistemas judiciais complexos, planilhas intermináveis e o medo constante de perder um prazo fatal, o advogado perdeu o seu bem mais precioso: o tempo para pensar estrategicamente e a qualidade de vida.',
            content2: 'O mercado estava cheio de softwares, mas a maioria parecia ter sido desenhada para dificultar, e não para ajudar. Sentíamos que a tecnologia jurídica precisava de menos burocracia e mais humanidade.'
        },
        birth: {
            title: 'O nascimento de um Ecossistema',
            content: 'Foi dessa frustração que nasceu o nosso ecossistema. Nós não queríamos criar apenas "mais um sistema de gestão". Queríamos construir um parceiro silencioso, uma inteligência invisível que trabalhasse nos bastidores para que os escritórios pudessem focar no que realmente importa: a justiça e os seus clientes.'
        },
        meaning: {
            title: 'O Significado de Veritum',
            content: 'Quando fomos batizar nossa plataforma, não queríamos uma palavra que significasse apenas "dados corretos". Queríamos algo que fosse além dos números e olhasse para as pessoas.',
            veritas: {
                title: 'Veritas',
                subtitle: 'A verdade abstrata',
                desc: 'O conceito geral de justiça que você defende. O ideal.'
            },
            verum: {
                title: 'Verum',
                subtitle: 'O fato frio',
                desc: 'A prova objetiva, o documento anexado aos autos. Dados brutos.'
            },
            veritum: {
                title: 'Veritum',
                subtitle: 'A verdade sentida',
                desc: 'A realidade experimentada. O aspecto psicológico da paz mental.',
                specialTag: 'A Escolha Veritum'
            }
        },
        deepDive: {
            peaceTitle: 'PAZ',
            peaceSubtitle: 'Psicológica',
            content1: 'E no Direito, onde a verdade muitas vezes fica oculta sob pilhas de documentos e prazos, entregar Veritum significa entregar a paz mental.',
            content2: 'É a tranquilidade psicológica de saber que nenhum prazo será perdido. O Veritum PRO existe para trazer a clareza à tona: ele ilumina o seu escritório, transformando o caos processual em controle visual, dados brutos em jurimetria exata, e tarefas repetitivas em automação inteligente.',
            quote: 'Nós simplificamos a tecnologia para que você sinta a verdadeira liberdade de advogar e possa elevar a sua performance ao máximo.'
        },
        cta: {
            title: 'Veritum PRO - A verdade sobre o seu escritório, o controle sobre o seu futuro.'
        },
        footer: 'Veritum PRO - A verdade sobre o seu escritório, o controle sobre o seu futuro.'
    },
    userMenu: {
        profile: 'Meu Perfil',
        logout: 'Sair do Ecossistema',
        profileBreadcrumb: 'Perfil'
    },
    staticPages: {
        privacy: {
            title: 'Política de Privacidade',
            updatedAt: 'Última atualização: 24 de Fevereiro de 2024',
            intro: 'A sua privacidade é de extrema relevância para o Veritum PRO. Esta política descreve como coletamos, usamos e protegemos as suas informações ao utilizar a nossa arquitetura BYODB integrada ao Supabase.',
            section1Title: '1. Arquitetura BYODB (Bring Your Own Database)',
            section1Content: 'O Veritum PRO opera sob um modelo onde você fornece a sua própria infraestrutura de dados. Credenciais de API (Supabase/Gemini) são armazenadas localmente no seu dispositivo ou em tabelas seguras sob o seu controle. Nós não temos acesso aos seus dados de clientes ou processos judiciais.',
            section2Title: '2. Coleta de Informações',
            section2Content: 'Coletamos apenas dados essenciais para autenticação (E-mail/Nome) via Supabase Auth e preferências de interface (Tema/Idioma). O conteúdo processado pelos módulos (Nexus, Sentinel) reside exclusivamente na sua instância de banco de dados.',
            section3Title: '3. Inteligência Artificial',
            section3Content: 'Utilizamos o Google Gemini AI para processamento jurídico. Os dados enviados para análise são processados conforme as políticas de privacidade da Google API, e nenhuma informação sensível é utilizada para treinamento de modelos globais por nossa parte.'
        },
        terms: {
            title: 'Termos de Serviço',
            updatedAt: 'Última atualização: 24 de Fevereiro de 2024',
            intro: 'Ao acessar o ecossistema Veritum PRO, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis.',
            section1Title: '1. Licença de Uso',
            section1Content: 'O Veritum PRO concede uma licença limitada, não exclusiva e revogável para o uso do software modular conforme o plano contratado. É proibida a engenharia reversa ou redistribuição dos módulos proprietários.'
        }
    },
    management: {
        accessGroups: {
            title: 'Grupos de Acesso',
            subtitle: 'Refinamento Granular: Defina permissões por funcionalidade.'
        },
        users: {
            title: 'Gestão de Usuários',
            subtitle: 'Administre quem acessa seu ecossistema.',
            searchPlaceholder: 'Nome ou e-mail...',
            searchLabel: 'Buscar Integrante',
            roleLabel: 'Role/Nível',
            statusLabel: 'Status',
            newUser: 'Novo Usuário',
            allPlans: 'Todos os Planos',
            allRoles: 'Todos',
            active: 'Ativos',
            inactive: 'Inativos',
            filterByAdmin: 'Filtrar por Administrador',
            allAdmins: 'Todos os Administradores',
            masterFilter: {
                self: 'Master (Meus Usuários)',
                clients: 'Sócio-Administradores Privados'
            },
            table: {
                member: 'Integrante',
                accessGroup: 'Grupo de Acesso',
                role: 'Role',
                status: 'Status',
                controls: 'Controles',
                noGroup: 'Sem Grupo',
                syncing: 'Sincronizando Ecossistema...',
                noUser: 'Nenhum integrante encontrado.',
                readOnly: 'Apenas Leitura',
                page: 'Página {current} de {total}',
                tooltips: {
                    toggleStatus: 'Alternar Status',
                    edit: 'Editar',
                    delete: 'Excluir'
                }
            },
            roles: {
                master: 'Master',
                admin: 'Administrador',
                operator: 'Operador',
                intern: 'Estagiário',
                partnerAdmin: 'Sócio-Administrador',
                partnerAdministrative: 'Sócio Administrativo',
                senior: 'Sênior',
                coordinator: 'Coordenador',
                paralegal: 'Paralegal',
                financial: 'Financeiro',
            },
            modal: {
                addTitle: 'Novo Integrante',
                editTitle: 'Atualizar Dados',
                subtitle: 'Configure as credenciais e o nível de acesso.',
                name: 'Nome Completo',
                email: 'E-mail / Login',
                password: 'Senha Inicial',
                passwordEdit: 'Trocar Senha (Opcional)',
                role: 'Cargo / Função Corporativa',
                selectRole: 'Selecione um Cargo...',
                inherited: 'Permissões herdadas do Grupo: {name}',
                close: 'Fechar',
                submitAdd: 'Finalizar Cadastro',
                submitEdit: 'Salvar Edição',
                roleRestriction: 'Apenas administradores podem alterar cargos e permissões.',
                globalSystem: 'Sistema Global',
                godMode: 'Super Master (Deus)'
            },
            delete: {
                title: 'Excluir Integrante?',
                message: 'Você tem certeza que deseja excluir "{name}"? Esta ação é irreversível.',
                confirm: 'Sim, Excluir',
                cancel: 'Não, Cancelar'
            },
            bulk: {
                selected: '{count} selecionados',
                activate: 'Ativar Selecionados',
                deactivate: 'Desativar Selecionados',
                delete: 'Excluir Permanentemente',
                confirmDelete: 'Tem certeza que deseja excluir {count} usuários? Esta ação é irreversível.'
            },
            toast: {
                bulkStatusSuccess: '{count} usuários marcados como {status}!',
                bulkDeleteSuccess: '{count} usuários removidos do ecossistema!',
                bulkError: 'Erro ao processar ações em massa.',
                superAdminOnly: 'Acesso negado: Requer nível Sócio-Administrador.',
                operatorRestriction: 'Restrição: Operadores não podem criar Administradores.',
                selfEditOnly: 'Você só pode editar seu próprio perfil.',
                successEdit: 'Dados atualizados com sucesso!',
                successAdd: 'Integrante cadastrado no ecossistema!',
                statusSuccess: 'Usuário está agora {status}.',
                successDelete: 'Integrante removido permanentemente.',
                deleteError: 'Falha ao remover integrante.',
                errorProcess: 'Erro no processamento da solicitação.',
                unauthorized: 'Ação não autorizada.'
            },
            menu: 'Gestão de Usuários'
        },
        access: {
            title: 'Grupos de Acesso',
            subtitle: 'Refinamento Granular: Defina permissões por funcionalidade.',
            menu: 'Grupos de Acesso',
            newGroup: 'Novo Grupo',
            masterGroups: 'Master (Meus Grupos)',
            privateAdmins: 'Sócio-Administradores Privados',
            noRoles: 'Nenhum cargo encontrado. Crie um novo primeiro.',
            created: 'Criado em {date}',
            noAccess: 'Nenhum acesso ativo',
            syncing: 'Sincronizando Ecossistema...',
            noGroups: 'Nenhum grupo de acesso criado.',
            table: {
                group: 'Grupo de Acesso',
                members: 'Integrantes',
                features: 'Funcionalidades',
                controls: 'Controles',
                noMembers: 'Nenhum Integrante',
                memberCount: '{count} Integrantes',
                featureCount: '{count} Funções',
            },
            modal: {
                addTitle: 'Novo Grupo RBAC',
                editTitle: 'Configurar Permissões',
                subtitle: 'Ative funcionalidades específicas para este perfil.',
                translateIA: 'Traduzir via IA',
                translating: 'Traduzindo...',
                groupName: 'Identificação do Grupo',
                groupNamePlaceholder: 'Ex: Equipe de Triagem, Controladoria, Sócios...',
                templateLabel: 'Usar Template (Acesso Rápido)',
                templatePlaceholder: 'Selecione um template para preenchimento rápido...',
                clearSelection: 'Limpar Seleção',
                clearSelectionSuccess: 'Permissões limpas.',
                linkedRoles: 'Cargos Vinculados',
                newRole: 'Novo Cargo',
                rolesPlaceholder: 'Selecione cargos ou crie novos...',
                others: 'Outros Cargos / Avulsos',
                granularTitle: 'Permissões Granulares por Suíte',
                featuresActive: '{count} de {total} Ativos',
                toggleAll: 'Alternar Tudo',
                planRestriction: 'O plano atual não tem acesso a esta funcionalidade.',
                save: 'Salvar Grupo e Permissões',
                close: 'Fechar'
            },
            roleModal: {
                addTitle: 'Novo Cargo',
                editTitle: 'Editar Cargo',
                subtitle: 'Defina o nome da função',
                namePlaceholder: 'Ex: Advogado Pleno',
                save: 'Salvar Cargo'
            },
            delete: {
                title: 'Excluir?',
                message: 'Remover o grupo {name}? Usuários vinculados perderão acesso granular.',
                confirm: 'Sim, Remover Grupo',
                cancel: 'Cancelar',
                error: 'Erro ao remover: {error}'
            },
            toast: {
                duplicate: 'Já existe um grupo com o nome "{name}"',
                successName: 'Nome do grupo atualizado.',
                successSave: 'Grupo e permissões atualizados!',
                successCreate: 'Grupo criado com sucesso!',
                errorSave: 'Ocorreu um erro ao salvar o grupo.',
                fillName: 'Preencha o nome do grupo em pt-br para realizar a tradução.',
                successTranslate: 'Tradução via IA concluída!',
                errorTranslate: 'Erro na tradução: verifique a API Key do Gemini.',
                duplicateRole: 'O cargo "{name}" já existe.',
                successRoleAdd: 'Cargo criado com sucesso.',
                successRoleEdit: 'Cargo atualizado.',
                errorRole: 'Erro ao salvar cargo.',
                applyTemplateSuccess: 'Template "{name}" aplicado!',
                applyTemplateWithPremium: 'Template "{name}" aplicado! (Recursos premium ignorados)',
                loadModulesError: 'Erro ao carregar módulos do sistema.',
                loadFeaturesError: 'Erro ao carregar funcionalidades.'
            }
        },
        settings: {
            title: 'Configurações',
            menu: 'Configurações',
            subtitle: 'Ajustes globais do seu workspace.',
            tabs: {
                infra: 'Infraestrutura',
                org: 'Dados do Escritório',
                plan: 'Minha Assinatura'
            },
            infra: {
                title: 'Bring Your Own Database (BYODB)',
                save: 'Salvar Infra',
                urlLabel: 'Custom Supabase URL',
                keyLabel: 'Custom Supabase Key',
                geminiLabel: 'Custom Gemini Key',
                urlPlaceholder: 'https://your-project.supabase.co',
                keyPlaceholder: 'Anon/Public Key...',
                geminiPlaceholder: 'AIzaSyB...',
                privacyTitle: 'Privacidade Garantida',
                privacyDesc: 'Ao utilizar BYODB, seus dados de clientes, processos e faturamento nunca saem do seu próprio servidor Supabase.',
                restricted: 'Acesso restrito a Sócio-Administradores.'
            },
            toast: {
                saveSuccess: 'Configurações de infraestrutura salvas!',
                saveError: 'Erro ao salvar configurações.'
            },
            plan: {
                restrictedSub: 'Acesso restrito a Sócio-Administradores.',
                restrictedDesc: 'Apenas os administradores responsáveis pela organização (Sócio-Administrador) podem visualizar detalhes ou gerenciar a assinatura do ecossistema.',
                loading: 'Carregando detalhes da assinatura...',
                currentPlan: 'Plano Atual',
                planAccess: 'Acesso total ao ecossistema habilitado no seu plano.',
                upgrade: 'Fazer Upgrade',
                ecosystemModules: 'Módulos do Ecossistema',
                statusUnlocked: 'Liberado',
                statusPartial: 'Acesso Parcial',
                statusLocked: 'Bloqueado',
                acquire: 'Adquirir',
                features: 'Funcionalidades',
                commercialPlans: 'Planos Comerciais',
                ecosystemCombo: 'Ecosystem Combo',
                individualModule: 'Módulo Individual',
                recommended: 'Recomendado',
                perMonth: '/mês',
                perYear: '/ano',
                monthly: 'Mensal',
                yearly: 'Anual',
                liberated: 'Liberado',
                current: 'Atual',
                acquirePlan: 'Adquirir Plano',
                aLaCarteModules: 'Módulos Avulsos',
                acquireModule: 'Adquirir Módulo'
            }
        },
        organization: {
            identification: 'Identificação',
            companyName: 'Razão Social',
            companyNamePlaceholder: 'Nome Oficial da Empresa',
            tradingName: 'Nome Fantasia',
            tradingNamePlaceholder: 'Nome de Marca',
            cnpj: 'CNPJ',
            logo: 'Logo & Marcas',
            logoTitle: 'Logotipo do Escritório',
            logoDesc: 'Será usado em cabeçalhos de documentos e relatórios.',
            email: 'E-mail Comercial',
            emailPlaceholder: 'contato@escritorio.com',
            phone: 'Telefone',
            website: 'Site',
            address: 'Endereço Sede',
            zip: 'CEP (Busca Automática)',
            street: 'Logradouro (Rua/Av)',
            number: 'Número',
            complement: 'Complemento',
            neighborhood: 'Bairro',
            city: 'Cidade',
            state: 'UF',
            save: 'Salvar Escritório',
            toast: {
                fetchError: 'Erro ao carregar dados do escritório.',
                cepError: 'CEP não encontrado.',
                cepFetchError: 'Erro ao buscar CEP.',
                saveSuccess: 'Dados do escritório salvos com sucesso!',
                saveError: 'Erro ao salvar dados.'
            }
        },
        master: {
            suites: {
                menu: 'Gestão de Módulos',
                title: 'Gestão de Módulos',
                subtitle: 'Configure a vitrine do seu ecossistema jurídico.',
                listTitle: 'Listagem de Módulos',
                table: {
                    order: 'Ordem',
                    module: 'Módulo',
                    actions: 'Ações',
                    visible: 'Módulo Visível',
                    hidden: 'Módulo Oculto',
                    noActive: 'Nenhum módulo ativo'
                },
                form: {
                    edit: 'Editar Módulo',
                    add: 'Novo Módulo',
                    metadata: 'Metadata do Ecossistema',
                    saveChanges: 'Salvar Alterações',
                    cancelSelection: 'Cancelar Seleção',
                    publish: 'Publicar Módulo',
                    idKey: 'Key Identificadora',
                    mainName: 'Nome Principal',
                    translateIA: 'Traduzir via IA',
                    translating: 'Traduzindo...',
                    shortBio: 'Bio Curta',
                    cardDetails: 'Detalhes do Card',
                    features: 'Recursos / Features',
                    iconSvg: 'Código SVG do Ícone',
                    activePortal: 'Ativa no Portal'
                },
                delete: {
                    title: 'Confirmar Exclusão',
                    message: 'Você está prestes a remover permanentemente o módulo "{name}" do ecossistema. Esta ação não pode ser desfeita.',
                    cancel: 'Cancelar',
                    confirm: 'Sim, Excluir'
                },
                toast: {
                    successUpdate: 'Módulo atualizado com sucesso!',
                    successCreate: 'Módulo criado com sucesso!',
                    errorSave: 'Erro ao salvar módulo',
                    errorStatus: 'Erro ao alterar status: {error}',
                    errorDelete: 'Erro ao excluir: {error}',
                    fillBio: 'Preencha ao menos a Bio Curta para traduzir.',
                    noGemini: 'Chave do Gemini não configurada. Por favor, adicione sua API Key nas Configurações.',
                    successTranslate: 'Tradução baseada em IA concluída!',
                    errorTranslate: 'Erro na tradução: {error}'
                }
            },
            plans: {
                menu: 'Gestão de Planos',
                title: 'Gestão de Planos',
                subtitle: 'Configure os pacotes e preços do Veritum Pro.',
                filters: {
                    all: 'Todos',
                    individual: 'Individuais',
                    combo: 'Combos'
                },
                listTitle: 'Listagem',
                table: {
                    order: 'Ordem',
                    plan: 'Plano',
                    action: 'Ação',
                    active: 'Plano Ativo',
                    inactive: 'Plano Inativo'
                },
                form: {
                    edit: 'Editando:',
                    noName: 'Sem Nome',
                    add: 'Novo Plano',
                    tabs: {
                        details: 'Detalhes',
                        permissions: 'Permissões'
                    },
                    saveChanges: 'Salvar Alterações',
                    cancelSelection: 'Cancelar Seleção',
                    create: 'Criar Plano',
                    name: 'Nome do Plano',
                    shortDesc: 'Descrição Curta',
                    shortDescPlaceholder: 'Breve slogan ou diferencial do plano...',
                    translateIA: 'Traduzir via Gemini IA',
                    monthlyPrice: 'Preço Base Mensal (R$)',
                    discount: '% Mensal',
                    quarterlyDiscount: '% Trimestral',
                    semiannualDiscount: '% Semestral',
                    yearlyDiscount: '% Anual',
                    basicFeatures: 'Funcionalidades Básicas (Bullet Points)',
                    featuresPlaceholder: 'Uma funcionalidade por linha...',
                    recommended: 'Plano Recomendado',
                    activeSale: 'Ativo para Venda',
                    comboPlan: 'Plano Combo',
                    granularTitle: 'Controle de Acesso Granular',
                    granularDesc: 'Selecione quais suítes e funcionalidades específicas estarão liberadas neste plano.',
                    tooltips: {
                        uncheckAll: 'Clique para desmarcar tudo',
                        originalData: 'Dados Originais (Clique para marcar tudo)',
                        empty: 'Vazio (Clique para restaurar originais)',
                        partial: 'Seleção Parcial (Clique para marcar tudo)'
                    }
                },
                delete: {
                    title: 'Excluir Plano?',
                    message: 'Você removerá "{name}" das opções de venda.',
                    no: 'Não',
                    confirm: 'Sim, Excluir'
                },
                toast: {
                    errorProcess: 'Falha ao salvar o plano (dados não retornados)',
                    successUpdate: 'Plano e permissões atualizados!',
                    successCreate: 'Plano criado com sucesso!',
                    errorSave: 'Erro ao salvar plano',
                    statusSuccess: 'Plano {status} com sucesso!',
                    errorStatus: 'Erro ao alterar status: {error}',
                    errorDelete: 'Erro ao excluir: {error}',
                    fillBio: 'Preencha a Bio Curta para traduzir.',
                    successTranslate: 'Tradução baseada em IA concluída!',
                    errorTranslate: 'Erro na tradução: {error}'
                }
            },
            scheduling: {
                menu: 'Agendamentos',
                title: 'Gestão de',
                titleHighlight: 'Agendamentos',
                subtitle: 'Visualize e organize as demonstrações estratégicas solicitadas.',
                views: {
                    month: 'Mensal',
                    day: 'Diário'
                },
                sidebar: {
                    title: 'Solicitações',
                    empty: 'Nada encontrado',
                    filterTitle: 'Filtrar Período',
                    status: {
                        all: 'Tudo',
                        pending: 'Pend',
                        scheduled: 'Agend',
                        attended: 'Atend',
                        canceled: 'Canc'
                    }
                },
                calendar: {
                    today: 'Hoje',
                    monthFormat: 'MMMM yyyy',
                    dayFormat: 'EEEE, dd MMMM',
                    filters: {
                        all: 'Ver Todos',
                        scheduled: 'Agendados',
                        attended: 'Atendidos',
                        canceled: 'Cancelados'
                    },
                    tooltips: {
                        selectTime: 'Selecione o horário para {name}',
                        scheduleAt: 'Agendar às {time}'
                    }
                },
                actions: {
                    sendInvite: 'Enviar E-mail de Convite',
                    edit: 'Editar Agendamento',
                    markAttended: 'Marcar como Atendido',
                    backPending: 'Voltar para Pendentes',
                    attended: 'Atendido',
                    reschedule: 'Remarcar',
                    cancel: 'Cancelar',
                    delete: 'Excluir'
                },
                delete: {
                    title: 'Confirmar Exclusão',
                    message: 'Você tem certeza que deseja excluir o agendamento de "{name}"? Esta ação não pode ser desfeita.',
                    cancel: 'Cancelar',
                    confirm: 'Excluir Lead'
                },
                scheduleConfirm: {
                    title: 'Confirmar Agendamento?',
                    message: 'Você está confirmando a demonstração para:',
                    scheduledFor: 'Agendado para',
                    at: 'às',
                    no: 'Não, Voltar',
                    yes: 'Sim, Confirmar',
                    saving: 'Salvando...'
                },
                editModal: {
                    title: 'Editar Agendamento',
                    leadLabel: 'Lead: {name}',
                    fields: {
                        name: 'Nome Completo',
                        email: 'Email',
                        whatsapp: 'WhatsApp',
                        teamSize: 'Tamanho da Equipe',
                        meetingLink: 'Link da Reunião (Zoom, Teams, etc)',
                        meetingPlaceholder: 'https://zoom.us/j/...'
                    },
                    actions: {
                        cancel: 'Cancelar',
                        sending: 'Enviando...',
                        sendInvite: 'Enviar Convite',
                        save: 'Salvar Alterações'
                    }
                },
                toast: {
                    successConfirm: 'Agendamento confirmado!',
                    errorConfirm: 'Erro ao confirmar agendamento.',
                    errorTechnical: 'Falha técnica no agendamento.',
                    successDelete: 'Agendamento excluído permanentemente.',
                    errorDelete: 'Erro ao excluir agendamento.',
                    successUpdate: 'Agendamento atualizado com sucesso!',
                    errorSave: 'Erro ao salvar alterações.',
                    missingLink: 'Informe o link da reunião antes de enviar o convite.',
                    missingDate: 'Esta solicitação não possui data agendada.',
                    emailSubject: 'Confirmação de Reunião - Veritum PRO',
                    emailSuccess: 'Convite enviado para {email}!',
                    emailError: 'Falha no envio: {error}',
                    unexpectedError: 'Erro inesperado ao enviar e-mail.'
                }
            },
            email: {
                menu: 'Gestão de E-mails',
                title: 'Gestão de E-mails',
                subtitle: 'Configure os aliases (FROM) agrupados por cenário (JSONB).',
                scenarios: {
                    general: 'Dúvidas Gerais e Parcerias',
                    sales: 'Vendas VIP e Agendamentos',
                    billing: 'Gestão de Assinaturas e Financeiro',
                    support: 'Ajuda Técnica e Suporte'
                },
                card: {
                    description: 'Traduções e e-mails',
                    save: 'Salvar',
                    email: 'E-mail',
                    name: 'Nome'
                },
                langs: {
                    pt: 'Português (BR)',
                    en: 'Inglês (US)'
                },
                toasts: {
                    loadError: 'Erro ao carregar configurações de e-mail',
                    saveSuccess: 'Configuração atualizada com sucesso',
                    saveError: 'Erro ao salvar configuração'
                }
            },
            team: {
                menu: 'Gestão de Equipe',
                title: 'Gestão de Equipe',
                subtitle: 'Gerencie os membros do seu workspace e suas respectivas permissões.',
                addMember: 'Adicionar Membro',
                searchPlaceholder: 'Buscar por nome, e-mail ou OAB...',
                stats: {
                    total: 'Workspace Total',
                    active: 'Colaboradores Ativos'
                },
                table: {
                    member: 'Membro',
                    role: 'Cargo / ID',
                    contact: 'Contato',
                    status: 'Status',
                    actions: 'Ações',
                    loading: 'Carregando membros...',
                    empty: 'Nenhum membro encontrado.'
                },
                status: {
                    active: 'Ativo',
                    inactive: 'Inativo'
                },
                tooltips: {
                    edit: 'Editar Membro',
                    access: 'Configurações de Acesso'
                },
                modal: {
                    titles: {
                        edit: 'Editar Membro',
                        new: 'Novo Membro da Equipe'
                    },
                    fields: {
                        name: 'Nome Completo',
                        namePlaceholder: 'Ex: João da Silva',
                        email: 'E-mail Corporativo',
                        emailPlaceholder: 'email@empresa.com',
                        phone: 'Celular / Whats',
                        phonePlaceholder: '(11) 99999-9999',
                        oab: 'Número da OAB',
                        oabPlaceholder: 'SP123456',
                        role: 'Cargo / Função',
                        rolePlaceholder: 'Selecione um cargo...'
                    },
                    roles: {
                        socio: 'Sócio-Administrador',
                        advogado: 'Advogado Associado',
                        estagiario: 'Estagiário',
                        paralegal: 'Paralegal',
                        financeiro: 'Financeiro / Admin'
                    },
                    actions: {
                        cancel: 'Cancelar',
                        update: 'Atualizar Membro',
                        create: 'Cadastrar Membro'
                    }
                },
                toasts: {
                    fetchError: 'Erro ao carregar membros',
                    saveError: 'Erro ao salvar membro',
                    statusError: 'Erro ao alterar status'
                }
            },
            persons: {
                menu: 'CRM de Clientes',
                title: 'CRM - Clientes e Pessoas',
                subtitle: 'Repositório central de dados estruturados para processos e IA.',
                newEntry: 'Novo Cadastro CRM',
                searchPlaceholder: 'Buscar por nome ou CPF/CNPJ...',
                stats: {
                    label: 'Base de Dados CRM'
                },
                table: {
                    member: 'Membro',
                    classification: 'Classificação',
                    contact: 'Contato',
                    actions: 'Ações',
                    loading: 'Carregando CRM...',
                    empty: 'Nenhuma pessoa cadastrada.'
                },
                types: {
                    Cliente: 'Cliente',
                    Reclamado: 'Reclamado',
                    Testemunha: 'Testemunha',
                    Preposto: 'Preposto',
                    'Advogado Adverso': 'Advogado Adverso'
                },
                modal: {
                    titles: {
                        edit: 'Editar Cadastro',
                        new: 'Novo Cadastro CRM'
                    },
                    sections: {
                        classification: 'Tipo de Classificação',
                        advanced: 'Ver Detalhes Avançados (RG, Endereço, Histórico)',
                        hideAdvanced: 'Esconder Campos Avançados'
                    },
                    fields: {
                        name: 'Nome Completo / Razão Social',
                        namePlaceholder: 'Ex: Pedro de Alcântara ou Empresa Ltda',
                        document: 'CPF / CNPJ (Somente Números)',
                        documentPlaceholder: '000.000.000-00',
                        phone: 'WhatsApp / Telefone',
                        phonePlaceholder: '+55 (11) 9...',
                        email: 'E-mail Principal',
                        emailPlaceholder: 'contato@cliente.com',
                        rg: 'RG',
                        cep: 'CEP',
                        maritalStatus: 'Estado Civil',
                        profession: 'Profissão',
                        history: 'Histórico de Funções / Notas',
                        historyPlaceholder: 'Detalhes relevantes para o processo trabalhista/cível...'
                    },
                    actions: {
                        cancel: 'Cancelar',
                        update: 'Atualizar Registro',
                        save: 'Salvar no CRM'
                    }
                },
                validations: {
                    invalidDocument: 'Formato de Documento Inválido! Use 000.000.000-00 ou 00.000.000/0000-00'
                },
                confirmations: {
                    softDelete: 'Tem certeza que deseja ocultar este cadastro? O dado permanecerá no servidor para recuperação.'
                },
                toasts: {
                    saveSuccess: 'Registro salvo com sucesso!',
                    saveError: 'Erro ao salvar: Verifique se o CPF/CNPJ já existe ou se os campos estão corretos.',
                    deleteSuccess: 'Registro excluído com sucesso!',
                    deleteError: 'Erro ao excluir registro.'
                }
            }
        }
    },
    pricingPage: {
        nav: {
            portal: 'Portal',
            home: 'Início',
            comparison: 'Comparativo',
            modules: 'Módulos Avulsos',
            faq: 'Dúvidas'
        },
        hero: {
            title: 'Seu momento na advocacia,',
            titleAccent: 'nosso melhor plano.',
            subtitle: 'Escolha o plano que acompanha o seu ritmo. Do autônomo ao departamento jurídico corporativo, temos a arquitetura exata para o seu crescimento.',
            cancelGuarantee: 'O ecossistema jurídico sem taxa de adesão, sem multas contratuais e sem fidelidade. Assine hoje, cancele quando quiser.'
        },
        plans: {
            start: {
                name: 'START',
                desc: 'Para advogados autônomos e novos escritórios. A base sólida para organizar a rotina.',
                price: 'R$ 297',
                period: '/mês',
                features: [
                    'Nexus PRO: Gestão e Kanban (500 proc.)',
                    'Valorem PRO: Financeiro e PIX',
                    'Vox Clientis: Portal do Cliente Básico',
                    'Suporte via E-mail e Chat'
                ],
                cta: 'Começar Teste Grátis'
            },
            growth: {
                name: 'GROWTH',
                desc: 'Para escritórios em crescimento e bancas estruturadas. O motor de inteligência e automação.',
                price: 'R$ 597',
                period: '/mês',
                features: [
                    'Tudo do plano Start, mais:',
                    'Sentinel PRO: Captura Antecipada',
                    'Scriptor PRO: IA Geradora de Peças',
                    'Nexus PRO: Automação de Workflows',
                    'Vox Clientis: WhatsApp e IA Tradutora',
                    'Suporte Prioritário'
                ],
                cta: 'Começar teste grátis',
                badge: 'Mais Popular'
            },
            strategy: {
                name: 'STRATEGY',
                desc: 'Para diretorias jurídicas e corporações. O cockpit estratégico com jurimetria.',
                price: 'Sob Consulta',
                period: '',
                features: [
                    'Tudo do plano Growth, mais:',
                    'Cognitio PRO: BI e Jurimetria Preditiva',
                    'Nexus PRO: Gestão de Ativos e Frota',
                    'Valorem PRO: Relatórios de Contingência',
                    'Gerente de Sucesso Dedicado (CSM)'
                ],
                cta: 'Agendar Demonstração'
            }
        },
        comparison: {
            label: 'Quer analisar cada detalhe técnico?',
            hide: 'Ocultar',
            show: 'Ver',
            cta: 'comparativo completo de funcionalidades',
            headers: {
                feature: 'Funcionalidade',
                start: 'Start',
                growth: 'Growth',
                strategy: 'Strategy'
            },
            categories: {
                nexus: 'Gestão Processual (Nexus)',
                sentinel: 'Vigilância (Sentinel)',
                scriptor: 'Inteligência (Scriptor)',
                valorem: 'Financeiro (Valorem)',
                vox: 'Relacionamento (Vox)',
                cognitio: 'Estratégia (Cognitio)'
            },
            features: {
                kanban: 'Kanban e Prazos',
                workflows: 'Workflows Automatizados',
                assets: 'Gestão de Ativos e Frota',
                capture: 'Captura Antecipada (Distribuição)',
                monitoring: 'Monitoramento de Diários',
                genAi: 'IA Gerativa de Peças',
                audit: 'Auditoria de Risco (IA)',
                cashflow: 'Fluxo de Caixa e PIX',
                provisioning: 'Provisionamento e PJe-Calc',
                portal: 'Portal do Cliente',
                portalBasic: 'Básico',
                portalFull: 'Completo',
                translation: 'Tradução IA e WhatsApp',
                bi: 'BI e Jurimetria Preditiva'
            }
        },
        whyChoose: {
            title: 'Por que escolher o',
            titleAccent: 'Ecossistema?',
            subtitle: 'Ferramentas isoladas geram retrabalho. Desenhamos nossos planos para garantir o Flow perfeito. Um módulo alimenta o outro, eliminando 100% da digitação manual de dados.',
            items: [
                { title: 'Sentinel Captura', desc: 'Identifica o processo na distribuição.' },
                { title: 'Nexus Delega', desc: 'Cria a tarefa para sua equipe.' },
                { title: 'Scriptor Redige', desc: 'IA gera a defesa em minutos.' },
                { title: 'Vox Notifica', desc: 'Avisa o cliente automaticamente.' }
            ]
        },
        aLaCarte: {
            badge: 'Flexibilidade Total',
            title: 'Módulos Avulsos',
            subtitle: 'Precisa de uma solução pontual? Você não precisa levar o ecossistema inteiro se quiser resolver apenas um desafio imediato.',
            sentinel: {
                title: 'Sentinel Radar',
                desc: 'Ideal para quem só precisa monitorar diários oficiais e capturar novos processos sem a gestão completa.',
                cta: 'Saiba mais'
            },
            cognitio: {
                title: 'Cognitio Analytics',
                desc: 'Ideal para diretores que já usam outro sistema de gestão, mas precisam da nossa Jurimetria de Magistrados.',
                cta: 'Agendar Demo'
            }
        },
        faq: {
            title: 'Dúvidas Frequentes',
            questions: [
                { q: 'O que acontece se eu quiser cancelar meu plano?', a: 'Nada de ligações demoradas ou multas escondidas. Você cancela com um clique direto no seu painel. Sem carência e sem fidelidade. No Veritum PRO, nós não te prendemos por contrato, nós te conquistamos pela excelência do serviço. Caso decida sair, você poderá exportar todos os seus dados livremente antes do encerramento.' },
                { q: 'Preciso de cartão de crédito para o teste grátis?', a: 'Não. Acreditamos na nossa tecnologia. Você testa os planos Start ou Growth por 14 dias com acesso total, sem burocracia.' },
                { q: 'Como funciona o limite de processos?', a: 'O sistema não cobra por "processo arquivado". Nós precificamos baseados nos seus casos ativos, garantindo que você pague apenas pelo que gera esforço real.' },
                { q: 'Posso mudar de plano depois?', a: 'A qualquer momento. O Veritum PRO tem uma arquitetura modular. Faça upgrade ou downgrade com apenas um clique a partir das suas configurações.' }
            ]
        },
        finalCta: {
            title: 'A advocacia do futuro',
            titleAccent: 'não usa planilhas.',
            subtitle: 'Junte-se ao ecossistema Veritum PRO hoje mesmo e transforme seu escritório em uma máquina de performance.',
            button: 'Criar Minha Conta Agora',
            footer: 'Desenvolvido por AGTech | LegalTech de Alta Performance © 2026'
        },
        demoModal: {
            successTitle: 'Solicitação Recebida!',
            successDesc: 'Um de nossos consultores especializados entrará em contato via WhatsApp para confirmar o **melhor horário** na data que você sugeriu.',
            title: 'Demonstração Estratégica',
            subtitle: 'Preencha os dados abaixo para qualificar seu atendimento.',
            labels: {
                name: 'Nome Completo',
                email: 'E-mail Corporativo',
                whatsapp: 'WhatsApp',
                teamSize: 'Tamanho da Equipe / Volume',
                dateRange: 'Selecione o intervalo de datas desejado'
            },
            placeholders: {
                name: 'Ex: Dr. Alexandre Aguiar',
                email: 'nome@escritorio.com',
                whatsapp: '(11) 99999-9999',
                teamSize: 'Selecione uma opção...'
            },
            teamOptions: {
                small: '1 a 5 advogados (Novo Escritório)',
                medium: '6 a 20 advogados (Escritório em Expansão)',
                large: '+20 advogados ou Depto. Jurídico'
            },
            calendar: {
                tooltip1: 'Clique uma vez para o início e outra para o fim do período desejado.',
                tooltip2: 'Entraremos em contato para confirmar o melhor horário dentro deste intervalo.',
                error: 'Por favor, selecione o período para a demonstração.'
            },
            submitBtn: 'Confirmar Sugestão',
            submitting: 'Enviando...'
        }
    },
    landingPages: {
        nexus: {
            nav: {
                home: 'Início',
                vision: 'Visão',
                features: 'Funcionalidades',
                ux: 'Diferencial'
            },
            hero: {
                badge: 'Gestão de Alta Performance',
                title: 'A central de comando do seu escritório.',
                subtitle: 'Onde o caos se transforma em clareza. Centralize processos, prazos e equipe em um único painel inteligente. O Nexus PRO elimina planilhas e automatiza a sua rotina.',
                cta1: 'Começar Teste Grátis',
                cta2: 'Saiba mais'
            },
            mockup: {
                title: 'Nexus PRO Kanban',
                columns: {
                    todo: 'A Fazer (12)',
                    doing: 'Em Andamento (5)',
                    done: 'Concluído (84)'
                }
            },
            vision: {
                stats: {
                    deadlines: 'Prazos Hoje',
                    tasks: 'Tarefas Concluídas',
                    productivity: 'Produtividade',
                    members: 'Colaboradores'
                },
                title: 'Gestão que acompanha o seu ritmo.',
                subtitle: 'O Nexus PRO é o coração operacional do ecossistema Veritum. Desenhado para reduzir a carga cognitiva da sua equipe, ele reúne todas as pontas soltas da advocacia em um fluxo de trabalho claro e intuitivo.',
                quote: '"Saiba exatamente quem está fazendo o quê, em qual prazo e com qual prioridade."'
            },
            features: {
                category: 'Tecnologia Operacional',
                title: 'Funcionalidades de Alto Nível',
                subtitle: 'Ferramentas criadas para escritórios que não têm tempo a perder.',
                items: {
                    kanban: {
                        title: 'Gestão de Processos e Prazos (Kanban)',
                        desc: 'Transforme a ansiedade em controle. Acompanhe processos, audiências e tarefas em um mural Kanban totalmente visual.'
                    },
                    automation: {
                        title: 'Workflows Avançados e Automação',
                        desc: 'Delegue no piloto automático. Crie fluxos de trabalho inteligentes que distribuem tarefas para a sua equipe automaticamente.'
                    },
                    assets: {
                        title: 'Gestão de Ativos e Bens em Litígio',
                        desc: 'Tenha o mapa completo da execução. Controle certidões, matrículas, frotas e imóveis atrelados a processos jurídicos.'
                    },
                    corporate: {
                        title: 'Controle Societário e Ciclo de Vida',
                        desc: 'Domine o consultivo corporativo. Gerencie contratos não-financeiros, procurações e atos societários com alertas automáticos.'
                    }
                }
            },
            ux: {
                title: 'Design pensado para o seu Flow de trabalho.',
                subtitle: 'Diga adeus aos sistemas travados e difíceis de aprender. O Nexus PRO foi criado sob rigorosos princípios de design centrado no usuário. Menos cliques, zero distrações e foco total no que importa.',
                items: {
                    progressive: {
                        title: 'Divulgação Progressiva',
                        desc: 'Você visualiza o painel macro e acessa os detalhes apenas quando precisa.'
                    },
                    noise: {
                        title: 'Interface Sem Ruído',
                        desc: 'Elimine ferramentas complexas que atrasam sua equipe. O foco é seu aliado.'
                    }
                },
                efficiency: 'Eficiência',
                automation: 'Automação'
            },
            finalCta: {
                title: 'Pronto para revolucionar a sua gestão jurídica?',
                subtitle: 'O Nexus PRO é a base sólida da sua operação e se conecta de forma nativa às outras inteligências do Ecossistema Veritum.',
                button1: 'Começar Agora - É Grátis',
                button2: 'Ver Planos de Assinatura',
                footer: 'Sem cartão de crédito • Configuração em 2 minutos'
            },
            footer: {
                slogan: 'A central de comando de quem advoga com estratégia.'
            }
        },
        sentinel: {
            nav: {
                home: 'Início',
                vision: 'Visão',
                features: 'Funcionalidades',
                ux: 'Diferencial'
            },
            hero: {
                badge: 'Inteligência Jurídica Ativa',
                title: 'Aja antes da citação oficial. O radar definitivo.',
                subtitle: 'Monitore publicações, intimações e descubra novos processos no momento da distribuição. O Sentinel PRO varre o Brasil inteiro para que você nunca mais tenha medo de perder um prazo ou sofrer uma revelia.',
                cta1: 'Começar Teste Grátis',
                cta2: 'Conhecer Planos',
                check: 'Junte-se a advogados que deixaram de buscar processos manualmente.'
            },
            mockup: {
                title: 'Sentinel PRO Cockpit',
                alerts: '12 ALERTAS DE CRISE',
                stats: {
                    intimations: 'INTIMAÇÕES HOJE',
                    timeSaved: 'TEMPO SALVO'
                }
            },
            vision: {
                title: 'O seu "Cockpit" de Vigilância Jurídica.',
                subtitle: 'O Sentinel PRO não é apenas um buscador, é o sensor de riscos do ecossistema Veritum. Processamos milhares de publicações e movimentações processuais por dia, filtrando o ruído e entregando apenas o que é estritamente relevante para você e seus clientes.',
                box: 'Com um painel visual limpo e inteligente, agrupamos as informações para que você saiba exatamente onde sua atenção é necessária hoje, reduzindo a fadiga de olhar para dezenas de telas.'
            },
            features: {
                category: 'Tecnologia Proativa',
                title: 'Funcionalidades Sugeridas',
                items: {
                    revelia: {
                        title: 'Antecipe-se à Revelia',
                        desc: 'Não espere o oficial de justiça bater à porta. Nossos robôs detectam novas ações no exato momento do peticionamento (distribuição). Receba alertas de processos até 30 dias antes da citação oficial.'
                    },
                    zeroDeadlines: {
                        title: 'Zero Prazos Perdidos',
                        desc: 'Esqueça a busca manual. O Sentinel PRO varre automaticamente os Diários Oficiais, DJEN e os tribunais do país. Receba alertas inteligentes de intimações e movimentações em tempo real.'
                    },
                    reputation: {
                        title: 'Proteja a Reputação do Cliente',
                        desc: 'A vigilância vai além dos tribunais. Monitore marcas em jornais, portais de notícias e órgãos de defesa do consumidor (Procon, Consumidor.gov). Atue como um escudo corporativo proativo.'
                    },
                    aiIntelligence: {
                        title: 'Inteligência que lê por você',
                        desc: 'Nossa IA lê publicações e classifica o conteúdo instantaneamente. indicadores visuais (como vermelho para Risco Alto) ajudam você a priorizar urgências em um segundo.'
                    }
                }
            },
            ux: {
                title: 'Uma interface que pensa como um advogado.',
                subtitle: 'Ferramentas complexas atrasam o seu trabalho. Projetamos o Sentinel PRO para garantir foco total. Sem "muralhas de dados", você visualiza gráficos limpos, navegação intuitiva e alertas codificados por cores que evitam erros.',
                list: [
                    'Foco total: Menos cliques, mais resultados.',
                    'Alertas por cores: Priorização instantânea.',
                    'Resumos por IA: Deixe a leitura densa para nós.',
                    'Ação rápida: Transforme alertas em tarefas com um clique.'
                ],
                grid: {
                    vision: 'Visão 360º',
                    security: 'Segurança Total',
                    action: 'Ação Instantânea',
                    stress: 'Fim do Stress'
                }
            },
            finalCta: {
                title: 'Pronto para nunca mais se preocupar com Publicações?',
                subtitle: 'O Sentinel PRO é brilhante sozinho, mas é imbatível no Ecossistema Veritum. Junte-se a centenas de escritórios que elevaram sua segurança operacional.',
                button1: 'Começar Agora - É Grátis',
                button2: 'Ver Planos de Assinatura',
                footer: 'Sem cartão de crédito • Configuração rápida'
            },
            footer: {
                slogan: 'O radar proativo de quem não aceita o risco da revelia.'
            }
        },
        scriptor: {
            nav: {
                home: 'Início',
                vision: 'Visão',
                features: 'Funcionalidades',
                ux: 'Diferencial'
            },
            hero: {
                badge: 'IA Documental Generativa',
                title: 'A inteligência que redige, revisa e protege.',
                subtitle: 'O fim da "Síndrome da Página em Branco". Transforme horas de redação e revisão em minutos com seu co-piloto jurídico alimentado por IA.',
                cta1: 'Começar Teste Grátis',
                cta2: 'Saiba mais'
            },
            mockup: {
                title: 'Scriptor PRO Editor',
                pilot: 'IA Co-piloto sugerindo...',
                accept: 'TAB p/ Aceitar'
            },
            stats: {
                drafting: 'Tempo de Redação',
                clauses: 'Cláusulas Abusivas',
                signatures: 'Assinaturas Hoje',
                search: 'Pesquisa Global'
            },
            vision: {
                title: 'Mais do que um editor. Uma mente jurídica ao seu lado.',
                desc1: 'O Scriptor PRO não substitui a sua estratégia, ele a potencializa. Desenvolvemos um ecossistema documental inteligente que lê, compreende o contexto e sugere as melhores práticas jurídicas.',
                desc2: 'Concentre sua energia no intelecto da tese, enquanto nossos algoritmos cuidam da formatação, da revisão e da caça aos riscos ocultos.'
            },
            features: {
                category: 'Tecnologia Documental',
                title: 'Funcionalidades de Elite',
                subtitle: 'Ferramentas criadas para bancas e departamentos que exigem produtividade máxima.',
                items: {
                    generator: {
                        title: 'Gerador de Peças e Contratos (IA)',
                        desc: 'Acelere a sua produção. Nossa IA analisa o contexto do seu caso e redige minutas, contestações e contratos automaticamente.'
                    },
                    auditor: {
                        title: 'Auditoria de Risco em Contratos (IA)',
                        desc: 'Nunca mais deixe uma "pegadinha" passar despercebida. Identifique instantaneamente cláusulas abusivas e pontos de atenção.'
                    },
                    repository: {
                        title: 'Repositório Inteligente (GED)',
                        desc: 'O fim das pastas perdidas. Armazene modelos e arquivos em um cofre digital seguro com total conformidade com a LGPD.'
                    },
                    signature: {
                        title: 'Assinatura Digital Nativa',
                        desc: 'Feche negócios sem plataformas terceiras. Envie documentos para assinatura pelo celular com validade jurídica garantida.'
                    }
                },
                cta: 'Saiba mais'
            },
            ux: {
                title: 'Seu ambiente de foco absoluto.',
                subtitle: 'A tecnologia só é boa quando não atrapalha. Projetamos o SCRIPTOR PRO com um design minimalista para proteger a sua concentração. Mantenha-se no Flow do início ao fim da sua redação.',
                items: {
                    contextual: {
                        title: 'IA Contextual',
                        desc: 'Ela sugere, você aprova. O controle é sempre seu.'
                    },
                    versioning: {
                        title: 'Versionamento Seguro',
                        desc: 'Restaure versões anteriores com um clique.'
                    },
                    search: {
                        title: 'Busca Global',
                        desc: 'Encontre palavras em milhares de PDFs em milissegundos.'
                    }
                }
            },
            finalCta: {
                title: 'Pronto para multiplicar a sua capacidade de produção?',
                subtitle: 'Seja operando sozinho como um Super ChatGPT Jurídico ou integrado perfeitamente ao Ecossistema Veritum, o Scriptor PRO é a vantagem injusta do seu escritório.',
                button1: 'Começar Agora - É Grátis',
                button2: 'Ver Planos de Assinatura',
                footer: 'Sem cartão de crédito • Configuração rápida'
            },
            footer: {
                slogan: 'A tecnologia de quem advoga no estado da arte.'
            }
        },
        valorem: {
            nav: {
                home: 'Início',
                vision: 'Visão',
                features: 'Funcionalidades',
                ux: 'Diferencial'
            },
            hero: {
                badge: 'Inteligência Financeira Jurídica',
                title: 'Sua saúde financeira em piloto automático.',
                subtitle: 'Receba seus honorários sem burocracia. Diga adeus às planilhas confusas e à inadimplência. O Valorem PRO resolve cálculos judiciais e automatiza cobranças.',
                cta1: 'Começar Teste Grátis',
                cta2: 'Saiba mais'
            },
            mockup: {
                monthly: 'Receita Mensal',
                pix: 'Pagamento via PIX',
                pay: 'Pagar Agora',
                direct: 'PIX Direto',
                boleto: 'Boleto',
                efficiency: 'Eficiência',
                today: 'Hoje'
            },
            stats: {
                revenue: 'Receitas no Mês',
                overdue: 'Inadimplência',
                provision: 'Provisão de Risco',
                liquidity: 'Liquidez Hoje',
                liquidityVal: 'Alta'
            },
            vision: {
                title: 'Pare de cobrar clientes. Deixe o sistema fazer isso por você.',
                desc: 'O Valorem PRO foi desenhado para quem advoga e não quer perder tempo com tarefas burocráticas de tesouraria. Saiba exatamente quem pagou, quem está devendo e qual é a projeção de faturamento do trimestre.',
                quote: '"Uma visão em tempo real, do centavo ao milhão, sem precisar ser um especialista em finanças."'
            },
            features: {
                category: 'Tecnologia Financeira',
                title: 'Funcionalidades de Elite',
                subtitle: 'Ferramentas criadas para garantir a rentabilidade e a transparência do seu negócio.',
                items: {
                    management: {
                        title: 'Gestão Financeira Inteligente',
                        desc: 'Assuma o controle total. Gerencie honorários, custas e fluxo de caixa. Vincule cada despesa diretamente ao processo do cliente.'
                    },
                    billing: {
                        title: 'Emissão de Boletos e PIX Integrado',
                        desc: 'Profissionalize suas cobranças. Gere QR Codes PIX e boletos com lembretes automáticos e baixa instantânea no sistema.'
                    },
                    calc: {
                        title: 'Integração PJe-Calc e Atualizações',
                        desc: 'Fim da dor de cabeça com cálculos judiciais. Importe dados governamentais e atualize valores com índices monetários reais.'
                    },
                    reports: {
                        title: 'Provisionamento e Relatórios de Contingência',
                        desc: 'A visão exigida por grandes diretorias. Calcule provisões de risco e monitore valores retidos em depósitos judiciais.'
                    }
                },
                cta: 'Saiba mais'
            },
            ux: {
                title: 'Finanças traduzidas para o seu idioma.',
                subtitle: 'Você é de humanas, e nós entendemos isso. Em vez de telas repletas de jargões contábeis, o Valorem PRO usa gráficos visuais e ícones intuitivos.',
                items: {
                    conciliation: {
                        title: 'Conciliação Visual',
                        desc: 'Cores que indicam imediatamente o que está pago, atrasado ou pendente.'
                    },
                    sharing: {
                        title: 'Rateio Descomplicado',
                        desc: 'Divisão automática de honorários entre sócios e parceiros.'
                    },
                    export: {
                        title: 'Exportação Transparente',
                        desc: 'Exporte relatórios para o seu contador com apenas um clique.'
                    }
                }
            },
            finalCta: {
                title: 'Pronto para lucrar mais e se preocupar menos?',
                subtitle: 'Integrado perfeitamente ao Nexus PRO, o Valorem garante que todo o seu trabalho jurídico seja devidamente registrado, cobrado e recebido.',
                button1: 'Começar Agora - É Grátis',
                button2: 'Ver Planos de Assinatura',
                footer: 'Sem cartão de crédito • Configuração em 2 minutos'
            },
            footer: {
                slogan: 'O controle financeiro de quem advoga com previsibilidade.'
            }
        },
        cognitio: {
            nav: {
                home: 'Início',
                vision: 'Visão',
                features: 'Funcionalidades',
                ux: 'Diferencial'
            },
            hero: {
                badge: 'Inteligência Jurídica Preditiva',
                title: 'O olhar estratégico que a sua diretoria exige.',
                subtitle: 'Advocacia guiada por dados. Transforme dados complexos em previsibilidade financeira e decisões de alto impacto para seu departamento ou banca.',
                cta1: 'Agendar Demonstração',
                cta2: 'Saiba mais'
            },
            mockup: {
                kpiGlobal: 'KPI Global',
                activeRisk: 'Risco Ativo',
                sentences: 'Sentenças',
                sentencesValue: '1.2k',
                sentencesSub: 'Hoje',
                analysisTitle: 'Análise de Êxito por Tribunal'
            },
            stats: {
                successRate: 'Taxa de Êxito',
                mitigatedRisk: 'Risco Mitigado',
                avgTime: 'Tempo Médio',
                avgTimeVal: '14 Meses',
                predictability: 'Previsibilidade',
                predictabilityVal: 'Alta'
            },
            vision: {
                title: 'Pare de advogar no escuro. A intuição cede lugar à precisão.',
                desc: 'Grandes bancas e departamentos jurídicos corporativos não podem depender de "achismos". O Cognitio PRO lê o histórico de milhares de decisões para que você saiba quando é mais vantajoso um acordo ou o litígio.',
                quote: '"Tenha o raio-x completo da sua operação na palma da mão e preste contas à diretoria com segurança absoluta."'
            },
            features: {
                category: 'Tecnologia Analítica',
                title: 'Funcionalidades de Elite',
                subtitle: 'Ferramentas criadas para sócios e diretores que precisam de respostas rápidas e exatas.',
                items: {
                    bi: {
                        title: 'Dashboards e BI Jurídico',
                        desc: 'Visualize a performance de toda a operação em painéis interativos. Identifique gargalos e métricas de produtividade em tempo real.'
                    },
                    predictive: {
                        title: 'Análise Preditiva de Desfechos (IA)',
                        desc: 'Nossa IA cruza dados de jurisprudência e histórico processual para calcular a probabilidade de ganho antes mesmo do protocolo.'
                    },
                    judges: {
                        title: 'Raio-X de Magistrados e Comarcas',
                        desc: 'Conheça a mente de quem vai julgar. Relatórios detalhados sobre como cada tribunal costuma decidir em temas específicos.'
                    },
                    corporate: {
                        title: 'Visão Corporativa e Provisionamento',
                        desc: 'Acompanhe custos por filial ou projeto. Descubra quais setores enfrentam maior litigiosidade e atue preventivamente.'
                    }
                },
                cta: 'Saiba mais'
            },
            ux: {
                title: 'O fim da "Parede de Números".',
                subtitle: 'Executivos não têm tempo para decifrar planilhas. Projetamos o Cognitio PRO com as melhores práticas de visualização para decisões rápidas.',
                items: {
                    disclosure: {
                        title: 'Divulgação Progressiva',
                        desc: 'Cenário macro limpo com possibilidade de aprofundamento total em um clique.'
                    },
                    trends: {
                        title: 'Destaque de Tendências',
                        desc: 'Gráficos codificados por cores que indicam riscos e oportunidades instantaneamente.'
                    },
                    export: {
                        title: 'Exportação Executiva',
                        desc: 'Gere relatórios visuais perfeitos para apresentações em segundos.'
                    }
                }
            },
            finalCta: {
                title: 'Pronto para liderar com inteligência de dados?',
                subtitle: 'Ideal para bancas estruturadas e corporações que buscam excelência, previsibilidade e rentabilidade em sua operação jurídica.',
                button1: 'Agendar Demonstração Exclusiva',
                button2: 'Ver Planos de Assinatura'
            },
            footer: {
                slogan: 'A tecnologia de quem dita as regras do jogo.'
            }
        },
        vox: {
            nav: {
                home: 'Início',
                vision: 'Visão',
                features: 'Funcionalidades',
                ux: 'Diferencial'
            },
            hero: {
                badge: 'Atendimento Padrão Ouro',
                title: 'O fim da pergunta: "Doutor, como está o meu caso?"',
                subtitle: 'Comunicação jurídica sem interrupções. Automatize seu atendimento com integração ao WhatsApp e Inteligência Artificial. Fidelize com transparência absoluta.',
                cta1: 'Começar Teste Grátis',
                cta2: 'Saiba mais'
            },
            mockup: {
                title1: 'Veritum Automations',
                status: 'online',
                msg1: 'Olá João! 👋',
                msg2: 'O juiz deu andamento no seu caso hoje. Em palavras simples, isso significa que entramos na fase final para a sentença.',
                time: '10:45',
                aiLabel: 'Tradutor IA:',
                msg3: 'Não se preocupe, o processo está seguindo o cronograma esperado. Próximo passo: Audiência de Instrução.',
                clientBanner: 'Cliente Feliz',
                percentage: '98%'
            },
            vision: {
                stats: {
                    messages: 'Mensagens Enviadas',
                    messagesVal: '1.240',
                    timeSaved: 'Tempo Salvo',
                    timeSavedVal: '45h',
                    satisfaction: 'Satisfação',
                    satisfactionVal: '98%',
                    availability: 'Disponibilidade',
                    availabilityVal: '24/7'
                },
                title: 'Atendimento de excelência em piloto automático.',
                desc1: 'A maior causa de insatisfação dos clientes jurídicos é a falta de comunicação. O Vox Clientis preenche essa lacuna atuando como o seu gerente de relacionamento 24 horas por dia.',
                desc2: 'Compartilhe o progresso das ações de forma ágil e proativa, garantindo que o seu cliente se sinta seguro e o seu WhatsApp pessoal continue livre de cobranças.'
            },
            features: {
                category: 'Tecnologia de Relacionamento',
                title: 'Funcionalidades de Elite',
                subtitle: 'Ferramentas criadas para escritórios que valorizam e profissionalizam a experiência do cliente.',
                items: {
                    translator: {
                        title: 'Tradutor de Juridiquês (IA)',
                        desc: 'Nossa IA lê o andamento processual e o traduz automaticamente para uma linguagem simples e empática para o seu cliente.'
                    },
                    automation: {
                        title: 'Automação de WhatsApp',
                        desc: 'Envie atualizações de processos, lembretes de audiência e links para pagamento diretamente para o canal preferido do cliente.'
                    },
                    portal: {
                        title: 'Portal Exclusivo do Cliente',
                        desc: 'Ofereça um portal web seguro com a sua identidade visual para consulta de status, documentos e dúvidas básicas.'
                    },
                    proactive: {
                        title: 'Comunicação Proativa',
                        desc: 'Informe antes de ser perguntado. O sistema dispara notificações automáticas sempre que algo relevante acontece no processo.'
                    }
                },
                cta: 'Saiba mais'
            },
            ux: {
                title: 'A transparência que gera indicações.',
                subtitle: 'Projetamos o Vox Clientis com uma interface inclusiva e acolhedora não apenas para você, mas principalmente para o consumidor final.',
                items: {
                    boundaries: {
                        title: 'Fronteiras Profissionais',
                        desc: 'O cliente acessa o Portal dele; o seu time trabalha no Nexus. Cada um no seu espaço.'
                    },
                    accessibility: {
                        title: 'Acessibilidade Universal',
                        desc: 'Telas simples, fontes legíveis e linguagem clara para qualquer perfil de cliente.'
                    },
                    notifications: {
                        title: 'Notificações Proativas',
                        desc: 'Acabe com a ansiedade. Mantenha o cliente informado em tempo real.'
                    }
                },
                mockupLabels: {
                    chat: 'Chat Online',
                    process: 'Ver Processo'
                }
            },
            finalCta: {
                title: 'Pronto para elevar o nível do seu atendimento?',
                subtitle: 'Integrado nativamente ao Sentinel e ao Nexus, o Vox Clientis fecha o ciclo perfeito da sua operação: o sistema vigia, você executa, e o cliente é informado.',
                button1: 'Começar Agora - É Grátis',
                button2: 'Ver Planos de Assinatura',
                footer: 'Sem cartão de crédito • Configuração em 2 minutos'
            },
            footer: {
                slogan: 'A tecnologia de quem advoga com empatia e profissionalismo.'
            }
        }
    }
};
