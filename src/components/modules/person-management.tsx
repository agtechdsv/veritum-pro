
import React, { useState, useEffect } from 'react';
import { Person, Credentials } from '@/types';
import { Plus, Search, User, Mail, Phone, MapPin, Briefcase, FileText, ChevronDown, ChevronUp, Save, Trash2, Key, Info, Pencil, XCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from '@/contexts/language-context';
import { toast } from '@/components/ui/toast';

interface Props {
    credentials: Credentials;
}

const PersonManagement: React.FC<Props> = ({ credentials }) => {
    const { t } = useTranslation();
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [expandedFields, setExpandedFields] = useState(false);

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        fetchPersons();
    }, []);

    const fetchPersons = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('persons')
                .select('*')
                .is('deleted_at', null)
                .order('full_name', { ascending: true })
                .limit(50);

            if (error) throw error;
            setPersons(data || []);
        } catch (error) {
            console.error('Error fetching persons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict CPF/CNPJ Validation (Golden Rule: Data Integrity)
        const doc = editingPerson?.document || '';
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

        if (!cpfRegex.test(doc) && !cnpjRegex.test(doc)) {
            toast.error(t('management.master.persons.validations.invalidDocument'));
            return;
        }

        try {
            if (editingPerson?.id) {
                const { error } = await supabase
                    .from('persons')
                    .update(editingPerson)
                    .eq('id', editingPerson.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('persons')
                    .insert([editingPerson]);
                if (error) throw error;
            }
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
        if (!window.confirm(t('management.master.persons.confirmations.softDelete'))) return;
        try {
            await supabase.from('persons').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            toast.success(t('management.master.persons.toasts.deleteSuccess'));
            fetchPersons();
        } catch (err) {
            console.error('Error deleting person:', err);
            toast.error(t('management.master.persons.toasts.deleteError'));
        }
    };

    const filteredPersons = persons.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.document.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('management.master.persons.title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('management.master.persons.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setEditingPerson({ person_type: 'Cliente' }); setIsModalOpen(true); }}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-slate-800 dark:border-slate-100"
                >
                    <Plus size={18} /> {t('management.master.persons.newEntry')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('management.master.persons.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.persons.stats.label')}</span>
                    <span className="text-2xl font-black text-indigo-600">{persons.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">{t('management.master.persons.table.loading')}</div>
                ) : filteredPersons.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">{t('management.master.persons.table.empty')}</div>
                ) : filteredPersons.map(person => (
                    <div key={person.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${person.person_type === 'Cliente' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800' :
                                person.person_type === 'Advogado Adverso' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-800' :
                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                }`}>
                                {t(`management.master.persons.types.${person.person_type}`)}
                            </span>
                            <button
                                onClick={() => { setEditingPerson(person); setIsModalOpen(true); }}
                                className="text-slate-300 hover:text-indigo-600 transition-colors"
                            >
                                <Pencil size={16} />
                            </button>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{person.full_name}</h3>
                        <p className="text-xs text-slate-400 font-mono mb-4">{person.document}</p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                <Mail size={14} className="text-slate-300" />
                                <span className="truncate">{person.email || t('common.notApplicable')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                <Phone size={14} className="text-slate-300" />
                                <span>{person.phone || t('common.notApplicable')}</span>
                            </div>
                        </div>

                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-12 -mt-12 group-hover:from-indigo-500/10 transition-all"></div>
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
                                        onChange={e => setEditingPerson({ ...editingPerson, document: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium font-mono"
                                        placeholder={t('management.master.persons.modal.fields.documentPlaceholder')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.persons.modal.fields.phone')}</label>
                                    <input
                                        value={editingPerson?.phone || ''}
                                        onChange={e => setEditingPerson({ ...editingPerson, phone: e.target.value })}
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
                                                    onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, cep: e.target.value } })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-sm"
                                                />
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
        </div >
    );
};

export default PersonManagement;
