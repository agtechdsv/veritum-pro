import React, { useState, useEffect, useRef } from 'react';
import { Credentials, Lawsuit, LawsuitDocument, Task, CalendarEvent, User, Person, TeamMember, Asset, CorporateEntity, Shareholder, CorporateDocument, TaxRegime, EntityStatus, EntityType, AssetDocument, TimelineEntry, GlobalDocument, FinancialTransaction } from '@/types';
import { Plus, MoreHorizontal, Calendar, Scale, Search, Filter, LayoutDashboard, ArrowRight, AlertTriangle, CheckCircle2, Clock, MapPin, Shield, User as UserIcon, Users, Save, XCircle, Pencil, ChevronRight, ChevronLeft, ChevronDown, Zap, Lock as LockIcon, Trash2, LayoutGrid, List, Building2, FileText, PieChart, Briefcase, Upload, Check, Loader2, Download, Network, Trello, History, ExternalLink, DollarSign, TrendingDown, Wallet, Landmark, BarChart3, Sparkles, Brain } from 'lucide-react';
import { createDynamicClient } from '@/utils/supabase/client';
import IntelligenceWidget from '../shared/intelligence-widget';
import { useTranslation } from '@/contexts/language-context';
import PersonManagement from './person-management';
import { useModule } from '@/app/veritumpro/layout';
import { listPersons } from '@/app/actions/crm-actions';
import { listLawsuits, saveLawsuit, deleteLawsuit, listTasks, saveTask, deleteTask, listEvents, saveEvent, deleteEvent, listTeam, getCitiesByState, listAssets, saveAsset, deleteAsset, listCorporateEntities, saveCorporateEntity, deleteCorporateEntity, listShareholders, saveShareholder, deleteShareholder, listCorporateDocuments, saveCorporateDocument, deleteCorporateDocument, listLawsuitDocuments, saveLawsuitDocument, deleteLawsuitDocument, listAssetDocuments, saveAssetDocument, deleteAssetDocument, listTimelineEntries, listAllGlobalDocuments, listFinancialTransactions, saveFinancialTransaction, deleteFinancialTransaction, getFinancialStats } from '@/app/actions/nexus-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/toast';
import { createMasterClient } from '@/lib/supabase/master';
import Link from 'next/link';
import { PremiumFileUpload, PremiumCombobox, BlockedTabOverlay, TrendingUp } from './nexus/nexus-components';
import { NexoVisual } from './nexus/nexus-visual';

// Sub-components extracted to ./nexus/nexus-components.tsx

