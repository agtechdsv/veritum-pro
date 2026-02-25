'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';

const BR_FLAG = "https://flagcdn.com/w40/br.png";
const US_FLAG = "https://flagcdn.com/w40/us.png";
const ES_FLAG = "https://flagcdn.com/w40/es.png";

export const LanguageSelector: React.FC = () => {
    const { locale, setLocale, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { id: 'pt', label: 'Português', flag: BR_FLAG },
        { id: 'en', label: 'English', flag: US_FLAG },
        { id: 'es', label: 'Español', flag: ES_FLAG },
    ];

    const currentLang = languages.find(l => l.id === locale) || languages[0];

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400 cursor-pointer"
            >
                <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={currentLang.flag} alt={currentLang.label} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold uppercase hidden sm:inline">{locale}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden"
                    >
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.selectLanguage') || 'Selecionar Idioma'}</span>
                        </div>
                        {languages.map((lang) => (
                            <button
                                key={lang.id}
                                onClick={() => {
                                    setLocale(lang.id as 'pt' | 'en');
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all text-left cursor-pointer ${locale === lang.id
                                    ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img src={lang.flag} alt={lang.label} className="w-full h-full object-cover" />
                                    </div>
                                    <span>{lang.label}</span>
                                </div>
                                {locale === lang.id && <Check size={16} className="text-indigo-600" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
