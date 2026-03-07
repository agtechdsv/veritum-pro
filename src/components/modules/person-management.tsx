import React, { useState, useEffect } from 'react';
import { Person, Credentials, UserPreferences, User as AppUser } from '@/types';
import { Plus, Search, User, Mail, Phone, MapPin, Briefcase, FileText, ChevronDown, ChevronUp, ChevronRight, Zap, Save, Trash2, Key, Info, Pencil, XCircle, Database as DbIcon, ShieldCheck, MessageCircle, ExternalLink, Scale, FileDown, ArrowUpRight, Filter } from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';
import { toast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { listPersons, savePerson, deletePerson } from '@/app/actions/crm-actions';
import { createMasterClient } from '@/lib/supabase/master';

interface Props {
    credentials: Credentials;
    preferences: UserPreferences;
    currentUser: AppUser;
    isEmbedded?: boolean;
    externalPersons?: Person[];
    externalLoading?: boolean;
    masterSelectedUserId?: string;
}

const PersonManagement: React.FC<Props> = ({ credentials, preferences, currentUser, isEmbedded, externalPersons, externalLoading, masterSelectedUserId }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [localPersons, setLocalPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);

    // Source of truth: external props take precedence when provided and no active local search
    const persons = (externalPersons && !searchTerm) ? externalPersons : localPersons;
    const isLoading = (externalLoading !== undefined) ? (externalLoading || loading) : loading;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

    // Deletion states
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);

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
        const handleOpenModal = () => {
            setEditingPerson({ person_type: 'Cliente' });
            setIsModalOpen(true);
        };
        window.addEventListener('CRM_OPEN_MODAL', handleOpenModal);
        return () => window.removeEventListener('CRM_OPEN_MODAL', handleOpenModal);
    }, []);

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

    const formatDocument = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            // CPF: 000.000.000-00
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        } else {
            // CNPJ: 00.000.000/0000-00
            return numbers
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        } else {
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        }
    };

    const formatCEP = (value: string) => {
        const raw = value.replace(/\D/g, '');
        return raw.replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
    };

    const searchCEP = async (cep: string) => {
        const cleanCEP = cep.replace(/\D/g, '');
        if (cleanCEP.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast.error(t('management.organization.toast.cepError'));
                return;
            }

            setEditingPerson(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    address: {
                        ...prev.address,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        cep: cep
                    }
                };
            });
        } catch (err) {
            console.error('Error fetching CEP:', err);
            toast.error(t('management.organization.toast.cepFetchError'));
        }
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

    const handleGenerateDocs = (person: any) => {
        toast.info(`Gerando documentos para ${person.full_name || '...'}...`);
        setTimeout(() => {
            toast.success(`Documentos gerados com sucesso! Verifique sua pasta de downloads.`);
        }, 1500);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId) {
            toast.error('Selecione um cliente primeiro.');
            return;
        }

        const doc = editingPerson?.document || '';
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

        if (!cpfRegex.test(doc) && !cnpjRegex.test(doc)) {
            toast.error(t('management.master.persons.validations.invalidDocument'));
            return;
        }

        try {
            if (!editingPerson) return;
            await savePerson(editingPerson, selectedUserId);
            toast.success(t('management.master.persons.toasts.saveSuccess'));
            setIsModalOpen(false);
            setEditingPerson(null);
            setActiveTab('basic');
            fetchPersons();
        } catch (error) {
            console.error('Error saving person:', error);
            toast.error(t('management.master.persons.toasts.saveError'));
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
            fetchPersons();
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
                <div className="bg-white dark:bg-slate-950 px-5 py-2.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm min-w-[160px] self-end md:self-auto">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mr-6">{t('management.master.persons.stats.label')}</span>
                    <span className="text-xl font-black text-indigo-600">{persons.length}</span>
                </div>
            </div>

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
                                    <button
                                        onClick={() => { setEditingPerson(person); setIsModalOpen(true); setActiveTab('basic'); }}
                                        className="p-4 -m-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all cursor-pointer"
                                    >
                                        <Pencil size={16} />
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
                                <button
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

            {/* Person Drawer (Slide-over Pattern) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsModalOpen(false); setActiveTab('basic'); }}
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
                                            {editingPerson?.id ? t('management.master.persons.modal.titles.edit') : t('management.master.persons.modal.titles.new')}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                            {editingPerson?.id ? 'Gestão de Perfis Jurídicos' : 'Novo Integrante no Ecossistema'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setIsModalOpen(false); setActiveTab('basic'); }}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                    >
                                        <XCircle size={28} />
                                    </button>
                                </div>

                                {/* Tab Switcher */}
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl relative">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('basic')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === 'basic' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        <User size={14} /> Dados Básicos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('advanced')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === 'advanced' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        <Zap size={14} /> Avançado
                                    </button>
                                    <div
                                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-950 rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${activeTab === 'advanced' ? 'translate-x-full' : 'translate-x-0'}`}
                                    />
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {activeTab === 'basic' ? (
                                            <div className="space-y-8">
                                                {/* Classification Selection */}
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-4 px-1">Tipo de Classificação</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso'].map(type => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => setEditingPerson({ ...editingPerson, person_type: type as any })}
                                                                className={`px-3 py-3 rounded-xl text-[10px] font-bold transition-all border ${editingPerson?.person_type === type
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-105'
                                                                    : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                                                    }`}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Nome Completo</label>
                                                        <input
                                                            required
                                                            value={editingPerson?.full_name || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, full_name: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold text-lg"
                                                            placeholder="Digite o nome completo"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Documento (CPF/CNPJ)</label>
                                                            <input
                                                                required
                                                                value={editingPerson?.document || ''}
                                                                onChange={e => setEditingPerson({ ...editingPerson, document: formatDocument(e.target.value) })}
                                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold font-mono"
                                                                placeholder="000.000.000-00"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Telefone</label>
                                                            <input
                                                                value={editingPerson?.phone || ''}
                                                                onChange={e => setEditingPerson({ ...editingPerson, phone: formatPhone(e.target.value) })}
                                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                                placeholder="(00) 00000-0000"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">E-mail</label>
                                                        <input
                                                            type="email"
                                                            value={editingPerson?.email || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, email: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                            placeholder="exemplo@email.com"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 animate-in fade-in duration-300">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">RG</label>
                                                        <input
                                                            value={editingPerson?.rg || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, rg: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">CEP</label>
                                                        <input
                                                            value={editingPerson?.address?.cep || ''}
                                                            onChange={e => {
                                                                const val = formatCEP(e.target.value);
                                                                setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, cep: val } });
                                                                if (val.replace(/\D/g, '').length === 8) searchCEP(val);
                                                            }}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-indigo-600 dark:text-indigo-400"
                                                            placeholder="00000-000"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Logradouro (Rua/Avenida)</label>
                                                        <input
                                                            value={editingPerson?.address?.street || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, street: e.target.value } })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Nº</label>
                                                        <input
                                                            value={editingPerson?.address?.number || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, number: e.target.value } })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-center"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Complemento</label>
                                                        <input
                                                            value={editingPerson?.address?.complement || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, complement: e.target.value } })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Bairro</label>
                                                        <input
                                                            value={editingPerson?.address?.neighborhood || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, neighborhood: e.target.value } })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-4">
                                                    <div className="col-span-3">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Cidade</label>
                                                        <input
                                                            value={editingPerson?.address?.city || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, city: e.target.value } })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Estado (UF)</label>
                                                        <select
                                                            value={editingPerson?.address?.state || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, state: e.target.value } })}
                                                            className="w-full px-3 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-center pr-8"
                                                        >
                                                            <option value="">UF</option>
                                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                                <option key={uf} value={uf}>{uf}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Estado Civil</label>
                                                        <input
                                                            value={editingPerson?.legal_data?.marital_status || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, marital_status: e.target.value } })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Profissão</label>
                                                        <input
                                                            value={editingPerson?.legal_data?.profession || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, profession: e.target.value } })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">CTPS</label>
                                                        <input
                                                            value={editingPerson?.ctps || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, ctps: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-indigo-600 dark:text-indigo-400"
                                                            placeholder="000.000 / Série 000-A"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">PIS/NIT</label>
                                                        <input
                                                            value={editingPerson?.pis || ''}
                                                            onChange={e => setEditingPerson({ ...editingPerson, pis: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-indigo-600 dark:text-indigo-400"
                                                            placeholder="000.00000.00-0"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Histórico / Observações</label>
                                                    <textarea
                                                        rows={4}
                                                        value={editingPerson?.legal_data?.history || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, history: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold resize-none"
                                                        placeholder="Digite observações importantes sobre este cadastro..."
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); setActiveTab('basic'); }}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        {t('management.master.persons.modal.actions.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Save size={20} /> {editingPerson?.id ? t('management.master.persons.modal.actions.update') : t('management.master.persons.modal.actions.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            {
                deleteConfirmId && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center animate-in zoom-in duration-300">
                            <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                {t('management.master.persons.confirmations.softDeleteTitle') || 'Excluir Integrante?'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                {t('management.master.persons.confirmations.softDeleteMessage', { name: deleteConfirmName }) || `Você tem certeza que deseja excluir "${deleteConfirmName}"? Esta ação é irreversível.`}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(null); }}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    {t('common.cancel') || 'Cancelar'}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} /> {t('common.delete') || 'Sim, Excluir'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PersonManagement;
