'use client'

import React from 'react';
import { X, Cpu, Mail } from 'lucide-react';
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useTranslation } from '@/contexts/language-context';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function CompanyModal({ isOpen, onClose }: Props) {
    const { theme } = useTheme()
    const { locale } = useTranslation()

    const content = {
        title: {
            pt: "A engenharia por trás do Veritum PRO",
            en: "The engineering behind Veritum PRO",
            es: "La ingeniería detrás de Veritum PRO"
        },
        body: {
            pt: (
                <>
                    <p className="text-lg mb-6">
                        A <strong className="text-slate-900 dark:text-white">AGTech</strong> é um laboratório de inovação e engenharia de software focado no desenvolvimento de LegalTechs de alta performance.
                    </p>
                    <p className="mb-6">
                        Nossa missão é construir a infraestrutura tecnológica invisível que permite aos grandes escritórios operarem com máxima eficiência, segurança e inteligência de dados.
                    </p>
                    <p>
                        Combinamos arquiteturas robustas com um design centrado na experiência do usuário para entregar ferramentas que realmente transformam a rotina jurídica.
                    </p>
                </>
            ),
            en: (
                <>
                    <p className="text-lg mb-6">
                        <strong className="text-slate-900 dark:text-white">AGTech</strong> is an innovation and software engineering lab focused on developing high-performance LegalTechs.
                    </p>
                    <p className="mb-6">
                        Our mission is to build the invisible technological infrastructure that allows large firms to operate with maximum efficiency, security, and data intelligence.
                    </p>
                    <p>
                        We combine robust architectures with user-experience-centered design to deliver tools that truly transform the legal routine.
                    </p>
                </>
            ),
            es: (
                <>
                    <p className="text-lg mb-6">
                        <strong className="text-slate-900 dark:text-white">AGTech</strong> es un laboratorio de innovación e ingeniería de software enfocado en el desarrollo de LegalTechs de alto rendimiento.
                    </p>
                    <p className="mb-6">
                        Nuestra misión es construir la infraestructura tecnológica invisible que permite a los grandes despachos operar con máxima eficiencia, seguridad e inteligencia de datos.
                    </p>
                    <p>
                        Combinamos arquitecturas robustas con un diseño centrado en la experiencia del usuario para ofrecer herramientas que realmente transforman la rutina jurídica.
                    </p>
                </>
            )
        },
        footerText: {
            pt: "Quer elevar o nível tecnológico do seu projeto?",
            en: "Want to elevate the technological level of your project?",
            es: "¿Quieres elevar el nivel tecnológico de tu proyecto?"
        },
        buttonText: {
            pt: "Fale com nossos engenheiros",
            en: "Talk to our engineers",
            es: "Habla con nuestros ingenieros"
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 bg-transparent border-none shadow-none overflow-hidden">
                <div className={`relative w-full h-full flex flex-col rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <DialogTitle className="sr-only">{(content.title as any)[locale] || content.title.pt}</DialogTitle>

                    {/* Background blobs for premium feel */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[80px] rounded-full pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative p-8 pb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-900/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                                <Cpu size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight dark:text-white text-slate-900 leading-tight">
                                    {(content.title as any)[locale] || content.title.pt}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">AGTech Innovation Lab</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group">
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 p-10 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {(content.body as any)[locale] || content.body.pt}
                    </div>

                    {/* Footer */}
                    <div className="relative p-8 pt-6 border-t border-slate-100 dark:border-slate-900/50 flex flex-col justify-between items-center gap-6 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm">
                        <div className="text-center space-y-2">
                            <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                                {(content.footerText as any)[locale] || content.footerText.pt}
                            </p>
                        </div>
                        <a
                            href="mailto:agtech.dev@veritumpro.com"
                            className="w-full text-center px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-tight flex items-center justify-center gap-2"
                        >
                            <Mail size={18} />
                            {(content.buttonText as any)[locale] || content.buttonText.pt}
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
