import React, { useState, useEffect } from 'react';
import { Person, Credentials, UserPreferences, User as AppUser, Organization } from '@/types';
import {
    Plus, Search, User, Mail, Phone, MapPin, Briefcase, FileText,
    ChevronDown, ChevronUp, ChevronRight, Zap, Save, Trash2, Key, Info,
    Pencil, XCircle, Database as DbIcon, ShieldCheck, MessageCircle,
    ExternalLink, Scale, FileDown, ArrowUpRight, Filter, FileCheck,
    ScrollText, CheckCircle2, LayoutGrid, List, Network
} from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';
import { toast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { listPersons, deletePerson } from '@/app/actions/crm-actions';
import { createMasterClient } from '@/lib/supabase/master';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CrmModal } from './nexus/modals/CrmModal';

interface Props {
    credentials: Credentials;
    preferences: UserPreferences;
    currentUser: AppUser;
    isEmbedded?: boolean;
    externalPersons?: Person[];
    externalLoading?: boolean;
    masterSelectedUserId?: string;
    onRefresh?: () => void;
    onNewLawsuit?: (personId: string) => void;
    onNewAsset?: (personId: string) => void;
    onNewCorporateEntity?: (person: Person) => void;
    onOpenNexoVisual?: (person: Person) => void;
}

