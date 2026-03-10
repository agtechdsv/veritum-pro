import React, { useState, useEffect } from 'react';
import { Credentials, Lawsuit, Task, User, Person, TeamMember } from '@/types';
import { Plus, MoreHorizontal, Calendar, Scale, Search, Filter, ArrowRight, AlertTriangle, CheckCircle2, Clock, MapPin, Shield, User as UserIcon, Users, Save, XCircle, Pencil, ChevronRight, ChevronDown, Zap, Lock as LockIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import IntelligenceWidget from '../shared/intelligence-widget';
import { useTranslation } from '@/contexts/language-context';
import PersonManagement from './person-management';
import { useModule } from '@/app/veritumpro/layout';
import { listPersons } from '@/app/actions/crm-actions';
import { listLawsuits, saveLawsuit, deleteLawsuit, listTasks, saveTask, deleteTask, listTeam, getCitiesByState } from '@/app/actions/nexus-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/toast';
import { createMasterClient } from '@/lib/supabase/master';

const Nexus: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isLawsuitModalOpen, setIsLawsuitModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingLawsuit, setEditingLawsuit] = useState<Partial<Lawsuit> | null>(null);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [activeTab, setActiveTab] = useState<'pessoas' | 'processos' | 'tarefas' | 'agenda' | 'ativos' | 'societario'>('pessoas');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLawsuitTab, setActiveLawsuitTab] = useState<'basic' | 'advanced'>('basic');
    const [activeTaskTab, setActiveTaskTab] = useState<'basic' | 'advanced'>('basic');

    // Searchable Select States
    const [authorSearch, setAuthorSearch] = useState('');
    const [defendantSearch, setDefendantSearch] = useState('');
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
    const [isDefendantDropdownOpen, setIsDefendantDropdownOpen] = useState(false);

    const { preferences } = useModule();

    // Master Selection States
    const isMaster = user.role === 'Master';
    const [selectedUserId, setSelectedUserId] = useState<string>(isMaster ? '' : user.id);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    // Cascading & Searchable States
    const [cities, setCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [chambers, setChambers] = useState<string[]>([]);
    const [isLoadingChambers, setIsLoadingChambers] = useState(false);

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        if (isMaster) {
            fetchClients();
        }
    }, [isMaster]);

    useEffect(() => {
        fetchAll();
    }, [activeTab, selectedUserId]); // Only fetch on tab change or master user change

    const fetchClients = async () => {
        const supMaster = createMasterClient();
        const { data } = await supMaster
            .from('users')
            .select('id, name, email, role')
            .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
            .order('name');
        if (data) setAllUsers(data);
    };

    const fetchAll = async () => {
        if (isMaster && !selectedUserId) {
            setLawsuits([]);
            setTasks([]);
            setPersons([]);
            setTeam([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        // Clear previous state to avoid "piscada" (flicker) with old data
        setLawsuits([]);
        setTasks([]);
        setPersons([]);
        setTeam([]);

        try {
            const targetUserId = selectedUserId;

            // Centralized fetching for all nexus-related data
            const [lawResult, taskResult, personResult, teamResult] = await Promise.all([
                listLawsuits('', targetUserId),
                listTasks('', targetUserId),
                listPersons('', targetUserId),
                listTeam(targetUserId)
            ]);

            if (lawResult.data) setLawsuits(lawResult.data);
            if (taskResult.data) setTasks(taskResult.data);
            if (personResult.data) setPersons(personResult.data);
            if (teamResult?.data) setTeam(teamResult.data);

            const hasTableError = lawResult.error === 'TABLE_NOT_FOUND' ||
                taskResult.error === 'TABLE_NOT_FOUND' ||
                personResult.error === 'TABLE_NOT_FOUND' ||
                teamResult?.error === 'TABLE_NOT_FOUND';

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

    const handleCreateLawsuitFromCRM = (personId: string) => {
        // Switch to lawsuits tab
        setActiveTab('processos');
        // Initialize new lawsuit with the author pre-filled
        setEditingLawsuit({
            author_id: personId,
            status: 'Ativo',
            sphere: 'Cível', // Default
            responsible_lawyer_id: team.find(m => m.master_user_id === user.id)?.id || team[0]?.id || ''
        });
        // Open modal with a small delay to allow tab transition animation to feel smooth
        setTimeout(() => {
            setIsLawsuitModalOpen(true);
            setActiveLawsuitTab('basic');
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
            await saveLawsuit(editingLawsuit!, targetUserId);

            setIsLawsuitModalOpen(false);
            setEditingLawsuit(null);
            setActiveLawsuitTab('basic');
            toast.success(t('modules.nexus.modals.lawsuit.success') || 'Processo salvo com sucesso!');
            fetchAll();
        } catch (err) {
            console.error('Error saving lawsuit:', err);
            toast.error(t('modules.nexus.modals.lawsuit.error') || 'Erro ao salvar processo');
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetUserId = selectedUserId;
            await saveTask(editingTask!, targetUserId);

            setIsTaskModalOpen(false);
            setEditingTask(null);
            setActiveTaskTab('basic');
            toast.success(t('modules.nexus.modals.task.success') || 'Tarefa salva com sucesso!');
            fetchAll();
        } catch (err) {
            console.error('Error saving task:', err);
            toast.error(t('modules.nexus.modals.task.error') || 'Erro ao salvar tarefa');
        }
    };

    const handleSoftDeleteLawsuit = async (id: string) => {
        if (!window.confirm(t('modules.nexus.kanban.deleteConfirm'))) return;
        try {
            const targetUserId = selectedUserId;
            await deleteLawsuit(id, targetUserId);
            toast.success(t('modules.nexus.kanban.deleteSuccess') || 'Processo excluído corretamente');
            fetchAll();
        } catch (err) {
            console.error('Error deleting lawsuit:', err);
            toast.error(t('modules.nexus.kanban.deleteError') || 'Erro ao excluir processo');
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
                                    onChange={e => setSelectedUserId(e.target.value)}
                                >
                                    <option value="">--- {t('management.users.masterFilter.selectClient') || 'Selecione um Cliente'} ---</option>
                                    <optgroup label={t('management.users.masterFilter.clients')?.toUpperCase() || 'CLIENTES (SÓCIOS ADM)'}>
                                        {allUsers.filter(u => u.id !== user.id).map(c => {
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
                    <div className="flex-1 flex flex-col p-8 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{t('management.master.persons.title')}</h1>
                                    <p className="text-slate-500 font-bold">{t('management.users.subtitle')}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('CRM_OPEN_MODAL'));
                                    }}
                                    className="bg-emerald-600 text-white px-6 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
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
                        />
                    </div>
                )}

                {activeTab === 'processos' && (
                    <div className="flex-1 flex flex-col p-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.title')}</h1>
                                    <p className="text-slate-500 font-bold flex items-center gap-2">
                                        Total de {lawsuits.length} {t('common.processes')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setEditingLawsuit({ status: 'Ativo' }); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                    className="bg-indigo-600 text-white px-6 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                >
                                    <Plus size={14} /> {t('modules.nexus.newLawsuit')}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
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
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <button
                                                onClick={() => setView('kanban')}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Kanban
                                            </button>
                                            <button
                                                onClick={() => setView('list')}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Lista
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <IntelligenceWidget credentials={credentials} moduleContext="Operacional / Nexus" limit={3} />
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
                                    <p className="text-2xl font-black text-rose-600">{tasks.filter(t => t.status !== 'Concluído' && (new Date(t.due_date).getTime() - new Date().getTime()) < 86400000).length}</p>
                                </div>
                                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg"><Clock size={20} /></div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.metrics.pending')}</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{tasks.filter(t => t.status !== 'Concluído').length}</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg"><CheckCircle2 size={20} /></div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('modules.nexus.metrics.completion')}</p>
                                    <p className="text-2xl font-black text-emerald-600">
                                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Concluído').length / tasks.length) * 100) : 0}%
                                    </p>
                                </div>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
                            </div>
                        </div>

                        {/* Main Content: Kanban Board */}
                        <div className="flex-1 flex gap-6 overflow-x-auto p-8 pt-0 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {columns.map((column) => (
                                <div key={column} className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-3xl p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${column === 'Atrasado' ? 'bg-rose-500' :
                                                column === 'Concluído' ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`} />
                                            {getColumnTranslation(column)}
                                            <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                {tasks.filter(t => t.status === column).length}
                                            </span>
                                        </h3>
                                        <button className="text-slate-400 hover:text-slate-600"><Plus size={16} /></button>
                                    </div>

                                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                                        {loading ? (
                                            <div className="py-8 text-center text-slate-400 text-xs font-bold animate-pulse">{t('modules.nexus.empty.syncing')}</div>
                                        ) : tasks.filter(t => t.status === column).map((task) => {
                                            const law = lawsuits.find(l => l.id === task.lawsuit_id);
                                            const resp = team.find(t_ => t_.id === task.responsible_id);
                                            return (
                                                <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getSeverityColor(task.due_date, task.status)}`}>
                                                            {getPriorityTranslation(task.priority || 'Média')}
                                                        </span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                                                className="p-1 text-slate-400 hover:text-indigo-600"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-2">{task.title}</h4>
                                                    {law && <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1"><Scale size={10} /> {law.cnj_number}</p>}

                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-200 dark:border-slate-700" title={resp?.full_name}>
                                                                {resp?.full_name?.charAt(0) || <UserIcon size={10} />}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400">{resp?.full_name?.split(' ')[0]}</span>
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
                                <button
                                    onClick={() => { setEditingTask({ status: 'A Fazer' }); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                    className="bg-slate-800 text-white px-6 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                                >
                                    <Plus size={14} /> {t('common.new')} {t('common.event') || 'Evento'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto p-6">
                            <div className="grid grid-cols-7 gap-4 mb-4">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2 border-b border-slate-100 dark:border-slate-800">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-4 h-full">
                                {Array.from({ length: 31 }).map((_, i) => {
                                    const day = i + 1;
                                    const dayTasks = tasks.filter(t => new Date(t.due_date).getDate() === day);
                                    return (
                                        <div key={i} className={`min-h-[140px] p-3 rounded-2xl border transition-all ${dayTasks.length > 0 ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-300' : 'border-slate-100 dark:border-slate-800/20'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs font-black ${dayTasks.length > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {dayTasks.slice(0, 3).map(task => (
                                                    <div key={task.id} className="text-[9px] font-bold p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 truncate text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1">
                                                        <div className={`w-1 h-1 rounded-full ${task.priority === 'Urgente' ? 'bg-rose-500' : 'bg-indigo-400'}`} />
                                                        {task.title}
                                                    </div>
                                                ))}
                                                {dayTasks.length > 3 && <div className="text-[8px] font-black text-indigo-500 text-center">+{dayTasks.length - 3} itens</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'ativos' || activeTab === 'societario') && (
                    <div className="flex-1 flex flex-col p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                    {activeTab === 'ativos' ? t('modules.nexus.tabs.assets') : t('modules.nexus.tabs.corporate')}
                                </h1>
                                <p className="text-slate-500 font-bold">
                                    {activeTab === 'ativos' ? t('modules.nexus.comingSoon.assetsSubtitle') : t('modules.nexus.comingSoon.corporateSubtitle')}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                            <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 animate-pulse">
                                {activeTab === 'ativos' ? <Shield size={64} /> : <LockIcon size={64} />}
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">
                                {t('modules.nexus.comingSoon.title')}
                            </h2>
                            <p className="max-w-md text-slate-500 font-bold text-lg">
                                Esta aba está sendo preparada para o seu ecossistema. {activeTab === 'ativos' ? 'O controle total de seus ativos e garantias processuais virá para cá.' : 'A gestão societária e de contratos de longo prazo será centralizada aqui.'}
                            </p>
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
                                    <button
                                        onClick={() => { setIsLawsuitModalOpen(false); setActiveLawsuitTab('basic'); }}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                    >
                                        <XCircle size={28} />
                                    </button>
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
        </div>
    );
};

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

export default Nexus;
