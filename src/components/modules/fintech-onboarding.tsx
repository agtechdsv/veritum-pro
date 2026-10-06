import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { ShieldAlert, Banknote, Rocket, CheckCircle2, AlertCircle, Building, Mail, FileText, Phone } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { createFintechSubAccount } from '@/app/veritumpro/fintech/actions';

interface Props {
    user: any;
    officeData: any;
    clientId?: string;
    onSuccess: (subAccountData: any) => void;
}

export const FintechOnboarding: React.FC<Props> = ({ user, officeData, clientId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        brandingName: officeData?.company_name || '',
        email: officeData?.email || user.email || '',
        cpfCnpj: officeData?.cnpj || '',
        phone: officeData?.phone || '',
    });

    React.useEffect(() => {
        if (officeData) {
            setFormData(prev => ({
                ...prev,
                brandingName: officeData.company_name || prev.brandingName,
                email: officeData.email || prev.email,
                cpfCnpj: officeData.cnpj || prev.cpfCnpj,
                phone: officeData.phone || prev.phone,
            }));
        }
    }, [officeData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataQuery = new FormData();
            formDataQuery.append('brandingName', formData.brandingName);
            formDataQuery.append('email', formData.email);
            formDataQuery.append('cpfCnpj', formData.cpfCnpj.replace(/\D/g, ''));
            formDataQuery.append('phone', formData.phone.replace(/\D/g, ''));
            formDataQuery.append('accountType', 'user');
            
            if (clientId) {
                formDataQuery.append('clientId', clientId);
            }

            const result = await createFintechSubAccount(formDataQuery);

            if (result.error) {
                toast.error(result.error);
            } else if (result.success) {
                toast.success('Conta digital criada com sucesso!');
                onSuccess(result.data);
            }
        } catch (err: any) {
            console.error('Erro no onboarding:', err);
            toast.error(err.message || 'Falha ao criar conta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl p-10 border border-slate-200 dark:border-slate-800 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-indigo-500" />
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400">
                        <Banknote size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ative sua Conta Digital</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">E comece a faturar diretamente pelo sistema</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl flex flex-col items-center text-center gap-2 border border-slate-200 dark:border-slate-800">
                        <Rocket className="text-indigo-500" size={24} />
                        <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Automação de Boletos e Pix</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl flex flex-col items-center text-center gap-2 border border-slate-200 dark:border-slate-800">
                        <ShieldAlert className="text-emerald-500" size={24} />
                        <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Régua de Cobrança Automática</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl flex flex-col items-center text-center gap-2 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="text-amber-500" size={24} />
                        <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Conciliação Financeira Embutida</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                                <Building size={14} /> Nome na Fatura (Razão Social)
                            </label>
                            <input
                                required
                                value={formData.brandingName}
                                onChange={e => setFormData({ ...formData, brandingName: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                                placeholder="Nome do seu Escritório"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                                <FileText size={14} /> CPF ou CNPJ
                            </label>
                            <input
                                required
                                value={formData.cpfCnpj}
                                onChange={e => setFormData({ ...formData, cpfCnpj: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                                placeholder="00.000.000/0001-00"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                                <Mail size={14} /> E-mail (Para receber notificações)
                            </label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                                placeholder="contato@escritorio.com"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                                <Phone size={14} /> Celular / WhatsApp
                            </label>
                            <input
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <AlertCircle className="text-slate-400 shrink-0" size={24} />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                            Após a ativação, você receberá um e-mail oficial com um link seguro para envio da sua documentação (KYC). Sua conta será analisada em até 24 horas.
                        </p>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl text-xs
                                ${loading 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30 active:scale-[0.98]'
                                }
                            `}
                        >
                            {loading ? 'Processando abertura...' : 'Ativar Minha Conta Digital Agora'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
