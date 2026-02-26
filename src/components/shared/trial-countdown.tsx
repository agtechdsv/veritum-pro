
import React, { useState, useEffect } from 'react';
import { createMasterClient } from '@/lib/supabase/master';
import { Credentials } from '@/types';
import { Clock, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    userId: string;
    isSidebarOpen: boolean;
    onUpgrade?: () => void;
}

const TrialCountdown: React.FC<Props> = ({ userId, isSidebarOpen, onUpgrade }) => {
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Subscriptions always live in the Master DB (Ecosystem Hub)
    const supabase = createMasterClient();

    useEffect(() => {
        fetchTrialStatus();
    }, [userId]);

    const fetchTrialStatus = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('end_date, is_trial')
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle(); // Better than .single() as it doesn't throw if 0 results

            if (error) {
                // If it's a real database error, log it
                console.error('Database error fetching trial:', error.message, error.details);
                return;
            }

            if (data?.is_trial && data.end_date) {
                const end = new Date(data.end_date);
                const now = new Date();
                const diff = end.getTime() - now.getTime();
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                setDaysRemaining(days > 0 ? days : 0);
            } else {
                // User might be a Master or have a non-trial active plan
                setDaysRemaining(null);
            }
        } catch (err: any) {
            console.error('Unexpected error fetching trial status:', err?.message || err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || daysRemaining === null) return null;

    // Don't show if more than 14 days (probably not a trial anymore or fresh trial)
    // Actually, fresh trial is 14 days. Let's show it if it's <= 14 days.

    return (
        <div className="px-4 py-2">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${daysRemaining <= 3
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50'
                    : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-900/50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${daysRemaining <= 3 ? 'bg-rose-500' : 'bg-indigo-600'} text-white`}>
                        <Zap size={14} />
                    </div>
                    {isSidebarOpen && (
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Período Trial
                            </span>
                            <span className={`text-xs font-black ${daysRemaining <= 3 ? 'text-rose-600' : 'text-indigo-600'}`}>
                                {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                            </span>
                        </div>
                    )}
                </div>

                {isSidebarOpen && (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(daysRemaining / 14) * 100}%` }}
                            className={`h-full rounded-full ${daysRemaining <= 3 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                        />
                    </div>
                )}

                {isSidebarOpen && onUpgrade && (
                    <button
                        onClick={onUpgrade}
                        className={`w-full py-2 mt-1 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm ${daysRemaining <= 3
                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]'
                            }`}
                    >
                        Assinar Agora
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default TrialCountdown;
