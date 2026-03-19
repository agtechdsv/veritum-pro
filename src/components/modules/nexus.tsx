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
import { TaskModal } from './nexus/modals/TaskModal';
import { LawsuitModal } from './nexus/modals/LawsuitModal';
import { CrmModal } from './nexus/modals/CrmModal';
import { AssetModal } from './nexus/modals/AssetModal';
import { CalendarTab } from './nexus/tabs/CalendarTab';
import { AssetsTab } from './nexus/tabs/AssetsTab';
import { LawsuitsTab } from './nexus/tabs/LawsuitsTab';
import { CorporateEntityModal } from './nexus/modals/CorporateEntityModal';
import { DocumentsTab } from './nexus/tabs/DocumentsTab';
import { CrmTab } from './nexus/tabs/CrmTab';
import { TasksTab } from './nexus/tabs/TasksTab';
import { SocietarioTab } from './nexus/tabs/SocietarioTab';




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
    const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [activeCrmTab, setActiveCrmTab] = useState<'basic' | 'advanced'>('basic');
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
            toast.error('Erro ao carregar histÃ³rico');
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
    const ENTITY_STATUSES: EntityStatus[] = ['Ativa', 'Baixada', 'Inativa', 'Em LiquidaÃ§Ã£o'];

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
            if (currentStatus === 'Suspenso' || currentStatus === 'Em ManutenÃ§Ã£o' || currentStatus === 'Em LiquidaÃ§Ã£o' || currentStatus === 'Em Garantia') 
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

    useEffect(() => {
        const handleOpenModal = (e: any) => {
            const detail = e.detail;
            if (detail) {
                setEditingPerson(detail);
            } else {
                setEditingPerson({ person_type: 'Cliente' });
            }
            setActiveCrmTab('basic');
            setIsCrmModalOpen(true);
        };
        window.addEventListener('CRM_OPEN_MODAL', handleOpenModal as any);
        return () => window.removeEventListener('CRM_OPEN_MODAL', handleOpenModal as any);
    }, []);

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
                toast.error(t('modules.nexus.errors.notMigrated') || 'O banco de dados do cliente selecionado ainda nÃ£o foi migrado (tabelas Nexus/Team faltantes).');
            }

        } catch (err: any) {
            console.error('Error loading Nexus data:', err);
            if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
                toast.error(t('modules.nexus.errors.notInitialized') || 'O banco de dados deste cliente ainda nÃ£o foi inicializado (tabelas Nexus/Team faltantes).');
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
        
        // SimulaÃ§Ã£o de chamada para API de IA (ex: Gemini/OpenAI)
        // Em produÃ§Ã£o, isso leria o conteÃºdo dos documentos e timeline
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const summary = `### ANÃLISE ESTRATÃ‰GICA NEXUS\n\nEste processo (**${editingLawsuit.case_title}**) encontra-se em fase de **${editingLawsuit.status}**. \n\n**Pontos Chave:**\n- Atualmente possui **${lawsuitDocuments.length} documentos** anexados para revisÃ£o.\n- A probabilidade de Ãªxito Ã© avaliada como **${editingLawsuit.probability_of_success || 'NÃ£o Definida'}**.\n- Identificamos movimentaÃ§Ãµes recentes na linha do tempo que sugerem atenÃ§Ã£o ao prÃ³ximo prazo fatal.\n\n**RecomendaÃ§Ã£o do Sistema:** Manter a provisÃ£o atual de **R$ ${(editingLawsuit.provision_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** e prosseguir com a estratÃ©gia de conciliaÃ§Ã£o, dado o histÃ³rico de decisÃµes em tribunais similares (anÃ¡lise preditiva).`;
        
        setAiLawsuitSummary(summary);
        setIsAiSummarizing(false);
    };

    const handleSummarizeDocument = async (doc: LawsuitDocument | AssetDocument | CorporateDocument | GlobalDocument) => {
        setIsAiSummarizing(true);
        toast.info(`A IA estÃ¡ analisando: ${doc.title}...`);
        
        // SimulaÃ§Ã£o de processamento de documento
        await new Promise(resolve => setTimeout(resolve, 3500));
        
        const summary = `Este arquivo (**${doc.title}**) foi processado com sucesso. \n\n**Resumo Inteligente:**\nO documento refere-se a uma **${doc.document_type}** datada de **${doc.event_date ? new Date(doc.event_date).toLocaleDateString() : 'data nÃ£o informada'}**. \n\nIdentificamos que o teor principal aborda uma manifestaÃ§Ã£o sobre fatos novos do processo, sem impactos imediatos no valor da causa, mas relevante para a estratÃ©gia de defesa. \n\n**Pontos de AtenÃ§Ã£o:**\n- Verificar se o anexo estÃ¡ completo (pÃ¡ginas legÃ­veis).\n- O teor coincide com a Ãºltima atualizaÃ§Ã£o de jurisprudÃªncia cadastrada no Intelligence Center.`;
        
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
                    ? ['1Âª VARA DO TRABALHO', '2Âª VARA DO TRABALHO', '3Âª VARA DO TRABALHO', '4Âª VARA DO TRABALHO', '5Âª VARA DO TRABALHO']
                    : ['1Âª VARA CÃƒÂVEL', '2Âª VARA CÃƒÂVEL', '3Âª VARA CÃƒÂVEL', '1Âª VARA FEDERAL', '2Âª VARA FEDERAL'];

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
            // SÃ³ limpamos se o modal estiver fechado (editingEntity === null)
            // Isso preserva os sÃ³cios "virtuais" injetados pelo CRM
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
            m.role?.toLowerCase().includes('sÃ³cio') ||
            m.role?.toLowerCase().includes('socio') ||
            m.specialty // If they have a specialty, they are likely a lawyer
        );

        setEditingLawsuit({
            author_id: personId,
            status: 'Ativo',
            sphere: 'CÃƒÂ­vel', // Default
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

        // Se for CPF, guarda a pessoa na Ref e jÃ¡ popula a UI para visualizaÃ§Ã£o imediata
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
                position: 'SÃ³cio-Administrador',
                shareholder_name: person.full_name,
                shareholder_type: 'Person'
            } as Shareholder]);
            console.log('[NEXUS] SÃ³cio preparado e enviado para a UI:', person.full_name);
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
            toast.success('TransaÃ§Ã£o salva com sucesso');
            setIsEditingFinancial(false);
            setEditingFinancial(null);
            if (transaction.lawsuit_id) handleFetchLawsuitFinances(transaction.lawsuit_id);
            // Refresh global stats
            const stats = await getFinancialStats(undefined, undefined, selectedUserId);
            if (stats.data) setFinancialStats(stats.data);
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast.error('Erro ao salvar transaÃ§Ã£o');
        }
    };

    const handleDeleteFinancialTransaction = async (id: string, lawsuitId?: string) => {
        if (!confirm('Deseja realmente excluir esta transaÃ§Ã£o?')) return;
        try {
            await deleteFinancialTransaction(id, selectedUserId);
            toast.success('TransaÃ§Ã£o excluÃ­da');
            if (lawsuitId) handleFetchLawsuitFinances(lawsuitId);
            const stats = await getFinancialStats(undefined, undefined, selectedUserId);
            if (stats.data) setFinancialStats(stats.data);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Erro ao excluir transaÃ§Ã£o');
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
            title: title || 'Sem TÃ­tulo',
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
                toast.error('Processo nÃ£o encontrado nos dados carregados.');
            }
        } else if (origin_type === 'asset') {
            const asset = assets.find(a => a.id === origin_id);
            if (asset) {
                setEditingAsset(asset);
                setIsAssetModalOpen(true);
                setActiveAssetTab('docs');
            } else {
                toast.error('Ativo nÃ£o encontrado nos dados carregados.');
            }
        } else if (origin_type === 'corporate') {
            const entity = corporateEntities.find(e => e.id === origin_id);
            if (entity) {
                handleEditEntity(entity, 'docs');
            } else {
                toast.error('Entidade nÃ£o encontrada nos dados carregados.');
            }
        }
    };

    const handleDeleteGlobalDocument = async (doc: GlobalDocument) => {
        const { origin_type, id, title, file_url } = doc;
        let confirmTitle = 'Excluir Documento';
        
        triggerConfirm(
            confirmTitle,
            `Deseja realmente remover o documento "${title}"? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`,
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
            toast.error(t('modules.nexus.modals.lawsuit.validation.cnj') || 'Formato de CNJ invÃ¡lido. Use 0000000-00.0000.0.00.0000');
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

            // VÃƒÂ­nculo automÃ¡tico de sÃ³cio se for criaÃ§Ã£o via CRM
            if (isNew && personToLink) {
                try {
                    console.log('[NEXUS-DEBUG] Criando vÃƒÂ­nculo societÃ¡rio para:', personToLink.full_name);
                    await saveShareholder({
                        entity_id: savedEntity.id,
                        person_shareholder_id: personToLink.id,
                        ownership_percentage: 100,
                        share_type: 'Quotas',
                        shares_count: 100,
                        is_admin: true,
                        position: 'SÃ³cio-Administrador',
                    } as any, targetUserId);
                    
                    toast.success(`${personToLink.full_name} vinculado como sÃ³cio 100%`);
                } catch (shErr: any) {
                    console.error('[NEXUS-DEBUG] Erro ao vincular sÃ³cio:', shErr);
                    toast.error(`AtenÃ§Ã£o: A empresa foi salva, mas o QSA falhou: ${shErr.message}`);
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
            
            // Refresh geral para garantir que o QSA apareÃ§a na prÃ³xima abertura
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
            toast.success('SÃ³cio salvo com sucesso!');
            
            if (editingShareholder?.id) {
                setShareholders(prev => prev.map(s => s.id === savedShareholder.id ? savedShareholder : s));
            } else {
                setShareholders(prev => [savedShareholder, ...prev]);
            }
        } catch (err) {
            console.error('Error saving shareholder:', err);
            toast.error('Erro ao salvar sÃ³cio');
        }
    };

    const handleDeleteShareholder = (id: string) => {
        triggerConfirm(
            'Excluir SÃ³cio',
            'Tem certeza que deseja excluir este sÃ³cio? Esta aÃ§Ã£o removerÃ¡ o vÃƒÂ­nculo com a entidade.',
            async () => {
                try {
                    await deleteShareholder(id, selectedUserId);
                    setShareholders(prev => prev.filter(s => s.id !== id));
                    toast.success('SÃ³cio removido');
                } catch (err) {
                    console.error('Error deleting shareholder:', err);
                    toast.error('Erro ao remover sÃ³cio');
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
                toast.success('Documento adicionado ÃƒÂ  fila. Ele serÃ¡ salvo apÃ³s vocÃª clicar em "Criar Entidade".');
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
                toast.success('Documento adicionado ÃƒÂ  fila. Ele serÃ¡ salvo apÃ³s vocÃª clicar em "Criar Processo".');
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
                toast.success('Documento adicionado ÃƒÂ  fila. Ele serÃ¡ salvo apÃ³s vocÃª clicar em "Criar Ativo".');
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
                    toast.success(t('modules.nexus.kanban.deleteSuccess') || 'Processo excluÃƒÂ­do corretamente');
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

    const columns = ['A Fazer', 'Em Andamento', 'ConcluÃ­do', 'Atrasado'];

    const getColumnTranslation = (col: string) => {
        switch (col) {
            case 'A Fazer': return t('modules.nexus.kanban.todo');
            case 'Em Andamento': return t('modules.nexus.kanban.doing');
            case 'ConcluÃ­do': return t('modules.nexus.kanban.done');
            case 'Atrasado': return t('modules.nexus.kanban.late');
            default: return col;
        }
    };

    const getPriorityTranslation = (priority: string) => {
        switch (priority) {
            case 'Baixa':
            case 'Low': return t('modules.nexus.modals.task.priorities.Low');
            case 'MÃ©dia':
            case 'Medium': return t('modules.nexus.modals.task.priorities.Medium');
            case 'Alta':
            case 'High': return t('modules.nexus.modals.task.priorities.High');
            case 'Urgente':
            case 'Urgent': return t('modules.nexus.modals.task.priorities.Urgent');
            default: return priority;
        }
    };

    const getSeverityColor = (dueDate: string, status: string) => {
        if (status === 'ConcluÃ­do') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
        const now = new Date();
        const due = new Date(dueDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Late
        if (diffHours < 24) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Urgent
        if (diffHours < 48) return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100'; // Attention
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200'; // Normal
    };

    const getTaskUrgencyInfo = (dueDate: string, status: string) => {
        if (status === 'ConcluÃ­do') return { label: 'ConcluÃ­do', color: 'emerald', days: 0, isToday: false };
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Atrasado', color: 'rose', days: Math.abs(diffDays), isToday: false };
        if (diffDays === 0) return { label: 'Vence Hoje', color: 'rose', days: 0, isToday: true };
        if (diffDays === 1) return { label: 'Vence AmanhÃ£', color: 'amber', days: 1, isToday: false };
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
        'CÃ­vel',
        'Federal',
        'PrevidenciÃ¡ria',
        'TributÃ¡ria',
        'Criminal',
        'FamÃ­lia & SucessÃµes',
        'Eleitoral',
        'Militar'
    ];

    const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

    const RITOS = {
        'Trabalhista': ['OrdinÃ¡rio', 'SumarÃ­ssimo', 'SumÃ¡rio (AlÃ§ada)', 'ExecuÃ§Ã£o Trabalhista'],
        'CÃ­vel': ['Procedimento Comum', 'SumarÃ­ssimo (Juizado Especial)', 'ExecuÃ§Ã£o de TÃ­tulo Extrajudicial', 'MonitÃ³ria', 'InventÃ¡rio/Arrolamento'],
        'Federal': ['Procedimento Comum', 'SumarÃ­ssimo (JEF)', 'ExecuÃ§Ã£o Fiscal'],
        'PrevidenciÃ¡ria': ['Procedimento Comum', 'SumarÃ­ssimo (JEF)', 'AcidentÃ¡rio'],
        'TributÃ¡ria': ['ExecuÃ§Ã£o Fiscal', 'AnulatÃ³ria', 'Mandado de SeguranÃ§a', 'RepetiÃ§Ã£o de IndÃ©bito'],
        'Criminal': ['OrdinÃ¡rio', 'SumÃ¡rio', 'SumarÃ­ssimo', 'Tribunal do JÃºri', 'ExecuÃ§Ã£o Penal'],
        'default': ['Procedimento Comum', 'Especial', 'Mandado de SeguranÃ§a']
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
            'Superior': ['STJ - Superior Tribunal de JustiÃ§a', 'STF']
        },
        'CÃ­vel': {
            'AC': ['TJAC'], 'AL': ['TJAL'], 'AP': ['TJAP'], 'AM': ['TJAM'], 'BA': ['TJBA'],
            'CE': ['TJCE'], 'DF': ['TJDFT'], 'ES': ['TJES'], 'GO': ['TJGO'], 'MA': ['TJMA'],
            'MT': ['TJMT'], 'MS': ['TJMS'], 'MG': ['TJMG'], 'PA': ['TJPA'], 'PB': ['TJPB'],
            'PR': ['TJPR'], 'PE': ['TJPE'], 'PI': ['TJPI'], 'RJ': ['TJRJ'], 'RN': ['TJRN'],
            'RS': ['TJRS'], 'RO': ['TJRO'], 'RR': ['TJRR'], 'SC': ['TJSC'], 'SP': ['TJSP'],
            'SE': ['TJSE'], 'TO': ['TJTO'],
            'Superior': ['STJ', 'STF']
        }
    };

    // Extension: PrevidenciÃ¡ria and TributÃ¡ria often share CÃ­vel/Federal courts
    TRIBUNAIS['PrevidenciÃ¡ria'] = TRIBUNAIS['Federal'];
    TRIBUNAIS['TributÃ¡ria'] = TRIBUNAIS['Federal'];
    TRIBUNAIS['Criminal'] = TRIBUNAIS['CÃ­vel'];
    TRIBUNAIS['FamÃ­lia & SucessÃµes'] = TRIBUNAIS['CÃ­vel'];
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
                    <option value="">ðŸ‘¤ {t('common.filters.allMembers')}</option>
                    {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={filterLawsuitId}
                    onChange={e => setFilterLawsuitId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">âš–ï¸ {t('common.filters.allProcesses')}</option>
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
                    <option value="">ðŸ¢ {t('common.filters.allStatuses')}</option>
                    {Object.entries(t('common.statuses.asset', { returnObjects: true }) as Record<string, string>).map(([key, val]) => <option key={key} value={val}>{val}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={assetTypeFilter}
                    onChange={e => setAssetTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">ðŸ“¦ {t('common.filters.allTypes')}</option>
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
                                    <optgroup label={t('management.users.masterFilter.clients')?.toUpperCase() || 'CLIENTES (SÃ“CIOS ADM)'}>
                                        {allClients.filter(u => u.id !== user.id).map(c => {
                                            const rawName = typeof c.name === 'object' ? ((c.name as any).pt || (c.name as any).en || '') : (c.name || '');
                                            const formattedName = rawName.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                            const formattedEmail = (c.email || '').toLowerCase();
                                            return (
                                                <option key={c.id} value={c.id}>
                                                    Ã°Å¸ÂÂ¢ {formattedName} ({formattedEmail})
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

            {/* ðŸ’Ž MAIN CONTENT AREA - Nexus 2.0 Router */}
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
                                        val: tasks.filter(t => t.status !== 'ConcluÃ­do' && (new Date(t.due_date).getTime() - new Date().getTime()) < 86400000).length, 
                                        color: 'text-rose-600', 
                                        bg: 'bg-rose-50 dark:bg-rose-900/30',
                                        icon: Clock, 
                                        trend: t('modules.nexus.overview.metricsTrends.urgent')
                                    },
                                    { 
                                        label: t('modules.nexus.metrics.pending'), 
                                        val: tasks.filter(t => t.status !== 'ConcluÃ­do').length, 
                                        color: 'text-amber-600', 
                                        bg: 'bg-amber-50 dark:bg-amber-900/30',
                                        icon: CheckCircle2, 
                                        trend: t('modules.nexus.overview.metricsTrends.queue')
                                    },
                                    { 
                                        label: t('modules.nexus.metrics.completion'), 
                                        val: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'ConcluÃ­do').length / tasks.length) * 100) : 0}%`, 
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
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{t('modules.nexus.finance.filtersSubtitle') || 'Ajuste o perÃ­odo para anÃ¡lise de performance'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.dateRange.start') || 'InÃ­cio'}</span>
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
                                    <IntelligenceWidget credentials={credentials} moduleContext="EstratÃ©gico / Nexus" limit={3} />
                                    
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                                <PieChart className="text-indigo-600" size={20} /> {t('modules.nexus.overview.assetDistribution')}
                                            </h3>
                                            <Link href="/veritumpro/nexus?tab=ativos" className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">{t('common.viewAll')}</Link>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {['ImÃ³vel', 'VeÃ­culo', 'Empresa / Quotas', 'Outros'].map((type, i) => {
                                                const count = assets.filter(a => a.asset_type === type).length;
                                                const typeLabel = type === 'ImÃ³vel' ? t('modules.nexus.assets.types.RealEstate') :
                                                                type === 'VeÃ­culo' ? t('modules.nexus.assets.types.Vehicle') :
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
                    <CrmTab
                        t={t}
                        credentials={credentials}
                        preferences={preferences}
                        user={user}
                        persons={persons}
                        loading={loading}
                        selectedUserId={selectedUserId}
                        fetchAll={fetchAll}
                        handleCreateLawsuitFromCRM={handleCreateLawsuitFromCRM}
                        handleCreateCorporateEntityFromCRM={handleCreateCorporateEntityFromCRM}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                    />
                )}

                {activeTab === 'processos' && (
                    <LawsuitsTab 
                        t={t}
                        locale={t('locale')}
                        lawsuits={lawsuits}
                        filteredLawsuits={filteredLawsuits}
                        processViewStyle={processViewStyle}
                        setProcessViewStyle={setProcessViewStyle}
                        lawsuitSearch={lawsuitSearch}
                        setLawsuitSearch={setLawsuitSearch}
                        lawsuitStatusFilter={lawsuitStatusFilter}
                        setLawsuitStatusFilter={setLawsuitStatusFilter}
                        lawsuitLawyerFilter={lawsuitLawyerFilter}
                        setLawsuitLawyerFilter={setLawsuitLawyerFilter}
                        team={team}
                        persons={persons}
                        loading={loading}
                        LAWSUIT_STATUSES={LAWSUIT_STATUSES}
                        handleDropLawsuit={handleDropLawsuit}
                        handleDragStartLawsuit={handleDragStartLawsuit}
                        handleOpenHistory={handleOpenHistory}
                        handleSoftDeleteLawsuit={handleSoftDeleteLawsuit}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        renderStatusBadge={renderStatusBadge}
                        setEditingLawsuit={setEditingLawsuit}
                        setPendingLawsuitDocuments={setPendingLawsuitDocuments}
                        setIsLawsuitModalOpen={setIsLawsuitModalOpen}
                        setActiveLawsuitTab={setActiveLawsuitTab}
                        setActiveTab={setActiveTab}
                        setEditingTask={setEditingTask}
                        setIsTaskModalOpen={setIsTaskModalOpen}
                        setActiveTaskTab={setActiveTaskTab}
                        setEditingAsset={setEditingAsset}
                        setIsAssetModalOpen={setIsAssetModalOpen}
                        setEditingLawsuitDoc={setEditingLawsuitDoc}
                        setIsLawsuitDocModalOpen={setIsLawsuitDocModalOpen}
                    />
                )}

                {activeTab === 'tarefas' && (
                    <TasksTab
                        t={t}
                        credentials={credentials}
                        lawsuits={lawsuits}
                        filteredTasks={filteredTasks}
                        team={team}
                        loading={loading}
                        view={view}
                        setView={setView}
                        filterSearchTerm={filterSearchTerm}
                        setFilterSearchTerm={setFilterSearchTerm}
                        filterResponsibleId={filterResponsibleId}
                        setFilterResponsibleId={setFilterResponsibleId}
                        filterLawsuitId={filterLawsuitId}
                        setFilterLawsuitId={setFilterLawsuitId}
                        setEditingTask={setEditingTask}
                        setIsTaskModalOpen={setIsTaskModalOpen}
                        setActiveTaskTab={setActiveTaskTab}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleDropTask={handleDropTask}
                        handleDragStartTask={handleDragStartTask}
                    />
                )}

                {activeTab === 'agenda' && (
                    <CalendarTab
                        t={t}
                        credentials={credentials}
                        team={team}
                        lawsuits={lawsuits}
                        events={events}
                        filteredEvents={filteredEvents}
                        eventView={eventView}
                        setEventView={setEventView}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        setEditingEvent={setEditingEvent}
                        setIsEventModalOpen={setIsEventModalOpen}
                        handleSoftDeleteEvent={handleSoftDeleteEvent}
                        filterSearchTerm={filterSearchTerm}
                        setFilterSearchTerm={setFilterSearchTerm}
                        filterResponsibleId={filterResponsibleId}
                        setFilterResponsibleId={setFilterResponsibleId}
                        filterLawsuitId={filterLawsuitId}
                        setFilterLawsuitId={setFilterLawsuitId}
                    />
                )}

                {activeTab === 'ativos' && (
                    <AssetsTab
                        t={t}
                        credentials={credentials}
                        persons={persons}
                        lawsuits={lawsuits}
                        loading={loading}
                        assetSearch={assetSearch}
                        setAssetSearch={setAssetSearch}
                        assetStatusFilter={assetStatusFilter}
                        setAssetStatusFilter={setAssetStatusFilter}
                        assetTypeFilter={assetTypeFilter}
                        setAssetTypeFilter={setAssetTypeFilter}
                        assetViewStyle={assetViewStyle}
                        setAssetViewStyle={setAssetViewStyle}
                        filteredAssets={filteredAssets}
                        ASSET_STATUSES={ASSET_STATUSES}
                        handleDropAsset={handleDropAsset}
                        handleDragStartAsset={handleDragStartAsset}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleOpenHistory={handleOpenHistory}
                        handleSoftDeleteAsset={handleSoftDeleteAsset}
                        setEditingAsset={setEditingAsset}
                        setIsAssetModalOpen={setIsAssetModalOpen}
                        setEditingAssetDoc={setEditingAssetDoc}
                        setIsAssetDocModalOpen={setIsAssetDocModalOpen}
                        renderStatusBadge={renderStatusBadge}
                    />
                )}

                {activeTab === 'societario' && (
                    <SocietarioTab
                        t={t}
                        corporateSearchTerm={corporateSearchTerm}
                        setCorporateSearchTerm={setCorporateSearchTerm}
                        corporateViewStyle={corporateViewStyle}
                        setCorporateViewStyle={setCorporateViewStyle}
                        filteredEntities={filteredEntities}
                        ENTITY_STATUSES={ENTITY_STATUSES}
                        handleDropEntity={handleDropEntity}
                        handleDragStartEntity={handleDragStartEntity}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleOpenHistory={handleOpenHistory}
                        handleEditEntity={handleEditEntity}
                        handleSoftDeleteEntity={handleSoftDeleteEntity}
                        setEditingEntity={setEditingEntity}
                        setShareholders={setShareholders}
                        setCorporateDocuments={setCorporateDocuments}
                        setIsEntityModalOpen={setIsEntityModalOpen}
                        setActiveEntityTab={setActiveEntityTab}
                        setEditingDocument={setEditingDocument}
                        setIsDocumentModalOpen={setIsDocumentModalOpen}
                        personForQSARef={personForQSARef}
                        renderStatusBadge={renderStatusBadge}
                    />
                )}

                {activeTab === 'documentos' && (
                    <DocumentsTab
                        docSearch={docSearch}
                        setDocSearch={setDocSearch}
                        docOriginFilter={docOriginFilter}
                        setDocOriginFilter={setDocOriginFilter}
                        docTypeFilter={docTypeFilter}
                        setDocTypeFilter={setDocTypeFilter}
                        isGlobalDocsLoading={isGlobalDocsLoading}
                        filteredGlobalDocuments={filteredGlobalDocuments}
                        uniqueDocTypes={uniqueDocTypes}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleSummarizeDocument={handleSummarizeDocument}
                        handleDownloadFile={handleDownloadFile}
                        handleEditGlobalDocumentOrigin={handleEditGlobalDocumentOrigin}
                        handleDeleteGlobalDocument={handleDeleteGlobalDocument}
                    />
                )}
            </div>


            <LawsuitModal
                isLawsuitModalOpen={isLawsuitModalOpen}
                setIsLawsuitModalOpen={setIsLawsuitModalOpen}
                setLawsuitTimeline={setLawsuitTimeline}
                setActiveLawsuitTab={setActiveLawsuitTab}
                editingLawsuit={editingLawsuit}
                handleOpenNexoVisual={handleOpenNexoVisual}
                setActiveTab={setActiveTab}
                setEditingAsset={setEditingAsset}
                setIsAssetModalOpen={setIsAssetModalOpen}
                activeLawsuitTab={activeLawsuitTab}
                persons={persons}
                setEditingLawsuit={setEditingLawsuit}
                isLoadingCities={isLoadingCities}
                cities={cities}
                handleSaveLawsuit={handleSaveLawsuit}
                lawsuitTimeline={lawsuitTimeline}
                team={team}
                user={user}
                aiLawsuitSummary={aiLawsuitSummary}
                isAiSummarizing={isAiSummarizing}
                handleSummarizeWithAI={handleSummarizeWithAI}
                lawsuitDocuments={lawsuitDocuments}
                pendingLawsuitDocuments={pendingLawsuitDocuments}
                setEditingLawsuitDoc={setEditingLawsuitDoc}
                setIsLawsuitDocModalOpen={setIsLawsuitDocModalOpen}
                handleSummarizeDocument={handleSummarizeDocument}
                handleDeleteLawsuitDocument={handleDeleteLawsuitDocument}
                setPendingLawsuitDocuments={setPendingLawsuitDocuments}
                handleFetchLawsuitFinances={handleFetchLawsuitFinances}
                formatCNJ={formatCNJ}
                ESFERAS={ESFERAS}
                UFS={UFS}
                TRIBUNAIS={TRIBUNAIS}
                RITOS={RITOS}
                chambers={chambers}
                lawsuitFinances={lawsuitFinances}
                isFinancialLoading={isFinancialLoading}
                handleSaveFinancialTransaction={handleSaveFinancialTransaction}
                handleDeleteFinancialTransaction={handleDeleteFinancialTransaction}
                isLawsuitTimelineLoading={isLawsuitTimelineLoading}
                formatCurrency={formatCurrency}
                setAiLawsuitSummary={setAiLawsuitSummary}
                isLawsuitDocModalOpen={isLawsuitDocModalOpen}
                editingLawsuitDoc={editingLawsuitDoc}
                handleSaveLawsuitDocument={handleSaveLawsuitDocument}
                lawsuitDocUploadRef={lawsuitDocUploadRef}
                lawsuitDocFile={lawsuitDocFile}
                setLawsuitDocFile={setLawsuitDocFile}
            />

            <CrmModal
                isCrmModalOpen={isCrmModalOpen}
                setIsCrmModalOpen={setIsCrmModalOpen}
                editingPerson={editingPerson}
                setEditingPerson={setEditingPerson}
                activeCrmTab={activeCrmTab}
                setActiveCrmTab={setActiveCrmTab}
                selectedUserId={selectedUserId}
                onSuccess={fetchAll}
            />

            {/* Task Drawer (Slide-over Workflow Pattern) */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setActiveTaskTab('basic'); }}
                editingTask={editingTask}
                setEditingTask={setEditingTask}
                activeTaskTab={activeTaskTab}
                setActiveTaskTab={setActiveTaskTab}
                handleSaveTask={handleSaveTask}
                lawsuits={lawsuits}
                team={team}
                columns={columns}
                getColumnTranslation={getColumnTranslation}
            />

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
                                                {['AudiÃªncia', 'ReuniÃ£o', 'Despacho', 'DiligÃªncia', 'Outro'].map(t => <option key={t} value={t}>{t}</option>)}
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
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">InÃƒÂ­cio</label>
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
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">LocalizaÃ§Ã£o (FÃƒÂ­sica ou Link)</label>
                                            <input
                                                value={editingEvent?.location || ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                placeholder="Ex: FÃ³rum Central ou Zoom Link"
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
            <AssetModal
                isOpen={isAssetModalOpen}
                onClose={() => { setIsAssetModalOpen(false); setActiveAssetTab('basic'); }}
                editingAsset={editingAsset}
                setEditingAsset={setEditingAsset}
                activeTab={activeAssetTab}
                setActiveTab={setActiveAssetTab}
                handleSaveAsset={handleSaveAsset}
                persons={persons}
                lawsuits={lawsuits}
                justificationText={justificationText}
                setJustificationText={setJustificationText}
                assetTimeline={assetTimeline}
                setAssetTimeline={setAssetTimeline}
                isTimelineLoading={isAssetTimelineLoading}
                team={team}
                user={user}
                assetDocuments={assetDocuments}
                pendingAssetDocuments={pendingAssetDocuments}
                setPendingAssetDocuments={setPendingAssetDocuments}
                isAssetDocModalOpen={isAssetDocModalOpen}
                setIsAssetDocModalOpen={setIsAssetDocModalOpen}
                editingAssetDoc={editingAssetDoc}
                setEditingAssetDoc={setEditingAssetDoc}
                handleSaveAssetDocument={handleSaveAssetDocument}
                assetDocUploadRef={assetDocUploadRef}
                assetDocFile={assetDocFile}
                setAssetDocFile={setAssetDocFile}
                handleDownloadFile={handleDownloadFile}
                handleSummarizeDocument={handleSummarizeDocument}
                handleDeleteAssetDocument={handleDeleteAssetDocument}
            />

            {/* Corporate Entity Modal (The "Big One") */}
            <CorporateEntityModal
                isOpen={isEntityModalOpen}
                onClose={() => { setIsEntityModalOpen(false); setActiveEntityTab('basic'); }}
                editingEntity={editingEntity}
                setEditingEntity={setEditingEntity}
                activeTab={activeEntityTab}
                setActiveTab={setActiveEntityTab}
                handleSaveEntity={handleSaveEntity}
                handleOpenNexoVisual={handleOpenNexoVisual}
                shareholders={shareholders}
                corporateDocuments={corporateDocuments}
                pendingCorporateDocuments={pendingCorporateDocuments}
                setPendingCorporateDocuments={setPendingCorporateDocuments}
                corporateTimeline={corporateTimeline}
                isTimelineLoading={isCorporateTimelineLoading}
                team={team}
                user={user}
                justificationText={justificationText}
                setJustificationText={setJustificationText}
                handleDeleteShareholder={handleDeleteShareholder}
                handleDeleteDocument={handleDeleteDocument}
                handleDownloadFile={handleDownloadFile}
                handleSummarizeDocument={handleSummarizeDocument}
                isShareholderModalOpen={isShareholderModalOpen}
                setIsShareholderModalOpen={setIsShareholderModalOpen}
                editingShareholder={editingShareholder}
                setEditingShareholder={setEditingShareholder}
                handleSaveShareholder={handleSaveShareholder}
                isDocumentModalOpen={isDocumentModalOpen}
                setIsDocumentModalOpen={setIsDocumentModalOpen}
                editingDocument={editingDocument}
                setEditingDocument={setEditingDocument}
                handleSaveDocument={handleSaveDocument}
                corporateDocUploadRef={corporateDocUploadRef}
                setCorporateDocFile={setCorporateDocFile}
                ENTITY_TYPES={ENTITY_TYPES}
                TAX_REGIMES={TAX_REGIMES}
                ENTITY_STATUSES={ENTITY_STATUSES}
                formatCurrency={formatCurrency}
            />




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
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-1">CogniÃ§Ã£o Artificial Veritum</p>
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
                                        As informaÃ§Ãµes apresentadas sÃ£o geradas por inteligÃªncia artificial e devem ser validadas por um profissional jurÃ­dico antes de qualquer tomada de decisÃ£o.
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
                                        <p className="text-sm font-bold text-slate-400">Nenhum registro de histÃ³rico encontrado para este item.</p>
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
                                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">ResponsÃ¡vel</span>
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
                        if (category && ['Autor', 'RÃ©u', 'ResponsÃ¡vel', 'ProprietÃ¡rio', 'SÃ³cio', 'GestÃ£o', 'Origem'].includes(category)) {
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
        </div>
    );
};

export default Nexus;