const Nexus: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    const { t, locale } = useTranslation();
    const { preferences, onSelectClient, allClients, selectedClientId, credentials: contextCreds } = useModule();
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [eventView, setEventView] = useState<'calendar' | 'list'>('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [corporateEntities, setCorporateEntities] = useState<CorporateEntity[]>([]);
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [corporateDocuments, setCorporateDocuments] = useState<CorporateDocument[]>([]);
    const [lawsuitDocuments, setLawsuitDocuments] = useState<LawsuitDocument[]>([]);
    const [assetDocuments, setAssetDocuments] = useState<AssetDocument[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalDocuments, setGlobalDocuments] = useState<GlobalDocument[]>([]);
    const [isGlobalDocsLoading, setIsGlobalDocsLoading] = useState(false);
    
    // Master Selection States
    const isMaster = user.role === 'Master';
    const [selectedUserId, setSelectedUserId] = useState<string>(selectedClientId || (isMaster ? '' : user.id));

    // UI State
    const [isLawsuitModalOpen, setIsLawsuitModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingLawsuit, setEditingLawsuit] = useState<Partial<Lawsuit> | null>(null);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'pessoas' | 'processos' | 'tarefas' | 'agenda' | 'ativos' | 'societario' | 'documentos'>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeAssetTab, setActiveAssetTab] = useState<'basic' | 'advanced' | 'docs' | 'timeline'>('basic');
    const [activeLawsuitTab, setActiveLawsuitTab] = useState<'basic' | 'advanced' | 'docs' | 'timeline' | 'financeiro' | 'ai'>('basic');
    const [lawsuitTimeline, setLawsuitTimeline] = useState<TimelineEntry[]>([]);
    const [aiLawsuitSummary, setAiLawsuitSummary] = useState<string | null>(null);
    const [isAiSummarizing, setIsAiSummarizing] = useState(false);
    const [pendingLawsuitDocuments, setPendingLawsuitDocuments] = useState<{ file: File, docData: Partial<LawsuitDocument> }[]>([]);
    const [pendingAssetDocuments, setPendingAssetDocuments] = useState<{ file: File, docData: Partial<AssetDocument> }[]>([]);
    const [pendingCorporateDocuments, setPendingCorporateDocuments] = useState<{ file: File, docData: Partial<CorporateDocument> }[]>([]);
    const [aiInfoModal, setAiInfoModal] = useState<{ isOpen: boolean, title: string, summary: string }>({ isOpen: false, title: '', summary: '' });
    const [assetTimeline, setAssetTimeline] = useState<TimelineEntry[]>([]);
    const [isLawsuitTimelineLoading, setIsLawsuitTimelineLoading] = useState(false);
    const [isAssetTimelineLoading, setIsAssetTimelineLoading] = useState(false);
    const [visualRefreshTrigger, setVisualRefreshTrigger] = useState(0);
    const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
    const [isFinancialLoading, setIsFinancialLoading] = useState(false);
    const [financialStats, setFinancialStats] = useState({ totalCredits: 0, totalDebits: 0, balance: 0 });
    const [financeStartDate, setFinanceStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [financeEndDate, setFinanceEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
    const [isEditingFinancial, setIsEditingFinancial] = useState(false);
    const [editingFinancial, setEditingFinancial] = useState<Partial<FinancialTransaction> | null>(null);
    const [lawsuitFinances, setLawsuitFinances] = useState<FinancialTransaction[]>([]);
    const [activeTaskTab, setActiveTaskTab] = useState<'basic' | 'advanced'>('basic');
    const [processViewStyle, setProcessViewStyle] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [assetViewStyle, setAssetViewStyle] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [corporateViewStyle, setCorporateViewStyle] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Partial<CorporateEntity> | null>(null);
    const [activeEntityTab, setActiveEntityTab] = useState<'basic' | 'qsa' | 'docs' | 'timeline'>('basic');
    const [corporateTimeline, setCorporateTimeline] = useState<TimelineEntry[]>([]);
    const [isCorporateTimelineLoading, setIsCorporateTimelineLoading] = useState(false);
    const [corporateSearchTerm, setCorporateSearchTerm] = useState('');
    const [isShareholderModalOpen, setIsShareholderModalOpen] = useState(false);
    const [editingShareholder, setEditingShareholder] = useState<Partial<Shareholder> | null>(null);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<Partial<CorporateDocument> | null>(null);
    const [isNexoVisualOpen, setIsNexoVisualOpen] = useState(false);
    const [isNexoVisualLoading, setIsNexoVisualLoading] = useState(false);
    const [nexoData, setNexoData] = useState<{ origin_type: 'lawsuit' | 'corporate' | 'asset' | 'task' | 'document' | 'person' | 'lawsuit_document' | 'asset_document' | 'corporate_document', id: string, title: string, data: any } | null>(null);
    const [isLawsuitDocModalOpen, setIsLawsuitDocModalOpen] = useState(false);
    const [editingLawsuitDoc, setEditingLawsuitDoc] = useState<Partial<LawsuitDocument> | null>(null);
    const [lawsuitDocFile, setLawsuitDocFile] = useState<File | null>(null);
    const [isAssetDocModalOpen, setIsAssetDocModalOpen] = useState(false);
    const [editingAssetDoc, setEditingAssetDoc] = useState<Partial<AssetDocument> | null>(null);
    const [assetDocFile, setAssetDocFile] = useState<File | null>(null);
    const [corporateDocFile, setCorporateDocFile] = useState<File | null>(null);
    const personForQSARef = useRef<Person | null>(null);
    const corporateDocUploadRef = useRef<{ upload: () => Promise<string | null> }>(null);
    const lawsuitDocUploadRef = useRef<{ upload: () => Promise<string | null> }>(null);
    const assetDocUploadRef = useRef<{ upload: () => Promise<string | null> }>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState<{
        id: string;
        type: 'lawsuit' | 'asset' | 'corporate';
        title: string;
        timeline: TimelineEntry[];
        isLoading: boolean;
    } | null>(null);

    const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
    const [justificationText, setJustificationText] = useState('');
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        id: string;
        type: 'lawsuit' | 'asset' | 'corporate';
        newStatus: string;
    } | null>(null);

    const handleOpenHistory = async (id: string, type: 'lawsuit' | 'asset' | 'corporate', title: string) => {
        setIsHistoryModalOpen(true);
        setHistoryData({ id, type, title, timeline: [], isLoading: true });
        try {
            const { data } = await listTimelineEntries(type, id, selectedUserId);
            setHistoryData(prev => prev ? { ...prev, timeline: data || [], isLoading: false } : null);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Erro ao carregar histórico');
            setHistoryData(prev => prev ? { ...prev, isLoading: false } : null);
        }
    };

    // Quick Status Popup State
    const [statusPopover, setStatusPopover] = useState<{
        id: string;
        type: 'lawsuit' | 'asset' | 'corporate';
        options: string[];
        currentStatus: string;
        rect: { x: number, y: number };
    } | null>(null);

    const LAWSUIT_STATUSES = ['Ativo', 'Suspenso', 'Arquivado', 'Encerrado'];
    const ASSET_STATUSES = ['Ativo', 'Bloqueado', 'Vendido', 'Em Garantia', 'Alienado'];
    const ENTITY_STATUSES: EntityStatus[] = ['Ativa', 'Baixada', 'Inativa', 'Em Liquidação'];

    const handleQuickStatusUpdate = (id: string, type: 'lawsuit' | 'asset' | 'corporate', newStatus: string) => {
        const item = type === 'lawsuit' ? lawsuits.find(l => l.id === id) : type === 'asset' ? assets.find(a => a.id === id) : corporateEntities.find(e => e.id === id);
        if (item && item.status === newStatus) {
            setStatusPopover(null);
            return;
        }

        setPendingStatusChange({ id, type, newStatus });
        setJustificationText('');
        setIsJustificationModalOpen(true);
        setStatusPopover(null);
    };

    const handleConfirmStatusChange = async () => {
        if (!pendingStatusChange) return;
        const { id, type, newStatus } = pendingStatusChange;
        
        try {
            if (type === 'lawsuit') {
                const law = lawsuits.find(l => l.id === id);
                if (law) {
                    const saved = await saveLawsuit({ ...law, status: newStatus as any }, selectedUserId, justificationText);
                    setLawsuits(prev => prev.map(l => l.id === id ? saved : l));
                }
            } else if (type === 'asset') {
                const asset = assets.find(a => a.id === id);
                if (asset) {
                    const saved = await saveAsset({ ...asset, status: newStatus as any }, selectedUserId, justificationText);
                    setAssets(prev => prev.map(a => a.id === id ? saved : a));
                }
            } else if (type === 'corporate') {
                const entity = corporateEntities.find(e => e.id === id);
                if (entity) {
                    const saved = await saveCorporateEntity({ ...entity, status: newStatus as any }, selectedUserId, justificationText);
                    setCorporateEntities(prev => prev.map(e => e.id === id ? saved : e));
                }
            }
            toast.success(`Status atualizado para ${newStatus}`);
            setIsJustificationModalOpen(false);
            setPendingStatusChange(null);
            setJustificationText('');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status');
        }
    };

    const renderStatusBadge = (id: string, currentStatus: string, type: 'lawsuit' | 'asset' | 'corporate', options: string[]) => {
        const getStyles = () => {
            if (currentStatus === 'Ativo' || currentStatus === 'Ativa') return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50';
            if (currentStatus === 'Encerrado' || currentStatus === 'Vendido' || currentStatus === 'Baixada' || currentStatus === 'Inativa' || currentStatus === 'Bloqueado') 
                return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50';
            if (currentStatus === 'Suspenso' || currentStatus === 'Em Manutenção' || currentStatus === 'Em Liquidação' || currentStatus === 'Em Garantia') 
                return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/50';
            return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50';
        };

        return (
            <button
                type="button"
                title="Clique para alterar o status"
                onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setStatusPopover({
                        id,
                        type,
                        options,
                        currentStatus,
                        rect: { x: rect.left, y: rect.bottom + window.scrollY }
                    });
                }}
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm ${getStyles()}`}
            >
                {currentStatus}
            </button>
        );
    };

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    };

    const extractStoragePath = (url: string, bucket: string) => {
        try {
            const parts = url.split(`${bucket}/`);
            if (parts.length > 1) {
                // Strip query parameters
                return parts[1].split('?')[0];
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const filteredEntities = corporateEntities.filter(e => 
        e.legal_name.toLowerCase().includes(corporateSearchTerm.toLowerCase()) ||
        e.trading_name?.toLowerCase().includes(corporateSearchTerm.toLowerCase()) ||
        e.cnpj?.includes(corporateSearchTerm)
    );

    // Filters
    const [filterSearchTerm, setFilterSearchTerm] = useState('');
    const [filterResponsibleId, setFilterResponsibleId] = useState('');
    const [filterLawsuitId, setFilterLawsuitId] = useState('');

    // Specific Filters for Processos and Ativos
    const [lawsuitSearch, setLawsuitSearch] = useState('');
    const [lawsuitStatusFilter, setLawsuitStatusFilter] = useState('');
    const [lawsuitLawyerFilter, setLawsuitLawyerFilter] = useState('');

    const [assetSearch, setAssetSearch] = useState('');
    const [assetStatusFilter, setAssetStatusFilter] = useState('');
    const [assetTypeFilter, setAssetTypeFilter] = useState('');

    const [docSearch, setDocSearch] = useState('');
    const [docTypeFilter, setDocTypeFilter] = useState('');
    const [docOriginFilter, setDocOriginFilter] = useState('');

    // Searchable Select States
    const [authorSearch, setAuthorSearch] = useState('');
    const [defendantSearch, setDefendantSearch] = useState('');
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
    const [isDefendantDropdownOpen, setIsDefendantDropdownOpen] = useState(false);



    // Sync with global selection
    useEffect(() => {
        if (selectedClientId && selectedClientId !== selectedUserId) {
            setSelectedUserId(selectedClientId);
        }
    }, [selectedClientId]);

    // Cascading & Searchable States
    const [cities, setCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [chambers, setChambers] = useState<string[]>([]);
    const [isLoadingChambers, setIsLoadingChambers] = useState(false);

    const supabase = React.useMemo(() =>
        createDynamicClient(contextCreds.supabaseUrl, contextCreds.supabaseAnonKey),
        [contextCreds.supabaseUrl, contextCreds.supabaseAnonKey]
    );

    useEffect(() => {
        fetchAll();
    }, [selectedUserId]); // Fetch only when the selected context (client) changes



    const fetchAll = async () => {
        if (isMaster && !selectedUserId) {
            setLawsuits([]);
            setEvents([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        // Clear previous state to avoid "piscada" (flicker) with old data
        setLawsuits([]);
        setEvents([]);
        setAssets([]);

        try {
            const targetUserId = selectedUserId;

            // Centralized fetching for all nexus-related data
            const [lawResult, taskResult, eventResult, personResult, teamResult, assetResult, corpResult, finStatsResult] = await Promise.all([
                listLawsuits('', targetUserId),
                listTasks('', targetUserId),
                listEvents('', targetUserId),
                listPersons('', targetUserId),
                listTeam(targetUserId),
                listAssets(undefined, undefined, targetUserId),
                listCorporateEntities('', targetUserId),
                getFinancialStats(undefined, undefined, targetUserId, financeStartDate, financeEndDate)
            ]);

            if (lawResult.data) setLawsuits(lawResult.data);
            if (taskResult.data) setTasks(taskResult.data);
            if (eventResult.data) setEvents(eventResult.data);
            if (personResult.data) setPersons(personResult.data);
            if (teamResult?.data) setTeam(teamResult.data);

            if (assetResult?.data) setAssets(assetResult.data);
            if (corpResult?.data) setCorporateEntities(corpResult.data);
            if (finStatsResult?.data) setFinancialStats(finStatsResult.data);

            const hasTableError = lawResult.error === 'TABLE_NOT_FOUND' ||
                taskResult.error === 'TABLE_NOT_FOUND' ||
                eventResult.error === 'TABLE_NOT_FOUND' ||
                personResult.error === 'TABLE_NOT_FOUND' ||
                teamResult?.error === 'TABLE_NOT_FOUND' ||
                assetResult?.error === 'TABLE_NOT_FOUND' ||
                corpResult?.error === 'TABLE_NOT_FOUND' ||
                (finStatsResult as any)?.error === 'TABLE_NOT_FOUND';

            if (hasTableError) {
                toast.error(t('modules.nexus.errors.notMigrated') || 'O banco de dados do cliente selecionado ainda não foi migrado (tabelas Nexus/Team faltantes).');
            }

        } catch (err: any) {
            console.error('Error loading Nexus data:', err);
            if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
                toast.error(t('modules.nexus.errors.notInitialized') || 'O banco de dados deste cliente ainda não foi inicializado (tabelas Nexus/Team faltantes).');
            } else {
                toast.error(t('modules.nexus.errors.loadError') || 'Erro ao carregar dados do Nexus.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSummarizeWithAI = async () => {
        if (!editingLawsuit?.id) return;
        setIsAiSummarizing(true);
        setAiLawsuitSummary(null);
        
        // Simulação de chamada para API de IA (ex: Gemini/OpenAI)
        // Em produção, isso leria o conteúdo dos documentos e timeline
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const summary = `### ANÁLISE ESTRATÉGICA NEXUS\n\nEste processo (**${editingLawsuit.title}**) encontra-se em fase de **${editingLawsuit.status}**. \n\n**Pontos Chave:**\n- Atualmente possui **${lawsuitDocuments.length} documentos** anexados para revisão.\n- A probabilidade de êxito é avaliada como **${editingLawsuit.probability_of_success || 'Não Definida'}**.\n- Identificamos movimentações recentes na linha do tempo que sugerem atenção ao próximo prazo fatal.\n\n**Recomendação do Sistema:** Manter a provisão atual de **R$ ${(editingLawsuit.provision_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** e prosseguir com a estratégia de conciliação, dado o histórico de decisões em tribunais similares (análise preditiva).`;
        
        setAiLawsuitSummary(summary);
        setIsAiSummarizing(false);
    };

    const handleSummarizeDocument = async (doc: LawsuitDocument | AssetDocument | CorporateDocument | GlobalDocument) => {
        setIsAiSummarizing(true);
        toast.info(`A IA está analisando: ${doc.title}...`);
        
        // Simulação de processamento de documento
        await new Promise(resolve => setTimeout(resolve, 3500));
        
        const summary = `Este arquivo (**${doc.title}**) foi processado com sucesso. \n\n**Resumo Inteligente:**\nO documento refere-se a uma **${doc.document_type}** datada de **${doc.event_date ? new Date(doc.event_date).toLocaleDateString() : 'data não informada'}**. \n\nIdentificamos que o teor principal aborda uma manifestação sobre fatos novos do processo, sem impactos imediatos no valor da causa, mas relevante para a estratégia de defesa. \n\n**Pontos de Atenção:**\n- Verificar se o anexo está completo (páginas legíveis).\n- O teor coincide com a última atualização de jurisprudência cadastrada no Intelligence Center.`;
        
        setAiInfoModal({ isOpen: true, title: `Resumo IA: ${doc.title}`, summary: summary });
        setIsAiSummarizing(false);
    };

    const handleFetchGlobalDocuments = async (showToast = false) => {
        setIsGlobalDocsLoading(true);
        try {
            const result = await listAllGlobalDocuments(selectedUserId);
            if (result.data) {
                setGlobalDocuments(result.data);
            }
            if (showToast) toast.success(t('common.success'));
        } catch (error) {
            console.error("Error fetching global docs:", error);
            toast.error(t('common.error'));
        } finally {
            setIsGlobalDocsLoading(false);
        }
    };

    // Load global documents when tab is active
    useEffect(() => {
        if (activeTab === 'documentos') {
            handleFetchGlobalDocuments();
        }
    }, [activeTab]);

    // Cascading Logic: State -> City
    useEffect(() => {
        if (editingLawsuit?.state) {
            const fetchCities = async () => {
                setIsLoadingCities(true);
                try {
                    const data = await getCitiesByState(editingLawsuit.state as string);
                    setCities(data);
                } catch (err) {
                    console.error('Error fetching cities:', err);
                    setCities([]);
                } finally {
                    setIsLoadingCities(false);
                }
            };
            fetchCities();
        } else {
            setCities([]);
        }
    }, [editingLawsuit?.state]);

    // Cascading Logic: Tribunal -> Chamber (Vara)
    useEffect(() => {
        if (editingLawsuit?.court) {
            const fetchChambers = async () => {
                setIsLoadingChambers(true);
                // Get unique existing chambers for this tribunal to build the autocomplete base
                const uniqueChambers = Array.from(new Set(
                    lawsuits
                        .filter(l => l.court === editingLawsuit.court)
                        .map(l => l.chamber)
                )).filter(Boolean) as string[];

                // Common defaults if none exist
                const defaults = editingLawsuit.sphere === 'Trabalhista'
                    ? ['1ª VARA DO TRABALHO', '2ª VARA DO TRABALHO', '3ª VARA DO TRABALHO', '4ª VARA DO TRABALHO', '5ª VARA DO TRABALHO']
                    : ['1ª VARA CÃVEL', '2ª VARA CÃVEL', '3ª VARA CÃVEL', '1ª VARA FEDERAL', '2ª VARA FEDERAL'];

                setChambers(Array.from(new Set([...uniqueChambers, ...defaults])).sort());
                setIsLoadingChambers(false);
            };
            fetchChambers();
        } else {
            setChambers([]);
        }
    }, [editingLawsuit?.court, editingLawsuit?.sphere]);

    // Fetch Shareholders & Documents when Entity is selected
    useEffect(() => {
        if (editingEntity?.id) {
            const fetchSubs = async () => {
                const [sResult, dResult] = await Promise.all([
                    listShareholders(editingEntity.id!, selectedUserId),
                    listCorporateDocuments(editingEntity.id!, selectedUserId)
                ]);
                if (sResult.data) setShareholders(sResult.data);
                if (dResult.data) setCorporateDocuments(dResult.data);
            };
            fetchSubs();
        } else if (!editingEntity) {
            // Só limpamos se o modal estiver fechado (editingEntity === null)
            // Isso preserva os sócios "virtuais" injetados pelo CRM
            setShareholders([]);
            setCorporateDocuments([]);
        }
    }, [editingEntity?.id, !editingEntity, selectedUserId]);

    // Fetch Lawsuit Documents when Lawsuit is selected
    useEffect(() => {
        if (editingLawsuit?.id) {
            const fetchDocs = async () => {
                const result = await listLawsuitDocuments(editingLawsuit.id!, selectedUserId);
                if (result.data) setLawsuitDocuments(result.data);
            };
            fetchDocs();

            // Fetch Timeline if active tab
            if (activeLawsuitTab === 'timeline') {
                const fetchTimeline = async () => {
                    setIsLawsuitTimelineLoading(true);
                    try {
                        const res = await listTimelineEntries('lawsuit', editingLawsuit.id!, selectedUserId);
                        if (res.data) setLawsuitTimeline(res.data);
                    } finally {
                        setIsLawsuitTimelineLoading(false);
                    }
                };
                fetchTimeline();
            }
        } else {
            setLawsuitDocuments([]);
            setLawsuitTimeline([]);
        }
    }, [editingLawsuit?.id, selectedUserId, activeLawsuitTab]);

    // Fetch Asset Documents when Asset is selected
    useEffect(() => {
        if (editingAsset?.id) {
            const fetchDocs = async () => {
                const result = await listAssetDocuments(editingAsset.id!, selectedUserId);
                if (result.data) setAssetDocuments(result.data);
            };
            fetchDocs();

             // Fetch Timeline if active tab
             if (activeAssetTab === 'timeline') {
                const fetchTimeline = async () => {
                    setIsAssetTimelineLoading(true);
                    try {
                        const res = await listTimelineEntries('asset', editingAsset.id!, selectedUserId);
                        if (res.data) setAssetTimeline(res.data);
                    } finally {
                        setIsAssetTimelineLoading(false);
                    }
                };
                fetchTimeline();
            }
        } else {
            setAssetDocuments([]);
            setAssetTimeline([]);
        }
    }, [editingAsset?.id, selectedUserId, activeAssetTab]);

    // Fetch Corporate Timeline when Entity is selected
    useEffect(() => {
        if (editingEntity?.id) {
            if (activeEntityTab === 'timeline') {
                const fetchTimeline = async () => {
                    setIsCorporateTimelineLoading(true);
                    try {
                        const res = await listTimelineEntries('corporate', editingEntity.id!, selectedUserId);
                        if (res.data) setCorporateTimeline(res.data);
                    } finally {
                        setIsCorporateTimelineLoading(false);
                    }
                };
                fetchTimeline();
            }
        } else {
            setCorporateTimeline([]);
        }
    }, [editingEntity?.id, selectedUserId, activeEntityTab]);

    // Nexo Visual logic moved to sub-component

    const handleCreateLawsuitFromCRM = (personId: string) => {
        // Switch to lawsuits tab
        setActiveTab('processos');
        setPendingLawsuitDocuments([]);
        // SMART DEFAULT: Try to find the logged-in user in the team first (by ID or Email)
        const currentMember = team.find(m => m.id === user.id || (user.email && m.email === user.email));

        // FALLBACK: If not found, try to find the first member who has a lawyer-related role
        const firstLawyer = team.find(m =>
            m.role?.toLowerCase().includes('advogado') ||
            m.role?.toLowerCase().includes('sócio') ||
            m.role?.toLowerCase().includes('socio') ||
            m.specialty // If they have a specialty, they are likely a lawyer
        );

        setEditingLawsuit({
            author_id: personId,
            status: 'Ativo',
            sphere: 'CÃ­vel', // Default
            responsible_lawyer_id: currentMember?.id || firstLawyer?.id || team[0]?.id || ''
        });
        // Open modal with a small delay to allow tab transition animation to feel smooth
        setTimeout(() => {
            setIsLawsuitModalOpen(true);
            setActiveLawsuitTab('basic');
        }, 300);
    };

    const handleCreateCorporateEntityFromCRM = (person: Person) => {
        // Switch to societario tab
        setActiveTab('societario');
        // Smart Default for Entity Type based on document length
        const isCNPJ = person.document?.replace(/\D/g, '').length === 14;
        
        setEditingEntity({
            legal_name: person.full_name,
            cnpj: person.document,
            address: person.address,
            status: 'Ativa',
            entity_type: isCNPJ ? 'LTDA' : 'MEI'
        });

        // Se for CPF, guarda a pessoa na Ref e já popula a UI para visualização imediata
        if (!isCNPJ) {
            personForQSARef.current = person;
            setShareholders([{
                id: 'temp-' + Date.now(),
                entity_id: 'pending',
                person_shareholder_id: person.id,
                share_type: 'Quotas',
                shares_count: 100,
                ownership_percentage: 100,
                is_admin: true,
                position: 'Sócio-Administrador',
                shareholder_name: person.full_name,
                shareholder_type: 'Person'
            } as Shareholder]);
            console.log('[NEXUS] Sócio preparado e enviado para a UI:', person.full_name);
        } else {
            personForQSARef.current = null;
            setShareholders([]);
        }
        setCorporateDocuments([]);

        // Open modal with a small delay to allow tab transition animation to feel smooth
        setTimeout(() => {
            setIsEntityModalOpen(true);
            setActiveEntityTab('basic');
        }, 300);
    };

    const handleDownloadFile = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download error:', error);
            // Fallback: open in new tab if fetch fails
            window.open(url, '_blank');
        }
    };

    const handleFetchLawsuitFinances = async (lawsuitId: string) => {
        setIsFinancialLoading(true);
        try {
            const result = await listFinancialTransactions(lawsuitId, undefined, selectedUserId);
            if (result.data) setLawsuitFinances(result.data);
        } catch (error) {
            console.error('Error fetching finances:', error);
            toast.error('Erro ao carregar dados financeiros');
        } finally {
            setIsFinancialLoading(false);
        }
    };

    const handleSaveFinancialTransaction = async (transaction: Partial<FinancialTransaction>) => {
        try {
            await saveFinancialTransaction(transaction, selectedUserId);
            toast.success('Transação salva com sucesso');
            setIsEditingFinancial(false);
            setEditingFinancial(null);
            if (transaction.lawsuit_id) handleFetchLawsuitFinances(transaction.lawsuit_id);
            // Refresh global stats
            const stats = await getFinancialStats(undefined, undefined, selectedUserId);
            if (stats.data) setFinancialStats(stats.data);
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast.error('Erro ao salvar transação');
        }
    };

    const handleDeleteFinancialTransaction = async (id: string, lawsuitId?: string) => {
        if (!confirm('Deseja realmente excluir esta transação?')) return;
        try {
            await deleteFinancialTransaction(id, selectedUserId);
            toast.success('Transação excluída');
            if (lawsuitId) handleFetchLawsuitFinances(lawsuitId);
            const stats = await getFinancialStats(undefined, undefined, selectedUserId);
            if (stats.data) setFinancialStats(stats.data);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Erro ao excluir transação');
        }
    };

    const handleOpenNexoVisual = (type: 'lawsuit' | 'corporate' | 'asset' | 'task' | 'document' | 'person', data: any) => {
        let title = '';
        if (type === 'lawsuit') title = data.case_title || data.cnj_number;
        else if (type === 'corporate') title = data.legal_name;
        else if (type === 'person') title = data.full_name;
        else if (type === 'asset' || type === 'task' || type === 'document') title = data.title;

        setNexoData({
            origin_type: type,
            id: data.id,
            title: title || 'Sem Título',
            data: data
        });
        setIsNexoVisualOpen(true);
    };

    const handleEditGlobalDocumentOrigin = async (doc: GlobalDocument) => {
        const { origin_type, origin_id } = doc;
        
        if (origin_type === 'lawsuit') {
            const lawsuit = lawsuits.find(l => l.id === origin_id);
            if (lawsuit) {
                setEditingLawsuit(lawsuit);
                setIsLawsuitModalOpen(true);
                setActiveLawsuitTab('docs');
            } else {
                toast.error('Processo não encontrado nos dados carregados.');
            }
        } else if (origin_type === 'asset') {
            const asset = assets.find(a => a.id === origin_id);
            if (asset) {
                setEditingAsset(asset);
                setIsAssetModalOpen(true);
                setActiveAssetTab('docs');
            } else {
                toast.error('Ativo não encontrado nos dados carregados.');
            }
        } else if (origin_type === 'corporate') {
            const entity = corporateEntities.find(e => e.id === origin_id);
            if (entity) {
                handleEditEntity(entity, 'docs');
            } else {
                toast.error('Entidade não encontrada nos dados carregados.');
            }
        }
    };

    const handleDeleteGlobalDocument = async (doc: GlobalDocument) => {
        const { origin_type, id, title, file_url } = doc;
        let confirmTitle = 'Excluir Documento';
        
        triggerConfirm(
            confirmTitle,
            `Deseja realmente remover o documento "${title}"? Esta ação não pode ser desfeita.`,
            async () => {
                try {
                    if (file_url) {
                        const path = extractStoragePath(file_url, 'nexus-documents');
                        if (path) {
                            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                            await supabase.storage.from('nexus-documents').remove([path]);
                        }
                    }

                    if (origin_type === 'lawsuit') {
                        await deleteLawsuitDocument(id, selectedUserId);
                    } else if (origin_type === 'asset') {
                        await deleteAssetDocument(id, selectedUserId);
                    } else if (origin_type === 'corporate') {
                        await deleteCorporateDocument(id, selectedUserId);
                    }

                    setGlobalDocuments(prev => prev.filter(d => d.id !== id));
                    setLawsuitDocuments(prev => prev.filter(d => d.id !== id));
                    setAssetDocuments(prev => prev.filter(d => d.id !== id));
                    setCorporateDocuments(prev => prev.filter(d => d.id !== id));
                    
                    toast.success('Documento removido com sucesso');
                } catch (err) {
                    console.error('Error deleting global document:', err);
                    toast.error('Erro ao remover documento');
                }
            }
        );
    };

    const handleSaveLawsuit = async (e: React.FormEvent) => {
        e.preventDefault();

        // CNJ Strict Validation
        const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
        if (editingLawsuit?.cnj_number && !cnjRegex.test(editingLawsuit.cnj_number)) {
            toast.error(t('modules.nexus.modals.lawsuit.validation.cnj') || 'Formato de CNJ inválido. Use 0000000-00.0000.0.00.0000');
            return;
        }

        try {
            const targetUserId = selectedUserId;
            const isNew = !editingLawsuit?.id;
            const savedLawsuit = await saveLawsuit(editingLawsuit!, targetUserId, justificationText);

            // Process Pending Documents if it's a new lawsuit
            if (isNew && pendingLawsuitDocuments.length > 0) {
                toast.info('Fazendo upload dos documentos anexados...');
                try {
                    const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                    for (const pending of pendingLawsuitDocuments) {
                        const file = pending.file;
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                        const filePath = `lawsuits/${savedLawsuit.id}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('nexus-documents')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('nexus-documents')
                            .getPublicUrl(filePath);

                        const docData = {
                            ...pending.docData,
                            file_url: publicUrl,
                            lawsuit_id: savedLawsuit.id
                        } as LawsuitDocument;

                        await saveLawsuitDocument(docData, targetUserId);
                    }
                    toast.success(`${pendingLawsuitDocuments.length} documentos anexados com sucesso!`);
                    setPendingLawsuitDocuments([]);
                } catch (uploadErr) {
                    console.error('Error uploading pending documents:', uploadErr);
                    toast.error('Erro ao fazer upload de alguns documentos.');
                }
            }

            setIsLawsuitModalOpen(false);
            setEditingLawsuit(null);
            setLawsuitTimeline([]);
            setPendingLawsuitDocuments([]);
            setActiveLawsuitTab('basic');
            setJustificationText('');
            toast.success(t('modules.nexus.modals.lawsuit.success') || 'Processo salvo com sucesso!');
            
            // State mutation
            if (!isNew) {
                setLawsuits(prev => prev.map(l => l.id === savedLawsuit.id ? savedLawsuit : l));
                // Force NexoVisual update if it's the current center
                if (nexoData?.origin_type === 'lawsuit' && nexoData.id === savedLawsuit.id) {
                    setNexoData({ ...nexoData, data: savedLawsuit, title: savedLawsuit.case_title || savedLawsuit.cnj_number || nexoData.title });
                }
                setVisualRefreshTrigger(prev => prev + 1);
            } else {
                setLawsuits(prev => [savedLawsuit, ...prev]);
            }
        } catch (err) {
            console.error('Error saving lawsuit:', err);
            toast.error(t('modules.nexus.modals.lawsuit.error') || 'Erro ao salvar processo');
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            const savedTask = await saveTask(editingTask!, targetUserId);

            setIsTaskModalOpen(false);
            setEditingTask(null);
            setActiveTaskTab('basic');
            toast.success(t('modules.nexus.modals.task.success') || 'Tarefa salva com sucesso!');
            
            // State mutation
            if (editingTask?.id) {
                setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
            } else {
                setTasks(prev => [savedTask, ...prev]);
            }

            if (nexoData?.origin_type === 'task' && nexoData.id === savedTask.id) {
                setNexoData({ ...nexoData, data: savedTask, title: savedTask.title });
            }
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error saving task:', err);
            toast.error(t('modules.nexus.modals.task.error') || 'Erro ao salvar tarefa');
        }
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            const savedEvent = await saveEvent(editingEvent!, targetUserId);

            setIsEventModalOpen(false);
            setEditingEvent(null);
            toast.success(t('modules.nexus.modals.event.success') || 'Evento salvo com sucesso!');
            
            // State mutation
            if (editingEvent?.id) {
                setEvents(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
            } else {
                setEvents(prev => [savedEvent, ...prev]);
            }
        } catch (err) {
            console.error('Error saving event:', err);
            toast.error(t('modules.nexus.modals.event.error') || 'Erro ao salvar evento');
        }
    };

    const handleSaveAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            const isNew = !editingAsset?.id;
            const savedAsset = await saveAsset(editingAsset!, targetUserId, justificationText);

            // Process Pending Documents if it's a new asset
            if (isNew && pendingAssetDocuments.length > 0) {
                toast.info('Fazendo upload dos documentos anexados...');
                try {
                    const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                    for (const pending of pendingAssetDocuments) {
                        const file = pending.file;
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                        const filePath = `assets/${savedAsset.id}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('nexus-documents')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('nexus-documents')
                            .getPublicUrl(filePath);

                        const docData = {
                            ...pending.docData,
                            file_url: publicUrl,
                            asset_id: savedAsset.id
                        } as AssetDocument;

                        await saveAssetDocument(docData, targetUserId);
                    }
                    toast.success(`${pendingAssetDocuments.length} documentos anexados com sucesso!`);
                    setPendingAssetDocuments([]);
                } catch (uploadErr) {
                    console.error('Error uploading pending documents:', uploadErr);
                    toast.error('Erro ao fazer upload de alguns documentos.');
                }
            }

            setIsAssetModalOpen(false);
            setEditingAsset(null);
            setAssetTimeline([]);
            setPendingAssetDocuments([]);
            setActiveAssetTab('basic');
            setJustificationText('');
            toast.success('Ativo salvo com sucesso!');
            
            // State mutation
            if (!isNew) {
                setAssets(prev => prev.map(a => a.id === savedAsset.id ? savedAsset : a));
            } else {
                setAssets(prev => [savedAsset, ...prev]);
            }

            if (nexoData?.origin_type === 'asset' && nexoData.id === savedAsset.id) {
                setNexoData({ ...nexoData, data: savedAsset, title: savedAsset.title });
            }
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error saving asset:', err);
            toast.error('Erro ao salvar ativo');
        }
    };

    const handleSaveEntity = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Captura imediata
        const isNew = !editingEntity?.id;
        const personToLink = personForQSARef.current;
        const targetUserId = selectedUserId;
        
        console.log('[NEXUS-DEBUG] Executando handleSaveEntity', { isNew, hasPerson: !!personToLink });

        try {
            const savedEntity = await saveCorporateEntity(editingEntity!, targetUserId, justificationText);

            // VÃ­nculo automático de sócio se for criação via CRM
            if (isNew && personToLink) {
                try {
                    console.log('[NEXUS-DEBUG] Criando vÃ­nculo societário para:', personToLink.full_name);
                    await saveShareholder({
                        entity_id: savedEntity.id,
                        person_shareholder_id: personToLink.id,
                        ownership_percentage: 100,
                        share_type: 'Quotas',
                        shares_count: 100,
                        is_admin: true,
                        position: 'Sócio-Administrador',
                    } as any, targetUserId);
                    
                    toast.success(`${personToLink.full_name} vinculado como sócio 100%`);
                } catch (shErr: any) {
                    console.error('[NEXUS-DEBUG] Erro ao vincular sócio:', shErr);
                    toast.error(`Atenção: A empresa foi salva, mas o QSA falhou: ${shErr.message}`);
                } finally {
                    personForQSARef.current = null;
                }
            }

            // Process Pending Documents if it's a new entity
            if (isNew && pendingCorporateDocuments.length > 0) {
                toast.info('Fazendo upload dos documentos anexados...');
                try {
                    const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                    for (const pending of pendingCorporateDocuments) {
                        const file = pending.file;
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                        const filePath = `corporate/${savedEntity.id}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('nexus-documents')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('nexus-documents')
                            .getPublicUrl(filePath);

                        const docData = {
                            ...pending.docData,
                            file_url: publicUrl,
                            entity_id: savedEntity.id
                        } as CorporateDocument;

                        await saveCorporateDocument(docData, targetUserId);
                    }
                    toast.success(`${pendingCorporateDocuments.length} documentos anexados com sucesso!`);
                    setPendingCorporateDocuments([]);
                } catch (uploadErr) {
                    console.error('Error uploading pending documents:', uploadErr);
                    toast.error('Erro ao fazer upload de alguns documentos.');
                }
            }

            setIsEntityModalOpen(false);
            setEditingEntity(null);
            setPendingCorporateDocuments([]);
            setActiveEntityTab('basic');
            setJustificationText('');
            toast.success('Entidade salva com sucesso!');
            
            // State mutation
            if (!isNew) {
                setCorporateEntities(prev => prev.map(c => c.id === savedEntity.id ? savedEntity : c));
            } else {
                setCorporateEntities(prev => [savedEntity, ...prev]);
            }

            if (nexoData?.origin_type === 'corporate' && nexoData.id === savedEntity.id) {
                setNexoData({ ...nexoData, data: savedEntity, title: savedEntity.legal_name });
            }
            setVisualRefreshTrigger(prev => prev + 1);
            
            // Refresh geral para garantir que o QSA apareça na próxima abertura
            if (isNew && personToLink) {
                fetchAll();
            }
        } catch (err: any) {
            console.error('[NEXUS-DEBUG] Erro geral ao salvar entidade:', err);
            toast.error(`Erro ao salvar entidade: ${err.message}`);
        }
    };

    const handleSaveShareholder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            if (!editingEntity?.id) return;
            
            const shareholderData = {
                ...editingShareholder,
                entity_id: editingEntity.id
            } as Shareholder;

            const savedShareholder = await saveShareholder(shareholderData, targetUserId);

            setIsShareholderModalOpen(false);
            setEditingShareholder(null);
            toast.success('Sócio salvo com sucesso!');
            
            if (editingShareholder?.id) {
                setShareholders(prev => prev.map(s => s.id === savedShareholder.id ? savedShareholder : s));
            } else {
                setShareholders(prev => [savedShareholder, ...prev]);
            }
        } catch (err) {
            console.error('Error saving shareholder:', err);
            toast.error('Erro ao salvar sócio');
        }
    };

    const handleDeleteShareholder = (id: string) => {
        triggerConfirm(
            'Excluir Sócio',
            'Tem certeza que deseja excluir este sócio? Esta ação removerá o vÃ­nculo com a entidade.',
            async () => {
                try {
                    await deleteShareholder(id, selectedUserId);
                    setShareholders(prev => prev.filter(s => s.id !== id));
                    toast.success('Sócio removido');
                } catch (err) {
                    console.error('Error deleting shareholder:', err);
                    toast.error('Erro ao remover sócio');
                }
            }
        );
    };

    const handleSaveDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            
            // IF NEW ENTITY (No ID yet)
            if (!editingEntity?.id) {
                if (!corporateDocFile) {
                    toast.error('Por favor, selecione um arquivo primeiro.');
                    return;
                }
                
                // Add to pending list
                const newPendingDoc = {
                    file: corporateDocFile,
                    docData: { ...editingDocument, title: editingDocument?.title || corporateDocFile.name }
                };
                
                setPendingCorporateDocuments(prev => [...prev, newPendingDoc as any]);
                setIsDocumentModalOpen(false);
                setEditingDocument(null);
                setCorporateDocFile(null);
                toast.success('Documento adicionado Ã  fila. Ele será salvo após você clicar em "Criar Entidade".');
                return;
            }

            // EXISTING ENTITY logic (Trigger manual upload first)
            let fileUrl = editingDocument?.file_url;
            const oldFileUrl = editingDocument?.file_url;
            
            if (corporateDocUploadRef.current) {
                const uploadedUrl = await corporateDocUploadRef.current.upload();
                if (uploadedUrl) {
                    fileUrl = uploadedUrl;
                    // Delete old file if replaced
                    if (oldFileUrl && oldFileUrl !== uploadedUrl) {
                        const oldPath = extractStoragePath(oldFileUrl, 'nexus-documents');
                        if (oldPath) {
                            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                            await supabase.storage.from('nexus-documents').remove([oldPath]);
                        }
                    }
                }
            }

            if (!fileUrl) {
                toast.error('Por favor, selecione um arquivo primeiro.');
                return;
            }

            const docData = {
                ...editingDocument,
                file_url: fileUrl,
                entity_id: editingEntity?.id || editingDocument?.entity_id
            } as CorporateDocument;

            const savedDoc = await saveCorporateDocument(docData, targetUserId);

            setIsDocumentModalOpen(false);
            setEditingDocument(null);
            setCorporateDocFile(null);
            toast.success('Documento salvo com sucesso!');
            
            if (editingDocument?.id) {
                setCorporateDocuments(prev => prev.map(d => d.id === savedDoc.id ? savedDoc : d));
            } else {
                setCorporateDocuments(prev => [savedDoc, ...prev]);
            }

            if (nexoData?.origin_type === 'corporate_document' && nexoData.id === savedDoc.id) {
                setNexoData({ ...nexoData, data: savedDoc, title: savedDoc.title });
            }
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error saving document:', err);
            toast.error('Erro ao salvar documento');
        }
    };

    const handleSaveLawsuitDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            
            // IF NEW LAWSUIT (No ID yet)
            if (!editingLawsuit?.id) {
                if (!lawsuitDocFile) {
                    toast.error('Por favor, selecione um arquivo primeiro.');
                    return;
                }
                
                // Add to pending list
                const newPendingDoc = {
                    file: lawsuitDocFile,
                    docData: { ...editingLawsuitDoc }
                };
                
                setPendingLawsuitDocuments(prev => [...prev, newPendingDoc]);
                setIsLawsuitDocModalOpen(false);
                setEditingLawsuitDoc(null);
                setLawsuitDocFile(null);
                toast.success('Documento adicionado Ã  fila. Ele será salvo após você clicar em "Criar Processo".');
                return;
            }

            // EXISTING LAWSUIT logic (Trigger manual upload first)
            let fileUrl = editingLawsuitDoc?.file_url;
            const oldFileUrl = editingLawsuitDoc?.file_url;

            if (lawsuitDocUploadRef.current) {
                const uploadedUrl = await lawsuitDocUploadRef.current.upload();
                if (uploadedUrl) {
                    fileUrl = uploadedUrl;
                    // Delete old file if replaced
                    if (oldFileUrl && oldFileUrl !== uploadedUrl) {
                        const oldPath = extractStoragePath(oldFileUrl, 'nexus-documents');
                        if (oldPath) {
                            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                            await supabase.storage.from('nexus-documents').remove([oldPath]);
                        }
                    }
                }
            }

            if (!fileUrl) {
                toast.error('Por favor, selecione um arquivo primeiro.');
                return;
            }

            const docData = {
                ...editingLawsuitDoc,
                file_url: fileUrl,
                lawsuit_id: editingLawsuit?.id || editingLawsuitDoc?.lawsuit_id
            } as LawsuitDocument;

            const savedDoc = await saveLawsuitDocument(docData, targetUserId);

            setIsLawsuitDocModalOpen(false);
            setEditingLawsuitDoc(null);
            setLawsuitDocFile(null);
            toast.success(t('modules.nexus.lawsuit.success'));

            if (editingLawsuitDoc?.id) {
                setLawsuitDocuments(prev => prev.map(d => d.id === savedDoc.id ? savedDoc : d));
            } else {
                setLawsuitDocuments(prev => [savedDoc, ...prev]);
            }

            if (nexoData?.origin_type === 'lawsuit_document' && nexoData.id === savedDoc.id) {
                setNexoData({ ...nexoData, data: savedDoc, title: savedDoc.title });
            }
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error saving lawsuit document:', err);
            toast.error(t('common.error'));
        }
    };

    const handleEditEntity = async (entity: CorporateEntity, initialTab: 'basic' | 'qsa' | 'docs' = 'basic') => {
        setEditingEntity(entity);
        setIsEntityModalOpen(true);
        setActiveEntityTab(initialTab);
        
        // Fetch related data
        try {
            const [sh, docs] = await Promise.all([
                listShareholders(entity.id, selectedUserId),
                listCorporateDocuments(entity.id, selectedUserId)
            ]);
            if (sh.data) setShareholders(sh.data);
            if (docs.data) setCorporateDocuments(docs.data);
        } catch (err) {
            console.error('Error fetching entity details:', err);
        }
    };

    const handleDeleteDocument = async (id: string) => {
        const doc = corporateDocuments.find(d => d.id === id);
        if (!doc) return;

        triggerConfirm(
            t('common.deleteConfirm.title', { item: t('common.types.asset.corporate') }),
            t('common.deleteConfirm.message', { item: t('common.types.asset.corporate') }),
            async () => {
                try {
                    // Try to delete from storage if URL exists
                    if (doc.file_url) {
                        const path = extractStoragePath(doc.file_url, 'nexus-documents');
                        if (path) {
                            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                            await supabase.storage.from('nexus-documents').remove([path]);
                        }
                    }

                    await deleteCorporateDocument(id, selectedUserId);
                    setCorporateDocuments(prev => prev.filter(d => d.id !== id));
                    toast.success(t('common.deleteConfirm.success', { item: t('common.context') }));
                } catch (err) {
                    console.error('Error deleting document:', err);
                    toast.error(t('common.deleteConfirm.error', { item: t('common.context') }));
                }
            }
        );
    };

    const handleDeleteLawsuitDocument = async (id: string) => {
        const doc = lawsuitDocuments.find(d => d.id === id);
        if (!doc) return;

        triggerConfirm(
            t('common.deleteConfirm.title', { item: t('common.context') }),
            t('common.deleteConfirm.message', { item: t('common.context') }),
            async () => {
                try {
                    // Try to delete from storage if URL exists
                    if (doc.file_url) {
                        const path = extractStoragePath(doc.file_url, 'nexus-documents');
                        if (path) {
                            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                            await supabase.storage.from('nexus-documents').remove([path]);
                        }
                    }

                    await deleteLawsuitDocument(id, selectedUserId);
                    setLawsuitDocuments(prev => prev.filter(d => d.id !== id));
                    toast.success('Documento do processo removido');
                } catch (err) {
                    console.error('Error deleting lawsuit document:', err);
                    toast.error(t('common.deleteConfirm.error', { item: t('common.context') }));
                }
            }
        );
    };

    const handleSaveAssetDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAssetDoc) return;

        try {
            const targetUserId = selectedUserId;

            // IF NEW ASSET (No ID yet)
            if (!editingAsset?.id) {
                if (!assetDocFile) {
                    toast.error('Por favor, selecione um arquivo primeiro.');
                    return;
                }
                
                // Add to pending list
                const newPendingDoc = {
                    file: assetDocFile,
                    docData: { ...editingAssetDoc, title: editingAssetDoc?.title || assetDocFile.name }
                };
                
                setPendingAssetDocuments(prev => [...prev, newPendingDoc as any]);
                setIsAssetDocModalOpen(false);
                setEditingAssetDoc(null);
                setAssetDocFile(null);
                toast.success('Documento adicionado Ã  fila. Ele será salvo após você clicar em "Criar Ativo".');
                return;
            }

            // EXISTING ASSET logic (Trigger manual upload first)
            let fileUrl = editingAssetDoc?.file_url;
            const oldFileUrl = editingAssetDoc?.file_url;

            if (assetDocUploadRef.current) {
                const uploadedUrl = await assetDocUploadRef.current.upload();
                if (uploadedUrl) {
                    fileUrl = uploadedUrl;
                    // Delete old file if replaced
                    if (oldFileUrl && oldFileUrl !== uploadedUrl) {
                        const oldPath = extractStoragePath(oldFileUrl, 'nexus-documents');
                        if (oldPath) {
                            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                            await supabase.storage.from('nexus-documents').remove([oldPath]);
                        }
                    }
                }
            }

            if (!fileUrl) {
                toast.error('Por favor, selecione um arquivo primeiro.');
                return;
            }

            const docData = {
                ...editingAssetDoc,
                file_url: fileUrl,
                asset_id: editingAsset?.id || editingAssetDoc?.asset_id
            } as AssetDocument;

            const savedDoc = await saveAssetDocument(docData, targetUserId);

            setIsAssetDocModalOpen(false);
            setEditingAssetDoc(null);
            setAssetDocFile(null);
            toast.success('Documento do ativo salvo com sucesso!');

            if (editingAssetDoc?.id) {
                setAssetDocuments(prev => prev.map(d => d.id === savedDoc.id ? savedDoc : d));
            } else {
                setAssetDocuments(prev => [savedDoc, ...prev]);
            }

            if (nexoData?.origin_type === 'asset_document' && nexoData.id === savedDoc.id) {
                setNexoData({ ...nexoData, data: savedDoc, title: savedDoc.title });
            }
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error saving asset document:', err);
            toast.error('Erro ao salvar documento do ativo');
        }
    };

    const handleDeleteAssetDocument = async (id: string) => {
        const doc = assetDocuments.find(d => d.id === id);
        if (!doc) return;

        triggerConfirm(
            'Excluir Documento do Ativo',
            'Deseja excluir este documento permanentemente?',
            async () => {
                try {
                    if (doc.file_url) {
                        const path = extractStoragePath(doc.file_url, 'nexus-documents');
                        if (path) {
                            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                            await supabase.storage.from('nexus-documents').remove([path]);
                        }
                    }

                    await deleteAssetDocument(id, selectedUserId);
                    setAssetDocuments(prev => prev.filter(d => d.id !== id));
                    toast.success(t('common.deleteConfirm.success', { item: t('common.context') }));
                } catch (err) {
                    console.error('Error deleting asset document:', err);
                    toast.error(t('common.deleteConfirm.error', { item: t('common.context') }));
                }
            }
        );
    };

    const handleSoftDeleteEntity = (id: string) => {
        triggerConfirm(
            t('common.deleteConfirm.title', { item: t('common.types.asset.corporate') }),
            t('common.deleteConfirm.message', { item: t('common.types.asset.corporate') }),
            async () => {
                try {
                    const targetUserId = selectedUserId;
                    await deleteCorporateEntity(id, targetUserId);
                    toast.success(t('common.deleteConfirm.success', { item: t('common.types.asset.corporate') }));
                    setCorporateEntities(prev => prev.filter(c => c.id !== id));
                } catch (err) {
                    console.error('Error deleting entity:', err);
                    toast.error(t('common.deleteConfirm.error', { item: t('common.types.asset.corporate') }));
                }
            }
        );
    };

    const handleDragStartTask = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0); // Hide default ghost image to keep it clean
    };

    const handleDropTask = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate || taskToUpdate.status === newStatus) return;

        // Optimistic update
        const previousTasks = [...tasks];
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

        try {
            const updatedTask = { ...taskToUpdate, status: newStatus as any };
            await saveTask(updatedTask, selectedUserId);
            // Background sync is recommended later, but optimistic UI holds it
        } catch (err) {
            console.error('Error dragging task:', err);
            toast.error(t('common.error'));
            setTasks(previousTasks); // Rollback
        }
    };

    const handleDragStartLawsuit = (e: React.DragEvent, lawsuitId: string) => {
        e.dataTransfer.setData('lawsuitId', lawsuitId);
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDropLawsuit = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const lawsuitId = e.dataTransfer.getData('lawsuitId');
        if (!lawsuitId) return;
        handleQuickStatusUpdate(lawsuitId, 'lawsuit', newStatus);
    };

    const handleDragStartAsset = (e: React.DragEvent, assetId: string) => {
        e.dataTransfer.setData('assetId', assetId);
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDropAsset = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const assetId = e.dataTransfer.getData('assetId');
        if (!assetId) return;
        handleQuickStatusUpdate(assetId, 'asset', newStatus);
    };

    const handleDragStartEntity = (e: React.DragEvent, entityId: string) => {
        e.dataTransfer.setData('entityId', entityId);
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDropEntity = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const entityId = e.dataTransfer.getData('entityId');
        if (!entityId) return;
        handleQuickStatusUpdate(entityId, 'corporate', newStatus);
    };

    const handleSoftDeleteLawsuit = (id: string) => {
        triggerConfirm(
            t('modules.nexus.kanban.deleteConfirmTitle') || 'Excluir Processo',
            t('modules.nexus.kanban.deleteConfirm') || 'Tem certeza que deseja excluir este processo?',
            async () => {
                try {
                    const targetUserId = selectedUserId;
                    await deleteLawsuit(id, targetUserId);
                    toast.success(t('modules.nexus.kanban.deleteSuccess') || 'Processo excluÃ­do corretamente');
                    setLawsuits(prev => prev.filter(l => l.id !== id));
                } catch (err) {
                    console.error('Error deleting lawsuit:', err);
                    toast.error(t('modules.nexus.kanban.deleteError') || 'Erro ao excluir processo');
                }
            }
        );
    };

    const handleSoftDeleteAsset = (id: string) => {
        triggerConfirm(
            t('common.deleteConfirm.title', { item: t('common.types.asset.realEstate') }),
            t('common.deleteConfirm.message', { item: t('common.types.asset.realEstate') }),
            async () => {
                try {
                    const targetUserId = selectedUserId;
                    await deleteAsset(id, targetUserId);
                    toast.success(t('common.deleteConfirm.success', { item: t('common.types.asset.realEstate') }));
                    setAssets(prev => prev.filter(a => a.id !== id));
                } catch (err) {
                    console.error('Error deleting asset:', err);
                    toast.error(t('common.deleteConfirm.error', { item: t('common.types.asset.realEstate') }));
                }
            }
        );
    };

    const handleSoftDeleteEvent = (id: string) => {
        triggerConfirm(
            t('common.deleteConfirm.title', { item: t('common.event') }),
            t('common.deleteConfirm.message', { item: t('common.event') }),
            async () => {
                try {
                    const targetUserId = selectedUserId;
                    await deleteEvent(id, targetUserId);
                    toast.success(t('common.deleteConfirm.success', { item: t('common.event') }));
                    setEvents(prev => prev.filter(e => e.id !== id));
                } catch (err) {
                    console.error('Error deleting event:', err);
                    toast.error(t('common.deleteConfirm.error', { item: t('common.event') }));
                }
            }
        );
    };

    const columns = ['A Fazer', 'Em Andamento', 'Concluído', 'Atrasado'];

    const getColumnTranslation = (col: string) => {
        switch (col) {
            case 'A Fazer': return t('modules.nexus.kanban.todo');
            case 'Em Andamento': return t('modules.nexus.kanban.doing');
            case 'Concluído': return t('modules.nexus.kanban.done');
            case 'Atrasado': return t('modules.nexus.kanban.late');
            default: return col;
        }
    };

    const getPriorityTranslation = (priority: string) => {
        switch (priority) {
            case 'Baixa':
            case 'Low': return t('modules.nexus.modals.task.priorities.Low');
            case 'Média':
            case 'Medium': return t('modules.nexus.modals.task.priorities.Medium');
            case 'Alta':
            case 'High': return t('modules.nexus.modals.task.priorities.High');
            case 'Urgente':
            case 'Urgent': return t('modules.nexus.modals.task.priorities.Urgent');
            default: return priority;
        }
    };

    const getSeverityColor = (dueDate: string, status: string) => {
        if (status === 'Concluído') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
        const now = new Date();
        const due = new Date(dueDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Late
        if (diffHours < 24) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Urgent
        if (diffHours < 48) return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100'; // Attention
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200'; // Normal
    };

    const getTaskUrgencyInfo = (dueDate: string, status: string) => {
        if (status === 'Concluído') return { label: 'Concluído', color: 'emerald', days: 0, isToday: false };
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Atrasado', color: 'rose', days: Math.abs(diffDays), isToday: false };
        if (diffDays === 0) return { label: 'Vence Hoje', color: 'rose', days: 0, isToday: true };
        if (diffDays === 1) return { label: 'Vence Amanhã', color: 'amber', days: 1, isToday: false };
        return { label: `Em ${diffDays} dias`, color: 'slate', days: diffDays, isToday: false };
    };

    const formatCNJ = (value: string) => {
        const val = value.replace(/\D/g, '');
        return val
            .replace(/(\d{7})(\d)/, '$1-$2')
            .replace(/(\d{7}-\d{2})(\d)/, '$1.$2')
            .replace(/(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')
            .replace(/(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
            .replace(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2')
            .substring(0, 25);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    // Cascading Constants (100% Brazilian Judicial Geography)
    const ESFERAS = [
        'Trabalhista',
        'Cível',
        'Federal',
        'Previdenciária',
        'Tributária',
        'Criminal',
        'Família & Sucessões',
        'Eleitoral',
        'Militar'
    ];

    const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

    const RITOS = {
        'Trabalhista': ['Ordinário', 'Sumaríssimo', 'Sumário (Alçada)', 'Execução Trabalhista'],
        'Cível': ['Procedimento Comum', 'Sumaríssimo (Juizado Especial)', 'Execução de Título Extrajudicial', 'Monitória', 'Inventário/Arrolamento'],
        'Federal': ['Procedimento Comum', 'Sumaríssimo (JEF)', 'Execução Fiscal'],
        'Previdenciária': ['Procedimento Comum', 'Sumaríssimo (JEF)', 'Acidentário'],
        'Tributária': ['Execução Fiscal', 'Anulatória', 'Mandado de Segurança', 'Repetição de Indébito'],
        'Criminal': ['Ordinário', 'Sumário', 'Sumaríssimo', 'Tribunal do Júri', 'Execução Penal'],
        'default': ['Procedimento Comum', 'Especial', 'Mandado de Segurança']
    };

    const TAX_REGIMES: TaxRegime[] = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Isenta'];
    // ENTITY_STATUSES is already defined at line 398
    const ENTITY_TYPES: EntityType[] = ['LTDA', 'SA', 'EIRELI', 'MEI', 'Holding', t('common.types.entity.association'), t('common.types.entity.others')] as EntityType[];

    const TRIBUNAIS: Record<string, Record<string, string[]>> = {
        'Trabalhista': {
            'AC': ['TRT-14 (RO/AC)'], 'AL': ['TRT-19'], 'AP': ['TRT-8 (PA/AP)'], 'AM': ['TRT-11 (AM/RR)'],
            'BA': ['TRT-5'], 'CE': ['TRT-7'], 'DF': ['TRT-10 (DF/TO)'], 'ES': ['TRT-17'], 'GO': ['TRT-18'],
            'MA': ['TRT-16'], 'MT': ['TRT-23'], 'MS': ['TRT-24'], 'MG': ['TRT-3'], 'PA': ['TRT-8 (PA/AP)'],
            'PB': ['TRT-13'], 'PR': ['TRT-9'], 'PE': ['TRT-6'], 'PI': ['TRT-22'], 'RJ': ['TRT-1'],
            'RN': ['TRT-21'], 'RS': ['TRT-4'], 'RO': ['TRT-14 (RO/AC)'], 'RR': ['TRT-11 (AM/RR)'],
            'SC': ['TRT-12'], 'SP': ['TRT-2 (SP/GSP/Baixada)', 'TRT-15 (Interior/Litoral/Campinas)'],
            'SE': ['TRT-20'], 'TO': ['TRT-10 (DF/TO)'],
            'Superior': ['TST - Tribunal Superior do Trabalho', 'STF']
        },
        'Federal': {
            'AC': ['TRF-1'], 'AL': ['TRF-5'], 'AP': ['TRF-1'], 'AM': ['TRF-1'], 'BA': ['TRF-1'],
            'CE': ['TRF-5'], 'DF': ['TRF-1'], 'ES': ['TRF-2'], 'GO': ['TRF-1'], 'MA': ['TRF-1'],
            'MT': ['TRF-1'], 'MS': ['TRF-3'], 'MG': ['TRF-6'], 'PA': ['TRF-1'], 'PB': ['TRF-5'],
            'PR': ['TRF-4'], 'PE': ['TRF-5'], 'PI': ['TRF-1'], 'RJ': ['TRF-2'], 'RN': ['TRF-5'],
            'RS': ['TRF-4'], 'RO': ['TRF-1'], 'RR': ['TRF-1'], 'SC': ['TRF-4'], 'SP': ['TRF-3'],
            'SE': ['TRF-5'], 'TO': ['TRF-1'],
            'Superior': ['STJ - Superior Tribunal de Justiça', 'STF']
        },
        'Cível': {
            'AC': ['TJAC'], 'AL': ['TJAL'], 'AP': ['TJAP'], 'AM': ['TJAM'], 'BA': ['TJBA'],
            'CE': ['TJCE'], 'DF': ['TJDFT'], 'ES': ['TJES'], 'GO': ['TJGO'], 'MA': ['TJMA'],
            'MT': ['TJMT'], 'MS': ['TJMS'], 'MG': ['TJMG'], 'PA': ['TJPA'], 'PB': ['TJPB'],
            'PR': ['TJPR'], 'PE': ['TJPE'], 'PI': ['TJPI'], 'RJ': ['TJRJ'], 'RN': ['TJRN'],
            'RS': ['TJRS'], 'RO': ['TJRO'], 'RR': ['TJRR'], 'SC': ['TJSC'], 'SP': ['TJSP'],
            'SE': ['TJSE'], 'TO': ['TJTO'],
            'Superior': ['STJ', 'STF']
        }
    };

    // Extension: Previdenciária and Tributária often share Cível/Federal courts
    TRIBUNAIS['Previdenciária'] = TRIBUNAIS['Federal'];
    TRIBUNAIS['Tributária'] = TRIBUNAIS['Federal'];
    TRIBUNAIS['Criminal'] = TRIBUNAIS['Cível'];
    TRIBUNAIS['Família & Sucessões'] = TRIBUNAIS['Cível'];
    TRIBUNAIS['Eleitoral'] = Object.fromEntries(UFS.map(uf => [uf, [`TRE-${uf}`]]));
    TRIBUNAIS['Militar'] = { 'default': ['STM - Superior Tribunal Militar', 'TJM (Estadual)'] };

    const filteredTasks = tasks.filter(t => {
        const matchSearch = filterSearchTerm ? t.title.toLowerCase().includes(filterSearchTerm.toLowerCase()) : true;
        const matchResponsible = filterResponsibleId ? t.responsible_id === filterResponsibleId : true;
        const matchLawsuit = filterLawsuitId ? t.lawsuit_id === filterLawsuitId : true;
        return matchSearch && matchResponsible && matchLawsuit;
    });

    const filteredEvents = events.filter(e => {
        const matchSearch = filterSearchTerm ? e.title.toLowerCase().includes(filterSearchTerm.toLowerCase()) || e.event_type?.toLowerCase().includes(filterSearchTerm.toLowerCase()) : true;
        const matchResponsible = filterResponsibleId ? e.responsible_id === filterResponsibleId : true;
        const matchLawsuit = filterLawsuitId ? e.lawsuit_id === filterLawsuitId : true;
        return matchSearch && matchResponsible && matchLawsuit;
    });

    const filteredLawsuits = lawsuits.filter(l => {
        const matchSearch = lawsuitSearch ? (l.cnj_number?.toLowerCase().includes(lawsuitSearch.toLowerCase()) || l.case_title?.toLowerCase().includes(lawsuitSearch.toLowerCase())) : true;
        const matchStatus = lawsuitStatusFilter ? l.status === lawsuitStatusFilter : true;
        const matchLawyer = lawsuitLawyerFilter ? l.responsible_lawyer_id === lawsuitLawyerFilter : true;
        return matchSearch && matchStatus && matchLawyer;
    });

    const filteredAssets = assets.filter(a => {
        const matchSearch = assetSearch ? (a.title.toLowerCase().includes(assetSearch.toLowerCase()) || a.description?.toLowerCase().includes(assetSearch.toLowerCase())) : true;
        const matchStatus = assetStatusFilter ? a.status === assetStatusFilter : true;
        const matchType = assetTypeFilter ? a.asset_type === assetTypeFilter : true;
        return matchSearch && matchStatus && matchType;
    });

    const filteredGlobalDocuments = globalDocuments.filter(d => {
        const matchSearch = docSearch ? (
            d.title.toLowerCase().includes(docSearch.toLowerCase()) || 
            d.document_type.toLowerCase().includes(docSearch.toLowerCase()) ||
            d.origin_name?.toLowerCase().includes(docSearch.toLowerCase())
        ) : true;
        const matchType = docTypeFilter ? d.document_type === docTypeFilter : true;
        const matchOrigin = docOriginFilter ? d.origin_type === docOriginFilter : true;
        return matchSearch && matchType && matchOrigin;
    });

    const uniqueDocTypes = Array.from(new Set(globalDocuments.map(d => d.document_type))).sort();

    const renderOriginBadge = (origin: 'lawsuit' | 'asset' | 'corporate', name: string) => {
        const icons = {
            lawsuit: <Scale size={12} className="text-white" />,
            asset: <Shield size={12} className="text-white" />,
            corporate: <Building2 size={12} className="text-white" />
        };
        const colors = {
            lawsuit: 'bg-indigo-500',
            asset: 'bg-emerald-500',
            corporate: 'bg-amber-500'
        };
        const labels = {
            lawsuit: t('modules.nexus.tabs.processes'),
            asset: t('modules.nexus.tabs.assets'),
            corporate: t('modules.nexus.tabs.corporate')
        };

        return (
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${colors[origin]}`}>
                    {icons[origin]}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-black uppercase text-slate-400 leading-none mb-0.5">{labels[origin]}</span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{name}</span>
                </div>
            </div>
        );
    };

    const renderFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('common.placeholders.search')}
                        value={filterSearchTerm}
                        onChange={e => setFilterSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
            <div className="w-48">
                <select
                    value={filterResponsibleId}
                    onChange={e => setFilterResponsibleId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">👤 {t('common.filters.allMembers')}</option>
                    {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={filterLawsuitId}
                    onChange={e => setFilterLawsuitId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">⚖️ {t('common.filters.allProcesses')}</option>
                    {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number || law.case_title}</option>)}
                </select>
            </div>
            {(filterSearchTerm || filterResponsibleId || filterLawsuitId) && (
                <button
                    onClick={() => { setFilterSearchTerm(''); setFilterResponsibleId(''); setFilterLawsuitId(''); }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title={t('common.clearFilters')}
                >
                    <Filter size={16} className="relative z-10" />
                    <XCircle size={14} className="relative z-10 -ml-1" />
                </button>
            )}
        </div>
    );

    const renderLawsuitFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('modules.nexus.processes.searchPlaceholder')}
                        value={lawsuitSearch}
                        onChange={e => setLawsuitSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
            <div className="w-48">
                <select
                    value={lawsuitStatusFilter}
                    onChange={e => setLawsuitStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">⚖️ {t('common.filters.allStatuses')}</option>
                    {Object.entries(t('common.statuses.lawsuit', { returnObjects: true }) as Record<string, string>).map(([key, val]) => <option key={key} value={val}>{val}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={lawsuitLawyerFilter}
                    onChange={e => setLawsuitLawyerFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">👤 {t('common.filters.allLawyers')}</option>
                    {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
            </div>
            {(lawsuitSearch || lawsuitStatusFilter || lawsuitLawyerFilter) && (
                <button
                    onClick={() => { setLawsuitSearch(''); setLawsuitStatusFilter(''); setLawsuitLawyerFilter(''); }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title={t('common.clearFilters')}
                >
                    <Filter size={16} />
                    <XCircle size={14} className="-ml-1" />
                </button>
            )}
        </div>
    );

    const renderAssetFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('modules.nexus.assets.searchPlaceholder')}
                        value={assetSearch}
                        onChange={e => setAssetSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
            <div className="w-48">
                <select
                    value={assetStatusFilter}
                    onChange={e => setAssetStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">🏢 {t('common.filters.allStatuses')}</option>
                    {Object.entries(t('common.statuses.asset', { returnObjects: true }) as Record<string, string>).map(([key, val]) => <option key={key} value={val}>{val}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={assetTypeFilter}
                    onChange={e => setAssetTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">📦 {t('common.filters.allTypes')}</option>
                    {Object.entries(t('common.types.asset', { returnObjects: true }) as Record<string, string>).map(([key, val]) => <option key={key} value={val}>{val}</option>)}
                </select>
            </div>
            {(assetSearch || assetStatusFilter || assetTypeFilter) && (
                <button
                    onClick={() => { setAssetSearch(''); setAssetStatusFilter(''); setAssetTypeFilter(''); }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title={t('common.clearFilters')}
                >
                    <Filter size={16} />
                    <XCircle size={14} className="-ml-1" />
                </button>
            )}
        </div>
    );

    const renderGlobalDocumentsFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('modules.nexus.documents.searchPlaceholder')}
                        value={docSearch}
                        onChange={e => setDocSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
            <div className="w-48">
                <select
                    value={docOriginFilter}
                    onChange={e => setDocOriginFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">📌 {t('modules.nexus.documents.allOrigins')}</option>
                    <option value="lawsuit">⚖️ {t('modules.nexus.tabs.processes')}</option>
                    <option value="asset">🛡️ {t('modules.nexus.tabs.assets')}</option>
                    <option value="corporate">🏢 {t('modules.nexus.tabs.corporate')}</option>
                </select>
            </div>
            <div className="w-56">
                <select
                    value={docTypeFilter}
                    onChange={e => setDocTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">📄 {t('common.filters.allTypes')}</option>
                    {uniqueDocTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            {(docSearch || docOriginFilter || docTypeFilter) && (
                <button
                    onClick={() => { setDocSearch(''); setDocOriginFilter(''); setDocTypeFilter(''); }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title={t('common.clearFilters')}
                >
                    <Filter size={16} />
                    <XCircle size={14} className="-ml-1" />
                </button>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">{t('modules.nexus.title')}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('modules.nexus.subtitle')}</p>
                        </div>
                    </div>

                    {/* Tabs Container - Nexus Premium Style */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-fit border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                        {[
                            { id: 'overview', icon: <LayoutDashboard size={14} />, label: `0. ${t('modules.nexus.tabs.overview')}` },
                            { id: 'pessoas', icon: <Users size={14} />, label: `1. ${t('modules.nexus.tabs.people')}` },
                            { id: 'processos', icon: <Scale size={14} />, label: `2. ${t('modules.nexus.tabs.processes')}` },
                            { id: 'tarefas', icon: <Zap size={14} />, label: `3. ${t('modules.nexus.tabs.tasks')}` },
                            { id: 'agenda', icon: <Calendar size={14} />, label: `4. ${t('modules.nexus.tabs.calendar')}` },
                            { id: 'ativos', icon: <Shield size={14} />, label: `5. ${t('modules.nexus.tabs.assets')}` },
                            { id: 'societario', icon: <LockIcon size={14} />, label: `6. ${t('modules.nexus.tabs.corporate')}` },
                            { id: 'documentos', icon: <FileText size={14} />, label: `7. Documentos` }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Master Context Selector */}
                    {isMaster && (
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden shrink-0">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{t('management.users.roleLabel')} Master</span>
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none whitespace-nowrap">{t('management.users.masterFilter.selectClient') || 'Selecione o Cliente'}</span>
                            </div>
                            <div className="relative">
                                <select
                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-xs font-black tracking-widest text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer min-w-[260px] appearance-none pr-10"
                                    value={selectedUserId}
                                    onChange={e => {
                                        const newId = e.target.value;
                                        setSelectedUserId(newId);
                                        if (isMaster) onSelectClient(newId);
                                    }}
                                >
                                    <option value="">--- {t('management.users.masterFilter.selectClient') || 'Selecione um Cliente'} ---</option>
                                    <optgroup label={t('management.users.masterFilter.clients')?.toUpperCase() || 'CLIENTES (SÓCIOS ADM)'}>
                                        {allClients.filter(u => u.id !== user.id).map(c => {
                                            const rawName = typeof c.name === 'object' ? ((c.name as any).pt || (c.name as any).en || '') : (c.name || '');
                                            const formattedName = rawName.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                            const formattedEmail = (c.email || '').toLowerCase();
                                            return (
                                                <option key={c.id} value={c.id}>
                                                    ðŸ¢ {formattedName} ({formattedEmail})
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 💎 MAIN CONTENT AREA - Nexus 2.0 Router */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col h-full space-y-8 p-8">
                            {/* Header Overview */}
                            <div className="flex flex-col md:flex-row pb-6 border-b-4 border-slate-100 dark:border-slate-800">
                                <div className="flex-1">
                                    <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {t('modules.nexus.tabs.overview')}
                                    </h1>
                                    <p className="text-slate-500 font-bold tracking-wide mt-1 italic">
                                        {t('modules.nexus.overview.subtitle')}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-indigo-600 animate-pulse'}`} />
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">
                                            {t('modules.nexus.overview.status.label')}: {loading ? t('modules.nexus.overview.status.syncing') : t('modules.nexus.overview.status.synced')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cockpit Visual - KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { 
                                        label: t('modules.nexus.metrics.active'), 
                                        val: lawsuits.filter(l => l.status === 'Ativo').length, 
                                        color: 'text-indigo-600', 
                                        bg: 'bg-indigo-50 dark:bg-indigo-900/30',
                                        icon: Scale, 
                                        trend: '+12%' 
                                    },
                                    { 
                                        label: t('modules.nexus.metrics.deadlines'), 
                                        val: tasks.filter(t => t.status !== 'Concluído' && (new Date(t.due_date).getTime() - new Date().getTime()) < 86400000).length, 
                                        color: 'text-rose-600', 
                                        bg: 'bg-rose-50 dark:bg-rose-900/30',
                                        icon: Clock, 
                                        trend: t('modules.nexus.overview.metricsTrends.urgent')
                                    },
                                    { 
                                        label: t('modules.nexus.metrics.pending'), 
                                        val: tasks.filter(t => t.status !== 'Concluído').length, 
                                        color: 'text-amber-600', 
                                        bg: 'bg-amber-50 dark:bg-amber-900/30',
                                        icon: CheckCircle2, 
                                        trend: t('modules.nexus.overview.metricsTrends.queue')
                                    },
                                    { 
                                        label: t('modules.nexus.metrics.completion'), 
                                        val: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Concluído').length / tasks.length) * 100) : 0}%`, 
                                        color: 'text-emerald-600', 
                                        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                                        icon: TrendingUp, 
                                        trend: t('modules.nexus.overview.metricsTrends.productivity')
                                    }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                                        
                                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <stat.icon size={28} />
                                        </div>
                                        
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className={`text-4xl font-black tracking-tighter mb-2 ${stat.color}`}>
                                                    {loading ? (
                                                        <motion.div 
                                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                            className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl"
                                                        />
                                                    ) : stat.val}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {stat.label}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl border ${
                                                    stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    stat.trend === 'Urgente' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                    {stat.trend}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Financial Filter Bar */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 dark:bg-slate-900/50 p-6 px-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                                        <Filter size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('modules.nexus.finance.filtersTitle') || 'Filtros Financeiros'}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{t('modules.nexus.finance.filtersSubtitle') || 'Ajuste o período para análise de performance'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.dateRange.start') || 'Início'}</span>
                                        <input 
                                            type="date" 
                                            value={financeStartDate}
                                            onChange={(e) => setFinanceStartDate(e.target.value)}
                                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.dateRange.end') || 'Fim'}</span>
                                        <input 
                                            type="date" 
                                            value={financeEndDate}
                                            onChange={(e) => setFinanceEndDate(e.target.value)}
                                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white"
                                        />
                                    </div>
                                    <button 
                                        onClick={fetchAll}
                                        disabled={loading}
                                        className="h-10 mt-5 px-6 bg-indigo-600 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 group hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="group-hover:animate-pulse" />} 
                                        {t('common.apply') || 'Aplicar'}
                                    </button>
                                </div>
                            </div>

                            {/* Financial Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { 
                                        label: t('modules.nexus.finance.fees'), 
                                        val: `${locale === 'en' ? '$' : 'R$'} ${financialStats.totalCredits.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                                        color: 'text-emerald-600', 
                                        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                                        icon: Wallet, 
                                        trend: t('modules.nexus.overview.metricsTrends.revenue')
                                    },
                                    { 
                                        label: t('modules.nexus.finance.costs'), 
                                        val: `${locale === 'en' ? '$' : 'R$'} ${financialStats.totalDebits.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                                        color: 'text-rose-600', 
                                        bg: 'bg-rose-50 dark:bg-rose-900/30',
                                        icon: TrendingDown, 
                                        trend: t('modules.nexus.overview.metricsTrends.expenses')
                                    },
                                    { 
                                        label: t('modules.nexus.finance.balance'), 
                                        val: `${locale === 'en' ? '$' : 'R$'} ${financialStats.balance.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                                        color: 'text-indigo-600', 
                                        bg: 'bg-indigo-50 dark:bg-indigo-900/30',
                                        icon: Landmark, 
                                        trend: t('modules.nexus.overview.metricsTrends.net')
                                    },
                                    { 
                                        label: t('modules.nexus.finance.roi'), 
                                        val: financialStats.totalDebits > 0 ? `${((financialStats.balance / financialStats.totalDebits) * 100).toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '--%', 
                                        color: 'text-amber-600', 
                                        bg: 'bg-amber-50 dark:bg-amber-900/30',
                                        icon: BarChart3, 
                                        trend: t('modules.nexus.overview.metricsTrends.performance')
                                    }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800/50 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                                        
                                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <stat.icon size={28} />
                                        </div>
                                        
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className={`text-3xl font-black tracking-tighter mb-2 ${stat.color}`}>
                                                    {loading ? (
                                                        <motion.div 
                                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                            className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl"
                                                        />
                                                    ) : stat.val}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {stat.label}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl border bg-slate-50 text-slate-500 border-slate-100">
                                                    {stat.trend}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Insights AI - Premium Widget */}
                                <div className="lg:col-span-2 space-y-6">
                                    <IntelligenceWidget credentials={credentials} moduleContext="Estratégico / Nexus" limit={3} />
                                    
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                                <PieChart className="text-indigo-600" size={20} /> {t('modules.nexus.overview.assetDistribution')}
                                            </h3>
                                            <Link href="/veritumpro/nexus?tab=ativos" className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">{t('common.viewAll')}</Link>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {['Imóvel', 'Veículo', 'Empresa / Quotas', 'Outros'].map((type, i) => {
                                                const count = assets.filter(a => a.asset_type === type).length;
                                                const typeLabel = type === 'Imóvel' ? t('modules.nexus.assets.types.RealEstate') :
                                                                type === 'Veículo' ? t('modules.nexus.assets.types.Vehicle') :
                                                                type === 'Empresa / Quotas' ? t('modules.nexus.assets.types.Corporate') :
                                                                t('modules.nexus.assets.types.Others');
                                                return (
                                                    <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 truncate">{typeLabel}</div>
                                                        <div className="text-2xl font-black text-slate-800 dark:text-white">{count}</div>
                                                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                                                            <motion.div 
                                                                className={`h-full ${i % 2 === 0 ? 'bg-indigo-600' : 'bg-emerald-600'}`}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: assets.length > 0 ? `${(count / assets.length) * 100}%` : 0 }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Stats / Recent Activity */}
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
                                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                                        <div className="relative z-10">
                                            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{t('modules.nexus.overview.powerUser.title')}</h3>
                                            <p className="text-indigo-100 text-sm font-medium mb-6 leading-relaxed opacity-80">{t('modules.nexus.overview.powerUser.description')}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest">{t('modules.nexus.overview.powerUser.level')}</div>
                                                <div className="px-4 py-2 bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest">+5.2k XP</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 h-[calc(100%-180px)]">
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                            <List className="text-indigo-600" size={18} /> {t('modules.nexus.overview.recommendedActions.title')}
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: t('modules.nexus.overview.recommendedActions.reviewDeadlines'), icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', tab: 'tarefas' },
                                                { label: t('modules.nexus.overview.recommendedActions.registerAssets'), icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', tab: 'ativos' },
                                                { label: t('modules.nexus.overview.recommendedActions.mapQSA'), icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', tab: 'societario' },
                                                { label: t('modules.nexus.overview.recommendedActions.syncCRM'), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', tab: 'pessoas' }
                                            ].map((action, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => setActiveTab(action.tab as any)}
                                                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-white/5 active:scale-95"
                                                >
                                                    <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                        <action.icon size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-tight">{action.label}</span>
                                                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-600 transition-colors" size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'pessoas' && (
                    <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col h-full space-y-6">
                            {/* Header Pessoas */}
                            <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                                <div className="flex-1">
                                    <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {t('management.master.persons.title')}
                                    </h1>
                                    <p className="text-slate-500 font-bold tracking-wide mt-1">
                                        {t('management.users.subtitle')}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('CRM_OPEN_MODAL'));
                                        }}
                                        className="bg-slate-800 hover:bg-emerald-600 dark:bg-white dark:hover:bg-emerald-500 dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1"
                                    >
                                        <Plus size={14} /> {t('common.new')} {t('common.person')}
                                    </button>
                                </div>
                            </div>

                            <PersonManagement
                                credentials={credentials}
                                preferences={preferences!}
                                currentUser={user}
                                isEmbedded={true}
                                externalPersons={persons}
                                externalLoading={loading}
                                masterSelectedUserId={selectedUserId}
                                onRefresh={fetchAll}
                                onNewLawsuit={handleCreateLawsuitFromCRM}
                                onNewCorporateEntity={handleCreateCorporateEntityFromCRM}
                                onOpenNexoVisual={p => handleOpenNexoVisual('person', p)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'processos' && (
                    <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col h-full space-y-6">
                            {/* Header Processos */}
                            <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                                <div className="flex-1">
                                    <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {t('modules.nexus.title')}
                                    </h1>
                                    <p className="text-slate-500 font-bold tracking-wide mt-1">
                                        Total de {lawsuits.length} {t('common.processes')}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setProcessViewStyle('grid')}
                                            className={`p-2 rounded-lg transition-all ${processViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Cards"
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setProcessViewStyle('list')}
                                            className={`p-2 rounded-lg transition-all ${processViewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Lista"
                                        >
                                            <List size={18} />
                                        </button>
                                        <button
                                            onClick={() => setProcessViewStyle('kanban')}
                                            className={`p-2 rounded-lg transition-all ${processViewStyle === 'kanban' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Kanban"
                                        >
                                            <Trello size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { 
                                            setEditingLawsuit({ status: 'Ativo' }); 
                                            setPendingLawsuitDocuments([]);
                                            setIsLawsuitModalOpen(true); 
                                            setActiveLawsuitTab('basic'); 
                                        }}
                                        className="bg-slate-800 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-500 dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                                    >
                                        <Plus size={14} /> Novo Processo
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 px-8 pb-8 h-[calc(100vh-280px)]">
                                {renderLawsuitFilterBar()}
                                <AnimatePresence mode="wait">
                                    {processViewStyle === 'kanban' ? (
                                        <motion.div
                                            key="process-kanban"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="h-full flex gap-6 overflow-x-auto no-scrollbar pb-4"
                                        >
                                            {LAWSUIT_STATUSES.map(status => (
                                                <div 
                                                    key={status} 
                                                    className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                                    onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropLawsuit(e, status); }}
                                                >
                                                    <div className="flex items-center justify-between px-2 mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                status === 'Ativo' ? 'bg-emerald-500' :
                                                                status === 'Encerrado' ? 'bg-rose-500' :
                                                                status === 'Arquivado' ? 'bg-slate-400' : 'bg-amber-500'
                                                            }`} />
                                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{status}</h3>
                                                            <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                                {filteredLawsuits.filter(l => l.status === status).length}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 pb-6">
                                                        {filteredLawsuits.filter(l => l.status === status).length === 0 ? (
                                                            <div className="py-20 text-center text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">Vazio</div>
                                                        ) : (
                                                            filteredLawsuits.filter(l => l.status === status).map(law => (
                                                                <div 
                                                                    key={law.id} 
                                                                    draggable
                                                                    onDragStart={(e) => {
                                                                        handleDragStartLawsuit(e, law.id);
                                                                        e.currentTarget.classList.add('opacity-50');
                                                                    }}
                                                                    onDragEnd={(e) => {
                                                                        e.currentTarget.classList.remove('opacity-50');
                                                                    }}
                                                                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                                                                    onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="text-[8px] font-mono font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-tight truncate">{law.cnj_number || 'Sem CNJ'}</div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="flex gap-1 transition-all">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenHistory(law.id, 'lawsuit', law.case_title || 'Sem Título'); }}
                                                                                    className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                                    title="Análise de Histórico"
                                                                                >
                                                                                    <History size={12} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                                    className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                                    title={t('common.edit')}
                                                                                >
                                                                                    <Pencil size={12} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleSoftDeleteLawsuit(law.id); }}
                                                                                    className="p-1 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                                    title={t('common.delete')}
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3 line-clamp-2 leading-snug uppercase tracking-tight">{law.case_title}</h4>
                                                                    
                                                                    <div className="flex items-center gap-2 mb-4">
                                                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-[9px]">
                                                                            {persons.find(p => p.id === law.author_id)?.full_name?.charAt(0) || 'C'}
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                                                            {persons.find(p => p.id === law.author_id)?.full_name || 'Contestação'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                                                                        <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(law.value || 0)}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('lawsuit', law); }}
                                                                                className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                                title="Ver Mapa Mental (Nexo Visual)"
                                                                            >
                                                                                <Network size={12} />
                                                                            </button>
                                                                             {renderStatusBadge(law.id, law.status, 'lawsuit', LAWSUIT_STATUSES)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : processViewStyle === 'list' ? (
                                        <motion.div 
                                            key="process-list"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col"
                                        >
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.table.headers.cnj')}</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.lawsuit.labelTitle')}</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.client')}</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.lawsuit.labelValue')}</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('modules.nexus.table.headers.actions')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                        {loading ? (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 animate-pulse"><Scale size={40} /></div>
                                                                        <p className="font-bold text-slate-400 animate-pulse">{t('modules.nexus.empty.syncing')}</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : filteredLawsuits.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300"><Scale size={40} /></div>
                                                                        <p className="font-bold text-slate-400">{t('modules.nexus.empty.processes')}</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : filteredLawsuits.map((law) => (
                                                            <tr key={law.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{law.cnj_number}</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{law.case_title}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{law.sphere}</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center font-black text-xs">
                                                                            {persons.find(p => p.id === law.author_id)?.full_name?.charAt(0) || 'C'}
                                                                        </div>
                                                                        <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                                                                            {persons.find(p => p.id === law.author_id)?.full_name || 'Contestação'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {renderStatusBadge(law.id, law.status, 'lawsuit', LAWSUIT_STATUSES)}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-black text-slate-800 dark:text-white">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(law.value || 0)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center justify-end gap-1 transition-all">
                                                                         <button
                                                                             onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('lawsuit', law); }}
                                                                             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                             title="Ver Mapa Mental (Nexo Visual)"
                                                                         >
                                                                             <Network size={18} />
                                                                         </button>
                                                                         <button
                                                                             onClick={(e) => {
                                                                                 e.stopPropagation();
                                                                                 setActiveTab('tarefas');
                                                                                 setEditingTask({
                                                                                     status: 'A Fazer',
                                                                                     lawsuit_id: law.id,
                                                                                     responsible_id: law.responsible_lawyer_id || '',
                                                                                     title: `${law.author_id ? (persons.find(p => p.id === law.author_id)?.full_name + ' - ') : ''}Andamento de Processo`,
                                                                                     priority: 'Média'
                                                                                 });
                                                                                 setTimeout(() => {
                                                                                     setIsTaskModalOpen(true);
                                                                                     setActiveTaskTab('basic');
                                                                                 }, 300);
                                                                             }}
                                                                             className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                                             title={t('modules.nexus.newTask')}
                                                                         >
                                                                             <Zap size={18} />
                                                                         </button>
                                                                         <button
                                                                             onClick={(e) => {
                                                                                 e.stopPropagation();
                                                                                 setActiveTab('ativos');
                                                                                 setEditingAsset({
                                                                                     status: 'Ativo',
                                                                                     lawsuit_id: law.id,
                                                                                     person_id: law.author_id || '',
                                                                                     asset_type: 'Outros'
                                                                                 });
                                                                                 setTimeout(() => {
                                                                                     setIsAssetModalOpen(true);
                                                                                 }, 300);
                                                                             }}
                                                                             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                             title="Vincular Novo Ativo/Garantia"
                                                                         >
                                                                             <Shield size={18} />
                                                                         </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOpenHistory(law.id, 'lawsuit', law.case_title || 'Sem Título');
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                            title="Ver Histórico de Auditoria"
                                                                        >
                                                                            <History size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingLawsuit(law);
                                                                                setEditingLawsuitDoc({
                                                                                    document_type: 'Petição Inicial',
                                                                                    event_date: new Date().toISOString()
                                                                                });
                                                                                setIsLawsuitDocModalOpen(true);
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                            title="Upload Rápido de Documento"
                                                                        >
                                                                            <Upload size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                            title={t('common.edit')}
                                                                        >
                                                                            <Pencil size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleSoftDeleteLawsuit(law.id); }}
                                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                                            title={t('common.delete')}
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="process-grid"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex-1 overflow-y-auto no-scrollbar pb-8"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {loading ? (
                                                    <div className="col-span-full py-20 text-center animate-pulse text-slate-400 font-bold">{t('modules.nexus.empty.syncing')}</div>
                                                ) : filteredLawsuits.length === 0 ? (
                                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.empty.processes')}</div>
                                                ) : filteredLawsuits.map((law) => {
                                                    const author = persons.find(p => p.id === law.author_id);
                                                    return (
                                                        <div key={law.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{law.cnj_number}</span>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{law.sphere}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('lawsuit', law); }}
                                                                        className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                        title="Ver Mapa Mental (Nexo Visual)"
                                                                    >
                                                                        <Network size={12} />
                                                                    </button>
                                                                    {renderStatusBadge(law.id, law.status, 'lawsuit', LAWSUIT_STATUSES)}
                                                                </div>
                                                            </div>

                                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4 line-clamp-2 leading-tight">{law.case_title}</h3>

                                                            <div className="flex flex-col gap-2 mb-6">
                                                                {author && (
                                                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-xl">
                                                                        <UserIcon size={12} /> <span className="truncate">{author.full_name}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor da Causa</span>
                                                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(law.value || 0)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveTab('tarefas');
                                                                            setEditingTask({
                                                                                status: 'A Fazer',
                                                                                lawsuit_id: law.id,
                                                                                responsible_id: law.responsible_lawyer_id || '',
                                                                                title: `${law.author_id ? (persons.find(p => p.id === law.author_id)?.full_name + ' - ') : ''}Andamento de Processo`,
                                                                                priority: 'Média'
                                                                            });
                                                                            setTimeout(() => {
                                                                                setIsTaskModalOpen(true);
                                                                                setActiveTaskTab('basic');
                                                                            }, 300);
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                                        title={t('modules.nexus.newTask')}
                                                                    >
                                                                        <Zap size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveTab('ativos');
                                                                            setEditingAsset({
                                                                                status: 'Ativo',
                                                                                lawsuit_id: law.id,
                                                                                person_id: law.author_id || '',
                                                                                asset_type: 'Outros'
                                                                            });
                                                                            setTimeout(() => {
                                                                                setIsAssetModalOpen(true);
                                                                            }, 300);
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title="Vincular Novo Ativo/Garantia"
                                                                    >
                                                                        <Shield size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenHistory(law.id, 'lawsuit', law.case_title || 'Sem Título');
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title="Ver Histórico de Auditoria"
                                                                    >
                                                                        <History size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingLawsuit(law);
                                                                            setEditingLawsuitDoc({
                                                                                document_type: 'Petição Inicial',
                                                                                event_date: new Date().toISOString()
                                                                            });
                                                                            setIsLawsuitDocModalOpen(true);
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title="Upload Rápido de Documento"
                                                                    >
                                                                        <Upload size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title={t('common.edit')}
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleSoftDeleteLawsuit(law.id); }}
                                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                                        title={t('common.delete')}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tarefas' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-8 pt-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.tabs.tasks')}</h1>
                                        <p className="text-slate-500 font-bold">{t('modules.nexus.description')}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => { setEditingTask({ status: 'A Fazer' }); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                            className="bg-slate-800 text-white px-6 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                                        >
                                            <Plus size={14} /> {t('modules.nexus.newTask')}
                                        </button>
                                        <div className="flex w-72 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                            <button
                                                onClick={() => setView('kanban')}
                                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'kanban' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                Kanban
                                            </button>
                                            <button
                                                onClick={() => setView('list')}
                                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                Lista
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <IntelligenceWidget credentials={credentials} moduleContext="Operacional / Nexus" limit={3} />
                        </div>

                        <div className="px-8 mt-4">
                            {renderFilterBar()}
                        </div>

                        {/* KPIs Top Area */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.metrics.active')}</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{lawsuits.filter(l => l.status === 'Ativo').length}</p>
                                </div>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><Scale size={20} /></div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('modules.nexus.metrics.deadlines')}</p>
                                    <p className="text-2xl font-black text-rose-600">{filteredTasks.filter(t => t.status !== 'Concluído' && (new Date(t.due_date).getTime() - new Date().getTime()) < 86400000).length}</p>
                                </div>
                                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg"><Clock size={20} /></div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.metrics.pending')}</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{filteredTasks.filter(t => t.status !== 'Concluído').length}</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg"><CheckCircle2 size={20} /></div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('modules.nexus.metrics.completion')}</p>
                                    <p className="text-2xl font-black text-emerald-600">
                                        {filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t => t.status === 'Concluído').length / filteredTasks.length) * 100) : 0}%
                                    </p>
                                </div>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
                            </div>
                        </div>

                        {/* Main Content */}
                        {view === 'kanban' ? (
                            <div className="flex-1 flex gap-6 overflow-x-auto p-8 pt-0 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {columns.map((column) => (
                                    <div
                                        key={column}
                                        className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropTask(e, column); }}
                                    >
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <h3 className="font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${column === 'Atrasado' ? 'bg-rose-500' :
                                                    column === 'Concluído' ? 'bg-emerald-500' : 'bg-slate-400'
                                                    }`} />
                                                {getColumnTranslation(column)}
                                                <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                    {filteredTasks.filter(t => t.status === column).length}
                                                </span>
                                            </h3>
                                        </div>

                                        <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-6 rounded-xl">
                                            {loading ? (
                                                <div className="py-8 text-center text-slate-400 text-xs font-bold animate-pulse">{t('modules.nexus.empty.syncing')}</div>
                                            ) : filteredTasks.filter(t => t.status === column).map((task) => {
                                                const law = lawsuits.find(l => l.id === task.lawsuit_id);
                                                const resp = team.find(t_ => t_.id === task.responsible_id);
                                                const urgency = getTaskUrgencyInfo(task.due_date, task.status);

                                                return (
                                                    <motion.div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            handleDragStartTask(e as any, task.id);
                                                            (e.currentTarget as any).classList.add('opacity-50');
                                                        }}
                                                        onDragEnd={(e) => {
                                                            (e.currentTarget as any).classList.remove('opacity-50');
                                                        }}
                                                        animate={urgency.isToday ? { 
                                                            borderColor: ["#ef4444", "#fda4af", "#ef4444"],
                                                            boxShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 10px rgba(239, 68, 68, 0.3)", "0 0 0px rgba(239, 68, 68, 0)"]
                                                        } : {}}
                                                        transition={urgency.isToday ? { duration: 2, repeat: Infinity } : { duration: 0.2 }}
                                                        className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border ${urgency.isToday ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing group`}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${getSeverityColor(task.due_date, task.status)}`}>
                                                                {getPriorityTranslation(task.priority || 'Média')}
                                                            </span>
                                                            <div className="flex gap-1.5 transition-all">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('task', task); }}
                                                                    className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                    title="Ver Mapa Mental (Nexo Visual)"
                                                                >
                                                                    <Network size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                                                    className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                >
                                                                    <Pencil size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-3">{task.title}</h4>
                                                        {law && <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-1"><Scale size={10} /> {law.cnj_number}</p>}

                                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-200 dark:border-slate-700" title={resp?.full_name}>
                                                                    {resp?.full_name?.charAt(0) || <UserIcon size={10} />}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{resp?.full_name?.split(' ')[0]}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <div className="flex items-center gap-1 text-slate-400">
                                                                    <Calendar size={10} />
                                                                    <span className="text-[10px] font-bold">{new Date(task.due_date).toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                                </div>
                                                                {task.status !== 'Concluído' && (
                                                                    <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${urgency.color === 'rose' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                                                                        {urgency.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col p-8 pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.task.labelTitle')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.task.labelDueDate')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.task.labelResponsible')}</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('modules.nexus.table.headers.actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {filteredTasks.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">Nenhuma tarefa encontrada.</td>
                                                    </tr>
                                                ) : filteredTasks.map((task) => {
                                                    const resp = team.find(t_ => t_.id === task.responsible_id);
                                                    const urgency = getTaskUrgencyInfo(task.due_date, task.status);
                                                    return (
                                                        <tr key={task.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group ${urgency.isToday ? 'bg-rose-50/10' : ''}`}>
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">{task.title}</div>
                                                                {urgency.isToday && <span className="text-[8px] font-black uppercase text-rose-500 animate-pulse tracking-widest">Atendimento Urgente / Hoje</span>}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">
                                                                    {getColumnTranslation(task.status)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${getSeverityColor(task.due_date, task.status)}`}>
                                                                    {getPriorityTranslation(task.priority || 'Média')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <div className="text-xs font-bold text-slate-500">{new Date(task.due_date).toLocaleDateString()}</div>
                                                                    {task.status !== 'Concluído' && (
                                                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${urgency.color === 'rose' ? 'text-rose-500' : 'text-slate-400'}`}>
                                                                            {urgency.label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-200 dark:border-slate-700">
                                                                        {resp?.full_name?.charAt(0) || <UserIcon size={10} />}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{resp?.full_name || '-'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('task', task); }}
                                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title="Ver Mapa Mental (Nexo Visual)"
                                                                    >
                                                                        <Network size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                    >
                                                                        <Pencil size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'agenda' && (
                    <div className="flex-1 p-8 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.tabs.calendar')}</h1>
                                    <p className="text-slate-500 font-bold">Visualização cronológica de compromissos</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex w-72 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                        <button
                                            onClick={() => setEventView('calendar')}
                                            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${eventView === 'calendar' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Calendário
                                        </button>
                                        <button
                                            onClick={() => setEventView('list')}
                                            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${eventView === 'list' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Lista
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setEditingEvent({ event_type: 'Audiência' }); setIsEventModalOpen(true); }}
                                        className="bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                                    >
                                        <Plus size={14} /> {t('modules.nexus.modals.event.title')}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                {renderFilterBar()}
                            </div>
                        </div>

                        {eventView === 'list' ? (
                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="overflow-x-auto h-full pr-2">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.event.labelTitle')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.event.labelResponsible')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('modules.nexus.table.headers.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto">
                                            {filteredEvents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">Nenhum evento encontrado.</td>
                                                </tr>
                                            ) : filteredEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map((event) => {
                                                const resp = team.find(t_ => t_.id === event.responsible_id);
                                                const startDate = new Date(event.start_date);
                                                return (
                                                    <tr key={event.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-700 dark:text-slate-200">{startDate.toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' })}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold">{startDate.toLocaleTimeString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-700 dark:text-slate-200">{event.title}</div>
                                                            {event.location && <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><MapPin size={10} /> {event.location}</div>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                                                                {event.event_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-700 dark:text-slate-200">{resp?.full_name || '-'}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsEventModalOpen(true); }}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleSoftDeleteEvent(event.id); }}
                                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in-95 duration-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white capitalize">
                                        {currentDate.toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { month: 'long', year: 'numeric' })}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold group"
                                        >
                                            <ChevronLeft size={16} className="group-active:-translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentDate(new Date())}
                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                        >
                                            Hoje
                                        </button>
                                        <button
                                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold group"
                                        >
                                            <ChevronRight size={16} className="group-active:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-4 pr-2">
                                    <div className="grid grid-cols-7 gap-4 h-full">
                                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                                            <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
                                                {d}
                                            </div>
                                        ))}
                                        {(() => {
                                            const today = new Date();
                                            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

                                            const days = [];
                                            for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
                                            for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

                                            return days.map((day, idx) => {
                                                if (!day) return <div key={`empty-${idx}`} className="min-h-[140px] rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 border border-transparent" />;

                                                const dayEvents = filteredEvents.filter(e => {
                                                    const eDate = new Date(e.start_date);
                                                    return eDate.getDate() === day.getDate() && eDate.getMonth() === day.getMonth() && eDate.getFullYear() === day.getFullYear();
                                                });
                                                const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();

                                                return (
                                                    <div
                                                        key={`day-${idx}`}
                                                        className={`min-h-[140px] rounded-3xl border transition-all p-3 flex flex-col gap-2 relative cursor-pointer ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
                                                        onClick={() => {
                                                            const eventDate = new Date(day);
                                                            eventDate.setHours(9, 0, 0, 0); // Default to 09:00 AM
                                                            setEditingEvent({ start_date: eventDate.toISOString() });
                                                            setIsEventModalOpen(true);
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className={`text-sm font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400 scale-110 origin-left' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                {day.getDate()}
                                                            </span>
                                                            {dayEvents.length > 0 && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                        </div>
                                                        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                                                            {dayEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(ev => {
                                                                const isPastEvent = new Date(ev.start_date) < new Date();
                                                                return (
                                                                    <div
                                                                        key={ev.id}
                                                                        onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setIsEventModalOpen(true); }}
                                                                        className={`rounded-xl p-2 text-[10px] font-bold cursor-pointer hover:scale-[1.02] transition-all group ${isPastEvent
                                                                                ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                                                                                : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                                                                            }`}
                                                                    >
                                                                        <div className={`truncate ${isPastEvent ? 'line-through decoration-slate-300 dark:decoration-slate-600' : ''}`}>{ev.title}</div>
                                                                        <div className={`${isPastEvent ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-200'} font-medium mt-0.5 transition-opacity`}>
                                                                            {new Date(ev.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} â€¢ {ev.event_type}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ativos' && (
                    <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col h-full space-y-6">
                            {/* Header Ativos */}
                            <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                                <div className="flex-1">
                                    <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        Ativos & Garantias
                                    </h1>
                                    <p className="text-slate-500 font-bold tracking-wide mt-1">
                                        Controle patrimonial vinculado a Pessoas e Processos
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setAssetViewStyle('grid')}
                                            className={`p-2 rounded-lg transition-all ${assetViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Cards"
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setAssetViewStyle('list')}
                                            className={`p-2 rounded-lg transition-all ${assetViewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Lista"
                                        >
                                            <List size={18} />
                                        </button>
                                        <button
                                            onClick={() => setAssetViewStyle('kanban')}
                                            className={`p-2 rounded-lg transition-all ${assetViewStyle === 'kanban' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Kanban"
                                        >
                                            <Trello size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setEditingAsset({ status: 'Ativo', asset_type: 'Imóvel' }); setIsAssetModalOpen(true); }}
                                        className="bg-slate-800 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-500 dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                                    >
                                        <Plus size={14} /> Novo Ativo
                                    </button>
                                </div>
                            </div>

                            {/* Tabela Ativos */}
                            <div className="flex-1 px-8 pb-8 h-[calc(100vh-280px)]">
                             {renderAssetFilterBar()}
                             <AnimatePresence mode="wait">
                                {assetViewStyle === 'kanban' ? (
                                    <motion.div
                                        key="asset-kanban"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="h-full flex gap-6 overflow-x-auto no-scrollbar pb-4"
                                    >
                                        {ASSET_STATUSES.map(status => (
                                            <div
                                                key={status}
                                                className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropAsset(e, status); }}
                                            >
                                                <div className="flex items-center justify-between px-2 mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            status === 'Ativo' ? 'bg-emerald-500' :
                                                            status === 'Vendido' ? 'bg-rose-500' :
                                                            status === 'Bloqueado' ? 'bg-rose-600' : 'bg-amber-500'
                                                        }`} />
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{status}</h3>
                                                        <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                            {filteredAssets.filter(a => a.status === status).length}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 pb-6">
                                                    {filteredAssets.filter(a => a.status === status).length === 0 ? (
                                                        <div className="py-20 text-center text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">Vazio</div>
                                                    ) : (
                                                        filteredAssets.filter(a => a.status === status).map(asset => {
                                                            const person = persons.find(p => p.id === asset.person_id);
                                                            const lawsuit = lawsuits.find(l => l.id === asset.lawsuit_id);
                                                            return (
                                                                <div
                                                                    key={asset.id}
                                                                    draggable
                                                                    onDragStart={(e) => {
                                                                        handleDragStartAsset(e, asset.id);
                                                                        e.currentTarget.classList.add('opacity-50');
                                                                    }}
                                                                    onDragEnd={(e) => {
                                                                        e.currentTarget.classList.remove('opacity-50');
                                                                    }}
                                                                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                                                                    onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                                >
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div className="flex flex-col">
                                                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{asset.asset_type}</div>
                                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-1 line-clamp-1 leading-tight uppercase tracking-tight">{asset.title}</h4>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('asset', asset); }}
                                                                                className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                                title="Ver Mapa Mental (Nexo Visual)"
                                                                            >
                                                                                <Network size={12} />
                                                                            </button>
                                                                            {renderStatusBadge(asset.id, asset.status, 'asset', ASSET_STATUSES)}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col gap-2 mb-4">
                                                                        {person && (
                                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                                <UserIcon size={10} /> <span className="truncate">{person.full_name}</span>
                                                                            </div>
                                                                        )}
                                                                        {lawsuit && (
                                                                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                                                                <Scale size={10} /> <span className="truncate">{lawsuit.cnj_number || lawsuit.case_title}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800 mt-auto">
                                                                        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                                            {asset.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value) : '-'}
                                                                        </div>
                                                                        <div className="flex gap-1 transition-all">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenHistory(asset.id, 'asset', asset.title || 'Sem Título'); }}
                                                                                className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                                title="Análise de Histórico"
                                                                            >
                                                                                <History size={12} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                                                className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                            >
                                                                                <Pencil size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                ) : assetViewStyle === 'list' ? (
                                    <motion.div
                                        key="asset-list"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full"
                                    >
                                        <div className="overflow-x-auto h-full px-2">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativo</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculo</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto">
                                                    {filteredAssets.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">Nenhum ativo registrado.</td>
                                                        </tr>
                                                    ) : filteredAssets.map((asset) => {
                                                        const person = persons.find(p => p.id === asset.person_id);
                                                        const lawsuit = lawsuits.find(l => l.id === asset.lawsuit_id);
                                                        return (
                                                            <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-slate-700 dark:text-slate-200 shrink-0 text-sm">{asset.title}</div>
                                                                    {asset.registration_number && <div className="text-[10px] text-slate-400 font-bold mt-0.5">{asset.registration_number}</div>}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                                        {asset.asset_type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {asset.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value) : '-'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {person && <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><UserIcon size={10} /> {person.full_name}</div>}
                                                                    {lawsuit && <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><Scale size={10} /> {lawsuit.cnj_number || lawsuit.case_title}</div>}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        {renderStatusBadge(asset.id, asset.status, 'asset', ASSET_STATUSES)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center justify-end gap-1 transition-all">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('asset', asset); }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                            title="Ver Mapa Mental (Nexo Visual)"
                                                                        >
                                                                            <Network size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleOpenHistory(asset.id, 'asset', asset.title || 'Sem Título'); }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                            title="Análise de Histórico"
                                                                        >
                                                                            <History size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingAsset(asset);
                                                                                setEditingAssetDoc({
                                                                                    document_type: 'MatrÃ­cula',
                                                                                    event_date: new Date().toISOString()
                                                                                });
                                                                                setIsAssetDocModalOpen(true);
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                            title="Upload Rápido de Documento"
                                                                        >
                                                                            <Upload size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        >
                                                                            <Pencil size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSoftDeleteAsset(asset.id)}
                                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                                            title={t('common.delete')}
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="asset-grid"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loading ? (
                                        <div className="col-span-full py-20 text-center animate-pulse text-slate-400 font-bold">{t('modules.nexus.empty.assetsSyncing')}</div>
                                    ) : filteredAssets.length === 0 ? (
                                        <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.empty.assets')}</div>
                                    ) : filteredAssets.map((asset) => {
                                        const person = persons.find(p => p.id === asset.person_id);
                                        const lawsuit = lawsuits.find(l => l.id === asset.lawsuit_id);
                                        return (
                                            <div key={asset.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">{asset.asset_type}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('asset', asset); }}
                                                            className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                            title="Ver Mapa Mental (Nexo Visual)"
                                                        >
                                                            <Network size={12} />
                                                        </button>
                                                        {renderStatusBadge(asset.id, asset.status, 'asset', ASSET_STATUSES)}
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2 line-clamp-2 leading-tight">{asset.title}</h3>
                                                {asset.registration_number && <p className="text-[10px] text-slate-400 font-bold mb-4">{asset.registration_number}</p>}

                                                <div className="flex flex-col gap-2 mb-6">
                                                    {person && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-xl">
                                                            <UserIcon size={12} /> <span className="truncate">{person.full_name}</span>
                                                        </div>
                                                    )}
                                                    {lawsuit && (
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                                                            <Scale size={12} /> <span className="truncate">{lawsuit.cnj_number || lawsuit.case_title}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Estimado</span>
                                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                            {asset.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value) : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenHistory(asset.id, 'asset', asset.title || 'Sem Título'); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Análise de Histórico"
                                                        >
                                                            <History size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingAsset(asset);
                                                                setEditingAssetDoc({
                                                                                    document_type: 'MatrÃ­cula',
                                                                                    event_date: new Date().toISOString()
                                                                                });
                                                                setIsAssetDocModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Upload Rápido de Documento"
                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSoftDeleteAsset(asset.id); }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                            title={t('common.delete')}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'societario' && (
                    <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col h-full space-y-6">
                            {/* Header Societário */}
                            <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                                <div className="flex-1">
                                    <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {t('modules.nexus.corporate.title')}
                                    </h1>
                                    <p className="text-slate-500 font-bold tracking-wide mt-1">
                                        {t('modules.nexus.corporate.subtitle')}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <div className="relative group">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder={t('modules.nexus.corporate.searchPlaceholder')}
                                            value={corporateSearchTerm}
                                            onChange={(e) => setCorporateSearchTerm(e.target.value)}
                                            className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-64 outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setCorporateViewStyle('grid')}
                                            className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title={t('common.viewStyle.cards')}
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setCorporateViewStyle('list')}
                                            className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title={t('common.viewStyle.list')}
                                        >
                                            <List size={18} />
                                        </button>
                                        <button
                                            onClick={() => setCorporateViewStyle('kanban')}
                                            className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'kanban' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title={t('common.viewStyle.kanban')}
                                        >
                                            <Trello size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingEntity({ status: 'Ativa', entity_type: 'LTDA' });
                                            personForQSARef.current = null;
                                            setShareholders([]); // Limpa manualmente para nova entidade em branco
                                            setCorporateDocuments([]);
                                            setIsEntityModalOpen(true);
                                            setActiveEntityTab('basic');
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                                    >
                                        <Plus size={14} /> {t('modules.nexus.corporate.newEntity')}
                                    </button>
                                </div>
                            </div>

                            {/* Tabela/Grade Societário */}
                            <div className="flex-1 px-8 pb-8 h-[calc(100vh-280px)]">
                                <AnimatePresence mode="wait">
                                    {corporateViewStyle === 'kanban' ? (
                                        <motion.div
                                            key="corporate-kanban"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="h-full flex gap-6 overflow-x-auto no-scrollbar pb-4"
                                        >
                                            {ENTITY_STATUSES.map(status => (
                                                <div
                                                    key={status}
                                                    className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                                    onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropEntity(e, status); }}
                                                >
                                                    <div className="flex items-center justify-between px-2 mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                status === 'Ativa' ? 'bg-emerald-500' :
                                                                status === 'Baixada' ? 'bg-rose-500' :
                                                                status === 'Inativa' ? 'bg-slate-400' : 'bg-amber-500'
                                                            }`} />
                                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{status}</h3>
                                                            <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                                {filteredEntities.filter(e => e.status === status).length}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 pb-6">
                                                        {filteredEntities.filter(e => e.status === status).length === 0 ? (
                                                            <div className="py-20 text-center text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">{t('common.empty')}</div>
                                                        ) : (
                                                            filteredEntities.filter(e => e.status === status).map(entity => (
                                                                <div
                                                                    key={entity.id}
                                                                    draggable
                                                                    onDragStart={(e) => {
                                                                        handleDragStartEntity(e, entity.id);
                                                                        e.currentTarget.classList.add('opacity-50');
                                                                    }}
                                                                    onDragEnd={(e) => {
                                                                        e.currentTarget.classList.remove('opacity-50');
                                                                    }}
                                                                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                                                                    onClick={() => handleEditEntity(entity)}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">{entity.entity_type}</div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('corporate', entity); }}
                                                                                className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                                title="Ver Mapa Mental (Nexo Visual)"
                                                                            >
                                                                                <Network size={12} />
                                                                            </button>
                                                                            <div className="flex gap-1 transition-all">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenHistory(entity.id, 'corporate', entity.legal_name || 'Sem Título'); }}
                                                                                    className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                                    title={t('modules.nexus.processes.historyAnalysis')}
                                                                                >
                                                                                    <History size={12} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleEditEntity(entity); }}
                                                                                    className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                                >
                                                                                    <Pencil size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3 line-clamp-2 leading-snug uppercase tracking-tight">{entity.legal_name}</h4>

                                                                    <div className="flex flex-col gap-2 mb-4">
                                                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                                            {entity.cnpj || t('common.notApplicable')}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                                                                        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                                            {entity.total_capital ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entity.total_capital) : '-'}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            {renderStatusBadge(entity.id, entity.status, 'corporate', ENTITY_STATUSES)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : corporateViewStyle === 'list' ? (
                                        <motion.div 
                                            key="corporate-list"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                                        >
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.client')}</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.corporate.table.headers.cnpj')}</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.types.asset.others')}</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.corporate.table.headers.capital')}</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                    {filteredEntities.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">{t('modules.nexus.corporate.empty')}</td>
                                                        </tr>
                                                    ) : filteredEntities.map((entity: any) => (
                                                        <tr key={entity.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">{entity.legal_name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">{entity.trading_name || t('modules.nexus.corporate.labels.noTradingName')}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{entity.cnpj || t('common.notApplicable')}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase">
                                                                    {entity.entity_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">
                                                                {entity.total_capital ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entity.total_capital) : '-'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {renderStatusBadge(entity.id, entity.status, 'corporate', ENTITY_STATUSES)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-1 opacity-100">
                                                                    <button
                                                                        title={t('modules.nexus.processes.viewMindMap')}
                                                                    >
                                                                        <Network size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenHistory(entity.id, 'corporate', entity.legal_name || t('common.veritumPro')); }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title={t('modules.nexus.processes.historyAnalysis')}
                                                                    >
                                                                        <History size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            setEditingEntity(entity); 
                                                                            setEditingDocument({ 
                                                                                document_type: 'Contrato Social', 
                                                                                event_date: new Date().toISOString() 
                                                                            });
                                                                            setIsDocumentModalOpen(true); 
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title={t('modules.nexus.modals.document.title')}

                                                                    >
                                                                        <Upload size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEditEntity(entity)}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                                                                                                 title={t('common.actions')}

                                                                    >
                                                                        <Pencil size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingEntity(entity); setIsEntityModalOpen(true); setActiveEntityTab('qsa'); }}
                                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                                        title={t('modules.nexus.corporate.actions.manageQSA')}
                                                                    >
                                                                        <Users size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSoftDeleteEntity(entity.id)}
                                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                                        title={t('common.delete')}
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="corporate-grid"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                        >
                                            {filteredEntities.length === 0 ? (
                                                <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.corporate.empty')}</div>
                                             ) : filteredEntities.map((entity: any) => (


                                                <div key={entity.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-[400px] border-b-8 border-b-indigo-500">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-3xl group-hover:scale-110 transition-transform">
                                                            <Building2 size={24} />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('corporate', entity); }}
                                                                className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                title={t('modules.nexus.processes.viewMindMap')}
                                                            >
                                                                <Network size={12} />
                                                            </button>
                                                            {renderStatusBadge(entity.id, entity.status, 'corporate', ENTITY_STATUSES)}
                                                        </div>
                                                    </div>

                                                    <h3 className="font-black text-slate-800 dark:text-white text-xl mb-1 line-clamp-1 truncate uppercase tracking-tighter leading-tight">
                                                        {entity.legal_name}
                                                    </h3>
                                                    <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">{entity.cnpj || t('common.notApplicable')}</p>

                                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">{t('modules.nexus.corporate.labels.type')}</span>
                                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{entity.entity_type}</span>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">{t('modules.nexus.corporate.labels.regime')}</span>
                                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{entity.tax_regime || t('common.notApplicable')}</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-[2rem] mb-6 flex items-center justify-between border border-indigo-100 dark:border-indigo-800/50">
                                                        <div>
                                                            <span className="text-[8px] font-black text-indigo-600 uppercase block mb-0.5">{t('modules.nexus.corporate.labels.capital')}</span>
                                                            <span className="text-sm font-black text-slate-800 dark:text-white">
                                                                {entity.total_capital ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entity.total_capital) : 'R$ 0,00'}
                                                            </span>
                                                        </div>
                                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                                                            <PieChart size={18} className="text-indigo-600" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleEditEntity(entity, 'qsa')}
                                                            className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
                                                        >
                                                            {t('modules.nexus.corporate.actions.manageQSA')}
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleOpenHistory(entity.id, 'corporate', entity.legal_name || t('common.veritumPro')); }}
                                                            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                            title={t('modules.nexus.processes.historyAnalysis')}
                                                        >
                                                            <History size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setEditingEntity(entity); 
                                                                setEditingDocument({ 
                                                                    document_type: 'Contrato Social', 
                                                                    event_date: new Date().toISOString() 
                                                                });
                                                                setIsDocumentModalOpen(true); 
                                                            }}
                                                            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                            title={t('modules.nexus.modals.document.title')}
                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEditEntity(entity)}
                                                            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'documentos' && (
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                         {renderGlobalDocumentsFilterBar()}
                         
                         <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                            <AnimatePresence mode="wait">
                                {isGlobalDocsLoading ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full flex flex-col items-center justify-center py-20"
                                    >
                                        <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Consolidando documentos globais...</p>
                                    </motion.div>
                                ) : filteredGlobalDocuments.length === 0 ? (
                                    <motion.div 
                                        key="empty"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50"
                                    >
                                        <FileText size={64} className="text-slate-200 dark:text-slate-800 mb-4" />
                                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-tighter">Nenhum documento encontrado</h3>
                                        <p className="text-sm text-slate-400 font-medium mt-1">Tente ajustar seus filtros ou busca global.</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="grid"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10"
                                    >
                                        {filteredGlobalDocuments.map((doc, idx) => (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white dark:bg-slate-950 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('document', doc); }}
                                                            className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                            title="Ver Mapa Mental (Nexo Visual)"
                                                        >
                                                            <Network size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                            title="Visualizar Documento"
                                                        >
                                                            <ExternalLink size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors capitalize">
                                                            {doc.title}
                                                        </h4>
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 block">
                                                            {doc.document_type}
                                                        </span>
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex flex-col gap-3">
                                                        {renderOriginBadge(doc.origin_type, doc.origin_name || 'N/A')}
                                                        
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black uppercase text-slate-400 leading-none mb-0.5 whitespace-nowrap">Data do Evento</span>
                                                                <span className="text-[10px] font-bold text-slate-500">
                                                                    {doc.event_date ? new Date(doc.event_date).toLocaleDateString('pt-BR') : 'Sem Data'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleSummarizeDocument(doc)}
                                                                    className="p-2 bg-slate-50 dark:bg-slate-800 text-amber-500 hover:text-amber-600 transition-all rounded-xl"
                                                                    title="Resumo IA"
                                                                >
                                                                    <Sparkles size={16} />
                                                                </button>
                                                                {doc.file_url && (
                                                                    <button 
                                                                        onClick={() => handleDownloadFile(doc.file_url, doc.title || 'documento')}
                                                                        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-xl"
                                                                        title="Fazer Download"
                                                                    >
                                                                        <Download size={16} />
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => handleEditGlobalDocumentOrigin(doc)}
                                                                    className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl"
                                                                    title={doc.origin_type === 'lawsuit' ? 'Ir para o Processo' : doc.origin_type === 'asset' ? 'Ir para o Ativo' : 'Ir para o Societário'}
                                                                >
                                                                    <ArrowRight size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteGlobalDocument(doc)}
                                                                    className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl"
                                                                    title="Excluir Documento"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                         </div>
                    </div>
                )}
            </div>

            {/* Lawsuit Drawer (Slide-over Pattern) */}
            <AnimatePresence>
                {isLawsuitModalOpen && (
                    <div key="lawsuit-drawer-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsLawsuitModalOpen(false); setLawsuitTimeline([]); setActiveLawsuitTab('basic'); }}
                        />

                        {/* Drawer Content */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                            {editingLawsuit?.id ? 'Cadastro de Processo' : 'Cadastro de Processo'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1">
                                            Central de Inteligência Jurídica Veritum
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {editingLawsuit?.id && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenNexoVisual('lawsuit', editingLawsuit)}
                                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-xl transition-all shadow-sm"
                                                    title="Ver Mapa Mental (Nexo Visual)"
                                                >
                                                    <Network size={28} className="p-1" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsLawsuitModalOpen(false);
                                                        setActiveTab('ativos');
                                                        setEditingAsset({
                                                            status: 'Ativo',
                                                            lawsuit_id: editingLawsuit.id,
                                                            person_id: editingLawsuit.author_id || '',
                                                            asset_type: 'Outros'
                                                        });
                                                        setTimeout(() => setIsAssetModalOpen(true), 150);
                                                    }}
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-all shadow-sm"
                                                    title="Vincular Novo Ativo/Garantia ao Processo"
                                                >
                                                    <Shield size={28} className="p-1" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setIsLawsuitModalOpen(false); setLawsuitTimeline([]); setActiveLawsuitTab('basic'); }}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                        >
                                            <XCircle size={28} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tab Switcher - Premium Style */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-full">
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('basic')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Zap size={14} /> {t('common.basic') || 'Dados Básicos'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('advanced')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'advanced' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Zap size={14} /> {t('common.advanced') || 'Avançado'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('docs')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'docs' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <FileText size={14} /> Documentos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveLawsuitTab('financeiro'); if (editingLawsuit?.id) handleFetchLawsuitFinances(editingLawsuit.id); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'financeiro' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'} ${!editingLawsuit?.id ? 'opacity-50' : ''}`}
                                    >
                                        <DollarSign size={14} /> Financeiro {!editingLawsuit?.id && '🔒'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('timeline')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'timeline' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'} ${!editingLawsuit?.id ? 'opacity-50' : ''}`}
                                    >
                                        <History size={14} /> Histórico {!editingLawsuit?.id && '🔒'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('ai')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'ai' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 shadow-xl shadow-amber-600/10' : 'text-slate-500 hover:text-slate-700'} ${!editingLawsuit?.id ? 'opacity-50' : ''}`}
                                    >
                                        <Sparkles size={14} className={activeLawsuitTab === 'ai' ? 'animate-pulse' : ''} /> {t('modules.nexus.modals.lawsuit.ai.tab') || 'IA'} {!editingLawsuit?.id && '🔒'}
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSaveLawsuit} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {activeLawsuitTab === 'basic' ? (
                                            <div className="space-y-8">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.labelCnj')}</label>
                                                    <input
                                                        required
                                                        value={editingLawsuit?.cnj_number || ''}
                                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, cnj_number: formatCNJ(e.target.value) })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-mono font-black text-lg text-indigo-600 dark:text-indigo-400"
                                                        placeholder="0000000-00.0000.0.00.0000"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.labelTitle')}</label>
                                                    <input
                                                        value={editingLawsuit?.case_title || ''}
                                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, case_title: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                        placeholder={t('modules.nexus.modals.lawsuit.placeholderTitle')}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Searchable Select: Polo Ativo (Autor) */}
                                                    <div className="relative">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.labelAuthor')}</label>
                                                        <div
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer flex items-center justify-between group hover:border-indigo-300 transition-all font-bold text-slate-800 dark:text-white"
                                                            onClick={() => { setIsAuthorDropdownOpen(!isAuthorDropdownOpen); setIsDefendantDropdownOpen(false); }}
                                                        >
                                                            <span className="truncate">
                                                                {persons.find(p => p.id === editingLawsuit?.author_id)?.full_name || t('modules.nexus.modals.lawsuit.selectCrm')}
                                                            </span>
                                                            <Search size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                        </div>

                                                        {isAuthorDropdownOpen && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                                                    <input
                                                                        autoFocus
                                                                        placeholder="Pesquisar no CRM..."
                                                                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                                        value={authorSearch}
                                                                        onChange={e => setAuthorSearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                                                    {['Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso'].map(type => {
                                                                        const typePersons = persons.filter(p => p.person_type === type && p.full_name?.toLowerCase().includes(authorSearch.toLowerCase()));
                                                                        if (typePersons.length === 0) return null;
                                                                        return (
                                                                            <div key={type}>
                                                                                <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-slate-800/50">
                                                                                    {type}
                                                                                </div>
                                                                                {typePersons.map(p => (
                                                                                    <div
                                                                                        key={p.id}
                                                                                        className="px-6 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-sm font-bold border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                                                                        onClick={() => {
                                                                                            setEditingLawsuit({ ...editingLawsuit, author_id: p.id });
                                                                                            setIsAuthorDropdownOpen(false);
                                                                                            setAuthorSearch('');
                                                                                        }}
                                                                                    >
                                                                                        {p.full_name}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Searchable Select: Polo Passivo (Réu) */}
                                                    <div className="relative">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Polo Passivo (Réu)</label>
                                                        <div
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer flex items-center justify-between group hover:border-indigo-300 transition-all font-bold text-slate-800 dark:text-white"
                                                            onClick={() => { setIsDefendantDropdownOpen(!isDefendantDropdownOpen); setIsAuthorDropdownOpen(false); }}
                                                        >
                                                            <span className="truncate">
                                                                {persons.find(p => p.id === editingLawsuit?.defendant_id)?.full_name || t('modules.nexus.modals.lawsuit.selectCrm')}
                                                            </span>
                                                            <Search size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                        </div>

                                                        {isDefendantDropdownOpen && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                                                    <input
                                                                        autoFocus
                                                                        placeholder="Pesquisar no CRM..."
                                                                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                                        value={defendantSearch}
                                                                        onChange={e => setDefendantSearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                                                    {['Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso'].map(type => {
                                                                        const typePersons = persons.filter(p => p.person_type === type && p.full_name?.toLowerCase().includes(defendantSearch.toLowerCase()));
                                                                        if (typePersons.length === 0) return null;
                                                                        return (
                                                                            <div key={type}>
                                                                                <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-slate-800/50">
                                                                                    {type}
                                                                                </div>
                                                                                {typePersons.map(p => (
                                                                                    <div
                                                                                        key={p.id}
                                                                                        className="px-6 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-sm font-bold border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                                                                        onClick={() => {
                                                                                            setEditingLawsuit({ ...editingLawsuit, defendant_id: p.id });
                                                                                            setIsDefendantDropdownOpen(false);
                                                                                            setDefendantSearch('');
                                                                                        }}
                                                                                    >
                                                                                        {p.full_name}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Advogado Responsável</label>
                                                    <select
                                                        required
                                                        value={editingLawsuit?.responsible_lawyer_id || ''}
                                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, responsible_lawyer_id: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                    >
                                                        <option value="">{t('modules.nexus.modals.lawsuit.selectTeam')}</option>
                                                        {team.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Status do Processo</label>
                                                        <select
                                                            value={editingLawsuit?.status || 'Ativo'}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, status: e.target.value as any })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                        >
                                                            <option value="Ativo">Ativo</option>
                                                            <option value="Suspenso">Suspenso</option>
                                                            <option value="Arquivado">Arquivado</option>
                                                            <option value="Encerrado">Encerrado</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.justification.label')}</label>
                                                        <input
                                                            value={justificationText}
                                                            onChange={e => setJustificationText(e.target.value)}
                                                            placeholder={t('modules.nexus.modals.justification.modalPlaceholder')}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold text-xs"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Valor da Causa</label>
                                                        <div className="relative">
                                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                                            <input
                                                                value={editingLawsuit?.value ? formatCurrency(editingLawsuit.value) : ''}
                                                                onChange={e => {
                                                                    const raw = e.target.value.replace(/\D/g, '');
                                                                    setEditingLawsuit({ ...editingLawsuit, value: Number(raw) / 100 });
                                                                }}
                                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-lg text-emerald-600 dark:text-emerald-400"
                                                                placeholder="0,00"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : activeLawsuitTab === 'advanced' ? (
                                            <div className="space-y-8 animate-in fade-in duration-300">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Esfera Judicial</label>
                                                        <select
                                                            value={editingLawsuit?.sphere || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, sphere: e.target.value, court: '', rito: '' })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        >
                                                            <option value="">Esfera...</option>
                                                            {ESFERAS.map(e => <option key={e} value={e}>{e}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Estado (UF)</label>
                                                        <select
                                                            value={editingLawsuit?.state || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, state: e.target.value, court: '', city: '' })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-center"
                                                        >
                                                            <option value="">UF</option>
                                                            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Tribunal</label>
                                                        <select
                                                            value={editingLawsuit?.court || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, court: e.target.value, chamber: '' })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        >
                                                            <option value="">Selecione o Tribunal...</option>
                                                            {[
                                                                ...(TRIBUNAIS[editingLawsuit?.sphere || '']?.[editingLawsuit?.state || ''] || []),
                                                                ...(TRIBUNAIS[editingLawsuit?.sphere || '']?.['Superior'] || []),
                                                                ...(TRIBUNAIS[editingLawsuit?.sphere || '']?.['default'] || [])
                                                            ].map(t_ => (
                                                                <option key={t_} value={t_}>{t_}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Rito Processual</label>
                                                        <select
                                                            value={editingLawsuit?.rito || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, rito: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        >
                                                            <option value="">Rito...</option>
                                                            {(RITOS[editingLawsuit?.sphere as keyof typeof RITOS] || RITOS['default']).map(r => (
                                                                <option key={r} value={r}>{r}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Órgão Julgador (Vara/Câmara)</label>
                                                        <PremiumCombobox
                                                            value={editingLawsuit?.chamber || ''}
                                                            onChange={val => setEditingLawsuit({ ...editingLawsuit, chamber: val })}
                                                            options={chambers}
                                                            placeholder="Ex: 12ª Vara"
                                                            creatable
                                                            disabled={!editingLawsuit?.court}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Comarca / Cidade</label>
                                                        <PremiumCombobox
                                                            value={editingLawsuit?.city || ''}
                                                            onChange={val => setEditingLawsuit({ ...editingLawsuit, city: val })}
                                                            options={cities}
                                                            placeholder={isLoadingCities ? "Carregando cidades no servidor..." : "Selecione a Comarca..."}
                                                            disabled={!editingLawsuit?.state}
                                                            creatable
                                                        />
                                                    </div>
                                                </div>

                                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50">
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                                                <AlertTriangle size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação de Risco</p>
                                                                <h5 className="font-black text-slate-700 dark:text-white uppercase tracking-tighter">Probabilidade & Provisão</h5>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.advanced.riskProbability')}</label>
                                                                <select
                                                                    value={editingLawsuit?.probability_of_success || ''}
                                                                    onChange={e => setEditingLawsuit({ ...editingLawsuit, probability_of_success: e.target.value as any })}
                                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                                >
                                                                    <option value="">{t('common.notApplicable')}</option>
                                                                    <option value="Provável">{t('modules.nexus.modals.lawsuit.advanced.probHigh')}</option>
                                                                    <option value="Possível">{t('modules.nexus.modals.lawsuit.advanced.probMedium')}</option>
                                                                    <option value="Remoto">{t('modules.nexus.modals.lawsuit.advanced.probLow')}</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.advanced.riskProvision')}</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                                                    <input
                                                                        value={editingLawsuit?.provision_amount ? formatCurrency(editingLawsuit.provision_amount) : ''}
                                                                        onChange={e => {
                                                                            const raw = e.target.value.replace(/\D/g, '');
                                                                            setEditingLawsuit({ ...editingLawsuit, provision_amount: Number(raw) / 100 });
                                                                        }}
                                                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-rose-600 dark:text-rose-400"
                                                                        placeholder="0,00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                        ) : activeLawsuitTab === 'financeiro' ? (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                {!editingLawsuit?.id ? (
                                                    <BlockedTabOverlay message="A gestão financeira estará disponível após a criação deste processo." />
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-4 gap-4 mb-8">
                                                            <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100/50">
                                                                <p className="text-[10px] font-black uppercase text-emerald-600 mb-1 opacity-70">{t('modules.nexus.finance.fees')}</p>
                                                                <p className="text-xl font-black text-emerald-600">R$ {lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            </div>
                                                            <div className="p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl border border-rose-100/50">
                                                                <p className="text-[10px] font-black uppercase text-rose-600 mb-1 opacity-70">{t('modules.nexus.finance.costs')}</p>
                                                                <p className="text-xl font-black text-rose-600">R$ {lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            </div>
                                                            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
                                                                <p className="text-[10px] font-black uppercase text-indigo-600 mb-1 opacity-70">{t('modules.nexus.finance.balance')}</p>
                                                                <p className="text-xl font-black text-indigo-600">R$ {(
                                                                    lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0) -
                                                                    lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s, t) => s + (t.amount || 0), 0)
                                                                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            </div>
                                                            <div className={`p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100/50 transition-all ${
                                                                (() => {
                                                                    const cr = lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                    const db = lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                    return db > 0 && (cr - db) > 0;
                                                                })() ? 'text-amber-600' : 'text-slate-400 opacity-50'
                                                            }`}>
                                                                <p className="text-[10px] font-black uppercase mb-1 opacity-70">{t('modules.nexus.finance.roi')}</p>
                                                                <p className="text-xl font-black flex items-center gap-2">
                                                                    {(() => {
                                                                        const cr = lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        const db = lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        if (db <= 0) return '-%';
                                                                        const roi = ((cr - db) / db) * 100;
                                                                        return `${roi.toFixed(0)}%`;
                                                                    })()}
                                                                    {(() => {
                                                                        const cr = lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        const db = lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        return db > 0 && (cr - db) > 0;
                                                                    })() && <TrendingUp size={20} className="animate-pulse" />}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mb-8">

                                                            <div>
                                                                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.finance.title')}</h4>
                                                                <p className="text-xs text-slate-500 font-bold">{t('modules.nexus.finance.subtitle')}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingFinancial({
                                                                            lawsuit_id: editingLawsuit.id,
                                                                            transaction_date: new Date().toISOString().split('T')[0],
                                                                            entry_type: 'Debit',
                                                                            status: 'Pendente',
                                                                            amount: 0
                                                                        });
                                                                        setIsEditingFinancial(true);
                                                                    }}
                                                                    className={`p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center gap-2 hover:bg-rose-100 transition-all font-black text-[10px] uppercase tracking-widest border border-rose-100 ${isEditingFinancial && editingFinancial?.entry_type === 'Debit' ? 'ring-2 ring-rose-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/40 transform scale-105' : 'opacity-80'}`}
                                                                >
                                                                    <TrendingDown size={14} /> {t('modules.nexus.finance.addCost')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingFinancial({
                                                                            lawsuit_id: editingLawsuit.id,
                                                                            transaction_date: new Date().toISOString().split('T')[0],
                                                                            entry_type: 'Credit',
                                                                            status: 'Pendente',
                                                                            amount: 0
                                                                        });
                                                                        setIsEditingFinancial(true);
                                                                    }}
                                                                    className={`p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center gap-2 hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest border border-emerald-100 ${isEditingFinancial && editingFinancial?.entry_type === 'Credit' ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transform scale-105' : 'opacity-80'}`}
                                                                >
                                                                    <TrendingUp size={14} /> {t('modules.nexus.finance.addFee')}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isEditingFinancial && editingFinancial && (
                                                            <div className="bg-slate-50 dark:bg-slate-900/80 p-6 rounded-[2.5rem] border-2 border-indigo-200 dark:border-indigo-900/40 mb-8 animate-in zoom-in-95 duration-300">
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <h5 className="font-black text-xs uppercase tracking-widest text-indigo-600">
                                                                        {editingFinancial.entry_type === 'Debit' ? t('modules.nexus.finance.addCost') : t('modules.nexus.finance.addFee')}
                                                                    </h5>
                                                                    <button type="button" onClick={() => setIsEditingFinancial(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="col-span-2">
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{t('modules.nexus.finance.description')}</label>
                                                                        <input 
                                                                            value={editingFinancial.title || ''}
                                                                            onChange={e => setEditingFinancial({...editingFinancial, title: e.target.value})}
                                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                                                            placeholder={t('modules.nexus.finance.placeholderDescription')}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{t('modules.nexus.finance.value')}</label>
                                                                        <div className="relative">
                                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">R$</span>
                                                                            <input 
                                                                                value={editingFinancial.amount ? formatCurrency(editingFinancial.amount) : ''}
                                                                                onChange={e => {
                                                                                    const raw = e.target.value.replace(/\D/g, '');
                                                                                    setEditingFinancial({...editingFinancial, amount: Number(raw) / 100});
                                                                                }}
                                                                                className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all ${editingFinancial.entry_type === 'Debit' ? 'text-rose-600' : 'text-emerald-600'}`}
                                                                                placeholder="0,00"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Data</label>
                                                                        <input 
                                                                            type="date"
                                                                            value={editingFinancial.transaction_date?.slice(0, 10) || ''}
                                                                            onChange={e => setEditingFinancial({...editingFinancial, transaction_date: e.target.value})}
                                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2 flex gap-4 pt-2">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleSaveFinancialTransaction(editingFinancial)}
                                                                            disabled={!editingFinancial.title || !editingFinancial.amount}
                                                                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-50 hover:bg-indigo-700 transition-all"
                                                                        >
                                                                            {t('modules.nexus.finance.confirm')}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-4">
                                                            {isFinancialLoading ? (
                                                                <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-100 dark:border-slate-800">
                                                                    <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
                                                                    <p className="text-[10px] font-black uppercase text-slate-400">{t('modules.nexus.finance.loading')}</p>
                                                                </div>
                                                            ) : lawsuitFinances.length === 0 ? (
                                                                <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-100 dark:border-slate-800">
                                                                    <DollarSign size={32} className="text-slate-300 mb-4" />
                                                                    <p className="text-sm font-bold text-slate-400 italic">{t('modules.nexus.finance.empty')}</p>
                                                                </div>
                                                            ) : (
                                                                lawsuitFinances.map(transaction => (
                                                                    <div key={transaction.id} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.entry_type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                                {transaction.entry_type === 'Credit' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                                            </div>
                                                                            <div>
                                                                                <h6 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight">{transaction.title}</h6>
                                                                                <p className="text-[10px] text-slate-400 font-bold">{transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : '-'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-6">
                                                                            <div className={`text-right font-black ${transaction.entry_type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                {transaction.entry_type === 'Credit' ? '+' : '-'} R$ {transaction.amount ? formatCurrency(transaction.amount) : '0,00'}
                                                                            </div>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => handleDeleteFinancialTransaction(transaction.id, editingLawsuit.id)}
                                                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : activeLawsuitTab === 'timeline' ? (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.lawsuit.timeline.title')}</h4>
                                                        <p className="text-xs text-slate-500 font-bold">{t('modules.nexus.modals.lawsuit.timeline.auditDesc')}</p>
                                                    </div>
                                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                                                        <History size={24} />
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    {!editingLawsuit?.id ? (
                                                        <BlockedTabOverlay message={t('modules.nexus.modals.lawsuit.timeline.emptyAudit')} />
                                                    ) : isLawsuitTimelineLoading ? (
                                                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                            <Loader2 size={48} className="text-indigo-500 mb-4 animate-spin" />
                                                            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">{t('modules.nexus.modals.lawsuit.timeline.loadingAudit')}</p>
                                                        </div>
                                                    ) : lawsuitTimeline.length === 0 ? (
                                                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                            <Clock size={48} className="text-slate-300 mb-4" />
                                                            <p className="text-slate-400 font-bold italic">{t('modules.nexus.modals.lawsuit.timeline.noEvents')}</p>
                                                        </div>
                                                    ) : lawsuitTimeline.map((entry, idx) => (
                                                        <div key={entry.id} className="relative pl-10 pb-10 group">
                                                            {/* Thread Line */}
                                                            {idx < lawsuitTimeline.length - 1 && (
                                                                <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
                                                            )}
                                                            
                                                            {/* Icon Circle */}
                                                            <div className={`absolute left-0 top-0 w-8 h-8 rounded-2xl z-10 flex items-center justify-center shadow-sm border ${
                                                                entry.action === 'STATUS_CHANGE' 
                                                                    ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800' 
                                                                    : entry.action === 'CREATE'
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                                    : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                            }`}>
                                                                {entry.action === 'STATUS_CHANGE' ? <Zap size={14} /> : entry.action === 'CREATE' ? <Plus size={14} /> : <Clock size={14} />}
                                                            </div>

                                                            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-900/40">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                                        entry.action === 'STATUS_CHANGE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                        {entry.action}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                        {entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : 'Agora'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed uppercase tracking-tight">
                                                                    {entry.description}
                                                                </p>
                                                                <div className="mt-4 flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                                        <UserIcon size={10} className="text-slate-500" />
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-500 font-bold">Por: <span className="text-indigo-600 dark:text-indigo-400">
                                                                        {(() => {
                                                                            if (!entry.user_id) return entry.user_name || 'Sistema';
                                                                            const member = team.find(m => m.id === entry.user_id);
                                                                            if (member) return member.full_name;
                                                                            if (entry.user_id === user.id) return user.name;
                                                                            return entry.user_name || 'Sistema';
                                                                        })()}
                                                                    </span></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : activeLawsuitTab === 'ai' ? (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.lawsuit.ai.title')}</h4>
                                                        <p className="text-xs text-slate-500 font-bold">{t('modules.nexus.modals.lawsuit.ai.subtitle')}</p>
                                                    </div>
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl shadow-lg shadow-amber-500/10">
                                                        <Sparkles size={24} className="animate-pulse" />
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                                    {!aiLawsuitSummary && !isAiSummarizing ? (
                                                        <div className="py-10">
                                                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-6 mx-auto">
                                                                <Brain size={40} className="text-slate-300" />
                                                            </div>
                                                            <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">{t('modules.nexus.modals.lawsuit.ai.empty')}</h5>
                                                                <p className="text-sm text-slate-500 font-bold mb-8 max-w-[320px]">Deseja que a nossa IA processe todos os dados deste processo e gere um resumo executivo para você?</p>
                                                                <button 
                                                                    type="button"
                                                                    onClick={handleSummarizeWithAI}
                                                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-3 mx-auto"
                                                                >
                                                                    <Zap size={16} /> Gerar Resumo Agora
                                                                </button>
                                                            </div>
                                                        ) : isAiSummarizing ? (
                                                            <div className="py-20 flex flex-col items-center">
                                                                <div className="relative mb-8">
                                                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />
                                                                    <Loader2 size={64} className="text-indigo-600 animate-spin relative z-10" />
                                                                </div>
                                                                <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm animate-pulse">{t('modules.nexus.modals.lawsuit.ai.loading')}</h5>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{t('modules.nexus.modals.lawsuit.ai.subtitle')}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full text-left">
                                                                <div className="p-8 bg-white dark:bg-slate-950 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 shadow-inner relative overflow-hidden group">
                                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                                                        <Brain size={120} />
                                                                    </div>
                                                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line relative z-10">
                                                                        {aiLawsuitSummary}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-8 flex items-center justify-between gap-4">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setAiLawsuitSummary(null)}
                                                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                                                    >
                                                                        {t('modules.nexus.modals.shareholder.cancel') || 'Limpar e Refazer'}
                                                                    </button>
                                                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl border border-emerald-100/50">
                                                                        <Check size={14} />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('common.confirm') || 'Análise Concluída'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Documentos do Processo</h4>
                                                        <p className="text-xs text-slate-500 font-bold">Petições, Provas e Decisões</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingLawsuitDoc({ document_type: 'Petição Inicial', event_date: new Date().toISOString() }); setIsLawsuitDocModalOpen(true); }}
                                                        className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                                    >
                                                        <Plus size={20} /> Novo Documento
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {lawsuitDocuments.length === 0 && pendingLawsuitDocuments.length === 0 ? (
                                                        <div className="col-span-full py-20 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                                            Nenhum documento anexado a este processo.
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Existing saved documents */}
                                                            {lawsuitDocuments.map(doc => (
                                                                <div key={doc.id} className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all group relative overflow-hidden">
                                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-600 shadow-sm">
                                                                            <FileText size={20} />
                                                                        </div>
                                                                        <span className="text-[9px] font-black text-slate-400 capitalize bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                                                            {doc.document_type}
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative z-10">
                                                                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{doc.title}</h5>
                                                                        <p className="text-[10px] text-slate-500 font-bold mb-4">Referência: {doc.event_date ? new Date(doc.event_date).toLocaleDateString() : 'N/I'}</p>
                                                                        
                                                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => { setEditingLawsuitDoc(doc); setIsLawsuitDocModalOpen(true); }}
                                                                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                                                            >
                                                                                Editar
                                                                            </button>
                                                                            <div className="flex gap-2">
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => handleSummarizeDocument(doc)}
                                                                                    className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                                                                                    title="Resumo IA"
                                                                                >
                                                                                    <Sparkles size={16} />
                                                                                </button>
                                                                                {doc.file_url && (
                                                                                    <a 
                                                                                        href={doc.file_url} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                                                    >
                                                                                        <Download size={16} />
                                                                                    </a>
                                                                                )}
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteLawsuitDocument(doc.id)}
                                                                                    className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* Pending documents (in-memory) */}
                                                            {pendingLawsuitDocuments.map((pending, idx) => (
                                                                <div key={`pending-${idx}`} className="bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-800/30 transition-all group relative overflow-hidden">
                                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-amber-600 shadow-sm animate-pulse">
                                                                            <FileText size={20} />
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span className="text-[9px] font-black text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 uppercase tracking-widest">
                                                                                Aguardando Processo
                                                                            </span>
                                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">
                                                                                {pending.docData.document_type}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative z-10">
                                                                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{pending.docData.title}</h5>
                                                                        <p className="text-[10px] text-slate-500 font-bold mb-4">{pending.file.name} ({(pending.file.size / 1024).toFixed(1)} KB)</p>
                                                                        
                                                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                                                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">Pendente</span>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => setPendingLawsuitDocuments(prev => prev.filter((_, i) => i !== idx))}
                                                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                        </div>
                                    )}
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { 
                                            setIsLawsuitModalOpen(false); 
                                            setActiveLawsuitTab('basic');
                                            setPendingLawsuitDocuments([]);
                                        }}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.lawsuit.cancel')}
                                    </button>
                                    {(activeLawsuitTab !== 'docs' || !editingLawsuit?.id) && (
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                        >
                                            <Save size={20} /> {editingLawsuit?.id ? t('modules.nexus.modals.lawsuit.save') : 'Criar Processo Agora'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Task Drawer (Slide-over Workflow Pattern) */}
            <AnimatePresence>
                {isTaskModalOpen && (
                    <div key="task-drawer-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsTaskModalOpen(false); setActiveTaskTab('basic'); }}
                        />

                        {/* Drawer Content */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                            {editingTask?.id ? t('modules.nexus.modals.task.titleEdit') : t('modules.nexus.modals.task.title')}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1">
                                            {t('modules.nexus.modals.task.subtitle')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsTaskModalOpen(false); setActiveTaskTab('basic'); }}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                    >
                                        <XCircle size={28} />
                                    </button>
                                </div>

                                {/* Tab Switcher - Premium Style */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-80">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTaskTab('basic')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${activeTaskTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Calendar size={14} /> {t('modules.nexus.modals.task.tabs.basic')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTaskTab('advanced')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${activeTaskTab === 'advanced' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <AlertTriangle size={14} /> {t('modules.nexus.modals.task.tabs.advanced')}
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSaveTask} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {activeTaskTab === 'basic' ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelTitle')}</label>
                                                    <input
                                                        required
                                                        value={editingTask?.title || ''}
                                                        onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                        placeholder={t('modules.nexus.modals.task.placeholderTitle')}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelLawsuit')}</label>
                                                    <select
                                                        required
                                                        value={editingTask?.lawsuit_id || ''}
                                                        onChange={e => setEditingTask({ ...editingTask, lawsuit_id: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                    >
                                                        <option value="">{t('modules.nexus.modals.task.selectLawsuit')}</option>
                                                        {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number} - {law.case_title}</option>)}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelResponsible')}</label>
                                                    <select
                                                        required
                                                        value={editingTask?.responsible_id || ''}
                                                        onChange={e => setEditingTask({ ...editingTask, responsible_id: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                    >
                                                        <option value="">{t('modules.nexus.modals.task.selectResponsible')}</option>
                                                        {team.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelDueDate')}</label>
                                                    <input
                                                        required
                                                        type="datetime-local"
                                                        value={editingTask?.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''}
                                                        onChange={e => setEditingTask({ ...editingTask, due_date: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 animate-in fade-in duration-300">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{t('modules.nexus.modals.task.labelPriority')}</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                                            <button
                                                                key={p}
                                                                type="button"
                                                                onClick={() => setEditingTask({ ...editingTask, priority: p as any })}
                                                                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${editingTask?.priority === p
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-105'
                                                                    : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                                                    }`}
                                                            >
                                                                {t(`modules.nexus.modals.task.priorities.${p}`)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelStatus')}</label>
                                                    <select
                                                        value={editingTask?.status || 'A Fazer'}
                                                        onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                    >
                                                        {columns.map(col => <option key={col} value={col}>{getColumnTranslation(col)}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsTaskModalOpen(false); setActiveTaskTab('basic'); }}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.task.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Save size={20} /> {t('modules.nexus.modals.task.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Event Drawer */}
            <AnimatePresence>
                {isEventModalOpen && (
                    <div key="event-drawer-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsEventModalOpen(false); }}
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                            {editingEvent?.id ? t('modules.nexus.modals.event.titleEdit') || 'Editar Evento' : t('modules.nexus.modals.event.title') || 'Novo Evento'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                            Agenda de Consultas e Prazos
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsEventModalOpen(false); }}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                    >
                                        <XCircle size={28} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSaveEvent} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo de Evento</label>
                                            <select
                                                required
                                                value={editingEvent?.event_type || 'Outro'}
                                                onChange={e => setEditingEvent({ ...editingEvent, event_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            >
                                                {['Audiência', 'Reunião', 'Despacho', 'Diligência', 'Outro'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.event.labelTitle')}</label>
                                            <input
                                                required
                                                value={editingEvent?.title || ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                placeholder={t('modules.nexus.modals.event.placeholderTitle')}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">InÃ­cio</label>
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={editingEvent?.start_date ? new Date(editingEvent.start_date).toISOString().slice(0, 16) : ''}
                                                    onChange={e => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fim (Opcional)</label>
                                                <input
                                                    type="datetime-local"
                                                    value={editingEvent?.end_date ? new Date(editingEvent.end_date).toISOString().slice(0, 16) : ''}
                                                    onChange={e => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Localização (FÃ­sica ou Link)</label>
                                            <input
                                                value={editingEvent?.location || ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                placeholder="Ex: Fórum Central ou Zoom Link"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.event.labelLawsuit')} (Opcional)</label>
                                            <select
                                                value={editingEvent?.lawsuit_id || ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, lawsuit_id: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            >
                                                <option value="">{t('modules.nexus.modals.event.selectLawsuit')}</option>
                                                {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number} - {law.case_title}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.event.labelResponsible')}</label>
                                            <select
                                                required
                                                value={editingEvent?.responsible_id || ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, responsible_id: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            >
                                                <option value="">{t('modules.nexus.modals.event.selectResponsible')}</option>
                                                {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsEventModalOpen(false); }}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.event.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Save size={20} /> Salvar Evento
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Asset Modal (Slide-over) */}
            <AnimatePresence>
                {isAssetModalOpen && (
                    <div key="asset-modal-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsAssetModalOpen(false); setAssetTimeline([]); setActiveAssetTab('basic'); }}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                            {editingAsset?.id ? 'Novo Ativo' : 'Novo Ativo'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1">
                                            Gestão Patrimonial & Garantias
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsAssetModalOpen(false); setAssetTimeline([]); setActiveAssetTab('basic'); }}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                    >
                                        <XCircle size={28} />
                                    </button>
                                </div>
                                
                                {/* Asset Modal Tabs */}
                                <div className="mt-8">
                                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setActiveAssetTab('basic')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeAssetTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Building2 size={14} /> Dados Básicos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveAssetTab('docs')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeAssetTab === 'docs' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <FileText size={14} /> Documentos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveAssetTab('timeline')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeAssetTab === 'timeline' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'} ${!editingAsset?.id ? 'opacity-50' : ''}`}
                                        >
                                            <History size={14} /> Histórico {!editingAsset?.id && '🔒'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSaveAsset} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                                    {activeAssetTab === 'basic' ? (
                                        <div className="space-y-6 animate-in fade-in duration-500">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Título do Ativo *</label>
                                            <input
                                                type="text"
                                                required
                                                value={editingAsset?.title || ''}
                                                onChange={e => setEditingAsset({ ...editingAsset, title: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all"
                                                placeholder="Ex: Apartamento Copacabana, Hilux 2023..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo de Ativo</label>
                                                <div className="relative">
                                                    <select
                                                        value={editingAsset?.asset_type || 'Outros'}
                                                        onChange={e => setEditingAsset({ ...editingAsset, asset_type: e.target.value as any })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer"
                                                    >
                                                        <option value="Imóvel">Imóvel</option>
                                                        <option value="Veículo">Veículo</option>
                                                        <option value="Conta Bancária">Conta Bancária</option>
                                                        <option value="Ação Judicial">Ação Judicial</option>
                                                        <option value="Empresa / Quotas">Empresa / Quotas</option>
                                                        <option value="Outros">Outros</option>
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                                                <div className="relative">
                                                    <select
                                                        value={editingAsset?.status || 'Ativo'}
                                                        onChange={e => setEditingAsset({ ...editingAsset, status: e.target.value as any })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer"
                                                    >
                                                        <option value="Ativo">Ativo</option>
                                                        <option value="Bloqueado">Bloqueado</option>
                                                        <option value="Vendido">Vendido</option>
                                                        <option value="Em Garantia">Em Garantia</option>
                                                        <option value="Alienado">Alienado</option>
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.justification.label')}</label>
                                            <input
                                                value={justificationText}
                                                onChange={e => setJustificationText(e.target.value)}
                                                placeholder={t('modules.nexus.modals.justification.modalPlaceholder')}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold text-xs"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Valor Estimado (R$)</label>
                                                <input
                                                    type="text"
                                                    value={editingAsset?.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingAsset.value).replace('R$', '').trim() : ''}
                                                    onChange={e => {
                                                        const rawValue = e.target.value.replace(/\D/g, '');
                                                        if (!rawValue) {
                                                            setEditingAsset({ ...editingAsset, value: undefined });
                                                            return;
                                                        }
                                                        setEditingAsset({ ...editingAsset, value: parseInt(rawValue, 10) / 100 });
                                                    }}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Doc / Registro / Matrícula</label>
                                                <input
                                                    type="text"
                                                    value={editingAsset?.registration_number || ''}
                                                    onChange={e => setEditingAsset({ ...editingAsset, registration_number: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    placeholder="Ex: Matrícula 1234..."
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Vincular a Pessoa (Cliente/Proprietário)</label>
                                                <div className="relative">
                                                    <select
                                                        value={editingAsset?.person_id || ''}
                                                        onChange={e => setEditingAsset({ ...editingAsset, person_id: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer text-sm"
                                                    >
                                                        <option value="">Nenhum</option>
                                                        {persons.map(p => (
                                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Vincular a Processo</label>
                                                <div className="relative">
                                                    <select
                                                        value={editingAsset?.lawsuit_id || ''}
                                                        onChange={e => setEditingAsset({ ...editingAsset, lawsuit_id: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer text-sm"
                                                    >
                                                        <option value="">Nenhum processo referenciado</option>
                                                        {lawsuits.map(law => (
                                                            <option key={law.id} value={law.id}>{law.cnj_number || law.case_title}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Descrição / Notas</label>
                                            <textarea
                                                rows={4}
                                                value={editingAsset?.description || ''}
                                                onChange={e => setEditingAsset({ ...editingAsset, description: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold resize-none"
                                            />
                                        </div>
                                    </div>
                                    ) : activeAssetTab === 'timeline' ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Histórico do Ativo</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Auditoria de movimentações e garantias</p>
                                                </div>
                                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                                                    <History size={24} />
                                                </div>
                                            </div>

                                            <div className="relative">
                                                {!editingAsset?.id ? (
                                                    <BlockedTabOverlay message="O histórico de auditoria do patrimônio será liberado após o registro inicial do ativo." />
                                                ) : isAssetTimelineLoading ? (
                                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                        <Loader2 size={48} className="text-indigo-500 mb-4 animate-spin" />
                                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando histórico...</p>
                                                    </div>
                                                ) : assetTimeline.length === 0 ? (
                                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                        <Clock size={48} className="text-slate-300 mb-4" />
                                                        <p className="text-slate-400 font-bold italic">Nenhum evento registrado ainda.</p>
                                                    </div>
                                                ) : assetTimeline.map((entry, idx) => (
                                                    <div key={entry.id} className="relative pl-10 pb-10 group">
                                                        {idx < assetTimeline.length - 1 && (
                                                            <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
                                                        )}
                                                        
                                                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-2xl z-10 flex items-center justify-center shadow-sm border ${
                                                            entry.action === 'STATUS_CHANGE' 
                                                                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800' 
                                                                : entry.action === 'CREATE'
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                                : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                        }`}>
                                                            {entry.action === 'STATUS_CHANGE' ? <Zap size={14} /> : entry.action === 'CREATE' ? <Plus size={14} /> : <Clock size={14} />}
                                                        </div>

                                                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-900/40">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                                    entry.action === 'STATUS_CHANGE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                    {entry.action}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    {entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : 'Agora'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed uppercase tracking-tight">
                                                                {entry.description}
                                                            </p>
                                                            <div className="mt-4 flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                                    <UserIcon size={10} className="text-slate-500" />
                                                                </div>
                                                                <span className="text-[10px] text-slate-500 font-bold">Por: <span className="text-indigo-600 dark:text-indigo-400">
                                                                    {(() => {
                                                                        if (!entry.user_id) return entry.user_name || 'Sistema';
                                                                        const member = team.find(m => m.id === entry.user_id);
                                                                        if (member) return member.full_name;
                                                                        if (entry.user_id === user.id) return user.name;
                                                                        return entry.user_name || 'Sistema';
                                                                    })()}
                                                                </span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Documentos do Ativo</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Matrículas, CRLVs e Avaliações</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingAssetDoc({ document_type: 'Matrícula', event_date: new Date().toISOString() }); setIsAssetDocModalOpen(true); }}
                                                    className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                                    title="Novo Documento"
                                                >
                                                    <Plus size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Novo</span>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {assetDocuments.length === 0 && pendingAssetDocuments.length === 0 ? (
                                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                                                            <FileText size={32} />
                                                        </div>
                                                        <p className="text-slate-500 font-bold">Nenhum documento anexado ao ativo</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Anexe certidões, laudos ou fotos</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Pending Documents */}
                                                        {pendingAssetDocuments.map((pending, idx) => (
                                                            <div key={`pending-${idx}`} className="group bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-[2.5rem] border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between shadow-sm animate-in slide-in-from-left-4 duration-300">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shadow-inner">
                                                                        <FileText size={28} />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm italic">{pending.docData.title}</h5>
                                                                        <div className="flex items-center gap-3 mt-1">
                                                                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-[8px] font-black text-amber-700 dark:text-amber-400 rounded-lg uppercase tracking-widest animate-pulse">
                                                                                Aguardando Salvamento
                                                                            </span>
                                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                                                {pending.docData.document_type}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPendingAssetDocuments(prev => prev.filter((_, i) => i !== idx))}
                                                                        className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                                                        title="Remover da fila"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Saved Documents */}
                                                        {assetDocuments.map(doc => (
                                                            <div key={doc.id} className="group bg-slate-50 dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                                        <FileText size={28} />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm">{doc.title}</h5>
                                                                        <div className="flex items-center gap-3 mt-1">
                                                                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[9px] font-black text-slate-600 dark:text-slate-400 rounded-lg uppercase tracking-widest">
                                                                                {doc.document_type}
                                                                            </span>
                                                                            {doc.event_date && (
                                                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                                    <Calendar size={10} /> {new Date(doc.event_date).toLocaleDateString('pt-BR')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {doc.file_url && (
                                                                        <button
                                                                            onClick={() => handleDownloadFile(doc.file_url!, doc.title || 'documento')}
                                                                            className="p-3 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all"
                                                                            title="Fazer Download"
                                                                        >
                                                                            <Download size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => handleSummarizeDocument(doc)}
                                                                        className="p-3 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-all"
                                                                        title="Resumo IA"
                                                                    >
                                                                        <Sparkles size={18} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { setEditingAssetDoc(doc); setIsAssetDocModalOpen(true); }}
                                                                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                                                                    >
                                                                        <Pencil size={18} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteAssetDocument(doc.id)}
                                                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(activeAssetTab !== 'docs' || !editingAsset?.id) && (
                                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => { setIsAssetModalOpen(false); setActiveAssetTab('basic'); }}
                                            className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                        >
                                            <Save size={20} /> {editingAsset?.id ? 'Salvar Ativo' : 'Criar Ativo Agora'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Corporate Entity Modal (The "Big One") */}
            <AnimatePresence>
                {isEntityModalOpen && (
                    <div key="entity-modal-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsEntityModalOpen(false); setActiveEntityTab('basic'); }}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                                            {editingEntity?.id ? 'Nova Entidade' : 'Nova Entidade'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-2">
                                            <Shield size={12} className="text-indigo-600" /> Governança & Estrutura Societária
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {editingEntity?.id && (
                                            <button
                                                onClick={() => handleOpenNexoVisual('corporate', editingEntity)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-2xl transition-all shadow-sm"
                                                title="Ver Mapa Mental (Nexo Visual)"
                                            >
                                                <Network size={28} className="p-1" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setIsEntityModalOpen(false); setActiveEntityTab('basic'); }}
                                            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                                        >
                                            <XCircle size={32} />
                                        </button>
                                    </div>
                                </div>

                                {/* Premium Tabs */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-[2.5rem] w-full">
                                    {[
                                        { id: 'basic', label: 'Dados Gerais', icon: Building2 },
                                        { id: 'qsa', label: 'Quadro Societário', icon: Users, isLocked: !editingEntity?.id && shareholders.length === 0 },
                                        { id: 'docs', label: 'Documentos', icon: FileText },
                                        { id: 'timeline', label: 'Histórico', icon: History, isLocked: !editingEntity?.id },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveEntityTab(tab.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl text-xs font-black transition-all whitespace-nowrap ${activeEntityTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'} ${tab.isLocked ? 'opacity-50' : ''}`}
                                        >
                                            <tab.icon size={16} /> {tab.label} {tab.isLocked && '🔒'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSaveEntity} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto no-scrollbar p-10">
                                    {activeEntityTab === 'basic' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Razão Social *</label>
                                                    <input
                                                        required value={editingEntity?.legal_name || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, legal_name: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-black transition-all text-lg"
                                                        placeholder="Ex: HOLDING PATRIMONIAL LTDA"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Fantasia</label>
                                                    <input
                                                        value={editingEntity?.trading_name || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, trading_name: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                                                        placeholder="Ex: NOME DO GRUPO"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">CNPJ</label>
                                                    <input
                                                        value={editingEntity?.cnpj || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, cnpj: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-black text-indigo-600"
                                                        placeholder="00.000.000/0000-00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Inscrição Estadual</label>
                                                    <input
                                                        value={editingEntity?.state_registration || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, state_registration: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo</label>
                                                    <select
                                                        value={editingEntity?.entity_type || 'LTDA'}
                                                        onChange={e => setEditingEntity({ ...editingEntity, entity_type: e.target.value as any })}
                                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-bold"
                                                    >
                                                        {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Regime Tributário</label>
                                                    <select
                                                        value={editingEntity?.tax_regime || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, tax_regime: e.target.value as any })}
                                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-bold"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {TAX_REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                                                    <select
                                                        value={editingEntity?.status || 'Ativa'}
                                                        onChange={e => setEditingEntity({ ...editingEntity, status: e.target.value as any })}
                                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-bold"
                                                    >
                                                        {ENTITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Justificativa da Mudança (Opcional)</label>
                                                <input
                                                    value={justificationText}
                                                    onChange={e => setJustificationText(e.target.value)}
                                                    placeholder="Motivo da alteração de status..."
                                                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Capital Social Total (R$)</label>
                                                <div className="relative">
                                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                                                    <input
                                                        type="text"
                                                        value={editingEntity?.total_capital ? formatCurrency(editingEntity.total_capital) : ''}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/\D/g, '');
                                                            setEditingEntity({ ...editingEntity, total_capital: raw ? parseInt(raw, 10) / 100 : 0 });
                                                        }}
                                                        className="w-full pl-16 pr-8 py-5 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-3xl outline-none font-black text-xl text-indigo-600"
                                                        placeholder="0,00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeEntityTab === 'qsa' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Composição do Capital</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Sócios, acionistas e participações diretas</p>
                                                </div>
                                                {editingEntity?.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingShareholder({ shareholder_type: 'Person', ownership_percentage: 0 }); setIsShareholderModalOpen(true); }}
                                                        className="p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
                                                        title="Adicionar Sócio"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                )}
                                            </div>

                                            {!editingEntity?.id && shareholders.length === 0 ? (
                                                <BlockedTabOverlay message="O Quadro Societário requer que a empresa exista primeiro na base de dados." />
                                            ) : (
                                                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sócio</th>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participação (%)</th>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cotas/Ações</th>
                                                            <th className="px-8 py-5 text-right"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {shareholders.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold italic">Nenhum sócio vinculado a esta entidade.</td>
                                                            </tr>
                                                        ) : shareholders.map(s => (
                                                            <tr key={s.id} className="group hover:bg-white dark:hover:bg-slate-800/50 transition-all">
                                                                <td className="px-8 py-6 font-bold text-slate-700 dark:text-slate-200">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                                                            {s.shareholder_name?.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <span className="block">{s.shareholder_name}</span>
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.shareholder_type === 'Person' ? 'Pessoa Física' : 'Holding / PJ'}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-24">
                                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.ownership_percentage}%` }} />
                                                                        </div>
                                                                        <span className="font-black text-indigo-600">{s.ownership_percentage}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 font-bold text-slate-600 dark:text-slate-400">
                                                                    {new Intl.NumberFormat('pt-BR').format(s.shares_count || 0)}
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => { setEditingShareholder(s); setIsShareholderModalOpen(true); }}
                                                                            className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                                                                        >
                                                                            <Pencil size={16} />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleDeleteShareholder(s.id)}
                                                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
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
                                        )}
                                    </div>
                                )}

                                    {activeEntityTab === 'docs' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Atos & Contratos</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Atas, Estatutos e Documentos de Governança</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingDocument({ document_type: 'Contrato Social', event_date: new Date().toISOString() }); setIsDocumentModalOpen(true); }}
                                                    className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                                >
                                                    <Plus size={20} /> Novo Documento
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {corporateDocuments.length === 0 && pendingCorporateDocuments.length === 0 ? (
                                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                                        Nenhum documento anexado.
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Pending Documents */}
                                                        {pendingCorporateDocuments.map((pending, idx) => (
                                                            <div key={`pending-corp-${idx}`} className="bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-800/50 hover:border-amber-500/30 transition-all group animate-in zoom-in-95 duration-300">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-amber-600 shadow-sm animate-pulse">
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-amber-700 bg-amber-100 dark:bg-amber-900/60 px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest">
                                                                        Pendente
                                                                    </span>
                                                                </div>
                                                                <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1 italic">{pending.docData.title}</h5>
                                                                <p className="text-[10px] text-slate-500 font-bold mb-4">Tipo: {pending.docData.document_type || 'N/I'}</p>
                                                                
                                                                <div className="flex items-center justify-end">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setPendingCorporateDocuments(prev => prev.filter((_, i) => i !== idx))}
                                                                        className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                                                        title="Remover"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Saved Documents */}
                                                        {corporateDocuments.map(doc => (
                                                            <div key={doc.id} className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all group">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-600 shadow-sm">
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-slate-400 capitalize bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                                                        {doc.document_type}
                                                                    </span>
                                                                </div>
                                                                <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{doc.title}</h5>
                                                                <p className="text-[10px] text-slate-500 font-bold mb-4">Referência: {doc.event_date ? new Date(doc.event_date).toLocaleDateString() : 'N/I'}</p>
                                                                
                                                                    <div className="flex items-center gap-1">
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => handleSummarizeDocument(doc)}
                                                                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                                                                            title="Resumo IA"
                                                                        >
                                                                            <Sparkles size={16} />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => { setEditingDocument(doc); setIsDocumentModalOpen(true); }}
                                                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-2"
                                                                        >
                                                                        Editar
                                                                    </button>
                                                                    {doc.file_url && (
                                                                        <button 
                                                                            onClick={() => handleDownloadFile(doc.file_url!, doc.title || 'documento')}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                                            title="Fazer Download"
                                                                        >
                                                                            <Download size={16} />
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                                        className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                    </div>
                                    )}

                                    {activeEntityTab === 'timeline' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Histórico da Entidade</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Trilha de auditoria e registros de governança</p>
                                                </div>
                                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-3xl">
                                                    <History size={28} />
                                                </div>
                                            </div>

                                            <div className="relative">
                                                {!editingEntity?.id ? (
                                                    <BlockedTabOverlay message="O histórico será gerado após o registro da entidade." />
                                                ) : isCorporateTimelineLoading ? (
                                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                        <Loader2 size={48} className="text-indigo-500 mb-4 animate-spin" />
                                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando histórico...</p>
                                                    </div>
                                                ) : corporateTimeline.length === 0 ? (
                                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                        <Clock size={48} className="text-slate-300 mb-4" />
                                                        <p className="text-slate-400 font-bold italic">Nenhum evento registrado ainda.</p>
                                                    </div>
                                                ) : corporateTimeline.map((entry, idx) => (
                                                    <div key={entry.id} className="relative pl-12 pb-12 group">
                                                        {idx < corporateTimeline.length - 1 && (
                                                            <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
                                                        )}
                                                        
                                                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-[1.25rem] z-10 flex items-center justify-center shadow-sm border ${
                                                            entry.action === 'STATUS_CHANGE' 
                                                                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800' 
                                                                : entry.action === 'CREATE'
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                                : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                        }`}>
                                                            {entry.action === 'STATUS_CHANGE' ? <Zap size={16} /> : entry.action === 'CREATE' ? <Plus size={16} /> : <Clock size={16} />}
                                                        </div>

                                                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl ${
                                                                    entry.action === 'STATUS_CHANGE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                    {entry.action}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    {entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : 'Agora'}
                                                                </span>
                                                            </div>
                                                            <p className="text-base font-bold text-slate-700 dark:text-slate-200 leading-relaxed uppercase tracking-tight">
                                                                {entry.description}
                                                            </p>
                                                            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                                    <UserIcon size={12} className="text-slate-500" />
                                                                </div>
                                                                <span className="text-xs text-slate-500 font-bold">Responsável: <span className="text-indigo-600 dark:text-indigo-400">
                                                                    {(() => {
                                                                        if (!entry.user_id) return entry.user_name || 'Sistema';
                                                                        const member = team.find(m => m.id === entry.user_id);
                                                                        if (member) return member.full_name;
                                                                        if (entry.user_id === user.id) return user.name;
                                                                        return entry.user_name || 'Sistema';
                                                                    })()}
                                                                </span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsEntityModalOpen(false); setActiveEntityTab('basic'); }}
                                        className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        Fechar
                                    </button>
                                    {(activeEntityTab === 'basic' || !editingEntity?.id) && (
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                        >
                                            <Save size={20} /> {editingEntity?.id ? 'Salvar Alterações' : 'Criar Entidade Agora'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Shareholder Modal */}
            <AnimatePresence>
                {isShareholderModalOpen && (
                    <div key="shareholder-modal-overlay" className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => setIsShareholderModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <form onSubmit={handleSaveShareholder}>
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        Dados do Sócio
                                    </h3>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome do Sócio / Empresa *</label>
                                        <input
                                            required value={editingShareholder?.shareholder_name || ''}
                                            onChange={e => setEditingShareholder({ ...editingShareholder, shareholder_name: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo de Sócio</label>
                                            <select
                                                value={editingShareholder?.shareholder_type || 'Person'}
                                                onChange={e => setEditingShareholder({ ...editingShareholder, shareholder_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold"
                                            >
                                                <option value="Person">Pessoa Física</option>
                                                <option value="Entity">Holding / Pessoa Jurídica</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Participação (%)</label>
                                            <input
                                                type="number" step="0.01"
                                                value={editingShareholder?.ownership_percentage || ''}
                                                onChange={e => setEditingShareholder({ ...editingShareholder, ownership_percentage: parseFloat(e.target.value) })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-black text-indigo-600"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Quantidade de Cotas/Ações</label>
                                        <input
                                            type="number"
                                            value={editingShareholder?.shares_count || ''}
                                            onChange={e => setEditingShareholder({ ...editingShareholder, shares_count: e.target.value ? parseInt(e.target.value) : 0 })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                    <button
                                        type="button" onClick={() => setIsShareholderModalOpen(false)}
                                        className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                    >
                                        Confirmar Sócio
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Modal */}
            <AnimatePresence>
                {isDocumentModalOpen && (
                    <div key="document-modal-overlay" className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => setIsDocumentModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <form onSubmit={handleSaveDocument}>
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {editingDocument?.id ? 'Editar Documento' : 'Novo Documento'}
                                    </h3>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Título do Documento *</label>
                                        <input
                                            required value={editingDocument?.title || ''}
                                            onChange={e => setEditingDocument({ ...editingDocument, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo</label>
                                            <select
                                                value={editingDocument?.document_type || 'Contrato Social'}
                                                onChange={e => setEditingDocument({ ...editingDocument, document_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold"
                                            >
                                                <option value="Contrato Social">Contrato Social</option>
                                                <option value="Ata">Ata</option>
                                                <option value="Estatuto">Estatuto</option>
                                                <option value="Acordo de Sócios">Acordo de Sócios</option>
                                                <option value="Planilha">Planilha</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Data de Referência</label>
                                            <input
                                                type="date"
                                                value={editingDocument?.event_date ? new Date(editingDocument.event_date).toISOString().split('T')[0] : ''}
                                                onChange={e => setEditingDocument({ ...editingDocument, event_date: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Upload do Documento</label>
                                        <PremiumFileUpload 
                                            ref={corporateDocUploadRef}
                                            isManual={true}
                                            bucket="nexus-documents"
                                            path={`corporate/${editingEntity?.id || 'temp'}`}
                                            label="Arraste o documento aqui ou clique para selecionar"
                                            onFileSelect={(file) => {
                                                setCorporateDocFile(file);
                                                if (file && !editingDocument?.title) {
                                                    setEditingDocument({ ...editingDocument, title: file.name.split('.')[0] });
                                                }
                                            }}
                                            onUploadComplete={(url) => setEditingDocument({ ...editingDocument, file_url: url })}
                                        />
                                        {editingDocument?.file_url && (
                                            <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl animate-in zoom-in-95 duration-300">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                    <Check size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Documento Carregado</p>
                                                    <p className="text-[10px] text-emerald-600/70 truncate font-mono">{editingDocument.file_url}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                    <button
                                        type="button" onClick={() => setIsDocumentModalOpen(false)}
                                        className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                    >
                                        Salvar Documento
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Lawsuit Document Modal */}
            <AnimatePresence>
                {isLawsuitDocModalOpen && (
                    <div key="lawsuit-doc-modal-overlay" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => setIsLawsuitDocModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <form onSubmit={handleSaveLawsuitDocument}>
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {editingLawsuitDoc?.id ? 'Editar Documento do Processo' : 'Novo Documento do Processo'}
                                    </h3>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Título do Documento</label>
                                        <input
                                            required
                                            value={editingLawsuitDoc?.title || ''}
                                            onChange={e => setEditingLawsuitDoc({ ...editingLawsuitDoc, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            placeholder="Ex: Petição de Juntada"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                                            <select
                                                value={editingLawsuitDoc?.document_type || 'Petição Inicial'}
                                                onChange={e => setEditingLawsuitDoc({ ...editingLawsuitDoc, document_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            >
                                                <option value="Petição Inicial">Petição Inicial</option>
                                                <option value="Procuração">Procuração</option>
                                                <option value="Contestação">Contestação</option>
                                                <option value="Sentença">Sentença</option>
                                                <option value="Acórdão">Acórdão</option>
                                                <option value="Prova">Prova</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Data de Referência</label>
                                            <input
                                                type="date"
                                                value={editingLawsuitDoc?.event_date?.split('T')[0] || ''}
                                                onChange={e => setEditingLawsuitDoc({ ...editingLawsuitDoc, event_date: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Upload do Documento</label>
                                        <PremiumFileUpload
                                            ref={lawsuitDocUploadRef}
                                            isManual={true}
                                            onUploadComplete={(url) => setEditingLawsuitDoc({ ...editingLawsuitDoc, file_url: url })}
                                            onFileSelect={(file) => {
                                                setLawsuitDocFile(file);
                                                if (file && !editingLawsuitDoc?.title) {
                                                    setEditingLawsuitDoc({ ...editingLawsuitDoc, title: file.name.split('.')[0] });
                                                }
                                            }}
                                            bucket="nexus-documents"
                                            path={`lawsuits/${editingLawsuit?.id}`}
                                            label="Arraste o PDF do documento aqui"
                                            accept="application/pdf,image/*"
                                        />
                                        {editingLawsuitDoc?.file_url && (
                                            <div className="mt-2 flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                                                <CheckCircle2 size={16} /> Arquivo pronto para salvar
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsLawsuitDocModalOpen(false)}
                                        className="flex-1 px-8 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-xs"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.document.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Asset Document Modal */}
            <AnimatePresence>
                {isAssetDocModalOpen && (
                    <div key="asset-doc-modal-overlay" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => setIsAssetDocModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <form onSubmit={handleSaveAssetDocument}>
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {editingAssetDoc?.id ? t('modules.nexus.modals.document.editAssetTitle') : t('modules.nexus.modals.document.newAssetTitle')}
                                    </h3>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.document.labelTitle')} *</label>
                                        <input
                                            required
                                            value={editingAssetDoc?.title || ''}
                                            onChange={e => setEditingAssetDoc({ ...editingAssetDoc, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            placeholder={t('modules.nexus.modals.document.placeholderTitle')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.type')}</label>
                                            <select
                                                value={editingAssetDoc?.document_type || 'Matrícula'}
                                                onChange={e => setEditingAssetDoc({ ...editingAssetDoc, document_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            >
                                                <option value="Matrícula">Matrícula</option>
                                                <option value="Escritura">Escritura</option>
                                                <option value="CRLV">CRLV</option>
                                                <option value="Contrato Compra e Venda">Contrato Compra e Venda</option>
                                                <option value="Laudo de Avaliação">Laudo de Avaliação</option>
                                                <option value="Fotos">Fotos</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.referenceDate')}</label>
                                            <input
                                                type="date"
                                                value={editingAssetDoc?.event_date?.split('T')[0] || ''}
                                                onChange={e => setEditingAssetDoc({ ...editingAssetDoc, event_date: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.document.labelFile')}</label>
                                        <PremiumFileUpload
                                            ref={assetDocUploadRef}
                                            isManual={true}
                                            onUploadComplete={(url) => setEditingAssetDoc({ ...editingAssetDoc, file_url: url })}
                                            onFileSelect={(file) => {
                                                setAssetDocFile(file);
                                                if (file && !editingAssetDoc?.title) {
                                                    setEditingAssetDoc({ ...editingAssetDoc, title: file.name.split('.')[0] });
                                                }
                                            }}
                                            bucket="nexus-documents"
                                            path={`assets/${editingAsset?.id}`}
                                            label={t('modules.nexus.modals.document.labelFile')}
                                            accept="application/pdf,image/*"
                                        />
                                        {editingAssetDoc?.file_url && (
                                            <div className="mt-2 flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                                                <CheckCircle2 size={16} /> {t('common.success')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAssetDocModalOpen(false)}
                                        className="flex-1 px-8 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-xs"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.document.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <div key="confirm-modal-overlay" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-8 text-center pt-10">
                                <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-6 ${
                                    confirmModal.type === 'danger' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' :
                                    confirmModal.type === 'warning' ? 'bg-amber-50 text-amber-500 dark:bg-amber-900/20' :
                                    'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20'
                                }`}>
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">
                                    {confirmModal.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-bold px-4">
                                    {confirmModal.message}
                                </p>
                            </div>
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                <button
                                    type="button" 
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-slate-600 dark:text-slate-400"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        confirmModal.onConfirm();
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    }}
                                    className={`flex-[2] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                                        confirmModal.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' :
                                        confirmModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' :
                                        'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
                                    }`}
                                >
                                    {t('common.confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Status Popover */}
            <AnimatePresence>
                {statusPopover && (
                    <div key="status-popover-overlay" className="fixed inset-0 z-[500]">
                        <div 
                            className="absolute inset-0" 
                            onClick={() => setStatusPopover(null)} 
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            style={{ 
                                position: 'fixed', 
                                left: Math.min(statusPopover.rect.x, typeof window !== 'undefined' ? window.innerWidth - 180 : statusPopover.rect.x), 
                                top: statusPopover.rect.y + 8,
                                minWidth: '160px'
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[501] overflow-hidden p-2"
                        >
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-1">
                                {t('common.status')}
                            </div>
                            {statusPopover.options.map((opt, idx) => (
                                <button
                                    key={opt || `status-opt-${idx}`}
                                    onClick={() => handleQuickStatusUpdate(statusPopover.id, statusPopover.type, opt)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                                        statusPopover.currentStatus === opt 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    {opt}
                                    {statusPopover.currentStatus === opt && <Check size={14} className="text-indigo-600" />}
                                </button>
                            ))}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Justification Modal */}
            <AnimatePresence>
                {isJustificationModalOpen && (
                    <div key="justification-modal-overlay" className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => { setIsJustificationModalOpen(false); setPendingStatusChange(null); }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.justification.title')}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {t('modules.nexus.modals.justification.subtitle')}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <textarea
                                    value={justificationText}
                                    onChange={(e) => setJustificationText(e.target.value)}
                                    placeholder={t('modules.nexus.modals.justification.placeholder')}
                                    className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 transition-all outline-none resize-none"
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setIsJustificationModalOpen(false); setPendingStatusChange(null); }}
                                        className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleConfirmStatusChange}
                                        className="py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {t('common.confirm')} <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Analysis Modal */}
            <AnimatePresence mode="wait">
            <AnimatePresence>
                {aiInfoModal.isOpen && (
                    <div key="ai-info-modal-overlay" className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => setAiInfoModal(prev => ({ ...prev, isOpen: false }))}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-900/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.lawsuit.ai.title')}</h3>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-1">Cognição Artificial Veritum</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAiInfoModal(prev => ({ ...prev, isOpen: false }))}
                                    className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-rose-500 shadow-sm"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> {aiInfoModal.title}
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50">
                                        <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line text-base italic">
                                            "{aiInfoModal.summary}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 italic">
                                        As informações apresentadas são geradas por inteligência artificial e devem ser validadas por um profissional jurídico antes de qualquer tomada de decisão.
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <button
                                    onClick={() => setAiInfoModal(prev => ({ ...prev, isOpen: false }))}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                >
                                    {t('common.confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

                {isHistoryModalOpen && historyData && (
                    <div key="history-modal-overlay" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => setIsHistoryModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                        <History className="text-indigo-600" /> {t('modules.nexus.modals.lawsuit.timeline.title')}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {historyData.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                                >
                                    <XCircle size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
                                {historyData.isLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <Loader2 size={40} className="text-indigo-600 animate-spin" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('modules.nexus.modals.lawsuit.timeline.loadingAudit')}</p>
                                    </div>
                                ) : historyData.timeline.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                                            <History size={40} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">Nenhum registro de histórico encontrado para este item.</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-indigo-100 dark:bg-indigo-900/30" />
                                        
                                        <div className="space-y-8">
                                            {historyData.timeline.map((entry, idx) => (
                                                <div key={entry.id || `history-entry-${idx}`} className="relative pl-12">
                                                    <div className="absolute left-0 top-1 w-[42px] h-[42px] rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/10 z-10">
                                                        {entry.action === 'CREATE' ? <Plus size={16} className="text-emerald-500" /> :
                                                         entry.action === 'STATUS_CHANGE' ? <Zap size={16} className="text-amber-500" /> :
                                                         <FileText size={16} className="text-indigo-500" />}
                                                    </div>

                                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{entry.action}</div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                                                <Clock size={12} /> {entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : 'Sem data'}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed mb-4">{entry.description}</p>
                                                        
                                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px] text-slate-500">
                                                                {team.find(t => t.id === entry.user_id)?.full_name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Responsável</span>
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{team.find(t => t.id === entry.user_id)?.full_name || 'Sistema'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="w-full py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-[10px] border border-slate-200 dark:border-slate-700"
                                >
                                    {t('common.back')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                <NexoVisual 
                    key="nexo-visual-component"                    isOpen={isNexoVisualOpen}
                    onClose={() => setIsNexoVisualOpen(false)}
                    initialData={nexoData}
                    selectedUserId={selectedUserId}
                    persons={persons}
                    team={team}
                    assets={assets}
                    lawsuits={lawsuits}
                    tasks={tasks}
                    corporateEntities={corporateEntities}
                    onEdit={(type, data, category) => {
                        // 1. Logic for Roles: "Opening the modal to which they belong"
                        if (category && ['Autor', 'Réu', 'Responsável', 'Proprietário', 'Sócio', 'Gestão', 'Origem'].includes(category)) {
                             if (nexoData?.origin_type === 'lawsuit') { 
                                 setEditingLawsuit(nexoData.data); 
                                 setIsLawsuitModalOpen(true); 
                                 return; 
                             }
                             if (nexoData?.origin_type === 'asset') { 
                                 setEditingAsset(nexoData.data); 
                                 setIsAssetModalOpen(true); 
                                 return; 
                             }
                             if (nexoData?.origin_type === 'corporate') { 
                                 setEditingEntity(nexoData.data); 
                                 setIsEntityModalOpen(true); 
                                 return; 
                             }
                        }

                        if (type === 'lawsuit') { setEditingLawsuit(data); setIsLawsuitModalOpen(true); }
                        else if (type === 'asset') { setEditingAsset(data); setIsAssetModalOpen(true); }
                        else if (type === 'corporate') { setEditingEntity(data); setIsEntityModalOpen(true); }
                        else if (type === 'task') { setEditingTask(data); setIsTaskModalOpen(true); }
                        else if (type === 'person') { 
                            setActiveTab('pessoas');
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('CRM_OPEN_MODAL', { detail: data }));
                            }, 100);
                        }
                        else if (type === 'lawsuit_document') {
                            setEditingLawsuitDoc(data);
                            const law = lawsuits.find(l => l.id === data.lawsuit_id);
                            if (law) setEditingLawsuit(law);
                            setIsLawsuitDocModalOpen(true);
                        }
                        else if (type === 'asset_document') {
                            setEditingAssetDoc(data);
                            const asset = assets.find(a => a.id === data.asset_id);
                            if (asset) setEditingAsset(asset);
                            setIsAssetDocModalOpen(true);
                        }
                        else if (type === 'corporate_document') {
                            setEditingDocument(data);
                            const entity = corporateEntities.find(e => e.id === data.entity_id);
                            if (entity) {
                                setEditingEntity(entity);
                                setIsEntityModalOpen(true);
                            } else {
                                setIsDocumentModalOpen(true);
                            }
                        }
                    }}
                    refreshTrigger={visualRefreshTrigger}
                />
            </AnimatePresence>
        </div>
    );
};

export default Nexus;

