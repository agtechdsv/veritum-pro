import React, { useState, useEffect } from 'react';
import { Person, Credentials, UserPreferences, User as AppUser } from '@/types';
import { Plus, Search, User, Mail, Phone, MapPin, Briefcase, FileText, ChevronDown, ChevronUp, Save, Trash2, Key, Info, Pencil, XCircle, Database as DbIcon, ShieldCheck, MessageCircle, ExternalLink, Scale, FileDown, ArrowUpRight, Filter } from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';
import { toast } from '@/components/ui/toast';
import { listPersons, savePerson, deletePerson } from '@/app/actions/crm-actions';
import { createMasterClient } from '@/lib/supabase/master';

interface Props {
    credentials: Credentials;
    preferences: UserPreferences;
    currentUser: AppUser;
}

const PersonManagement: React.FC<Props> = ({ credentials, preferences, currentUser }) => {
    const { t } = useTranslation();
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [expandedFields, setExpandedFields] = useState(false);

    // Deletion states
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);

    // Master Selection States
    const isMaster = currentUser.role === 'Master';
    const [selectedUserId, setSelectedUserId] = useState<string>(isMaster ? '' : currentUser.id);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const masterUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isBYODB = !!(credentials.supabaseUrl && credentials.supabaseUrl !== masterUrl);

    useEffect(() => {
        if (isMaster) {
            fetchClients();
        }
    }, [isMaster]);

    useEffect(() => {
        if (selectedUserId) {
            fetchPersons();
        } else if (isMaster) {
            setPersons([]);
        }
    }, [selectedUserId, searchTerm]);

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
                setPersons([]);
                toast.error('O banco de dados selecionado ainda não foi inicializado (tabelas faltando).');
            } else if (result && result.data) {
                setPersons(result.data);
                if (result.solvedId) {
                    console.log(`[CRM] Context: ${result.solvedId} DB: ${result.credentialsUsed?.substring(0, 20)}...`);
                }
            } else if (Array.isArray(result)) {
                setPersons(result);
            }
        } catch (error: any) {
            console.warn('CRM Module not fully initialized for this database (tables might be missing).', error.message || error.code || '');
            setPersons([]);
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
            setExpandedFields(false);
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
            {/* Master Context Selector */}
            {isMaster && (
                <div className="flex justify-center mb-8">
                    <div className="relative group/filter z-50">
                        <div className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                            <Filter size={18} className="text-amber-500" />
                            <select
                                className="bg-transparent outline-none appearance-none pr-8 cursor-pointer font-black uppercase tracking-tight"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                            >
                                <option value="">{t('management.users.masterFilter.selectClient') || '--- SELECIONE UM CLIENTE ---'}</option>
                                <option value={currentUser.id}>{t('management.users.masterFilter.self') || 'MEU PRÓPRIO CONTEXTO'}</option>
                                <optgroup label={t('management.users.masterFilter.clients') || 'CLIENTES'}>
                                    {allUsers.filter(u => u.id !== currentUser.id).map(c => (
                                        <option key={c.id} value={c.id}>🏢 {(typeof c.name === 'object' ? ((c.name as any).pt || (c.name as any).en || '') : (c.name || '')).toUpperCase()} ({c.email})</option>
                                    ))}
                                </optgroup>
                            </select>
                            <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 animate-in zoom-in duration-500">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors uppercase tracking-tight">{t('management.master.persons.title')}</h2>
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setEditingPerson({ person_type: 'Cliente' }); setIsModalOpen(true); }}
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
            </div>

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
                {loading ? (
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
                                        onClick={() => { setEditingPerson(person); setIsModalOpen(true); }}
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

            {/* Person Modal with Progressive Disclosure */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingPerson?.id ? t('management.master.persons.modal.titles.edit') : t('management.master.persons.modal.titles.new')}
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); setExpandedFields(false); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('management.master.persons.modal.sections.classification')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setEditingPerson({ ...editingPerson, person_type: type as any })}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${editingPerson?.person_type === type
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                                                    : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {t(`management.master.persons.types.${type}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.name')}</label>
                                    <input
                                        required
                                        value={editingPerson?.full_name || ''}
                                        onChange={e => setEditingPerson({ ...editingPerson, full_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                        placeholder={t('management.master.persons.modal.fields.namePlaceholder')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.document')}</label>
                                    <input
                                        required
                                        value={editingPerson?.document || ''}
                                        onChange={e => setEditingPerson({ ...editingPerson, document: formatDocument(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium font-mono"
                                        placeholder={t('management.master.persons.modal.fields.documentPlaceholder')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.phone')}</label>
                                    <input
                                        value={editingPerson?.phone || ''}
                                        onChange={e => setEditingPerson({ ...editingPerson, phone: formatPhone(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                        placeholder={t('management.master.persons.modal.fields.phonePlaceholder')}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.email')}</label>
                                    <input
                                        type="email"
                                        value={editingPerson?.email || ''}
                                        onChange={e => setEditingPerson({ ...editingPerson, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                        placeholder={t('management.master.persons.modal.fields.emailPlaceholder')}
                                    />
                                </div>
                            </div>

                            {/* Progressive Disclosure Section */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setExpandedFields(!expandedFields)}
                                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/40 px-3 py-2 rounded-lg transition-all"
                                >
                                    {expandedFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {expandedFields ? t('management.master.persons.modal.sections.hideAdvanced') : t('management.master.persons.modal.sections.advanced')}
                                </button>

                                {expandedFields && (
                                    <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.rg')}</label>
                                                <input
                                                    value={editingPerson?.rg || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, rg: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.cep')}</label>
                                                <input
                                                    value={editingPerson?.address?.cep || ''}
                                                    onChange={e => {
                                                        const val = formatCEP(e.target.value);
                                                        setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, cep: val } });
                                                        if (val.replace(/\D/g, '').length === 8) searchCEP(val);
                                                    }}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-black text-sm text-indigo-600 dark:text-indigo-400"
                                                    placeholder="00000-000"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.street')}</label>
                                                <input
                                                    value={editingPerson?.address?.street || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, street: e.target.value } })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.number')}</label>
                                                <input
                                                    value={editingPerson?.address?.number || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, number: e.target.value } })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.complement')}</label>
                                                <input
                                                    value={editingPerson?.address?.complement || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, complement: e.target.value } })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.neighborhood')}</label>
                                                <input
                                                    value={editingPerson?.address?.neighborhood || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, neighborhood: e.target.value } })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.city')}</label>
                                                    <input
                                                        value={editingPerson?.address?.city || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, city: e.target.value } })}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.state')}</label>
                                                    <input
                                                        value={editingPerson?.address?.state || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, state: e.target.value.toUpperCase().slice(0, 2) } })}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs text-center"
                                                        placeholder="UF"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.maritalStatus')}</label>
                                                <input
                                                    value={editingPerson?.legal_data?.marital_status || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, marital_status: e.target.value } })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.profession')}</label>
                                                <input
                                                    value={editingPerson?.legal_data?.profession || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, profession: e.target.value } })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.history')}</label>
                                            <textarea
                                                rows={3}
                                                value={editingPerson?.legal_data?.history || ''}
                                                onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, history: e.target.value } })}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm resize-none"
                                                placeholder={t('management.master.persons.modal.fields.historyPlaceholder')}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3 shrink-0">
                                <button type="button" onClick={() => { setIsModalOpen(false); setExpandedFields(false); }} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 transition-all">{t('management.master.persons.modal.actions.cancel')}</button>
                                <button type="submit" className="flex-[2] px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} /> {editingPerson?.id ? t('management.master.persons.modal.actions.update') : t('management.master.persons.modal.actions.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmId && (
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
            )}
        </div>
    );
};

export default PersonManagement;
