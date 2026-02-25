'use client'

import React, { useState, useEffect } from 'react';
import { Organization } from '@/types';
import { Building2, Mail, Phone, Globe, MapPin, Hash, Save, Camera } from 'lucide-react';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from './toast';
import { useTranslation } from '@/contexts/language-context';

interface OrganizationFormProps {
    adminId: string;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ adminId }) => {
    const { t } = useTranslation();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createMasterClient();

    useEffect(() => {
        fetchOrganization();
    }, [adminId]);

    const fetchOrganization = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('admin_id', adminId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setOrg(data || { admin_id: adminId, company_name: '' } as Organization);
        } catch (err) {
            console.error('Error fetching organization:', err);
            toast.error(t('management.organization.toast.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const maskCNPJ = (value: string) => {
        const raw = value.replace(/\D/g, '');
        return raw
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const maskCEP = (value: string) => {
        const raw = value.replace(/\D/g, '');
        return raw
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    };

    const maskPhone = (value: string) => {
        const raw = value.replace(/\D/g, '');
        if (raw.length <= 10) {
            return raw
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        } else {
            return raw
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && org) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setOrg({ ...org, logo_url: base64 });
            };
            reader.readAsDataURL(file);
        }
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

            if (org) {
                setOrg({
                    ...org,
                    address_street: data.logradouro,
                    address_neighborhood: data.bairro,
                    address_city: data.localidade,
                    address_state: data.uf,
                    address_zip: cep
                });
            }
        } catch (err) {
            console.error('Error fetching CEP:', err);
            toast.error(t('management.organization.toast.cepFetchError'));
        }
    };

    const handleSave = async () => {
        if (!org) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('organizations')
                .upsert({
                    ...org,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success(t('management.organization.toast.saveSuccess'));
        } catch (err) {
            console.error('Error saving organization:', err);
            toast.error(t('management.organization.toast.saveError'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('common.loading')}</span>
        </div>
    );

    if (!org) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Building2 size={16} /> {t('management.organization.identification')}
                    </h3>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.companyName')}</label>
                        <input
                            value={org.company_name}
                            onChange={e => setOrg({ ...org, company_name: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder={t('management.organization.companyNamePlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.tradingName')}</label>
                        <input
                            value={org.trading_name || ''}
                            onChange={e => setOrg({ ...org, trading_name: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder={t('management.organization.tradingNamePlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.cnpj')}</label>
                        <input
                            value={org.cnpj || ''}
                            onChange={e => setOrg({ ...org, cnpj: maskCNPJ(e.target.value) })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder="00.000.000/0000-00"
                        />
                    </div>
                </div>

                {/* Contact & Logo */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Camera size={16} /> {t('management.organization.logo')}
                    </h3>

                    <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="relative group">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                                {org.logo_url ? (
                                    <img src={org.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="text-slate-300" size={24} />
                                )}
                            </div>
                            <label className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-indigo-700 transition-all">
                                <Camera size={12} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                            </label>
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('management.organization.logoTitle')}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-tight">{t('management.organization.logoDesc')}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.email')}</label>
                        <input
                            value={org.email || ''}
                            onChange={e => setOrg({ ...org, email: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder={t('management.organization.emailPlaceholder')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.phone')}</label>
                            <input
                                value={org.phone || ''}
                                onChange={e => setOrg({ ...org, phone: maskPhone(e.target.value) })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                placeholder="(00) 0000-0000"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.website')}</label>
                            <input
                                value={org.website || ''}
                                onChange={e => setOrg({ ...org, website: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                placeholder="www.escritorio.com"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={16} /> {t('management.organization.address')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.zip')}</label>
                        <input
                            value={org.address_zip || ''}
                            onChange={e => {
                                const val = maskCEP(e.target.value);
                                setOrg({ ...org, address_zip: val });
                                if (val.replace(/\D/g, '').length === 8) searchCEP(val);
                            }}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-black transition-all text-indigo-600"
                            placeholder="00000-000"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.street')}</label>
                        <input
                            value={org.address_street || ''}
                            onChange={e => setOrg({ ...org, address_street: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.number')}</label>
                        <input
                            value={org.address_number || ''}
                            onChange={e => setOrg({ ...org, address_number: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.complement')}</label>
                        <input
                            value={org.address_complement || ''}
                            onChange={e => setOrg({ ...org, address_complement: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.neighborhood')}</label>
                        <input
                            value={org.address_neighborhood || ''}
                            onChange={e => setOrg({ ...org, address_neighborhood: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.city')}</label>
                        <input
                            value={org.address_city || ''}
                            onChange={e => setOrg({ ...org, address_city: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('management.organization.state')}</label>
                        <input
                            value={org.address_state || ''}
                            onChange={e => setOrg({ ...org, address_state: e.target.value.toUpperCase().slice(0, 2) })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold transition-all text-center"
                            placeholder="UF"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                >
                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={20} /> {t('management.organization.save')}</>}
                </button>
            </div>
        </div>
    );
};

export default OrganizationForm;
