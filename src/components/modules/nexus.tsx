import React, { useState, useEffect, useRef } from 'react';
import { Credentials, Lawsuit, Task, CalendarEvent, User, Person, TeamMember, Asset, CorporateEntity, Shareholder, CorporateDocument, TaxRegime, EntityStatus, EntityType } from '@/types';
import { Plus, MoreHorizontal, Calendar, Scale, Search, Filter, ArrowRight, AlertTriangle, CheckCircle2, Clock, MapPin, Shield, User as UserIcon, Users, Save, XCircle, Pencil, ChevronRight, ChevronLeft, ChevronDown, Zap, Lock as LockIcon, Trash2, LayoutGrid, List, Building2, FileText, PieChart, Briefcase } from 'lucide-react';
import { createDynamicClient } from '@/utils/supabase/client';
import IntelligenceWidget from '../shared/intelligence-widget';
import { useTranslation } from '@/contexts/language-context';
import PersonManagement from './person-management';
import { useModule } from '@/app/veritumpro/layout';
import { listPersons } from '@/app/actions/crm-actions';
import { listLawsuits, saveLawsuit, deleteLawsuit, listTasks, saveTask, deleteTask, listEvents, saveEvent, deleteEvent, listTeam, getCitiesByState, listAssets, saveAsset, deleteAsset, listCorporateEntities, saveCorporateEntity, deleteCorporateEntity, listShareholders, saveShareholder, deleteShareholder, listCorporateDocuments, saveCorporateDocument, deleteCorporateDocument } from '@/app/actions/nexus-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/toast';
import { createMasterClient } from '@/lib/supabase/master';

