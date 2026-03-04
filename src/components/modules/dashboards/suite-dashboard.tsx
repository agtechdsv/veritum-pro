'use client'

import React from 'react';
import { ModuleId, User } from '@/types';
import { DashboardCard } from './shared-dashboard-ui';
import { useTranslation } from '@/contexts/language-context';
import { Crown, Sparkles, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface Props {
    items: any[];
    onModuleChange: (id: ModuleId) => void;
    currentUser?: User;
}

const SuiteDashboard: React.FC<Props> = ({ items, onModuleChange, currentUser }) => {
    const { locale, t } = useTranslation();
    const [hiddenBanner, setHiddenBanner] = React.useState(false);
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {t('dashboard.suiteTitle').split(t('nav.modules')).map((part: string, i: number) =>
                        i === 0 ? <React.Fragment key={i}>{part}</React.Fragment> : <span key={i} className="text-branding-gradient">{t('nav.modules')}</span>
                    )}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-2">
                    {t('dashboard.suiteSubtitle')}
                </p>
            </div>

            {/* PROGRESSIVE DISCLOSURE VIP BANNER */}
            {currentUser && !currentUser.vip_active && !hiddenBanner && (
                <div className="mb-8">
                    {typeof currentUser.plan_name === 'string' && (currentUser.plan_name.toLowerCase().includes('growth') || currentUser.plan_name.toLowerCase().includes('strategy')) ? (
                        <div className="relative p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-between overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter">Convite Exclusivo: Clube VIP</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Você tem um convite para o Clube VIP aguardando ativação.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <Link
                                    href="/veritum/settings?tab=vip"
                                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
                                >
                                    Ativar Benefícios <ArrowRight size={16} />
                                </Link>
                                <button onClick={() => setHiddenBanner(true)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative p-6 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-between overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                    <Crown size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">Quer zerar sua assinatura?</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-500">Faça o upgrade para GROWTH ou STRATEGY e descubra o Clube VIP.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <Link
                                    href="/veritum/settings?tab=plan"
                                    className="px-6 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md"
                                >
                                    Fazer Upgrade
                                </Link>
                                <button onClick={() => setHiddenBanner(true)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                    <DashboardCard
                        key={item.id}
                        title={t(`modules.${item.id.toLowerCase()}.label`) || item.label}
                        subtitle={item.short_desc?.[locale] || item.short_desc?.pt}
                        description={item.detailed_desc?.[locale] || item.detailed_desc?.pt || t('dashboard.accessFunc', { name: t(`modules.${item.id.toLowerCase()}.label`) || item.label })}
                        icon={item.icon}
                        color={item.color}
                        isLocked={item.isLocked}
                        onClick={() => onModuleChange(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SuiteDashboard;
