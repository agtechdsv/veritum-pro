
-- SEED: BIBLIOTECA VERITUM STANDARD
-- 8 Modelos de Documentos essenciais para Advocacia com Veritum {{tags}}

INSERT INTO public.document_templates (title, category, content) VALUES
(
  'Procuração Ad Judicia', 
  'Judicial', 
  '# PROCURAÇÃO AD JUDICIA\n\n**OUTORGANTE:** {{nome_cliente}}, {{nacionalidade}}, {{estado_civil}}, {{profissao}}, portador(a) do RG nº {{rg}} e inscrito(a) no CPF sob o nº {{cpf}}, residente e domiciliado(a) em {{endereco_completo}}.\n\n**OUTORGADOS:** {{nome_advogado}}, inscrito na OAB/{{oab_uf}} sob o nº {{oab_number}}, com escritório profissional em {{cidade_escritorio}}.\n\n**PODERES:** Por este instrumento particular de procuração, o outorgante nomeia e constitui os outorgados seus procuradores, conferindo-lhes os poderes da cláusula ad judicia et extra, para o foro em geral, podendo propor ações, contestar, transigir, desistir, firmar acordos, receber e dar quitação, e praticar todos os demais atos necessários ao bom e fiel desempenho deste mandato.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Contrato de Honorários Advocatícios', 
  'Contratos', 
  '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS E HONORÁRIOS\n\n**CONTRATANTE:** {{nome_cliente}}, CPF {{cpf}}, residente em {{endereco_completo}}.\n\n**CONTRATADO:** {{nome_advogado}}, OAB/{{oab_number}}, com sede em {{cidade_escritorio}}.\n\n**OBJETO:** O presente contrato tem como objeto a prestação de serviços jurídicos consistentes em: [DESCREVER OBJETO DA AÇÃO].\n\n**HONORÁRIOS:** Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de [VALOR], na forma de [FORMA DE PAGAMENTO].\n\n**CLÁUSULA QUARTA:** No caso de êxito na demanda, incidirão honorários de sucumbência conforme legislação vigente.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**\n\n__________________________________________\n**{{nome_advogado}}**'
),
(
  'Termo de Consentimento LGPD', 
  'Compliance', 
  '# TERMO DE CONSENTIMENTO - LGPD\n\nEu, {{nome_cliente}}, inscrito(a) no CPF sob o nº {{cpf}}, autorizo expressamente o escritório {{nome_escritorio}} a realizar o tratamento de meus dados pessoais para fins exclusivos de prestação de serviços jurídicos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\n\nOs dados serão armazenados de forma segura e utilizados apenas para as finalidades do processo judicial/administrativo sob responsabilidade do contratado.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Ficha Cadastral de Cliente', 
  'Administrativo', 
  '# FICHA CADASTRAL DO CLIENTE\n\n**DADOS PESSOAIS:**\n- **Nome:** {{nome_cliente}}\n- **CPF:** {{cpf}}\n- **RG:** {{rg}}\n- **Nacionalidade:** {{nacionalidade}}\n- **Estado Civil:** {{estado_civil}}\n- **Profissão:** {{profissao}}\n\n**CONTATO:**\n- **Endereço:** {{endereco_completo}}\n- **E-mail:** {{email_cliente}}\n- **Telefone:** {{telefone_cliente}}\n\n**OBSERVAÇÕES:**\n[CAMPO LIVRE PARA ANOTAÇÕES DO ADVOGADO]\n\nData de Cadastro: {{data_hoje}}'
),
(
  'Declaração de Hipossuficiência', 
  'Judicial', 
  '# DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA\n\nEu, {{nome_cliente}}, portador(a) do RG nº {{rg}} e do CPF nº {{cpf}}, declaro para os devidos fins de direito, sob as penas da lei, que não possuo condições financeiras de arcar com as custas processuais e honorários advocatícios sem prejuízo do meu próprio sustento e de minha família.\n\nPor tal razão, pleiteio os benefícios da Gratuidade da Justiça, nos termos do art. 98 e seguintes do Código de Processo Civil.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Requerimento Administrativo', 
  'Administrativo', 
  'À ILUSTRÍSSIMA GERÊNCIA DO [NOME DO ÓRGÃO]\n\n**ASSUNTO:** Requerimento de [DESCREVER ASSUNTO]\n\n{{nome_cliente}}, CPF {{cpf}}, por intermédio de seu advogado {{nome_advogado}}, OAB {{oab_number}}, vem respeitosamente à presença de Vossa Senhoria requerer o quanto segue:\n\n[TEXTO DO REQUERIMENTO]\n\nTermos em que, pede deferimento.\n\n{{cidade_escritorio}}, {{data_hoje}}.'
),
(
  'Termo de Acordo Extrajudicial', 
  'Acordos', 
  '# TERMO DE ACORDO EXTRAJUDICIAL\n\n**PARTE A:** {{nome_cliente}}, CPF {{cpf}}.\n**PARTE B:** [NOME DA PARTE CONTRÁRIA], CPF/CNPJ [DOCUMENTO].\n\nAs partes acima qualificadas resolvem, de comum acordo, encerrar a controvérsia referente a [OBJETO DO ACORDO], mediante as seguintes condições:\n\n1. A PARTE B pagará à PARTE A a quantia de R$ [VALOR].\n2. O pagamento será efetuado em [DATA/FORMA].\n3. Com o cumprimento integral, as partes dão mútua e plena quitação.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Notificação Extrajudicial', 
  'Notificações', 
  '# NOTIFICAÇÃO EXTRAJUDICIAL\n\n**NOTIFICANTE:** {{nome_cliente}}, CPF {{cpf}}.\n**NOTIFICADO:** [NOME DO NOTIFICADO], [ENDEREÇO].\n\nPrezado(a),\n\nNa qualidade de advogado(a) de {{nome_cliente}}, venho através desta NOTIFICÁ-LO(A) formalmente sobre [ASSUNTO DA NOTIFICAÇÃO].\n\nSolicitamos a regularização da situação no prazo de [PRAZO] dias, sob pena de adoção das medidas judiciais cabíveis.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\nAtenciosamente,\n\n{{nome_advogado}}\nOAB/{{oab_number}}'
);