const PersonManagement: React.FC<Props> = ({ credentials, preferences, currentUser, isEmbedded, externalPersons, externalLoading, masterSelectedUserId, onRefresh, onNewLawsuit, onNewAsset, onNewCorporateEntity, onOpenNexoVisual }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [localPersons, setLocalPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

    // Source of truth: external props take precedence when provided and no active local search
    const persons = (externalPersons && !searchTerm) ? externalPersons : localPersons;
    const isLoading = (externalLoading !== undefined) ? (externalLoading || loading) : loading;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

    // Deletion states
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [selectedPersonForDoc, setSelectedPersonForDoc] = useState<Person | null>(null);
    const [orgData, setOrgData] = useState<Organization | null>(null);
    const [dbTemplates, setDbTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [processedContent, setProcessedContent] = useState('');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'preview'>('list');
    const [docActiveTab, setDocActiveTab] = useState<'master' | 'office'>('master');

    // Master Selection States
    const isMaster = currentUser.role === 'Master';
    const [internalSelectedUserId, setInternalSelectedUserId] = useState<string>(isMaster ? '' : currentUser.id);
    const selectedUserId = masterSelectedUserId !== undefined ? masterSelectedUserId : internalSelectedUserId;
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const masterUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isBYODB = !!(credentials.supabaseUrl && credentials.supabaseUrl !== masterUrl);

    useEffect(() => {
        if (isMaster) {
            fetchClients();
        }
    }, [isMaster]);

    useEffect(() => {
        // Sync with external data if provided
        if (externalPersons && !searchTerm) {
            setLocalPersons(externalPersons);
        }
    }, [externalPersons, searchTerm]);

    useEffect(() => {
        if (selectedUserId && !externalPersons) {
            fetchPersons();
        } else if (isMaster && !externalPersons) {
            setLocalPersons([]);
        }
    }, [selectedUserId, searchTerm]);

    useEffect(() => {
        if (isEmbedded) return;
        const handleOpenModal = () => {
            setIsModalOpen(true);
            setEditingPerson({ person_type: 'Cliente' });
        };

        window.addEventListener('CRM_OPEN_MODAL', handleOpenModal as any);
        return () => window.removeEventListener('CRM_OPEN_MODAL', handleOpenModal as any);
    }, [isEmbedded]);

    const fetchClients = async () => {
        const supabase = createMasterClient();
        const { data } = await supabase
            .from('users')
            .select('id, name, email, role')
            .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
            .order('name');
        if (data) setAllUsers(data);
    };

    const fetchPersons = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            const result: any = await listPersons(searchTerm, selectedUserId);
            if (result && result.error === 'TABLE_NOT_FOUND') {
                setLocalPersons([]);
                toast.error('O banco de dados selecionado ainda não foi inicializado (tabelas faltando).');
            } else if (result && result.data) {
                setLocalPersons(result.data);
                if (result.solvedId) {
                    console.log(`[CRM] Context: ${result.solvedId} DB: ${result.credentialsUsed?.substring(0, 20)}...`);
                }
            } else if (Array.isArray(result)) {
                setLocalPersons(result);
            }
        } catch (error: any) {
            console.warn('CRM Module not fully initialized for this database (tables might be missing).', error.message || error.code || '');
            setLocalPersons([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        if (!selectedUserId) return;
        setLoadingTemplates(true);
        try {
            const masterSupabase = createMasterClient();
            // Try to get credentials for the selected context
            const { data: creds } = await masterSupabase
                .from('user_preferences')
                .select('custom_supabase_url, custom_supabase_key')
                .eq('user_id', selectedUserId)
                .single();

            const targetUrl = creds?.custom_supabase_url || credentials.supabaseUrl;
            const targetKey = creds?.custom_supabase_key || credentials.supabaseAnonKey;

            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(targetUrl, targetKey);

            const { data: standardData, error: standardError } = await masterSupabase
                .from('veritum_standard_templates')
                .select('*')
                .order('title', { ascending: true });

            const { data: customData, error: customError } = await supabase
                .from('document_templates')
                .select('*')
                .is('deleted_at', null)
                .order('title', { ascending: true });

            let combined: any[] = [];
            if (standardData) combined = [...combined, ...standardData.map((t: any) => ({ ...t, is_standard: true }))];
            if (customData) combined = [...combined, ...customData.map((t: any) => ({ ...t, is_standard: false }))];

            setDbTemplates(combined);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        if (isDocModalOpen) {
            fetchTemplates();
            setViewMode('list');
            setSelectedTemplate(null);
            setPdfPreviewUrl(null);
        }
    }, [isDocModalOpen, selectedUserId]);

    const formatCEP = (value: string) => {
        const raw = value.replace(/\D/g, '');
        return raw.replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
    };


    const openWhatsApp = (phone?: string) => {
        if (!phone) return;
        const numbers = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${numbers.startsWith('55') ? numbers : '55' + numbers}`, '_blank');
    };

    const openMaps = (address?: any) => {
        if (!address?.cep && !address?.street) return;
        const destination = encodeURIComponent(`${address.street || ''}, ${address.number || ''}, ${address.city || ''} - ${address.state || ''}, ${address.cep || ''}`);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
    };

    const openEmail = (email?: string) => {
        if (!email) return;
        window.location.href = `mailto:${email}`;
    };

    // Fetch Organization Data for PDF Header
    useEffect(() => {
        if (isDocModalOpen && !orgData && currentUser.id) {
            const fetchOrg = async () => {
                const masterSupabase = createMasterClient();
                const { data } = await masterSupabase
                    .from('organizations')
                    .select('*')
                    .eq('admin_id', currentUser.id)
                    .single();
                if (data) setOrgData(data);
            };
            fetchOrg();
        }
    }, [isDocModalOpen, orgData, currentUser.id]);

    const handleGenerateDocs = (person: Person) => {
        setSelectedPersonForDoc(person);
        setIsDocModalOpen(true);
    };

    const replaceTags = (content: string, person: Person, org: any) => {
        let result = content;
        const today = new Date().toLocaleDateString('pt-BR');

        const tags: Record<string, string> = {
            '{{nome_cliente}}': person.full_name || '',
            '{{cpf}}': person.document || '',
            '{{documento}}': person.document || '',
            '{{rg}}': person.rg || '',
            '{{nacionalidade}}': person.legal_data?.nationality || 'Brasileira',
            '{{estado_civil}}': person.legal_data?.marital_status || 'Solteiro(a)',
            '{{profissao}}': person.legal_data?.profession || 'Autônomo(a)',
            '{{endereco_completo}}': `${person.address?.street || ''}, ${person.address?.number || ''} ${person.address?.complement || ''} - ${person.address?.neighborhood || ''} - ${person.address?.city || ''}/${person.address?.state || ''}`,
            '{{cidade_cliente}}': person.address?.city || '',
            '{{estado_cliente}}': person.address?.state || '',
            '{{email_cliente}}': person.email || '',
            '{{telefone_cliente}}': person.phone || '',
            '{{data_hoje}}': today,
            '{{cidade_escritorio}}': org?.address_city || 'Sua Cidade',
            '{{nome_advogado}}': currentUser.name || org?.company_name || '',
            '{{oab_number}}': '____',
            '{{oab_uf}}': org?.address_state || 'UF',
            '{{nome_escritorio}}': org?.company_name || 'Veritum Pro Office'
        };

        Object.entries(tags).forEach(([tag, value]) => {
            const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, value);
        });

        return result;
    };

    const handleSelectTemplate = (template: any) => {
        setSelectedTemplate(template);
        if (selectedPersonForDoc) {
            const processed = replaceTags(template.content, selectedPersonForDoc, orgData);
            setProcessedContent(processed);
        }
        setViewMode('preview');
    };

    const printDocument = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${selectedTemplate?.title || 'Documento'}</title>
                        <style>
                            body { font-family: "Times New Roman", Times, serif; padding: 50px; line-height: 1.5; color: #000; }
                            h1, h2, h3 { text-align: center; text-transform: uppercase; }
                            pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
                            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                            .content { text-align: justify; }
                            .footer { margin-top: 60px; text-align: center; }
                            @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>${orgData?.company_name || 'VERITUM PRO OFFICE'}</h2>
                            <p>${orgData?.address_street || ''}, ${orgData?.address_number || ''} - ${orgData?.address_city || ''}/${orgData?.address_state || ''}</p>
                            <p>${orgData?.email || ''} | ${orgData?.phone || ''}</p>
                        </div>
                        <div class="content">
                            ${processedContent}
                        </div>
                        <div class="footer">
                            <p>__________________________________________</p>
                            <p><strong>${selectedPersonForDoc?.full_name}</strong></p>
                            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <script>
                            window.onload = () => { window.print(); };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const generatePDF = (templateKey: string, returnBlob: boolean = false) => {
        if (!selectedPersonForDoc) return;

        const doc = new jsPDF();
        const p = selectedPersonForDoc;
        const org = orgData;
        const today = new Date().toLocaleDateString('pt-BR');

        // Professional Header
        if (org?.logo_url) {
            try {
                doc.addImage(org.logo_url, 'PNG', 10, 10, 30, 30);
            } catch (e) {
                console.error('Error adding logo to PDF', e);
            }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(org?.company_name || 'VERITUM PRO - OFFICE', 45, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const orgAddress = `${org?.address_street || ''}, ${org?.address_number || ''} ${org?.address_complement ? '- ' + org.address_complement : ''}`;
        const cityState = `${org?.address_neighborhood || ''} - ${org?.address_city || ''}/${org?.address_state || ''} - CEP: ${org?.address_zip || ''}`;
        const contact = `Email: ${org?.email || ''} | Tel: ${org?.phone || ''} | Site: ${org?.website || ''}`;

        doc.text(orgAddress, 45, 26);
        doc.text(cityState, 45, 30);
        doc.text(contact, 45, 34);

        doc.setLineWidth(0.5);
        doc.line(10, 42, 200, 42);

        // Content
        const titleMap: any = {
            procuracao: 'PROCURAÇÃO AD JUDICIA ET EXTRA',
            contrato: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS',
            declaracao: 'DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA',
            lgpd: 'TERMO DE CONSENTIMENTO - LGPD',
            substabelecimento: 'SUBSTABELECIMENTO',
            entrevista: 'FICHA DE ENTREVISTA E QUALIFICAÇÃO INTEGRAL',
            residencia: 'DECLARAÇÃO DE RESIDÊNCIA SOB AS PENAS DA LEI',
            recibo: 'RECIBO DE PAGAMENTO DE HONORÁRIOS'
        };

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const title = titleMap[templateKey] || 'DOCUMENTO';
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, (210 - titleWidth) / 2, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const qual = `OUTORGANTE: ${p.full_name}, ${p.legal_data?.marital_status || 'Estado Civil não informado'}, ${p.legal_data?.profession || 'Profissão não informada'}, portador(a) do RG nº ${p.rg || '______'}, inscrito(a) no CPF/MF sob o nº ${p.document || '______'}, residente e domiciliado(a) na ${p.address?.street || '______'}, nº ${p.address?.number || '______'}, ${p.address?.complement || ''}, Bairro ${p.address?.neighborhood || '______'}, em ${p.address?.city || '______'}/${p.address?.state || ''}, CEP: ${p.address?.cep || '______'}.`;

        if (templateKey === 'procuracao') {
            doc.text(qual, 15, 70, { align: 'justify', maxWidth: 180 });
            doc.setFont('helvetica', 'bold');
            doc.text('PODERES:', 15, 100);
            doc.setFont('helvetica', 'normal');
            doc.text('Pelo presente instrumento, o outorgante nomeia e constitui seus procuradores os advogados deste escritório, conferindo-lhes os amplos poderes da cláusula ad judicia et extra, para o foro em geral, em qualquer Juízo, Instância ou Tribunal, podendo propor ações e defendê-lo nas que lhe forem propostas, seguindo umas e outras até final decisão...', 15, 105, { align: 'justify', maxWidth: 180 });
        } else if (templateKey === 'contrato') {
            doc.text(qual, 15, 70, { align: 'justify', maxWidth: 180 });
            doc.setFont('helvetica', 'bold');
            doc.text('CLÁUSULA PRIMEIRA - DO OBJETO:', 15, 105);
            doc.setFont('helvetica', 'normal');
            doc.text('O presente contrato tem como objeto a prestação de serviços jurídicos pelo CONTRATADO em favor do CONTRATANTE, para fins de acompanhamento de demandas judiciais e extrajudiciais, bem como consultoria e assessoria jurídica especializada na área de atuação solicitada...', 15, 110, { align: 'justify', maxWidth: 180 });
            doc.setFont('helvetica', 'bold');
            doc.text('CLÁUSULA SEGUNDA - DOS HONORÁRIOS:', 15, 140);
            doc.setFont('helvetica', 'normal');
            doc.text('Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO os honorários advocatícios conforme pactuado verbalmente ou em anexo financeiro, observando-se a tabela da OAB e a complexidade da causa...', 15, 145, { align: 'justify', maxWidth: 180 });
        } else if (templateKey === 'substabelecimento') {
            doc.text('SUBSTABELECENTE: Os advogados integrantes deste escritório profissional.', 15, 70);
            doc.text(`SUBSTABELECIDO: Dra. _________________________________________, OAB/SP nº __________, com endereço na Rua ____________________, nº ____, ________________.`, 15, 80, { maxWidth: 180 });
            doc.text('PODERES: Pelo presente instrumento, substabeleço, COM RESERVA DE IGUAIS PODERES, na pessoa do substabelecido, os poderes que me foram conferidos por:', 15, 100);
            doc.setFont('helvetica', 'bold');
            doc.text(`CLIENTE: ${p.full_name}`, 15, 110);
            doc.setFont('helvetica', 'normal');
            doc.text('O presente substabelecimento é válido para atuar em conjunto ou separadamente em todos os atos processuais necessários ao bom andamento da causa.', 15, 120, { align: 'justify', maxWidth: 180 });
        } else if (templateKey === 'entrevista') {
            doc.text('DADOS DO CLIENTE:', 15, 70);
            const clientAddress = `${p.address?.street || ''}, ${p.address?.number || ''} ${p.address?.complement ? '- ' + p.address.complement : ''}, ${p.address?.neighborhood || ''}, ${p.address?.city || ''}/${p.address?.state || ''}`;
            const dataRows = [
                ['Nome Completo', p.full_name],
                ['CPF/CNPJ', p.document || ''],
                ['RG', p.rg || ''],
                ['Estado Civil', p.legal_data?.marital_status || ''],
                ['Profissão', p.legal_data?.profession || ''],
                ['Endereço', clientAddress],
                ['Telefone', p.phone || ''],
                ['PIS/NIT', p.pis || ''],
                ['CTPS', p.ctps || ''],
            ];
            autoTable(doc, {
                startY: 75,
                head: [['Campo', 'Valor']],
                body: dataRows,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 }
            });
            const finalY = (doc as any).lastAutoTable?.finalY || 150;
            doc.text('ANOTAÇÕES DA ENTREVISTA:', 15, finalY + 15);
            doc.setLineWidth(0.1);
            for (let i = 0; i < 8; i++) {
                doc.line(15, finalY + 25 + (i * 10), 195, finalY + 25 + (i * 10));
            }
        } else if (templateKey === 'declaracao') {
            doc.text(qual, 15, 70, { align: 'justify', maxWidth: 180 });
            doc.setFont('helvetica', 'bold');
            doc.text('DECLARAÇÃO:', 15, 110);
            doc.setFont('helvetica', 'normal');
            doc.text('Declaro, para os devidos fins de direito, notadamente para fins de obtenção do benefício da assistência judiciária gratuita, sob as penas da lei (Lei 1.060/50 e CPC/2015), que não possuo condições financeiras de arcar com as custas processuais e honorários advocatícios, sem prejuízo do meu próprio sustento e de minha família.', 15, 120, { align: 'justify', maxWidth: 180 });
        } else if (templateKey === 'lgpd') {
            doc.text(qual, 15, 70, { align: 'justify', maxWidth: 180 });
            doc.setFont('helvetica', 'bold');
            doc.text('TERMO DE CONSENTIMENTO:', 15, 110);
            doc.setFont('helvetica', 'normal');
            doc.text('Com base na Lei Geral de Proteção de Dados (Lei 13.709/18), autorizo expressamente este escritório a realizar o tratamento de meus dados pessoais e documentos compartilhados, exclusivamente para a finalidade de prestação de serviços jurídicos e defesa de meus interesses junto ao Judiciário e órgãos administrativos.', 15, 120, { align: 'justify', maxWidth: 180 });
        } else if (templateKey === 'residencia') {
            doc.text(qual, 15, 70, { align: 'justify', maxWidth: 180 });
            doc.text('DECLARAÇÃO:', 15, 110);
            doc.text('Declaro, para os devidos fins de direito, sob as penas da Lei Civil e Penal, que resido no endereço acima mencionado, sendo este meu domicílio habitual e verdadeiro.', 15, 120, { align: 'justify', maxWidth: 180 });
            doc.text('Por ser expressão da verdade, firmo a presente declaração.', 15, 140);
        } else if (templateKey === 'recibo') {
            doc.text(`RECEBEMOS de ${p.full_name}, CPF nº ${p.document}, a quantia de R$ _______,_______ (____________________________________________________________________), referente a honorários advocatícios relativos a __________________________________________________.`, 15, 80, { align: 'justify', maxWidth: 180 });
            doc.text('Damos plena e geral quitação pelo valor recebido.', 15, 110);
            doc.text(`Local e Data: ${org?.address_city || '______'}/${org?.address_state || ''}, ${today}`, 15, 130);
        } else {
            doc.text(qual, 15, 70, { align: 'justify', maxWidth: 180 });
            doc.text('Texto jurídico padrão para este modelo em fase de finalização pela Scriptor PRO Engine...', 15, 110, { align: 'justify', maxWidth: 180 });
        }

        // Signature
        const footerY = 250;
        doc.line(60, footerY, 150, footerY);
        doc.setFont('helvetica', 'bold');
        doc.text(p.full_name, (210 - doc.getTextWidth(p.full_name)) / 2, footerY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Local e Data: ${org?.address_city || '______'}/${org?.address_state || ''}, ${today}`, (210 - doc.getTextWidth(`Local e Data: ${org?.address_city || '______'}/${org?.address_state || ''}, ${today}`)) / 2, footerY + 15);

        if (returnBlob) {
            return doc.output('bloburl');
        }

        doc.save(`${templateKey}_${p.full_name.replace(/\s+/g, '_')}.pdf`);
    };

    const downloadDBTemplateAsPDF = (template: any, returnBlob: boolean = false) => {
        if (!selectedPersonForDoc) return;
        const doc = new jsPDF();
        const p = selectedPersonForDoc;
        const org = orgData;
        const today = new Date().toLocaleDateString('pt-BR');

        // Professional Header
        if (org?.logo_url) {
            try {
                doc.addImage(org.logo_url, 'PNG', 10, 10, 30, 30);
            } catch (e) {
                console.error('Error adding logo to PDF', e);
            }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(org?.company_name || 'VERITUM PRO - OFFICE', 45, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const orgAddress = `${org?.address_street || ''}, ${org?.address_number || ''} ${org?.address_complement ? '- ' + org.address_complement : ''}`;
        const cityState = `${org?.address_neighborhood || ''} - ${org?.address_city || ''}/${org?.address_state || ''} - CEP: ${org?.address_zip || ''}`;
        const contact = `Email: ${org?.email || ''} | Tel: ${org?.phone || ''} | Site: ${org?.website || ''}`;

        doc.text(orgAddress, 45, 26);
        doc.text(cityState, 45, 30);
        doc.text(contact, 45, 34);

        doc.setLineWidth(0.5);
        doc.line(10, 42, 200, 42);

        // Title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const titleText = template.title || 'DOCUMENTO';
        const titleWidth = doc.getTextWidth(titleText.toUpperCase());
        doc.text(titleText.toUpperCase(), (210 - titleWidth) / 2, 55);

        // Content
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const contentStr = template.content || '';
        const processed = replaceTags(contentStr, selectedPersonForDoc as Person, orgData);
        const cleanContent = processed.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]+>/g, '');

        const lines = doc.splitTextToSize(cleanContent, 180);

        let yPos = 70;
        lines.forEach((line: string) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 15, yPos, { align: 'justify', maxWidth: 180 });
            yPos += 5;
        });

        // Signature
        let footerY = yPos + 30;
        if (footerY > 270) {
            doc.addPage();
            footerY = 40;
        }

        doc.line(60, footerY, 150, footerY);
        doc.setFont('helvetica', 'bold');
        doc.text(p.full_name, (210 - doc.getTextWidth(p.full_name)) / 2, footerY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Local e Data: ${org?.address_city || '______'}/${org?.address_state || ''}, ${today}`, (210 - doc.getTextWidth(`Local e Data: ${org?.address_city || '______'}/${org?.address_state || ''}, ${today}`)) / 2, footerY + 15);

        if (returnBlob) {
            return doc.output('bloburl');
        }

        doc.save(`${titleText.replace(/\s+/g, '_')}_${p.full_name.replace(/\s+/g, '_')}.pdf`);
    };


    const handleEditPerson = (person: Person) => {
        if (isEmbedded) {
            window.dispatchEvent(new CustomEvent('CRM_OPEN_MODAL', { detail: person }));
        } else {
            setEditingPerson(person);
            setIsModalOpen(true);
            setActiveTab('basic');
        }
    };

    const handleSoftDelete = async (id: string) => {
        if (!selectedUserId) return;
        const personToDelete = persons.find(p => p.id === id);
        if (personToDelete) {
            setDeleteConfirmId(id);
            setDeleteConfirmName(personToDelete.full_name);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId || !selectedUserId) return;
        try {
            await deletePerson(deleteConfirmId, selectedUserId);
            toast.success(t('management.master.persons.toasts.deleteSuccess'));
            setDeleteConfirmId(null);
            setDeleteConfirmName(null);
            if (onRefresh) {
                onRefresh();
            } else {
                fetchPersons();
            }
        } catch (err) {
            console.error('Error deleting person:', err);
            toast.error(t('management.master.persons.toasts.deleteError'));
        }
    };

    const filteredPersons = persons;

    return (
        <div className="space-y-6">
            {/* Master Context Selector removed - now handled by parent module (Nexus/Suite) */}

            {!isEmbedded && (
                <div className={`flex flex-col md:flex-row gap-4 ${isEmbedded ? 'md:items-end md:justify-end text-right' : 'md:items-center justify-between'}`}>
                    <div className={`flex items-center gap-4 ${isEmbedded ? 'md:flex-row-reverse' : ''}`}>
                        <div className={`${isEmbedded ? 'bg-emerald-600/10 text-emerald-600 p-2 rounded-xl border border-emerald-600/20' : 'bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40'} animate-in zoom-in duration-500`}>
                            <User size={isEmbedded ? 18 : 24} />
                        </div>
                        <div className={isEmbedded ? 'text-right' : ''}>
                            <div className={`flex items-center gap-3 mb-1 ${isEmbedded ? 'justify-end' : ''}`}>
                                <h2 className={`${isEmbedded ? 'text-lg' : 'text-xl'} font-bold text-slate-800 dark:text-white transition-colors uppercase tracking-tight`}>{t('management.master.persons.title')}</h2>
                                {isBYODB ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <DbIcon size={12} className="shrink-0" />
                                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Private Cloud Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
                                        <ShieldCheck size={12} className="shrink-0" />
                                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Veritum Master DB</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('management.master.persons.subtitle')}</p>
                        </div>
                    </div>
                    {!isEmbedded && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setEditingPerson({ person_type: 'Cliente' }); setIsModalOpen(true); setActiveTab('basic'); }}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-slate-800 dark:border-slate-100"
                            >
                                <Plus size={18} /> {t('management.master.persons.newEntry')}
                            </button>
                            {isBYODB && (
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 group relative cursor-help">
                                    <DbIcon size={18} />
                                    <div className="absolute top-full right-0 mt-3 w-48 p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold leading-relaxed opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl">
                                        Os dados deste módulo estão sendo gravados no seu próprio banco de dados de forma isolada e segura.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('management.master.persons.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                    />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl self-end md:self-auto border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setViewStyle('grid')}
                        className={`p-2 rounded-lg transition-all ${viewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title={t('common.viewStyle.cards')}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewStyle('list')}
                        className={`p-2 rounded-lg transition-all ${viewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title={t('common.viewStyle.list')}
                    >
                        <List size={18} />
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-950 px-5 py-2.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm min-w-[160px] self-end md:self-auto">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mr-6">{t('management.master.persons.stats.label')}</span>
                    <span className="text-xl font-black text-indigo-600">{persons.length}</span>
                </div>
            </div>

            {viewStyle === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-12 text-center text-slate-400">{t('management.master.persons.table.loading')}</div>
                    ) : filteredPersons.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400">{t('management.master.persons.table.empty')}</div>
                    ) : filteredPersons.map(person => (
                        <div key={person.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-start justify-between mb-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${person.person_type === 'Cliente' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800' :
                                        person.person_type === 'Advogado Adverso' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-800' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                        }`}>
                                        {t(`management.master.persons.types.${person.person_type}`)}
                                    </span>
                                    <div className="flex gap-2">
                                        {onOpenNexoVisual && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onOpenNexoVisual(person); }}
                                                className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                title={t('modules.nexus.processes.viewMindMap')}
                                            >
                                                <Network size={14} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditPerson(person);
                                            }}
                                            className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all cursor-pointer"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleSoftDelete(person.id)}
                                            className="p-4 -m-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1 truncate pr-4">{person.full_name}</h3>
                                <p className="text-xs text-slate-400 font-mono mb-5 flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                    <FileText size={12} /> {person.document}
                                </p>

                                <div className="space-y-3 mb-6">
                                    <button
                                        onClick={() => openEmail(person.email)}
                                        className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm hover:text-indigo-600 transition-colors w-full group/link cursor-pointer"
                                    >
                                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover/link:bg-indigo-50 dark:group-hover/link:bg-indigo-900/30 transition-colors">
                                            <Mail size={14} className="text-slate-400 group-hover/link:text-indigo-600" />
                                        </div>
                                        <span className="truncate font-medium">{person.email || t('common.notApplicable')}</span>
                                    </button>

                                    <button
                                        onClick={() => openWhatsApp(person.phone)}
                                        className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm hover:text-emerald-600 transition-colors w-full group/link cursor-pointer"
                                    >
                                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover/link:bg-emerald-50 dark:group-hover/link:bg-emerald-900/30 transition-colors">
                                            <MessageCircle size={14} className="text-slate-400 group-hover/link:text-emerald-600" />
                                        </div>
                                        <span className="truncate font-medium">{person.phone || t('common.notApplicable')}</span>
                                    </button>

                                    {person.address && (
                                        <button
                                            onClick={() => openMaps(person.address)}
                                            className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm hover:text-indigo-600 transition-colors w-full group/link cursor-pointer"
                                        >
                                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover/link:bg-indigo-50 dark:group-hover/link:bg-indigo-900/30 transition-colors">
                                                <MapPin size={14} className="text-slate-400 group-hover/link:text-indigo-600" />
                                            </div>
                                            <span className="truncate font-medium text-left leading-tight">
                                                {person.address.street ? `${person.address.street}, ${person.address.number || ''}` : t('common.notApplicable')}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.persons.stats.activeLawsuits')}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Scale size={14} className="text-indigo-600" />
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">0</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleGenerateDocs(person)}
                                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-950 transition-all shadow-sm cursor-pointer"
                                        title={t('management.master.persons.actions.generateDocs')}
                                    >
                                        <FileDown size={18} />
                                    </button>
                                    {onNewAsset && (
                                        <button
                                            onClick={() => onNewAsset(person.id)}
                                            className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                            title={t('management.master.persons.actions.registerAsset')}
                                        >
                                            <Zap size={18} />
                                        </button>
                                    )}
                                    {onNewCorporateEntity && (
                                        <button
                                            onClick={() => onNewCorporateEntity(person)}
                                            className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                            title={t('management.master.persons.actions.registerCorporate')}
                                        >
                                            <Briefcase size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onNewLawsuit?.(person.id)}
                                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                                        title={t('management.master.persons.actions.newLawsuit')}
                                    >
                                        <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:from-indigo-500/10 transition-all duration-500"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.persons.table.member')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.persons.modal.fields.document')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.persons.table.contact')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.persons.table.classification')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('common.loading')}</td></tr>
                                ) : filteredPersons.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('management.master.persons.table.empty')}</td></tr>
                                ) : filteredPersons.map(person => (
                                    <tr key={person.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 dark:text-white capitalize truncate max-w-[200px]">{person.full_name}</div>
                                            {person.email && <div className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{person.email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm font-bold text-slate-600 dark:text-slate-300">{person.document}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{person.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${person.person_type === 'Cliente' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' :
                                                person.person_type === 'Advogado Adverso' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-800' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                                }`}>
                                                {t(`management.master.persons.types.${person.person_type || 'Geral'}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1 transition-all">
                                                {onOpenNexoVisual && (
                                                    <button
                                                        onClick={() => onOpenNexoVisual(person)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                        title={t('modules.nexus.processes.viewMindMap')}
                                                    >
                                                        <Network size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleGenerateDocs(person)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                    title={t('management.master.persons.actions.generateDocs')}
                                                >
                                                    <FileDown size={16} />
                                                </button>
                                                {onNewAsset && (
                                                    <button
                                                        onClick={() => onNewAsset(person.id)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                        title={t('management.master.persons.actions.registerAsset')}
                                                    >
                                                        <Zap size={16} />
                                                    </button>
                                                )}
                                                {onNewCorporateEntity && (
                                                    <button
                                                        onClick={() => onNewCorporateEntity(person)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                        title={t('management.master.persons.actions.registerCorporate')}
                                                    >
                                                        <Briefcase size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onNewLawsuit?.(person.id)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    title={t('management.master.persons.actions.newLawsuit')}
                                                >
                                                    <ArrowUpRight size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditPerson(person);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleSoftDelete(person.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Person Drawer (Slide-over Pattern) */}
            {!isEmbedded && (
                <CrmModal
                    isCrmModalOpen={isModalOpen}
                    setIsCrmModalOpen={setIsModalOpen}
                    editingPerson={editingPerson}
                    setEditingPerson={setEditingPerson as any}
                    activeCrmTab={activeTab}
                    setActiveCrmTab={setActiveTab}
                    selectedUserId={selectedUserId}
                    onSuccess={() => {
                        if (onRefresh) onRefresh();
                        else fetchPersons();
                    }}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {
                deleteConfirmId && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center animate-in zoom-in duration-300">
                            <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                {t('management.master.persons.confirmations.softDeleteTitle')}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                {t('management.master.persons.confirmations.softDeleteMessage', { name: deleteConfirmName })}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(null); }}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} /> {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Document Generation Modal */}
            <AnimatePresence>
                {isDocModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDocModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                        <FileCheck size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                            {viewMode === 'list' ? t('management.master.persons.docGen.title') : selectedTemplate?.title || t('management.master.persons.docGen.previewTitle')}
                                        </h2>
                                        <p className="text-slate-500 font-medium text-xs">
                                            {viewMode === 'list' ? t('management.master.persons.docGen.subtitle') : t('management.master.persons.docGen.previewSubtitle')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {viewMode === 'preview' && (
                                        <button
                                            onClick={() => { setViewMode('list'); setPdfPreviewUrl(null); }}
                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-200"
                                        >
                                            {t('management.master.persons.docGen.actions.back')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsDocModalOpen(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    >
                                        <XCircle size={24} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {viewMode === 'list' && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-2 mx-8 mt-4 rounded-xl flex gap-2 border border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => setDocActiveTab('master')}
                                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${docActiveTab === 'master' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t('management.master.persons.docGen.tabs.master')}
                                    </button>
                                    <button
                                        onClick={() => setDocActiveTab('office')}
                                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${docActiveTab === 'office' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t('management.master.persons.docGen.tabs.office')}
                                    </button>
                                </div>
                            )}

                            <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                                {viewMode === 'list' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {docActiveTab === 'master' && (
                                            <>
                                                {[
                                                    { key: 'procuracao', icon: ScrollText, color: 'indigo', title: t('management.master.persons.docGen.templates.procuracao'), sub: selectedPersonForDoc?.person_type === 'Cliente' ? t('management.master.persons.docGen.placeholders.activePole') : t('management.master.persons.docGen.placeholders.general') },
                                                    { key: 'contrato', icon: Scale, color: 'emerald', title: t('management.master.persons.docGen.templates.contrato'), sub: t('management.master.persons.docGen.placeholders.feeAgreement') },
                                                    { key: 'declaracao', icon: FileText, color: 'amber', title: t('management.master.persons.docGen.templates.declaracao'), sub: t('management.master.persons.docGen.placeholders.indigency') },
                                                    { key: 'lgpd', icon: ShieldCheck, color: 'blue', title: t('management.master.persons.docGen.templates.lgpd'), sub: t('management.master.persons.docGen.placeholders.dataProtection') },
                                                    { key: 'substabelecimento', icon: ArrowUpRight, color: 'violet', title: t('management.master.persons.docGen.templates.substabelecimento'), sub: t('management.master.persons.docGen.placeholders.repasse') },
                                                    { key: 'entrevista', icon: Briefcase, color: 'pink', title: t('management.master.persons.docGen.templates.entrevista'), sub: t('management.master.persons.docGen.placeholders.qualification') },
                                                    { key: 'residencia', icon: MapPin, color: 'cyan', title: t('management.master.persons.docGen.templates.residencia'), sub: t('management.master.persons.docGen.placeholders.residenceProof') },
                                                    { key: 'recibo', icon: Zap, color: 'emerald', title: t('management.master.persons.docGen.templates.recibo'), sub: t('management.master.persons.docGen.placeholders.paymentReceipt') }
                                                ].map((nt) => {
                                                    const colorClasses: Record<string, string> = {
                                                        indigo: 'text-indigo-600 border-indigo-500 hover:ring-indigo-500/10',
                                                        emerald: 'text-emerald-600 border-emerald-500 hover:ring-emerald-500/10',
                                                        amber: 'text-amber-600 border-amber-500 hover:ring-amber-500/10',
                                                        blue: 'text-blue-600 border-blue-500 hover:ring-blue-500/10',
                                                        violet: 'text-violet-600 border-violet-500 hover:ring-violet-500/10',
                                                        pink: 'text-pink-600 border-pink-500 hover:ring-pink-500/10',
                                                        cyan: 'text-cyan-600 border-cyan-500 hover:ring-cyan-500/10',
                                                    };
                                                    return (
                                                        <div key={nt.key} className="relative group">
                                                            <div className={`flex flex-col items-start p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl h-full transition-all group-hover:scale-[1.02] group-hover:shadow-lg`}>
                                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-4"><nt.icon size={20} className={colorClasses[nt.color]?.split(' ')[0]} /></div>
                                                                <span className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight mb-1">{nt.title}</span>
                                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{nt.sub}</span>
                                                            </div>
                                                            {/* Overlay */}
                                                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 z-10">
                                                                <button onClick={() => { generatePDF(nt.key); setTimeout(() => setIsDocModalOpen(false), 1000); }} className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-colors">
                                                                    {t('management.master.persons.docGen.actions.download')}
                                                                </button>
                                                                <button onClick={() => {
                                                                    const blobUrl = (generatePDF(nt.key, true) as any).toString();
                                                                    setSelectedTemplate({ title: nt.title });
                                                                    setPdfPreviewUrl(blobUrl);
                                                                    setViewMode('preview');
                                                                }} className="w-full py-2.5 bg-slate-800/80 backdrop-blur-md text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                                                                    {t('management.master.persons.docGen.actions.preview')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}

                                        {/* Dynamic Templates matching the active tab */}
                                        {dbTemplates.filter(t => (docActiveTab === 'master' ? t.is_standard : !t.is_standard)).map((template) => (
                                            <div key={template.id} className="relative group">
                                                <div className="flex flex-col items-start p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl h-full transition-all group-hover:scale-[1.02] group-hover:shadow-lg">
                                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-4">
                                                        {template.is_standard ? <CheckCircle2 size={20} className="text-amber-500" /> : <FileText size={20} className="text-indigo-600" />}
                                                    </div>
                                                    <span className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight mb-1 line-clamp-1">
                                                        {template.title}
                                                    </span>
                                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                        {template.category || t('management.master.persons.docGen.placeholders.general')}
                                                    </span>
                                                </div>
                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 z-10">
                                                    <button onClick={() => {
                                                        downloadDBTemplateAsPDF(template);
                                                        setTimeout(() => setIsDocModalOpen(false), 1000);
                                                    }} className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-colors">
                                                        {t('management.master.persons.docGen.actions.download')}
                                                    </button>
                                                    <button onClick={() => {
                                                        const processed = replaceTags(template.content, selectedPersonForDoc as Person, orgData);
                                                        setProcessedContent(processed);
                                                        setSelectedTemplate(template);

                                                        const blobUrl = (downloadDBTemplateAsPDF(template, true) as any).toString();
                                                        setPdfPreviewUrl(blobUrl);
                                                        setViewMode('preview');
                                                    }} className="w-full py-2.5 bg-slate-800/80 backdrop-blur-md text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                                                        {t('management.master.persons.docGen.actions.preview')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {docActiveTab === 'office' && dbTemplates.filter(t => !t.is_standard).length === 0 && (
                                            <div className="col-span-2 text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('management.master.persons.docGen.messages.noCustomTemplates')}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {pdfPreviewUrl ? (
                                            <div className="w-full h-[60vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-50">
                                                <iframe src={pdfPreviewUrl} className="w-full h-full border-0" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                                                    <div className="prose dark:prose-invert max-w-none text-sm font-serif" dangerouslySetInnerHTML={{ __html: processedContent }} />
                                                </div>
                                                <button
                                                    onClick={printDocument}
                                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20"
                                                >
                                                    {t('management.master.persons.docGen.actions.print')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {viewMode === 'list' && (
                                <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                        <span dangerouslySetInnerHTML={{ __html: t('management.master.persons.docGen.messages.autoFillData', { name: selectedPersonForDoc?.full_name, document: selectedPersonForDoc?.document || 'S/ Doc' }) }} />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PersonManagement;
