
import React from 'react';
import { Credentials, Lawsuit } from '@/types';
import { Plus, MoreHorizontal, Calendar, Scale } from 'lucide-react';

const Nexus: React.FC<{ credentials: Credentials; permissions: any }> = ({ credentials, permissions }) => {
    const columns = ['To Do', 'Em Análise', 'Prazos Fatais', 'Concluídos'];

    const mockTasks: (Lawsuit & { priority: 'Alta' | 'Normal' })[] = [
        { id: '1', cnj_number: '12345-67.2023.8.26.0100', client_name: 'Banco do Brasil', status: 'Active', value: 150000, priority: 'Alta' },
        { id: '2', cnj_number: '50032-11.2023.4.03.6100', client_name: 'Maria Silva', status: 'Draft', value: 25000, priority: 'Normal' },
        { id: '3', cnj_number: '00001-99.2023.5.02.0000', client_name: 'Tech Solutions Ltd', status: 'Closed', value: 85000, priority: 'Alta' },
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                        <Scale size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">Gestão de Processos</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Acompanhamento operacional e workflow NEXUS</p>
                    </div>
                </div>
                <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                    <Plus size={18} /> Novo Processo
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {columns.map((column) => (
                    <div key={column} className="flex-shrink-0 w-80 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col gap-4 transition-colors">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                {column}
                                <span className="bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold">2</span>
                            </h3>
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto pr-1">
                            {mockTasks.map((task) => (
                                <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${task.priority === 'Alta' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {task.priority}
                                        </span>
                                        <button className="text-slate-300 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{task.client_name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono font-medium">{task.cnj_number}</p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex -space-x-2">
                                            <img src={`https://ui-avatars.com/api/?name=${task.client_name}&background=random`} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900" />
                                            <img src="https://ui-avatars.com/api/?name=Adv&background=6366f1&color=fff" className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900" />
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                            <Calendar size={12} />
                                            <span className="text-[10px] font-semibold">12 Nov</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-sm hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2 font-medium">
                                <Plus size={16} /> Adicionar Item
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Nexus;
