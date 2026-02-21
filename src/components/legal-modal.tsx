'use client'

import React from 'react';
import { X, FileText, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';
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
                    <div className="space-y-8">
                        <section>
                            <p className="text-lg">A <strong>Veritum Pro</strong> valoriza a sua privacidade. Esta política descreve como tratamos as informações coletadas através do nosso ecossistema jurídico inteligente.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 text-sm">1</span>
                                Informações que Coletamos
                            </h3>
                            <p>Ao utilizar o login do Google ou preencher suas credenciais BYODB, coletamos apenas os dados essenciais (nome, e-mail e chaves de infraestrutura) para fins de autenticação e funcionamento técnico do sistema.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 text-sm">2</span>
                                Uso dos Dados
                            </h3>
                            <p>Seus dados são utilizados exclusivamente para autenticar seu acesso, sincronizar seus registros de forma privada em sua própria infraestrutura (Supabase) e permitir a interação com a inteligência artificial (Gemini).</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 text-sm">3</span>
                                Armazenamento Local
                            </h3>
                            <p className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                                <strong>Importante:</strong> Suas chaves de API são armazenadas localmente no seu navegador e nunca são enviadas aos nossos servidores centrais. Isso garante soberania total sobre seus dados.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 text-sm">4</span>
                                Cookies
                            </h3>
                            <p>Utilizamos apenas cookies estritamente necessários para manter sua sessão ativa e salvar suas preferências de tema (Dark/Light).</p>
                        </section>
                    </div>
                ),
                en: (
                    <div className="space-y-6">
                        <p><strong>Veritum Pro</strong> values your privacy. This policy describes how we handle information collected through our intelligent legal ecosystem.</p>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">1. Information We Collect</h3>
                        <p>When using Google login or providing your BYODB credentials, we only collect essential data (name, email, and infrastructure keys) for authentication and system functionality.</p>
                    </div>
                ),
                es: (
                    <div className="space-y-6">
                        <p><strong>Veritum Pro</strong> valora su privacidad. This policy describes how we handle information collected through our intelligent legal ecosystem.</p>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">1. Información que Recopilamos</h3>
                        <p>Al utilizar el inicio de sesión de Google o sus credenciais BYODB, solo recopilamos datos esenciales para a autenticação e o funcionamento técnico do sistema.</p>
                    </div>
                )
            }
        },
        terms: {
            icon: FileText,
            title: { pt: 'Termos de Serviço', en: 'Terms of Service', es: 'Términos de Servicio' },
            body: {
                pt: (
                    <div className="space-y-8">
                        <section>
                            <p className="text-lg">Bem-vindo ao <strong className="text-branding-gradient">Veritum Pro</strong>, o ecossistema jurídico modular de alta performance.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 text-sm">1</span>
                                Aceitação dos Termos
                            </h3>
                            <p>Ao acessar este aplicativo, você concorda em cumprir estes termos de serviço e todas as leis aplicáveis ao exercício da advocacia e proteção de dados (LGPD).</p>
                        </section>

                        <section>
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                <h3 className="text-amber-800 dark:text-amber-200 font-bold mb-2 flex items-center gap-2">
                                    <AlertTriangle size={18} /> 2. Isenção de Responsabilidade Jurídica
                                </h3>
                                <p className="text-amber-800 dark:text-amber-200 text-sm italic">
                                    O Veritum Pro é uma ferramenta de gestão e auxílio técnico. A inteligência artificial (IA) pode gerar imprecisões; portanto, todas as petições, pareceres e análises preditivas devem ser obrigatoriamente revisados por um advogado inscrito na OAB.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 text-sm">3</span>
                                Uso da Conta e BYODB
                            </h3>
                            <p>O acesso é pessoal e intransferível. O usuário é o único responsável pela segurança de suas chaves de API e credenciais de banco de dados (Bring Your Own Database).</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 text-sm">4</span>
                                Propriedade Intelectual
                            </h3>
                            <p>Todo o design e marca Veritum Pro são de propriedade da AgTech. Os dados jurídicos inseridos permanecem de posse e responsabilidade do usuário.</p>
                        </section>
                    </div>
                ),
                en: (
                    <div className="space-y-6">
                        <p>Welcome to <strong className="text-branding-gradient">Veritum Pro</strong>, the high-performance modular legal ecosystem.</p>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">1. Acceptance of Terms</h3>
                        <p>By accessing this application, you agree to comply with these terms of service and all applicable data protection laws.</p>
                    </div>
                ),
                es: (
                    <div className="space-y-6">
                        <p>Bienvenido a <strong className="text-branding-gradient">Veritum Pro</strong>, el ecosistema jurídico modular de alto rendimiento.</p>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">1. Aceptación de los Términos</h3>
                        <p>Al acceder a esta aplicación, usted acepta cumplir con estos términos de servicio e todas as leis aplicáveis.</p>
                    </div>
                )
            }
        }
    };

    const currentDoc = content[type];
    const Icon = currentDoc.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 bg-transparent border-none shadow-none overflow-hidden">
                <div className={`relative w-full h-full flex flex-col rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <DialogTitle className="sr-only">{currentDoc.title[lang]}</DialogTitle>

                    {/* Background blobs for premium feel */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[80px] rounded-full pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative p-8 pb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-900/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                                <Icon size={28} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight dark:text-white text-slate-900">
                                    {currentDoc.title[lang].split(' ').map((word: string, i: number) =>
                                        i === currentDoc.title[lang].split(' ').length - 1 ? (
                                            <span key={i} className="text-branding-gradient ml-1">{word}</span>
                                        ) : word + ' '
                                    )}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800">Documento Oficial</span>
                                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">v2.0</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group">
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 overflow-y-auto p-10 text-slate-600 dark:text-slate-300 leading-relaxed custom-scrollbar max-h-[60vh]">
                        {currentDoc.body[lang]}
                    </div>

                    {/* Footer */}
                    <div className="relative p-8 pt-6 border-t border-slate-100 dark:border-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                <Scale size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black dark:text-slate-400 text-slate-500 uppercase tracking-widest">Veritum Pro Security</p>
                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-600">Compliance & Proteção de Dados</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-tight"
                        >
                            Entendido e Aceito
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
