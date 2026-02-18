'use client'

import React from 'react';
import { X, FileText, ShieldCheck, Scale } from 'lucide-react';
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface Props {
    isOpen: boolean;
    onClose: () => void;
    type: 'privacy' | 'terms';
    lang?: 'pt' | 'en' | 'es';
}

export function LegalModal({ isOpen, onClose, type, lang = 'pt' }: Props) {
    const { theme } = useTheme()

    const content = {
        privacy: {
            icon: ShieldCheck,
            title: { pt: 'Política de Privacidade', en: 'Privacy Policy', es: 'Política de Privacidad' },
            body: {
                pt: (
                    <>
                        <p className="mb-4">A <strong>Veritum Pro</strong> valoriza a sua privacidade. Esta política descreve como tratamos as informações coletadas através do nosso ecossistema jurídico inteligente.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">1. Informações que Coletamos</h3>
                        <p className="mb-4">Ao utilizar o login do Google ou preencher suas credenciais BYODB, coletamos apenas os dados essenciais (nome, e-mail e chaves de infraestrutura) para fins de autenticação e funcionamento técnico do sistema.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">2. Uso dos Dados</h3>
                        <p className="mb-4">Seus dados são utilizados exclusivamente para autenticar seu acesso, sincronizar seus registros de forma privada em sua própria infraestrutura (Supabase) e permitir a interação com a inteligência artificial (Gemini).</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">3. Armazenamento Local</h3>
                        <p>Importante: Suas chaves de API são armazenadas localmente no seu navegador e nunca são enviadas aos nossos servidores centrais.</p>
                    </>
                ),
                en: (
                    <>
                        <p className="mb-4"><strong>Veritum Pro</strong> values your privacy. This policy describes how we handle information collected through our intelligent legal ecosystem.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">1. Information We Collect</h3>
                        <p className="mb-4">When using Google login or providing your BYODB credentials, we only collect essential data (name, email, and infrastructure keys) for authentication and system functionality.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">2. Data Usage</h3>
                        <p className="mb-4">Your data is used exclusively to authenticate your access, synchronize your records privately within your own infrastructure (Supabase), and enable interaction with AI (Gemini).</p>
                    </>
                ),
                es: (
                    <>
                        <p className="mb-4"><strong>Veritum Pro</strong> valora su privacidad. Esta política describe cómo manejamos la información recopilada a través de nuestro ecosistema jurídico inteligente.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">1. Información que Recopilamos</h3>
                        <p className="mb-4">Al utilizar el inicio de sesión de Google o sus credenciales BYODB, solo recopilamos datos esenciales para la autenticación e el funcionamiento técnico del sistema.</p>
                    </>
                )
            }
        },
        terms: {
            icon: FileText,
            title: { pt: 'Termos de Serviço', en: 'Terms of Service', es: 'Términos de Servicio' },
            body: {
                pt: (
                    <>
                        <p className="mb-4">Bem-vindo ao <strong>Veritum Pro</strong>, o ecossistema jurídico modular de alta performance.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">1. Aceitação dos Termos</h3>
                        <p className="mb-4">Ao acessar este aplicativo, você concorda em cumprir estes termos de serviço e todas as leis aplicáveis ao exercício da advocacia e proteção de dados (LGPD).</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">2. Isenção de Responsabilidade Jurídica</h3>
                        <p className="mb-4">O Veritum Pro é uma ferramenta de gestão e auxílio técnico. A inteligência artificial (IA) pode gerar imprecisões; portanto, todas as petições, pareceres e análises preditivas devem ser obrigatoriamente revisados por um advogado inscrito na OAB.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">3. Uso da Conta</h3>
                        <p>O acesso é pessoal e intransferível. O usuário é responsável por manter a confidencialidade de suas chaves de API e credenciais de banco de dados.</p>
                    </>
                ),
                en: (
                    <>
                        <p className="mb-4">Welcome to <strong>Veritum Pro</strong>, the high-performance modular legal ecosystem.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">1. Acceptance of Terms</h3>
                        <p className="mb-4">By accessing this application, you agree to comply with these terms of service and all applicable data protection laws.</p>
                    </>
                ),
                es: (
                    <>
                        <p className="mb-4">Bienvenido a <strong>Veritum Pro</strong>, el ecosistema jurídico modular de alto rendimiento.</p>
                        <h3 className="text-lg font-bold mt-6 mb-2 text-slate-800 dark:text-white">1. Aceptación de los Términos</h3>
                        <p className="mb-4">Al acceder a esta aplicación, usted acepta cumplir con estos términos de servicio y todas las leyes aplicables.</p>
                    </>
                )
            }
        }
    };

    const currentDoc = content[type];
    const Icon = currentDoc.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 bg-transparent border-none shadow-none">
                <div className={`relative w-full flex flex-col rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <DialogTitle className="sr-only">{currentDoc.title[lang]}</DialogTitle>
                    {/* Header */}
                    <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Icon size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight dark:text-white text-slate-900">
                                    {currentDoc.title[lang]}
                                </h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Documento Legal Veritum</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 text-slate-600 dark:text-slate-300 leading-relaxed custom-scrollbar max-h-[50vh]">
                        {currentDoc.body[lang]}
                    </div>

                    {/* Footer */}
                    <div className="p-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2">
                            <Scale size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold dark:text-slate-400 text-slate-500">VERITUM PRO SECURITY</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
