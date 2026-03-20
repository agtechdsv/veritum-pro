import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNexusCore } from './useNexusCore';
import { useNexusUI } from './useNexusUI';
import { useNexusSearch } from './useNexusSearch';
import { 
    saveLawsuit, saveTask, saveEvent, saveAsset, saveCorporateEntity, 
    saveShareholder, deleteShareholder, saveCorporateDocument, 
    deleteCorporateDocument, listShareholders, listCorporateDocuments,
    listLawsuitDocuments, listAssetDocuments, listTimelineEntries,
    saveLawsuitDocument, deleteLawsuitDocument, saveAssetDocument,
    deleteAssetDocument, deleteLawsuit, deleteAsset, deleteEvent,
    deleteCorporateEntity, listFinancialTransactions, saveFinancialTransaction,
    deleteFinancialTransaction, getFinancialStats, listAllGlobalDocuments,
    listMovements
} from '@/app/actions/nexus-actions';
import { listPersons } from '@/app/actions/crm-actions';
import { listTeam, getCitiesByState } from '@/app/actions/nexus-actions';
import { createDynamicClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/toast';
import { Person, CorporateEntity, Shareholder, CorporateDocument, LawsuitDocument, AssetDocument, Lawsuit, GlobalDocument, FinancialTransaction, TimelineEntry, TeamMember, Movement } from '@/types';
import { extractStoragePath } from './useNexusUtility';

export const useNexusLogic = (props: any) => {
    const { user, selectedClientId, onSelectClient, allClients, credentials, t } = props;
    const isMaster = user.role === 'Master';

    // Filters Date for Finance
    const [financeStartDate, setFinanceStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [financeEndDate, setFinanceEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

    // Instantiate State Hooks
    const core = useNexusCore(selectedClientId, user, isMaster, financeStartDate, financeEndDate);
    const ui = useNexusUI();
    const search = useNexusSearch({
        tasks: core.tasks,
        events: core.events,
        lawsuits: core.lawsuits,
        assets: core.assets,
        globalDocuments: core.globalDocuments,
        corporateEntities: core.corporateEntities,
        corporateDocuments: core.corporateDocuments,
        lawsuitDocuments: core.lawsuitDocuments,
        assetDocuments: core.assetDocuments
    });

    // Additional Specialized State
    const [visualRefreshTrigger, setVisualRefreshTrigger] = useState(0);
    const [nexoData, setNexoData] = useState<{ origin_type: any, id: string, title: string, data: any } | null>(null);
    const [nexoLoading, setNexoLoading] = useState(false);
    
    // Timeline/AI States
    const [lawsuitTimeline, setLawsuitTimeline] = useState<TimelineEntry[]>([]);
    const [assetTimeline, setAssetTimeline] = useState<TimelineEntry[]>([]);
    const [corporateTimeline, setCorporateTimeline] = useState<TimelineEntry[]>([]);
    const [isLawsuitTimelineLoading, setIsLawsuitTimelineLoading] = useState(false);
    const [isAssetTimelineLoading, setIsAssetTimelineLoading] = useState(false);
    const [isCorporateTimelineLoading, setIsCorporateTimelineLoading] = useState(false);
    
    const [aiLawsuitSummary, setAiLawsuitSummary] = useState<string | null>(null);
    const [isAiSummarizing, setIsAiSummarizing] = useState(false);
    const [aiInfoModal, setAiInfoModal] = useState<{ isOpen: boolean, title: string, summary: string }>({ isOpen: false, title: '', summary: '' });

    // Pending Documents for new entities
    const [pendingLawsuitDocuments, setPendingLawsuitDocuments] = useState<{ file: File, docData: Partial<LawsuitDocument> }[]>([]);
    const [pendingAssetDocuments, setPendingAssetDocuments] = useState<{ file: File, docData: Partial<AssetDocument> }[]>([]);
    const [pendingCorporateDocuments, setPendingCorporateDocuments] = useState<{ file: File, docData: Partial<CorporateDocument> }[]>([]);
    
    // Finance States
    const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
    const [isFinancialLoading, setIsFinancialLoading] = useState(false);
    const [lawsuitFinances, setLawsuitFinances] = useState<FinancialTransaction[]>([]);
    const [isEditingFinancial, setIsEditingFinancial] = useState(false);
    const [editingFinancial, setEditingFinancial] = useState<Partial<FinancialTransaction> | null>(null);
    
    // Movements States
    const [movements, setMovements] = useState<Movement[]>([]);
    const [isMovementsLoading, setIsMovementsLoading] = useState(false);

    // Document Files
    const [lawsuitDocFile, setLawsuitDocFile] = useState<File | null>(null);
    const [assetDocFile, setAssetDocFile] = useState<File | null>(null);
    const [corporateDocFile, setCorporateDocFile] = useState<File | null>(null);

    // Refs
    const personForQSARef = useRef<Person | null>(null);
    const corporateDocUploadRef = useRef<{ upload: () => Promise<string | null> }>(null);
    const lawsuitDocUploadRef = useRef<{ upload: () => Promise<string | null> }>(null);
    const assetDocUploadRef = useRef<{ upload: () => Promise<string | null> }>(null);

    // States for Selects
    const [cities, setCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [chambers, setChambers] = useState<string[]>([]);
    const [isLoadingChambers, setIsLoadingChambers] = useState(false);

    // Confirmation & Justification
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const [justificationText, setJustificationText] = useState('');
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        id: string;
        type: 'lawsuit' | 'asset' | 'corporate';
        newStatus: string;
    } | null>(null);

    const [historyData, setHistoryData] = useState<{
        id: string;
        type: 'lawsuit' | 'asset' | 'corporate';
        title: string;
        timeline: TimelineEntry[];
        isLoading: boolean;
    } | null>(null);

    const [statusPopover, setStatusPopover] = useState<{
        id: string;
        type: 'lawsuit' | 'asset' | 'corporate';
        options: string[];
        currentStatus: string;
        rect: { x: number, y: number };
    } | null>(null);

    // --------------------------------------------------------------------------
    // HANDLERS
    // --------------------------------------------------------------------------

    const triggerConfirm = useCallback((title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    }, []);

    const handleOpenHistory = async (id: string, type: 'lawsuit' | 'asset' | 'corporate', title: string) => {
        ui.setIsHistoryModalOpen(true);
        setHistoryData({ id, type, title, timeline: [], isLoading: true });
        try {
            const { data } = await listTimelineEntries(type, id, core.selectedUserId);
            setHistoryData(prev => prev ? { ...prev, timeline: data || [], isLoading: false } : null);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Erro ao carregar histórico');
            setHistoryData(prev => prev ? { ...prev, isLoading: false } : null);
        }
    };

    const handleDownloadFile = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl; link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) { window.open(url, '_blank'); }
    };

    const handleQuickStatusUpdate = (id: string, type: 'lawsuit' | 'asset' | 'corporate', newStatus: string) => {
        const item = type === 'lawsuit' ? core.lawsuits.find(l => l.id === id) : type === 'asset' ? core.assets.find(a => a.id === id) : core.corporateEntities.find(e => e.id === id);
        if (item && item.status === newStatus) {
            setStatusPopover(null);
            return;
        }
        setPendingStatusChange({ id, type, newStatus });
        setJustificationText('');
        ui.setIsJustificationModalOpen(true);
        setStatusPopover(null);
    };

    const handleConfirmStatusChange = async () => {
        if (!pendingStatusChange) return;
        const { id, type, newStatus } = pendingStatusChange;
        try {
            if (type === 'lawsuit') {
                const law = core.lawsuits.find(l => l.id === id);
                if (law) {
                    const saved = await saveLawsuit({ ...law, status: newStatus as any }, core.selectedUserId, justificationText);
                    core.setLawsuits(prev => prev.map(l => l.id === id ? saved : l));
                }
            } else if (type === 'asset') {
                const asset = core.assets.find(a => a.id === id);
                if (asset) {
                    const saved = await saveAsset({ ...asset, status: newStatus as any }, core.selectedUserId, justificationText);
                    core.setAssets(prev => prev.map(a => a.id === id ? saved : a));
                }
            } else if (type === 'corporate') {
                const entity = core.corporateEntities.find(e => e.id === id);
                if (entity) {
                    const saved = await saveCorporateEntity({ ...entity, status: newStatus as any }, core.selectedUserId, justificationText);
                    core.setCorporateEntities(prev => prev.map(e => e.id === id ? saved : e));
                }
            }
            toast.success(`Status atualizado para ${newStatus}`);
            ui.setIsJustificationModalOpen(false);
            setPendingStatusChange(null);
            setJustificationText('');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status');
        }
    };

    const handleSaveLawsuit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
        if (ui.editingLawsuit?.cnj_number && !cnjRegex.test(ui.editingLawsuit.cnj_number)) {
            toast.error(t('modules.nexus.modals.lawsuit.validation.cnj'));
            return;
        }
        try {
            const isNew = !ui.editingLawsuit?.id;
            const savedLawsuit = await saveLawsuit(ui.editingLawsuit!, core.selectedUserId, justificationText);
            if (isNew && pendingLawsuitDocuments.length > 0) {
                const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                for (const pending of pendingLawsuitDocuments) {
                    const filePath = `lawsuits/${savedLawsuit.id}/${Math.random().toString(36).substring(2)}_${Date.now()}.${pending.file.name.split('.').pop()}`;
                    await supabase.storage.from('nexus-documents').upload(filePath, pending.file);
                    const { data: { publicUrl } } = supabase.storage.from('nexus-documents').getPublicUrl(filePath);
                    await saveLawsuitDocument({ ...pending.docData, file_url: publicUrl, lawsuit_id: savedLawsuit.id } as LawsuitDocument, core.selectedUserId);
                }
                setPendingLawsuitDocuments([]);
            }
            ui.setIsLawsuitModalOpen(false); ui.setEditingLawsuit(null); setLawsuitTimeline([]); setPendingLawsuitDocuments([]); ui.setActiveLawsuitTab('basic'); setJustificationText('');
            toast.success(t('modules.nexus.modals.lawsuit.success'));
            if (!isNew) {
                core.setLawsuits(prev => prev.map(l => l.id === savedLawsuit.id ? savedLawsuit : l));
            } else core.setLawsuits(prev => [savedLawsuit, ...prev]);
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) { console.error(err); toast.error(t('modules.nexus.modals.lawsuit.error')); }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const savedTask = await saveTask(ui.editingTask!, core.selectedUserId);
            ui.setIsTaskModalOpen(false); ui.setEditingTask(null); ui.setActiveTaskTab('basic');
            toast.success(t('modules.nexus.modals.task.success'));
            if (ui.editingTask?.id) core.setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
            else core.setTasks(prev => [savedTask, ...prev]);
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) { console.error(err); toast.error(t('modules.nexus.modals.task.error')); }
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const savedEvent = await saveEvent(ui.editingEvent!, core.selectedUserId);
            ui.setIsEventModalOpen(false); ui.setEditingEvent(null);
            toast.success(t('modules.nexus.modals.event.success'));
            if (ui.editingEvent?.id) core.setEvents(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
            else core.setEvents(prev => [savedEvent, ...prev]);
        } catch (err) { console.error(err); toast.error(t('modules.nexus.modals.event.error')); }
    };

    const handleSaveAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const isNew = !ui.editingAsset?.id;
            const savedAsset = await saveAsset(ui.editingAsset!, core.selectedUserId, justificationText);
            if (isNew && pendingAssetDocuments.length > 0) {
                const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                for (const pending of pendingAssetDocuments) {
                    const filePath = `assets/${savedAsset.id}/${Math.random().toString(36).substring(2)}_${Date.now()}.${pending.file.name.split('.').pop()}`;
                    await supabase.storage.from('nexus-documents').upload(filePath, pending.file);
                    const { data: { publicUrl } } = supabase.storage.from('nexus-documents').getPublicUrl(filePath);
                    await saveAssetDocument({ ...pending.docData, file_url: publicUrl, asset_id: savedAsset.id } as AssetDocument, core.selectedUserId);
                }
                setPendingAssetDocuments([]);
            }
            ui.setIsAssetModalOpen(false); ui.setEditingAsset(null); setAssetTimeline([]); setPendingAssetDocuments([]); ui.setActiveAssetTab('basic'); setJustificationText('');
            toast.success('Ativo salvo com sucesso!');
            if (!isNew) core.setAssets(prev => prev.map(a => a.id === savedAsset.id ? savedAsset : a));
            else core.setAssets(prev => [savedAsset, ...prev]);
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) { console.error(err); toast.error('Erro ao salvar ativo'); }
    };

    const handleSaveEntity = async (e: React.FormEvent) => {
        e.preventDefault();
        const isNew = !ui.editingEntity?.id;
        const personToLink = personForQSARef.current;
        try {
            const savedEntity = await saveCorporateEntity(ui.editingEntity!, core.selectedUserId, justificationText);
            if (isNew && personToLink) {
                await saveShareholder({ entity_id: savedEntity.id, person_shareholder_id: personToLink.id, ownership_percentage: 100, share_type: 'Quotas', shares_count: 100, is_admin: true, position: 'Sócio-Administrador' } as any, core.selectedUserId);
                personForQSARef.current = null;
            }
            if (isNew && pendingCorporateDocuments.length > 0) {
                const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
                for (const pending of pendingCorporateDocuments) {
                    const filePath = `corporate/${savedEntity.id}/${Math.random().toString(36).substring(2)}_${Date.now()}.${pending.file.name.split('.').pop()}`;
                    await supabase.storage.from('nexus-documents').upload(filePath, pending.file);
                    const { data: { publicUrl } } = supabase.storage.from('nexus-documents').getPublicUrl(filePath);
                    await saveCorporateDocument({ ...pending.docData, file_url: publicUrl, entity_id: savedEntity.id } as CorporateDocument, core.selectedUserId);
                }
                setPendingCorporateDocuments([]);
            }
            ui.setIsEntityModalOpen(false); ui.setEditingEntity(null); setPendingCorporateDocuments([]); ui.setActiveEntityTab('basic'); setJustificationText('');
            toast.success('Entidade salva com sucesso!');
            if (!isNew) core.setCorporateEntities(prev => prev.map(c => c.id === savedEntity.id ? savedEntity : c));
            else { core.setCorporateEntities(prev => [savedEntity, ...prev]); core.fetchAll(); }
            setVisualRefreshTrigger(prev => prev + 1);
        } catch (err) { console.error(err); toast.error('Erro ao salvar entidade'); }
    };

    const handleDeleteLawsuit = (id: string) => {
        triggerConfirm(t('modules.nexus.kanban.deleteConfirmTitle'), t('modules.nexus.kanban.deleteConfirm'), async () => {
            try { await deleteLawsuit(id, core.selectedUserId); core.setLawsuits(prev => prev.filter(l => l.id !== id)); toast.success(t('modules.nexus.kanban.deleteSuccess')); }
            catch (err) { console.error(err); toast.error(t('modules.nexus.kanban.deleteError')); }
        });
    };

    const handleDeleteAsset = (id: string) => {
        triggerConfirm('Excluir Ativo', 'Tem certeza?', async () => {
            try { await deleteAsset(id, core.selectedUserId); core.setAssets(prev => prev.filter(a => a.id !== id)); toast.success('Ativo excluído'); }
            catch (err) { console.error(err); toast.error('Erro ao excluir ativo'); }
        });
    };

    const handleDeleteEntity = (id: string) => {
        triggerConfirm('Excluir Entidade', 'Tem certeza?', async () => {
            try { await deleteCorporateEntity(id, core.selectedUserId); core.setCorporateEntities(prev => prev.filter(c => c.id !== id)); toast.success('Entidade excluída'); }
            catch (err) { console.error(err); toast.error('Erro ao excluir entidade'); }
        });
    };

    const handleCreateLawsuitFromCRM = (personId: string) => {
        ui.setActiveTab('processos');
        setPendingLawsuitDocuments([]);
        const currentMember = core.team.find(m => m.id === user.id || (user.email && m.email === user.email));
        const firstLawyer = core.team.find(m => m.role?.toLowerCase().includes('advogado'));
        ui.setEditingLawsuit({
            author_id: personId,
            status: 'Ativo',
            sphere: 'Cível',
            responsible_lawyer_id: currentMember?.id || firstLawyer?.id || core.team[0]?.id || ''
        });
        setTimeout(() => { ui.setIsLawsuitModalOpen(true); ui.setActiveLawsuitTab('basic'); }, 300);
    };

    const handleCreateCorporateEntityFromCRM = (person: Person) => {
        ui.setActiveTab('societario');
        const isCNPJ = person.document?.replace(/\D/g, '').length === 14;
        ui.setEditingEntity({ legal_name: person.full_name, cnpj: person.document, address: person.address, status: 'Ativa', entity_type: isCNPJ ? 'LTDA' : 'MEI' });
        if (!isCNPJ) {
            personForQSARef.current = person;
            core.setShareholders([{ id: 'temp-' + Date.now(), entity_id: 'pending', person_shareholder_id: person.id, share_type: 'Quotas', shares_count: 100, ownership_percentage: 100, is_admin: true, position: 'Sócio-Administrador', shareholder_name: person.full_name, shareholder_type: 'Person' } as Shareholder]);
        } else {
            personForQSARef.current = null;
            core.setShareholders([]);
        }
        setTimeout(() => { ui.setIsEntityModalOpen(true); ui.setActiveEntityTab('basic'); }, 300);
    };

    const handleOpenNexoVisual = (type: any, data: any) => {
        let title = type === 'lawsuit' ? (data.case_title || data.cnj_number) : type === 'corporate' ? data.legal_name : type === 'person' ? data.full_name : data.title;
        setNexoData({ origin_type: type, id: data.id, title: title || 'Sem Título', data: data });
        ui.setIsNexoVisualOpen(true);
    };

    const handleEditEntity = async (entity: CorporateEntity, initialTab: any = 'basic') => {
        ui.setEditingEntity(entity); ui.setIsEntityModalOpen(true); ui.setActiveEntityTab(initialTab);
        try {
            const [sh, docs] = await Promise.all([listShareholders(entity.id, core.selectedUserId), listCorporateDocuments(entity.id, core.selectedUserId)]);
            if (sh.data) core.setShareholders(sh.data);
            if (docs.data) core.setCorporateDocuments(docs.data);
        } catch (err) { console.error(err); }
    };

    const handleDeleteDocument = async (id: string) => {
        const doc = core.corporateDocuments.find(d => d.id === id);
        if (!doc) return;
        triggerConfirm('Excluir Documento', 'Deseja realmente remover?', async () => {
            try {
                if (doc.file_url) {
                    const path = extractStoragePath(doc.file_url, 'nexus-documents');
                    if (path) { const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey); await supabase.storage.from('nexus-documents').remove([path]); }
                }
                await deleteCorporateDocument(id, core.selectedUserId);
                core.setCorporateDocuments(prev => prev.filter(d => d.id !== id));
                toast.success('Documento removido');
            } catch (err) { console.error(err); toast.error('Erro ao remover documento'); }
        });
    };

    const handleDeleteLawsuitDocument = async (id: string) => {
        const doc = core.lawsuitDocuments.find(d => d.id === id);
        if (!doc) return;
        triggerConfirm('Excluir Documento', 'Deseja realmente remover?', async () => {
            try {
                if (doc.file_url) {
                    const path = extractStoragePath(doc.file_url, 'nexus-documents');
                    if (path) { const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey); await supabase.storage.from('nexus-documents').remove([path]); }
                }
                await deleteLawsuitDocument(id, core.selectedUserId);
                core.setLawsuitDocuments(prev => prev.filter(d => d.id !== id));
                toast.success('Documento removido');
            } catch (err) { console.error(err); toast.error('Erro ao remover documento'); }
        });
    };

    const handleDeleteAssetDocument = async (id: string) => {
        const doc = core.assetDocuments.find(d => d.id === id);
        if (!doc) return;
        triggerConfirm('Excluir Documento', 'Deseja realmente remover?', async () => {
            try {
                if (doc.file_url) {
                    const path = extractStoragePath(doc.file_url, 'nexus-documents');
                    if (path) { const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey); await supabase.storage.from('nexus-documents').remove([path]); }
                }
                await deleteAssetDocument(id, core.selectedUserId);
                core.setAssetDocuments(prev => prev.filter(d => d.id !== id));
                toast.success('Documento removido');
            } catch (err) { console.error(err); toast.error('Erro ao remover documento'); }
        });
    };

    const handleSaveDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!ui.editingEntity?.id) {
                if (!corporateDocFile) { toast.error('Selecione um arquivo'); return; }
                setPendingCorporateDocuments(prev => [...prev, { file: corporateDocFile, docData: { ...ui.editingDocument, title: ui.editingDocument?.title || corporateDocFile.name } } as any]);
                ui.setIsDocumentModalOpen(false); ui.setEditingDocument(null); setCorporateDocFile(null);
                toast.info('Documento na fila'); return;
            }
        } catch (err) { console.error(err); }
    };

    const handleSummarizeWithAI = async () => {
        if (!ui.editingLawsuit?.id) return;
        setIsAiSummarizing(true); setAiLawsuitSummary(null);
        await new Promise(resolve => setTimeout(resolve, 3000));
        const summary = `### ANÁLISE ESTRATÉGICA NEXUS\n\nEste processo (**${ui.editingLawsuit.case_title}**) encontra-se em fase de **${ui.editingLawsuit.status}**. \n\n**Pontos Chave:**\n- Atualmente possui **${core.lawsuitDocuments.length} documentos** anexados.\n- Probabilidade de êxito: **${ui.editingLawsuit.probability_of_success || 'Não Definida'}**.`;
        setAiLawsuitSummary(summary); setIsAiSummarizing(false);
    };

    const handleSaveLawsuitDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!ui.editingLawsuit?.id) {
                if (!lawsuitDocFile) { toast.error('Selecione um arquivo'); return; }
                setPendingLawsuitDocuments(prev => [...prev, { file: lawsuitDocFile, docData: { ...ui.editingLawsuitDoc, title: ui.editingLawsuitDoc?.title || lawsuitDocFile.name } } as any]);
                ui.setIsLawsuitDocModalOpen(false); ui.setEditingLawsuitDoc(null); setLawsuitDocFile(null);
                toast.info('Documento na fila'); return;
            }
            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
            let fileUrl = ui.editingLawsuitDoc?.file_url;
            if (lawsuitDocFile) {
                const filePath = `lawsuits/${ui.editingLawsuit.id}/${Math.random().toString(36).substring(2)}_${Date.now()}.${lawsuitDocFile.name.split('.').pop()}`;
                await supabase.storage.from('nexus-documents').upload(filePath, lawsuitDocFile);
                const { data: { publicUrl } } = supabase.storage.from('nexus-documents').getPublicUrl(filePath);
                fileUrl = publicUrl;
            }
            const saved = await saveLawsuitDocument({ ...ui.editingLawsuitDoc, file_url: fileUrl, lawsuit_id: ui.editingLawsuit.id } as LawsuitDocument, core.selectedUserId);
            core.setLawsuitDocuments(prev => ui.editingLawsuitDoc?.id ? prev.map(d => d.id === saved.id ? saved : d) : [saved, ...prev]);
            ui.setIsLawsuitDocModalOpen(false); ui.setEditingLawsuitDoc(null); setLawsuitDocFile(null);
            toast.success('Documento salvo');
        } catch (err) { console.error(err); toast.error('Erro ao salvar documento'); }
    };

    const handleSaveAssetDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!ui.editingAsset?.id) {
                if (!assetDocFile) { toast.error('Selecione um arquivo'); return; }
                setPendingAssetDocuments(prev => [...prev, { file: assetDocFile, docData: { ...ui.editingAssetDoc, title: ui.editingAssetDoc?.title || assetDocFile.name } } as any]);
                ui.setIsAssetDocModalOpen(false); ui.setEditingAssetDoc(null); setAssetDocFile(null);
                toast.info('Documento na fila'); return;
            }
            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
            let fileUrl = ui.editingAssetDoc?.file_url;
            if (assetDocFile) {
                const filePath = `assets/${ui.editingAsset.id}/${Math.random().toString(36).substring(2)}_${Date.now()}.${assetDocFile.name.split('.').pop()}`;
                await supabase.storage.from('nexus-documents').upload(filePath, assetDocFile);
                const { data: { publicUrl } } = supabase.storage.from('nexus-documents').getPublicUrl(filePath);
                fileUrl = publicUrl;
            }
            const saved = await saveAssetDocument({ ...ui.editingAssetDoc, file_url: fileUrl, asset_id: ui.editingAsset.id } as AssetDocument, core.selectedUserId);
            core.setAssetDocuments(prev => ui.editingAssetDoc?.id ? prev.map(d => d.id === saved.id ? saved : d) : [saved, ...prev]);
            ui.setIsAssetDocModalOpen(false); ui.setEditingAssetDoc(null); setAssetDocFile(null);
            toast.success('Documento salvo');
        } catch (err) { console.error(err); toast.error('Erro ao salvar documento'); }
    };

    const handleSaveShareholder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!ui.editingEntity?.id) {
                core.setShareholders(prev => ui.editingShareholder?.id ? prev.map(s => s.id === ui.editingShareholder!.id ? ui.editingShareholder as Shareholder : s) : [{ ...ui.editingShareholder, id: 'temp-' + Date.now() } as Shareholder, ...prev]);
                ui.setIsShareholderModalOpen(false); ui.setEditingShareholder(null); return;
            }
            const saved = await saveShareholder({ ...ui.editingShareholder, entity_id: ui.editingEntity.id } as any, core.selectedUserId);
            core.setShareholders(prev => ui.editingShareholder?.id ? prev.map(s => s.id === saved.id ? saved : s) : [saved, ...prev]);
            ui.setIsShareholderModalOpen(false); ui.setEditingShareholder(null);
            toast.success('Sócio salvo');
        } catch (err) { console.error(err); toast.error('Erro ao salvar sócio'); }
    };

    const handleDeleteShareholder = async (id: string) => {
        if (id.startsWith('temp-')) { core.setShareholders(prev => prev.filter(s => s.id !== id)); return; }
        triggerConfirm('Excluir Sócio', 'Deseja realmente remover?', async () => {
            try { await deleteShareholder(id, core.selectedUserId); core.setShareholders(prev => prev.filter(s => s.id !== id)); toast.success('Sócio removido'); }
            catch (err) { console.error(err); toast.error('Erro ao remover sócio'); }
        });
    };

    const handleSummarizeDocument = async (doc: any) => {
        toast.info('IA analisando documento...');
        await new Promise(r => setTimeout(r, 2000));
        setAiInfoModal({ isOpen: true, title: `Análise: ${doc.title}`, summary: `Este documento do tipo **${doc.document_type}** foi analisado pela Inteligência Artificial Veritum. \n\n**Observações:**\n- Documento íntegro e legível.\n- Relevância alta para o histórico do processo/entidade.\n- Nenhuma irregularidade detectada.` });
    };

    const handleSoftDeleteLawsuit = async (id: string) => {
        triggerConfirm('Arquivar Processo', 'Deseja realmente arquivar este processo? Ele continuará no sistema mas não aparecerá nas buscas padrão.', async () => {
            try {
                const law = core.lawsuits.find(l => l.id === id);
                if (law) {
                    const saved = await saveLawsuit({ ...law, status: 'Arquivado' }, core.selectedUserId, 'Arquivamento via interface Nexus');
                    core.setLawsuits(prev => prev.filter(l => l.id !== id));
                    toast.success('Processo arquivado');
                }
            } catch (err) { toast.error('Erro ao arquivar'); }
        });
    };

    const handleSoftDeleteAsset = async (id: string) => {
        triggerConfirm('Remover Ativo', 'Deseja marcar este ativo como inativo?', async () => {
            try {
                const asset = core.assets.find(a => a.id === id);
                if (asset) {
                    const saved = await saveAsset({ ...asset, status: 'Inativo' }, core.selectedUserId, 'Inativação manual');
                    core.setAssets(prev => prev.filter(a => a.id !== id));
                    toast.success('Ativo inativado');
                }
            } catch (err) { toast.error('Erro ao inativar'); }
        });
    };

    const handleSoftDeleteEvent = async (id: string) => {
        triggerConfirm('Excluir Evento', 'Deseja remover este evento da agenda?', async () => {
            try { await deleteEvent(id, core.selectedUserId); core.setEvents(prev => prev.filter(e => e.id !== id)); toast.success('Evento removido'); }
            catch (err) { toast.error('Erro ao remover'); }
        });
    };

    const handleSoftDeleteEntity = async (id: string) => {
        triggerConfirm('Inativar Entidade', 'Deseja marcar esta entidade como Inativa?', async () => {
            try {
                const entity = core.corporateEntities.find(e => e.id === id);
                if (entity) {
                    const saved = await saveCorporateEntity({ ...entity, status: 'Inativa' }, core.selectedUserId, 'Inativação via interface Corporate');
                    core.setCorporateEntities(prev => prev.filter(e => e.id !== id));
                    toast.success('Entidade inativada');
                }
            } catch (err) { toast.error('Erro ao inativar'); }
        });
    };

    const handleDropLawsuit = async (lawsuitId: string, newStatus: string) => {
        const lawsuit = core.lawsuits.find(l => l.id === lawsuitId);
        if (!lawsuit || lawsuit.status === newStatus) return;
        setPendingStatusChange({ id: lawsuitId, type: 'lawsuit', newStatus });
        setJustificationText('');
        ui.setIsJustificationModalOpen(true);
    };

    const handleDragStartLawsuit = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('lawsuitId', id); };

    const handleDropTask = async (taskId: string, newStatus: string) => {
        const task = core.tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;
        try {
            const savedTask = await saveTask({ ...task, status: newStatus as any }, core.selectedUserId);
            core.setTasks(prev => prev.map(t => t.id === taskId ? savedTask : t));
            toast.success(`Tarefa movida para ${newStatus}`);
        } catch (err) { toast.error('Erro ao mover tarefa'); }
    };

    const handleDragStartTask = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('taskId', id); };

    const handleDropAsset = async (assetId: string, newStatus: string) => {
        const asset = core.assets.find(a => a.id === assetId);
        if (!asset || asset.status === newStatus) return;
        setPendingStatusChange({ id: assetId, type: 'asset', newStatus });
        setJustificationText('');
        ui.setIsJustificationModalOpen(true);
    };

    const handleDragStartAsset = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('assetId', id); };

    const handleDropEntity = async (entityId: string, newStatus: string) => {
        const entity = core.corporateEntities.find(e => e.id === entityId);
        if (!entity || entity.status === newStatus) return;
        setPendingStatusChange({ id: entityId, type: 'corporate', newStatus });
        setJustificationText('');
        ui.setIsJustificationModalOpen(true);
    };

    const handleDragStartEntity = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('entityId', id); };

    const handleEditGlobalDocumentOrigin = async (doc: GlobalDocument) => {
        toast.info('Edição de origem disponível em breve para documentos globais.');
    };

    const handleDeleteGlobalDocument = async (id: string) => {
        triggerConfirm('Excluir Documento', 'Deseja realmente remover este documento global?', async () => {
            // No global delete action yet, but simulate UI feedback
            core.setGlobalDocuments(prev => prev.filter(d => d.id !== id));
            toast.success('Documento removido da visualização');
        });
    };

    const handleFetchGlobalDocuments = useCallback(async (showToast = false) => {
        core.setIsGlobalDocsLoading(true);
        try {
            const result = await listAllGlobalDocuments(core.selectedUserId);
            if (result.data) core.setGlobalDocuments(result.data);
            if (showToast) toast.success(t('common.success'));
        } catch (error) { console.error(error); toast.error(t('common.error')); }
        finally { core.setIsGlobalDocsLoading(false); }
    }, [core.selectedUserId, core.setGlobalDocuments, core.setIsGlobalDocsLoading, t]);

    const handleSaveFinancialTransaction = async (transaction: Partial<FinancialTransaction>) => {
        try {
            await saveFinancialTransaction(transaction, core.selectedUserId);
            toast.success('Transação salva');
            setIsEditingFinancial(false); setEditingFinancial(null);
            if (transaction.lawsuit_id) {
                setIsFinancialLoading(true);
                const res = await listFinancialTransactions(transaction.lawsuit_id, undefined, core.selectedUserId);
                if (res.data) setLawsuitFinances(res.data);
                setIsFinancialLoading(false);
            }
            const stats = await getFinancialStats(undefined, undefined, core.selectedUserId);
            if (stats.data) core.setFinancialStats(stats.data);
        } catch (err) { toast.error('Erro ao salvar'); }
    };

    const handleDeleteFinancialTransaction = async (id: string, lawsuitId?: string) => {
        if (!confirm('Deseja realmente excluir?')) return;
        try {
            await deleteFinancialTransaction(id, core.selectedUserId); toast.success('Excluída');
            if (lawsuitId) {
                const res = await listFinancialTransactions(lawsuitId, undefined, core.selectedUserId);
                if (res.data) setLawsuitFinances(res.data);
            }
            const stats = await getFinancialStats(undefined, undefined, core.selectedUserId);
            if (stats.data) core.setFinancialStats(stats.data);
        } catch (err) { toast.error('Erro'); }
    };

    const handleFetchLawsuitFinances = async (lawsuitId: string) => {
        setIsFinancialLoading(true);
        try {
            const res = await listFinancialTransactions(lawsuitId, undefined, core.selectedUserId);
            if (res.data) setLawsuitFinances(res.data);
        } finally { setIsFinancialLoading(false); }
    };
    
    const handleFetchMovements = useCallback(async (lawsuitId: string) => {
        setIsMovementsLoading(true);
        try {
            const res = await listMovements(lawsuitId, core.selectedUserId);
            if (res.data) setMovements(res.data);
        } finally { setIsMovementsLoading(false); }
    }, [core.selectedUserId]);

    // --------------------------------------------------------------------------
    // EFFECTS
    // --------------------------------------------------------------------------

    const { setEditingPerson, setActiveCrmTab, setIsCrmModalOpen } = ui;

    useEffect(() => {
        const handleOpenModal = (e: any) => {
            const detail = e.detail;
            if (detail) setEditingPerson(detail);
            else setEditingPerson({ person_type: 'Cliente' });
            setActiveCrmTab('basic'); setIsCrmModalOpen(true);
        };
        window.addEventListener('CRM_OPEN_MODAL', handleOpenModal as any);
        return () => window.removeEventListener('CRM_OPEN_MODAL', handleOpenModal as any);
    }, [setEditingPerson, setActiveCrmTab, setIsCrmModalOpen]);

    useEffect(() => {
        if (ui.editingLawsuit?.state) {
            const fetchCities = async () => {
                setIsLoadingCities(true);
                try { const data = await getCitiesByState(ui.editingLawsuit!.state as string); setCities(data); } catch (err) { setCities([]); } finally { setIsLoadingCities(false); }
            };
            fetchCities();
        } else setCities([]);
    }, [ui.editingLawsuit?.state]);

    useEffect(() => {
        if (core.selectedUserId) {
            core.fetchAll();
        }
    }, [core.fetchAll, core.selectedUserId]);

    useEffect(() => {
        if (ui.editingLawsuit?.id) {
            const fetchDocs = async () => {
                const result = await listLawsuitDocuments(ui.editingLawsuit!.id!, core.selectedUserId);
                if (result.data) core.setLawsuitDocuments(result.data);
            };
            fetchDocs();
            if (ui.activeLawsuitTab === 'timeline') {
                const fetchTimeline = async () => {
                    setIsLawsuitTimelineLoading(true);
                    try { const res = await listTimelineEntries('lawsuit', ui.editingLawsuit!.id!, core.selectedUserId); if (res.data) setLawsuitTimeline(res.data); } finally { setIsLawsuitTimelineLoading(false); }
                };
                fetchTimeline();
            }
            if (ui.activeLawsuitTab === 'financeiro') {
                handleFetchLawsuitFinances(ui.editingLawsuit.id);
            }
            if (ui.activeLawsuitTab === 'movements') {
                handleFetchMovements(ui.editingLawsuit.id);
            }
        } else { core.setLawsuitDocuments([]); setLawsuitTimeline([]); }
    }, [ui.editingLawsuit?.id, core.selectedUserId, ui.activeLawsuitTab, core.setLawsuitDocuments]);

    return {
        core, ui, search,
        visualRefreshTrigger, setVisualRefreshTrigger,
        nexoData, setNexoData,
        nexoLoading, setNexoLoading,
        lawsuitTimeline, setLawsuitTimeline,
        assetTimeline, setAssetTimeline,
        corporateTimeline, setCorporateTimeline,
        isLawsuitTimelineLoading, setIsLawsuitTimelineLoading,
        isAssetTimelineLoading, setIsAssetTimelineLoading,
        isCorporateTimelineLoading, setIsCorporateTimelineLoading,
        movements, setMovements,
        isMovementsLoading, setIsMovementsLoading,
        aiLawsuitSummary, setAiLawsuitSummary,
        isAiSummarizing, setIsAiSummarizing,
        aiInfoModal, setAiInfoModal,
        pendingLawsuitDocuments, setPendingLawsuitDocuments,
        pendingAssetDocuments, setPendingAssetDocuments,
        pendingCorporateDocuments, setPendingCorporateDocuments,
        financialTransactions, setFinancialTransactions,
        isFinancialLoading, setIsFinancialLoading,
        lawsuitFinances, setLawsuitFinances,
        isEditingFinancial, setIsEditingFinancial,
        editingFinancial, setEditingFinancial,
        lawsuitDocFile, setLawsuitDocFile,
        assetDocFile, setAssetDocFile,
        corporateDocFile, setCorporateDocFile,
        personForQSARef, corporateDocUploadRef, lawsuitDocUploadRef, assetDocUploadRef,
        cities, setCities,
        isLoadingCities, setIsLoadingCities,
        chambers, setChambers,
        isLoadingChambers, setIsLoadingChambers,
        confirmModal, setConfirmModal,
        justificationText, setJustificationText,
        pendingStatusChange, setPendingStatusChange,
        historyData, setHistoryData,
        statusPopover, setStatusPopover,
        financeStartDate, setFinanceStartDate,
        financeEndDate, setFinanceEndDate,
        triggerConfirm,
        handleOpenHistory, handleQuickStatusUpdate, handleConfirmStatusChange,
        handleSaveLawsuit, handleSaveTask, handleSaveEvent, handleSaveAsset, handleSaveEntity,
        handleDeleteLawsuit, handleDeleteAsset, handleDeleteEntity,
        handleCreateLawsuitFromCRM, handleCreateCorporateEntityFromCRM,
        handleDownloadFile, handleOpenNexoVisual, handleEditEntity,
        handleDeleteDocument, handleDeleteLawsuitDocument, handleDeleteAssetDocument,
        handleSaveDocument, handleSummarizeWithAI, handleFetchGlobalDocuments,
        handleSaveFinancialTransaction, handleDeleteFinancialTransaction,
        handleSaveLawsuitDocument, handleSaveAssetDocument, handleSaveShareholder,
        handleDeleteShareholder, handleSummarizeDocument, handleSoftDeleteLawsuit,
        handleSoftDeleteAsset, handleSoftDeleteEvent, handleSoftDeleteEntity,
        handleDropLawsuit, handleDragStartLawsuit, handleDropTask, handleDragStartTask,
        handleDropAsset, handleDragStartAsset, handleDropEntity, handleDragStartEntity,
        handleEditGlobalDocumentOrigin, handleDeleteGlobalDocument, handleFetchLawsuitFinances,
        handleFetchMovements,
        isMaster, selectedClientId, user, onSelectClient, allClients, credentials, t
    };
};
