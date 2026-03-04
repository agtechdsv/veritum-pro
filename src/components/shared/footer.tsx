'use client'

import React from 'react'
import { Crown, Scale } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/contexts/language-context'

interface FooterProps {
    setIsCompanyModalOpen: (open: boolean) => void
    openLegal: (type: 'privacy' | 'terms') => void
    showSecurityLink?: boolean
    showVipLink?: boolean
}

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v18"></path><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M7 21h10"></path></svg>
    </div>
)

export const Footer = ({
    setIsCompanyModalOpen,
    openLegal,
    showSecurityLink = true,
    showVipLink = true
}: FooterProps) => {
    const { locale, t } = useTranslation()

    return (
        <footer className="py-8 px-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 transition-colors relative z-20">
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-4">
                {/* Brand Section */}
                <div className="flex items-center gap-3 shrink-0">
                    <Logo />
                    <span className="font-extrabold text-xl tracking-tighter text-slate-900 dark:text-white uppercase whitespace-nowrap">
                        VERITUM <span className="text-branding-gradient">PRO</span>
                    </span>
                </div>

                {/* Info Text */}
                <p className="text-[11px] md:text-[13px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                    <button
                        onClick={() => setIsCompanyModalOpen(true)}
                        className="group relative transition-all duration-300 hover:scale-[1.02] cursor-pointer not-italic inline-flex items-center"
                    >
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                            {locale === 'pt' ? 'Desenvolvido por ' : locale === 'es' ? 'Desarrollado por ' : 'Developed by '}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold ml-1 flex items-center">
                            AGTech
                            <sup className="ml-0.5 text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">©</sup>
                        </span>
                        {/* Tooltip */}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-2xl border border-slate-800 scale-90 group-hover:scale-100 z-[60]">
                            {locale === 'pt' ? 'Clique para saber mais' : locale === 'es' ? 'Clic para saber más' : 'Click to learn more'}
                        </span>
                    </button>
                    {locale === 'pt' ? ' | LegalTech de Alta Performance © 2026 Todos os direitos reservados.' : ' | High Performance LegalTech © 2026 All rights reserved.'}
                </p>

                {/* Nav Links */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-6 justify-center lg:justify-end shrink-0">
                    <button
                        onClick={() => openLegal('privacy')}
                        className="text-[11px] md:text-[13px] text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer font-bold whitespace-nowrap"
                    >
                        {t('common.privacy')}
                    </button>
                    <button
                        onClick={() => openLegal('terms')}
                        className="text-[11px] md:text-[13px] text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer font-bold whitespace-nowrap"
                    >
                        {t('common.terms')}
                    </button>
                    {showSecurityLink && (
                        <Link
                            href="/infrastructure"
                            className="text-[11px] md:text-[13px] text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer font-bold whitespace-nowrap flex items-center"
                        >
                            {t('common.security')}
                        </Link>
                    )}
                    {showVipLink && (
                        <Link
                            href="/clube-vip"
                            className="text-[11px] md:text-[13px] text-amber-500 hover:text-amber-600 transition-colors cursor-pointer font-black flex items-center gap-1 whitespace-nowrap"
                        >
                            <Crown size={14} /> Clube VIP
                        </Link>
                    )}
                </div>
            </div>
        </footer>
    )
}
