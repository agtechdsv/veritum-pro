import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Mail, Phone, MapPin, Briefcase, FileText, 
     Zap, Save, Trash2, XCircle, ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';
import { Person } from '@/types';
import { toast } from '@/components/ui/toast';
import { savePerson } from '@/app/actions/crm-actions';

interface CrmModalProps {
    isCrmModalOpen: boolean;
    setIsCrmModalOpen: (open: boolean) => void;
    editingPerson: Partial<Person> | null;
    setEditingPerson: (person: Partial<Person> | null) => void;
    activeCrmTab: 'basic' | 'advanced';
    setActiveCrmTab: (tab: 'basic' | 'advanced') => void;
    selectedUserId: string;
    onSuccess?: () => void;
}

export const CrmModal = (props: CrmModalProps) => {
    const { 
        isCrmModalOpen, 
        setIsCrmModalOpen, 
        editingPerson, 
        setEditingPerson, 
        activeCrmTab, 
        setActiveCrmTab, 
        selectedUserId,
        onSuccess
    } = props;
    
    const { t } = useTranslation();

    const formatDocument = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        } else {
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
                return;
            }

            setEditingPerson({
                ...editingPerson,
                address: {
                    ...editingPerson?.address,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                    cep: cep
                }
            });
        } catch (err) {
            console.error('Error fetching CEP:', err);
        }
    };

    const handleSavePerson = async (e: React.FormEvent) => {
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
            await savePerson(editingPerson as Person, selectedUserId);
            toast.success(t('management.master.persons.toasts.saveSuccess'));
            setIsCrmModalOpen(false);
            setEditingPerson(null);
            setActiveCrmTab('basic');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error saving person:', error);
            toast.error(t('management.master.persons.toasts.saveError'));
        }
    };

    return (
        <AnimatePresence>
            {isCrmModalOpen && (
                <div key="person-drawer-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        onClick={() => { setIsCrmModalOpen(false); setActiveCrmTab('basic'); setEditingPerson(null); }}
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
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                        {editingPerson?.id ? t('management.master.persons.modal.titles.edit') : t('management.master.persons.modal.titles.new')}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                                        {editingPerson?.id ? t('management.master.persons.modal.subtitles.edit') : t('management.master.persons.modal.subtitles.new')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsCrmModalOpen(false); setActiveCrmTab('basic'); setEditingPerson(null); }}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>

                            {/* Tab Switcher */}
                            <div className="relative flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setActiveCrmTab('basic')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all relative z-10 ${activeCrmTab === 'basic' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <User size={14} /> {t('common.basic')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveCrmTab('advanced')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all relative z-10 ${activeCrmTab === 'advanced' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <Zap size={14} /> {t('common.advanced')}
                                </button>
                                <div
                                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-950 rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${activeCrmTab === 'advanced' ? 'translate-x-full' : 'translate-x-0'}`}
                                />
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSavePerson} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {activeCrmTab === 'basic' ? (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 mb-4 px-1">{t('management.master.persons.modal.sections.classification')}</label>
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
                                                            {t(`management.master.persons.types.${type}`)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.name')}</label>
                                                <input
                                                    required
                                                    value={editingPerson?.full_name || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, full_name: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold text-lg"
                                                    placeholder={t('management.master.persons.modal.fields.namePlaceholder')}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.document')}</label>
                                                    <input
                                                        required
                                                        value={editingPerson?.document || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, document: formatDocument(e.target.value) })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold font-mono"
                                                        placeholder={t('management.master.persons.modal.fields.documentPlaceholder')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.phone')}</label>
                                                    <input
                                                        value={editingPerson?.phone || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, phone: formatPhone(e.target.value) })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                        placeholder={t('management.master.persons.modal.fields.phonePlaceholder')}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.email')}</label>
                                                <input
                                                    type="email"
                                                    value={editingPerson?.email || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, email: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                    placeholder={t('management.master.persons.modal.fields.emailPlaceholder')}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.rg')}</label>
                                                    <input
                                                        value={editingPerson?.rg || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, rg: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        placeholder="RG"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.cep')}</label>
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
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.street')}</label>
                                                    <input
                                                        value={editingPerson?.address?.street || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, street: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.number')}</label>
                                                    <input
                                                        value={editingPerson?.address?.number || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, number: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-center"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.complement')}</label>
                                                    <input
                                                        value={editingPerson?.address?.complement || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, complement: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.neighborhood')}</label>
                                                    <input
                                                        value={editingPerson?.address?.neighborhood || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, neighborhood: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="col-span-3">
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.city')}</label>
                                                    <input
                                                        value={editingPerson?.address?.city || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, city: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.state')}</label>
                                                    <select
                                                        value={editingPerson?.address?.state || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, address: { ...editingPerson?.address, state: e.target.value } })}
                                                        className="w-full px-3 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-center pr-8"
                                                    >
                                                        <option value="">{t('management.master.persons.modal.fields.ufPlaceholder')}</option>
                                                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                            <option key={uf} value={uf}>{uf}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.maritalStatus')}</label>
                                                    <input
                                                        value={editingPerson?.legal_data?.marital_status || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, marital_status: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.profession')}</label>
                                                    <input
                                                        value={editingPerson?.legal_data?.profession || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, profession: e.target.value } })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.ctps')}</label>
                                                    <input
                                                        value={editingPerson?.ctps || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, ctps: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-indigo-600 dark:text-indigo-400"
                                                        placeholder={t('management.master.persons.modal.fields.ctpsPlaceholder')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.pis')}</label>
                                                    <input
                                                        value={editingPerson?.pis || ''}
                                                        onChange={e => setEditingPerson({ ...editingPerson, pis: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-indigo-600 dark:text-indigo-400"
                                                        placeholder={t('management.master.persons.modal.fields.pisPlaceholder')}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('management.master.persons.modal.fields.history')}</label>
                                                <textarea
                                                    rows={4}
                                                    value={editingPerson?.legal_data?.history || ''}
                                                    onChange={e => setEditingPerson({ ...editingPerson, legal_data: { ...editingPerson?.legal_data, history: e.target.value } })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold resize-none"
                                                    placeholder={t('management.master.persons.modal.fields.historyPlaceholder')}
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
                                    onClick={() => { setIsCrmModalOpen(false); setActiveCrmTab('basic'); setEditingPerson(null); }}
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
    );
};