// 💎 Premium Combobox Component (Cascading & Searchable)
const PremiumCombobox: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
    disabled?: boolean;
    creatable?: boolean;
}> = ({ value, onChange, options, placeholder, disabled, creatable }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Sync search term with value when closed
    useEffect(() => {
        if (!isOpen) setSearchTerm(value);
    }, [value, isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalize = (str: string) =>
        (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredOptions = options.filter(opt =>
        normalize(opt).includes(normalize(searchTerm))
    ).slice(0, 50);

    const showAddOption = creatable && searchTerm && !options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-text'}`}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                                setSearchTerm('');
                            }}
                            className="p-1 hover:text-rose-500 transition-colors pointer-events-auto"
                        >
                            <XCircle size={14} className="text-slate-300" />
                        </button>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-[110] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-64 overflow-y-auto no-scrollbar">
                            {showAddOption && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(searchTerm.toUpperCase());
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-6 py-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border-b border-slate-50 dark:border-slate-800 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                            <Plus size={14} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Cadastrar Novo</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase">{searchTerm}</span>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold uppercase tracking-tight flex items-center justify-between group ${value === opt ? 'bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        {opt}
                                        {value === opt && <CheckCircle2 size={16} className="text-indigo-600" />}
                                    </button>
                                ))
                            ) : !showAddOption && (
                                <div className="p-8 text-center">
                                    <Search size={24} className="mx-auto text-slate-200 mb-2" />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhum resultado encontrado</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper for KPI area
const TrendingUp = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

const Nexus: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    const { t } = useTranslation();
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
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isLawsuitModalOpen, setIsLawsuitModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingLawsuit, setEditingLawsuit] = useState<Partial<Lawsuit> | null>(null);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);
    const [activeTab, setActiveTab] = useState<'pessoas' | 'processos' | 'tarefas' | 'agenda' | 'ativos' | 'societario'>('pessoas');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeAssetTab, setActiveAssetTab] = useState<'basic' | 'advanced'>('basic');
    const [activeLawsuitTab, setActiveLawsuitTab] = useState<'basic' | 'advanced'>('basic');
    const [activeTaskTab, setActiveTaskTab] = useState<'basic' | 'advanced'>('basic');
    const [processViewStyle, setProcessViewStyle] = useState<'grid' | 'list'>('grid');
    const [assetViewStyle, setAssetViewStyle] = useState<'grid' | 'list'>('grid');
    const [corporateViewStyle, setCorporateViewStyle] = useState<'grid' | 'list'>('grid');
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Partial<CorporateEntity> | null>(null);
    const [activeEntityTab, setActiveEntityTab] = useState<'basic' | 'qsa' | 'docs'>('basic');
    const [corporateSearchTerm, setCorporateSearchTerm] = useState('');
    const [isShareholderModalOpen, setIsShareholderModalOpen] = useState(false);
    const [editingShareholder, setEditingShareholder] = useState<Partial<Shareholder> | null>(null);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<Partial<CorporateDocument> | null>(null);
    const personForQSARef = useRef<Person | null>(null);

    const filteredEntities = corporateEntities.filter(e => 
        e.legal_name.toLowerCase().includes(corporateSearchTerm.toLowerCase()) ||
        e.trading_name?.toLowerCase().includes(corporateSearchTerm.toLowerCase()) ||
        e.cnpj?.includes(corporateSearchTerm)
    );

    // Filters
    const [filterSearchTerm, setFilterSearchTerm] = useState('');
    const [filterResponsibleId, setFilterResponsibleId] = useState('');
    const [filterLawsuitId, setFilterLawsuitId] = useState('');

    // Searchable Select States
    const [authorSearch, setAuthorSearch] = useState('');
    const [defendantSearch, setDefendantSearch] = useState('');
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
    const [isDefendantDropdownOpen, setIsDefendantDropdownOpen] = useState(false);
    const { preferences, onSelectClient, allClients, selectedClientId, credentials: contextCreds } = useModule();

    // Master Selection States
    const isMaster = user.role === 'Master';
    const [selectedUserId, setSelectedUserId] = useState<string>(selectedClientId || (isMaster ? '' : user.id));

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
            const [lawResult, taskResult, eventResult, personResult, teamResult, assetResult, corpResult] = await Promise.all([
                listLawsuits('', targetUserId),
                listTasks('', targetUserId),
                listEvents('', targetUserId),
                listPersons('', targetUserId),
                listTeam(targetUserId),
                listAssets(undefined, undefined, targetUserId),
                listCorporateEntities('', targetUserId)
            ]);

            if (lawResult.data) setLawsuits(lawResult.data);
            if (taskResult.data) setTasks(taskResult.data);
            if (eventResult.data) setEvents(eventResult.data);
            if (personResult.data) setPersons(personResult.data);
            if (teamResult?.data) setTeam(teamResult.data);
            if (assetResult?.data) setAssets(assetResult.data);
            if (corpResult?.data) setCorporateEntities(corpResult.data);

            const hasTableError = lawResult.error === 'TABLE_NOT_FOUND' ||
                taskResult.error === 'TABLE_NOT_FOUND' ||
                eventResult.error === 'TABLE_NOT_FOUND' ||
                personResult.error === 'TABLE_NOT_FOUND' ||
                teamResult?.error === 'TABLE_NOT_FOUND' ||
                assetResult?.error === 'TABLE_NOT_FOUND' ||
                corpResult?.error === 'TABLE_NOT_FOUND';

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

    // Cascading Logic: State -> City
    useEffect(() => {
        if (editingLawsuit?.state) {
            const fetchCities = async () => {
                setIsLoadingCities(true);
                try {
                    const data = await getCitiesByState(editingLawsuit.state as string);
                    console.log(`[Nexus] Cidades carregadas para ${editingLawsuit.state}:`, data.length);
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
                    : ['1ª VARA CÍVEL', '2ª VARA CÍVEL', '3ª VARA CÍVEL', '1ª VARA FEDERAL', '2ª VARA FEDERAL'];

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

    const handleCreateLawsuitFromCRM = (personId: string) => {
        // Switch to lawsuits tab
        setActiveTab('processos');
        // SMART DEFAULT: Try to find the logged-in user in the team first (by ID or Email)
        const currentMember = team.find(m => m.master_user_id === user.id || (user.email && m.email === user.email));

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
            sphere: 'Cível', // Default
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

    const handleSaveLawsuit = async (e: React.FormEvent) => {
        e.preventDefault();

        // CNJ Strict Validation
        const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
        if (editingLawsuit?.cnj_number && !cnjRegex.test(editingLawsuit.cnj_number)) {
            alert(t('modules.nexus.modals.lawsuit.validation.cnj'));
            return;
        }

        try {
            const targetUserId = selectedUserId;
            const savedLawsuit = await saveLawsuit(editingLawsuit!, targetUserId);

            setIsLawsuitModalOpen(false);
            setEditingLawsuit(null);
            setActiveLawsuitTab('basic');
            toast.success(t('modules.nexus.modals.lawsuit.success') || 'Processo salvo com sucesso!');
            
            // State mutation
            if (editingLawsuit?.id) {
                setLawsuits(prev => prev.map(l => l.id === savedLawsuit.id ? savedLawsuit : l));
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
            const savedAsset = await saveAsset(editingAsset!, targetUserId);

            setIsAssetModalOpen(false);
            setEditingAsset(null);
            setActiveAssetTab('basic');
            toast.success('Ativo salvo com sucesso!');
            
            // State mutation
            if (editingAsset?.id) {
                setAssets(prev => prev.map(a => a.id === savedAsset.id ? savedAsset : a));
            } else {
                setAssets(prev => [savedAsset, ...prev]);
            }
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
            const savedEntity = await saveCorporateEntity(editingEntity!, targetUserId);

            // Vínculo automático de sócio se for criação via CRM
            if (isNew && personToLink) {
                try {
                    console.log('[NEXUS-DEBUG] Criando vínculo societário para:', personToLink.full_name);
                    await saveShareholder({
                        entity_id: savedEntity.id,
                        person_shareholder_id: personToLink.id,
                        ownership_percentage: 100,
                        share_type: 'Quotas',
                        shares_count: 100,
                        is_admin: true,
                        position: 'Sócio-Administrador'
                    } as any, targetUserId);
                    
                    toast.success(`${personToLink.full_name} vinculado como sócio 100%`);
                } catch (shErr: any) {
                    console.error('[NEXUS-DEBUG] Erro ao vincular sócio:', shErr);
                    toast.error(`Atenção: A empresa foi salva, mas o QSA falhou: ${shErr.message}`);
                } finally {
                    personForQSARef.current = null;
                }
            }

            setIsEntityModalOpen(false);
            setEditingEntity(null);
            setActiveEntityTab('basic');
            toast.success('Entidade salva com sucesso!');
            
            // State mutation
            if (!isNew) {
                setCorporateEntities(prev => prev.map(c => c.id === savedEntity.id ? savedEntity : c));
            } else {
                setCorporateEntities(prev => [savedEntity, ...prev]);
            }
            
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

    const handleDeleteShareholder = async (id: string) => {
        if (!window.confirm('Excluir este sócio?')) return;
        try {
            await deleteShareholder(id, selectedUserId);
            setShareholders(prev => prev.filter(s => s.id !== id));
            toast.success('Sócio removido');
        } catch (err) {
            console.error('Error deleting shareholder:', err);
            toast.error('Erro ao remover sócio');
        }
    };

    const handleSaveDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            if (!editingEntity?.id) return;

            const docData = {
                ...editingDocument,
                entity_id: editingEntity.id
            } as CorporateDocument;

            const savedDoc = await saveCorporateDocument(docData, targetUserId);

            setIsDocumentModalOpen(false);
            setEditingDocument(null);
            toast.success('Documento salvo com sucesso!');
            
            if (editingDocument?.id) {
                setCorporateDocuments(prev => prev.map(d => d.id === savedDoc.id ? savedDoc : d));
            } else {
                setCorporateDocuments(prev => [savedDoc, ...prev]);
            }
        } catch (err) {
            console.error('Error saving document:', err);
            toast.error('Erro ao salvar documento');
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
        if (!window.confirm('Excluir este documento?')) return;
        try {
            await deleteCorporateDocument(id, selectedUserId);
            setCorporateDocuments(prev => prev.filter(d => d.id !== id));
            toast.success('Documento removido');
        } catch (err) {
            console.error('Error deleting document:', err);
            toast.error('Erro ao remover documento');
        }
    };

    const handleSoftDeleteEntity = async (id: string) => {
        if (!window.confirm('Deseja excluir esta entidade corporativa? Isso removerá o vínculo com QSA e Documentos.')) return;
        try {
            const targetUserId = selectedUserId;
            await deleteCorporateEntity(id, targetUserId);
            toast.success('Entidade excluída!');
            setCorporateEntities(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting entity:', err);
            toast.error('Erro ao excluir entidade');
        }
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
            toast.error('Erro ao mover a tarefa.');
            setTasks(previousTasks); // Rollback
        }
    };

    const handleSoftDeleteLawsuit = async (id: string) => {
        if (!window.confirm(t('modules.nexus.kanban.deleteConfirm'))) return;
        try {
            const targetUserId = selectedUserId;
            await deleteLawsuit(id, targetUserId);
            toast.success(t('modules.nexus.kanban.deleteSuccess') || 'Processo excluído corretamente');
            setLawsuits(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            console.error('Error deleting lawsuit:', err);
            toast.error(t('modules.nexus.kanban.deleteError') || 'Erro ao excluir processo');
        }
    };

    const handleSoftDeleteEvent = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            const targetUserId = selectedUserId;
            await deleteEvent(id, targetUserId);
            toast.success('Evento excluído!');
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Error deleting event:', err);
            toast.error('Erro ao excluir evento');
        }
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
            case 'Baixa': return t('modules.nexus.modals.task.priorities.Low');
            case 'Média': return t('modules.nexus.modals.task.priorities.Medium');
            case 'Alta': return t('modules.nexus.modals.task.priorities.High');
            case 'Urgente': return t('modules.nexus.modals.task.priorities.Urgent');
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
    const ENTITY_STATUSES: EntityStatus[] = ['Ativa', 'Baixada', 'Inativa', 'Em Liquidação'];
    const ENTITY_TYPES: EntityType[] = ['LTDA', 'SA', 'EIRELI', 'MEI', 'Holding', 'Associação', 'Outros'];

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

    const renderFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
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
                    <option value="">👤 Todos os Membros</option>
                    {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={filterLawsuitId}
                    onChange={e => setFilterLawsuitId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">⚖️ Todos os Processos</option>
                    {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number || law.case_title}</option>)}
                </select>
            </div>
            {(filterSearchTerm || filterResponsibleId || filterLawsuitId) && (
                <button
                    onClick={() => { setFilterSearchTerm(''); setFilterResponsibleId(''); setFilterLawsuitId(''); }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title="Limpar Filtros"
                >
                    <Filter size={16} className="relative z-10" />
                    <XCircle size={14} className="relative z-10 -ml-1" />
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
                            { id: 'pessoas', icon: <Users size={14} />, label: `1. ${t('modules.nexus.tabs.people')}` },
                            { id: 'processos', icon: <Scale size={14} />, label: `2. ${t('modules.nexus.tabs.processes')}` },
                            { id: 'tarefas', icon: <Zap size={14} />, label: `3. ${t('modules.nexus.tabs.tasks')}` },
                            { id: 'agenda', icon: <Calendar size={14} />, label: `4. ${t('modules.nexus.tabs.calendar')}` },
                            { id: 'ativos', icon: <Shield size={14} />, label: `5. ${t('modules.nexus.tabs.assets')}` },
                            { id: 'societario', icon: <LockIcon size={14} />, label: `6. ${t('modules.nexus.tabs.corporate')}` }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
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
                                                    🏢 {formattedName} ({formattedEmail})
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
                                    </div>
                                    <button
                                        onClick={() => { setEditingLawsuit({ status: 'Ativo' }); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                        className="bg-slate-800 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-500 dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                                    >
                                        <Plus size={14} /> Novo Processo
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 px-8 pb-8">
                                <AnimatePresence mode="wait">
                                    {processViewStyle === 'list' ? (
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
                                                        ) : lawsuits.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300"><Scale size={40} /></div>
                                                                        <p className="font-bold text-slate-400">{t('modules.nexus.empty.processes')}</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : lawsuits.map((law) => (
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
                                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${law.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                                                        }`}>
                                                                        {law.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-black text-slate-800 dark:text-white">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(law.value || 0)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                                            onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        >
                                                                            <Pencil size={18} />
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
                                                ) : lawsuits.length === 0 ? (
                                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.empty.processes')}</div>
                                                ) : lawsuits.map((law) => {
                                                    const author = persons.find(p => p.id === law.author_id);
                                                    return (
                                                        <div key={law.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{law.cnj_number}</span>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{law.sphere}</span>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${law.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                                    {law.status}
                                                                </span>
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
                                                                        onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                    >
                                                                        <Pencil size={16} />
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
                                                return (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            handleDragStartTask(e, task.id);
                                                            e.currentTarget.classList.add('opacity-50');
                                                        }}
                                                        onDragEnd={(e) => {
                                                            e.currentTarget.classList.remove('opacity-50');
                                                        }}
                                                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing group"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${getSeverityColor(task.due_date, task.status)}`}>
                                                                {getPriorityTranslation(task.priority || 'Média')}
                                                            </span>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                            <div className="flex items-center gap-1 text-slate-400">
                                                                <Calendar size={10} />
                                                                <span className="text-[10px] font-bold">{new Date(task.due_date).toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
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
                                                    return (
                                                        <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">{task.title}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">
                                                                    {getColumnTranslation(task.status)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`text-[10px] font-black uppercase text-slate-500`}>
                                                                    {getPriorityTranslation(task.priority || 'Média')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                                {new Date(task.due_date).toLocaleDateString()}
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
                                                                <button
                                                                    onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>
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
                                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
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
                                                                        <div className={`${isPastEvent ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-200'} font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                                            {new Date(ev.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ev.event_type}
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
                            <div className="flex-1 px-8 pb-8">
                            <AnimatePresence mode="wait">
                                {assetViewStyle === 'list' ? (
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
                                                    {assets.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">Nenhum ativo registrado.</td>
                                                        </tr>
                                                    ) : assets.map((asset) => {
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
                                                                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border ${asset.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'}`}>
                                                                        {asset.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        >
                                                                            <Pencil size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                if (window.confirm('Excluir este ativo permanentemente?')) {
                                                                                    await deleteAsset(asset.id, selectedUserId);
                                                                                    setAssets(prev => prev.filter(a => a.id !== asset.id));
                                                                                }
                                                                            }}
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
                                    ) : assets.length === 0 ? (
                                        <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.empty.assets')}</div>
                                    ) : assets.map((asset) => {
                                        const person = persons.find(p => p.id === asset.person_id);
                                        const lawsuit = lawsuits.find(l => l.id === asset.lawsuit_id);
                                        return (
                                            <div key={asset.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">{asset.asset_type}</span>
                                                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border ${asset.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'}`}>
                                                        {asset.status}
                                                    </span>
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
                                                            onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm('Excluir este ativo?')) {
                                                                    await deleteAsset(asset.id, selectedUserId);
                                                                    setAssets(prev => prev.filter(a => a.id !== asset.id));
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <XCircle size={18} />
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
                                        Entidades & Holdings
                                    </h1>
                                    <p className="text-slate-500 font-bold tracking-wide mt-1">
                                        Gestão de pessoas jurídicas, participações e governança
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <div className="relative group">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input 
                                            type="text"
                                            placeholder="Buscar entidade..."
                                            value={corporateSearchTerm}
                                            onChange={(e) => setCorporateSearchTerm(e.target.value)}
                                            className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-64 outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setCorporateViewStyle('grid')}
                                            className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Cards"
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setCorporateViewStyle('list')}
                                            className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            title="Visualização em Lista"
                                        >
                                            <List size={18} />
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
                                        <Plus size={14} /> Nova Entidade
                                    </button>
                                </div>
                            </div>

                            {/* Tabela/Grade Societário */}
                            <div className="flex-1 px-8 pb-8">
                                <AnimatePresence mode="wait">
                                    {corporateViewStyle === 'list' ? (
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
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                    {filteredEntities.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">Nenhuma entidade encontrada.</td>
                                                        </tr>
                                                    ) : filteredEntities.map((entity: CorporateEntity) => (
                                                        <tr key={entity.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">{entity.legal_name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">{entity.trading_name || 'Sem nome fantasia'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{entity.cnpj || '-'}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase">
                                                                    {entity.entity_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">
                                                                {entity.total_capital ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entity.total_capital) : '-'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border ${entity.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                                    {entity.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-1 opacity-100">
                                                                    <button
                                                                        onClick={() => handleEditEntity(entity)}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                        title="Editar Dados"
                                                                    >
                                                                        <Pencil size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingEntity(entity); setIsEntityModalOpen(true); setActiveEntityTab('qsa'); }}
                                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                                        title="Quadro Societário (QSA)"
                                                                    >
                                                                        <Users size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSoftDeleteEntity(entity.id)}
                                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                                        title="Remover"
                                                                    >
                                                                        <XCircle size={18} />
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
                                                <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">Nenhuma entidade encontrada.</div>
                                            ) : filteredEntities.map((entity: CorporateEntity) => (
                                                <div key={entity.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-[400px] border-b-8 border-b-indigo-500">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-3xl group-hover:scale-110 transition-transform">
                                                            <Building2 size={24} />
                                                        </div>
                                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-xl border-2 ${entity.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                            {entity.status}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-black text-slate-800 dark:text-white text-xl mb-1 line-clamp-1 truncate uppercase tracking-tighter leading-tight">
                                                        {entity.legal_name}
                                                    </h3>
                                                    <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">{entity.cnpj || 'CNPJ NÃO INFORMADO'}</p>

                                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tipo</span>
                                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{entity.entity_type}</span>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Regime</span>
                                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{entity.tax_regime || 'N/I'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-[2rem] mb-6 flex items-center justify-between border border-indigo-100 dark:border-indigo-800/50">
                                                        <div>
                                                            <span className="text-[8px] font-black text-indigo-600 uppercase block mb-0.5">Capital Social</span>
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
                                                            Gerenciar QSA
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
            </div>

            {/* Lawsuit Drawer (Slide-over Pattern) */}
            <AnimatePresence>
                {isLawsuitModalOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsLawsuitModalOpen(false); setActiveLawsuitTab('basic'); }}
                        />

                        {/* Drawer Content */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                            {editingLawsuit?.id ? t('modules.nexus.modals.lawsuit.titleEdit') : t('modules.nexus.modals.lawsuit.title')}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                            Central de Inteligência Jurídica Veritum
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {editingLawsuit?.id && (
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
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setIsLawsuitModalOpen(false); setActiveLawsuitTab('basic'); }}
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
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeLawsuitTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Zap size={14} /> {t('common.basic') || 'Básico'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('advanced')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeLawsuitTab === 'advanced' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Zap size={14} /> {t('common.advanced') || 'Avançado'}
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
                                        ) : (
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

                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsLawsuitModalOpen(false); setActiveLawsuitTab('basic'); }}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.lawsuit.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Save size={20} /> {t('modules.nexus.modals.lawsuit.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Task Drawer (Slide-over Pattern) */}
            <AnimatePresence>
                {isTaskModalOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
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
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                            {editingTask?.id ? t('modules.nexus.modals.task.title') : 'Nova Tarefa'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                            Workflow & Gestão de Prazos
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
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTaskTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Calendar size={14} /> Detalhes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTaskTab('advanced')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTaskTab === 'advanced' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <AlertTriangle size={14} /> Prioridade
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
                                                        {['Baixa', 'Média', 'Alta', 'Urgente'].map(p => (
                                                            <button
                                                                key={p}
                                                                type="button"
                                                                onClick={() => setEditingTask({ ...editingTask, priority: p as any })}
                                                                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${editingTask?.priority === p
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-105'
                                                                    : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                                                    }`}
                                                            >
                                                                {getPriorityTranslation(p)}
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
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
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
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Início</label>
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
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Localização (Física ou Link)</label>
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
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsAssetModalOpen(false); setActiveAssetTab('basic'); }}
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
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                            {editingAsset?.id ? 'Editar Ativo' : 'Novo Ativo'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                            Gestão Patrimonial & Garantias
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsAssetModalOpen(false); setActiveAssetTab('basic'); }}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                    >
                                        <XCircle size={28} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSaveAsset} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                                    <div className="space-y-6">
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
                                                placeholder="Informações adicionais sobre o ativo, endereço, chassi, bloqueios, etc..."
                                            />
                                        </div>
                                    </div>
                                </div>

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
                                        <Save size={20} /> Salvar Ativo
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Corporate Entity Modal (The "Big One") */}
                {isEntityModalOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsEntityModalOpen(false); setActiveEntityTab('basic'); }}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
                            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                            {editingEntity?.id ? 'Gestão Corporativa' : 'Nova Entidade'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                            <Shield size={12} className="text-indigo-600" /> Governança & Estrutura Societária
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsEntityModalOpen(false); setActiveEntityTab('basic'); }}
                                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                                    >
                                        <XCircle size={32} />
                                    </button>
                                </div>

                                {/* Premium Tabs */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-[2.5rem] w-full max-w-xl">
                                    {[
                                        { id: 'basic', label: 'Dados Gerais', icon: Building2 },
                                        { id: 'qsa', label: 'Quadro Societário', icon: Users },
                                        { id: 'docs', label: 'Documentos', icon: FileText },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveEntityTab(tab.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeEntityTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <tab.icon size={16} /> {tab.label}
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
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingShareholder({ shareholder_type: 'Person', ownership_percentage: 0 }); setIsShareholderModalOpen(true); }}
                                                    className="p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
                                                    title="Adicionar Sócio"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>

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
                                                {corporateDocuments.length === 0 ? (
                                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                                        Nenhum documento anexado.
                                                    </div>
                                                ) : corporateDocuments.map(doc => (
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
                                                        
                                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => { setEditingDocument(doc); setIsDocumentModalOpen(true); }}
                                                                 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                                             >
                                                                 Editar
                                                             </button>
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => handleDeleteDocument(doc.id)}
                                                                 className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                             >
                                                                 <Trash2 size={16} />
                                                             </button>
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
                                    {activeEntityTab === 'basic' && (
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                        >
                                            <Save size={20} /> Salvar Alterações
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
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                                        Novo Documento
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
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Link do Arquivo (URL)</label>
                                        <input
                                            value={editingDocument?.file_url || ''}
                                            onChange={e => setEditingDocument({ ...editingDocument, file_url: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-mono text-[10px]"
                                            placeholder="https://supabase.co/..."
                                        />
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
        </div>
    );
};

export default Nexus;
