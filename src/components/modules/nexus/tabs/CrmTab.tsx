import React from 'react';
import { Plus } from 'lucide-react';
import PersonManagement from '../../person-management';
import { Credentials, User, Person } from '@/types';

interface CrmTabProps {
    t: any;
    credentials: Credentials;
    preferences: any;
    user: User;
    persons: Person[];
    loading: boolean;
    selectedUserId: string;
    fetchAll: () => Promise<void>;
    handleCreateLawsuitFromCRM: (personId: string) => void;
    handleCreateCorporateEntityFromCRM: (person: Person) => void;
    handleOpenNexoVisual: (type: any, data: any) => void;
}

export const CrmTab = ({
    t,
    credentials,
    preferences,
    user,
    persons,
    loading,
    selectedUserId,
    fetchAll,
    handleCreateLawsuitFromCRM,
    handleCreateCorporateEntityFromCRM,
    handleOpenNexoVisual
}: CrmTabProps) => {
    return (
        <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col h-full space-y-6">
                {/* Header Pessoas */}
                <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            {t('management.master.persons.title')}
                        </h1>
                        <p className="text-slate-500 font-bold tracking-wide mt-1">
                            {t('management.users.subtitle')}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <button
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('CRM_OPEN_MODAL'));
                            }}
                            className="bg-slate-800 hover:bg-emerald-600 dark:bg-white dark:hover:bg-emerald-500 dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1"
                        >
                            <Plus size={14} /> {t('common.new')} {t('common.person')}
                        </button>
                    </div>
                </div>

                <PersonManagement
                    credentials={credentials}
                    preferences={preferences!}
                    currentUser={user}
                    isEmbedded={true}
                    externalPersons={persons}
                    externalLoading={loading}
                    masterSelectedUserId={selectedUserId}
                    onRefresh={fetchAll}
                    onNewLawsuit={handleCreateLawsuitFromCRM}
                    onNewCorporateEntity={handleCreateCorporateEntityFromCRM}
                    onOpenNexoVisual={p => handleOpenNexoVisual('person', p)}
                />
            </div>
        </div>
    );
};
