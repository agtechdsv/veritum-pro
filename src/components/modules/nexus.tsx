import React, { useState, useEffect } from 'react';
import { Credentials, User } from '@/types';
import { Plus, Calendar, Scale, Search, Filter, LayoutDashboard, ArrowRight, AlertTriangle, CheckCircle2, Clock, Zap, Lock as LockIcon, List, PieChart, FileText, Check, Loader2, Sparkles, History as HistoryIcon, XCircle, Users, Shield, ChevronRight, ChevronDown } from 'lucide-react';
import IntelligenceWidget from '../shared/intelligence-widget';
import { useTranslation } from '@/contexts/language-context';
import { useModule } from '@/app/veritumpro/layout';
import { useNexusLogic } from './nexus/hooks/useNexusLogic';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/toast';
import { createMasterClient } from '@/lib/supabase/master';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PremiumFileUpload, PremiumCombobox, BlockedTabOverlay, TrendingUp } from './nexus/nexus-components';
import { NexusFilterBar, AssetFilterBar, NexusStatusBadge } from './nexus/nexus-ui-helpers';

// --- Lazy-Loaded Components (Dynamic Imports) ---
import { NexoVisual } from './nexus/nexus-visual';
import { TaskModal } from './nexus/modals/TaskModal';
import { LawsuitModal } from './nexus/modals/LawsuitModal';
import { CrmModal } from './nexus/modals/CrmModal';
import { AssetModal } from './nexus/modals/AssetModal';
import { EventModal } from './nexus/modals/EventModal';
import { CorporateEntityModal } from './nexus/modals/CorporateEntityModal';
import { JustificationModal } from './nexus/modals/JustificationModal';
import { ConfirmationModal } from './nexus/modals/ConfirmationModal';

import { OverviewTab } from './nexus/tabs/OverviewTab';
import { CalendarTab } from './nexus/tabs/CalendarTab';
import { AssetsTab } from './nexus/tabs/AssetsTab';
import { LawsuitsTab } from './nexus/tabs/LawsuitsTab';
import { DocumentsTab } from './nexus/tabs/DocumentsTab';
import { CrmTab } from './nexus/tabs/CrmTab';
import { TasksTab } from './nexus/tabs/TasksTab';
import { SocietarioTab } from './nexus/tabs/SocietarioTab';

import { formatCNJ, formatCurrency, getSeverityColor, getTaskUrgencyInfo, extractStoragePath, LAWSUIT_STATUSES, ASSET_STATUSES, ENTITY_STATUSES, ESFERAS, UFS, RITOS, TAX_REGIMES, ENTITY_TYPES, TRIBUNAIS } from './nexus/hooks/useNexusUtility';


// Sub-components extracted to ./nexus/nexus-components.tsx

const Nexus: React.FC<{ credentials: Credentials; user: User; permissions: any }> = (props) => {
    const { t, locale } = useTranslation();
    const nx = useNexusLogic({ ...props, t, locale });
    const { core, ui, search } = nx;

    // Core State Destructuring (for backward compatibility in JSX)
    const { 
        lawsuits, setLawsuits, tasks, setTasks, events, setEvents, assets, setAssets,
        corporateEntities, setCorporateEntities, shareholders, setShareholders,
        corporateDocuments, setCorporateDocuments, lawsuitDocuments, setLawsuitDocuments,
        assetDocuments, setAssetDocuments, team, setTeam, persons, setPersons,
        loading, setLoading, globalDocuments, setGlobalDocuments, isGlobalDocsLoading, setIsGlobalDocsLoading,
        selectedUserId, setSelectedUserId, fetchAll, fetchTab, financialStats
    } = core;

    // UI State Destructuring
    const {
        activeTab, setActiveTab, activeCrmTab, setActiveCrmTab, activeLawsuitTab, setActiveLawsuitTab,
        activeAssetTab, setActiveAssetTab, activeTaskTab, setActiveTaskTab, activeEntityTab, setActiveEntityTab,
        isLawsuitModalOpen, setIsLawsuitModalOpen, isTaskModalOpen, setIsTaskModalOpen, isEventModalOpen, setIsEventModalOpen,
        isAssetModalOpen, setIsAssetModalOpen, isCrmModalOpen, setIsCrmModalOpen, isEntityModalOpen, setIsEntityModalOpen,
        isDocumentModalOpen, setIsDocumentModalOpen, isNexoVisualOpen, setIsNexoVisualOpen, isHistoryModalOpen, setIsHistoryModalOpen,
        isJustificationModalOpen, setIsJustificationModalOpen, isShareholderModalOpen, setIsShareholderModalOpen,
        isLawsuitDocModalOpen, setIsLawsuitDocModalOpen, isAssetDocModalOpen, setIsAssetDocModalOpen,
        editingLawsuit, setEditingLawsuit, editingTask, setEditingTask, editingEvent, setEditingEvent,
        editingAsset, setEditingAsset, editingPerson, setEditingPerson, editingEntity, setEditingEntity,
        editingShareholder, setEditingShareholder, editingDocument, setEditingDocument,
        editingLawsuitDoc, setEditingLawsuitDoc, editingAssetDoc, setEditingAssetDoc,
        processViewStyle, setProcessViewStyle, assetViewStyle, setAssetViewStyle, corporateViewStyle, setCorporateViewStyle,
        view, setView, eventView, setEventView
    } = ui;

    // Search/Filter Destructuring
    const {
        searchTerm, setSearchTerm, corporateSearchTerm, setCorporateSearchTerm, lawsuitSearch, setLawsuitSearch,
        assetSearch, setAssetSearch, docSearch, setDocSearch, filterSearchTerm, setFilterSearchTerm,
        filterResponsibleId, setFilterResponsibleId, filterLawsuitId, setFilterLawsuitId,
        filteredTasks, filteredEvents, filteredLawsuits, filteredAssets, 
        filteredGlobalDocuments, filteredEntityDocs, filteredLawsuitDocs, filteredAssetDocs,
        filteredEntities, lawsuitStatusFilter, setLawsuitStatusFilter, lawsuitLawyerFilter, setLawsuitLawyerFilter,
        assetStatusFilter, setAssetStatusFilter, assetTypeFilter, setAssetTypeFilter,
        docTypeFilter, setDocTypeFilter, docOriginFilter, setDocOriginFilter, uniqueDocTypes
    } = search;

    // Master Logic props
    const { isMaster, selectedClientId, user, onSelectClient, allClients, credentials } = nx;
    const { 
        visualRefreshTrigger, setVisualRefreshTrigger, nexoData, setNexoData, nexoLoading, setNexoLoading,
        lawsuitTimeline, setLawsuitTimeline, assetTimeline, setAssetTimeline, 
        corporateTimeline, setCorporateTimeline, isLawsuitTimelineLoading, setIsLawsuitTimelineLoading,
        isAssetTimelineLoading, setIsAssetTimelineLoading, isCorporateTimelineLoading, setIsCorporateTimelineLoading,
        aiLawsuitSummary, setAiLawsuitSummary, isAiSummarizing, setIsAiSummarizing, aiInfoModal, setAiInfoModal,
        pendingLawsuitDocuments, setPendingLawsuitDocuments, pendingAssetDocuments, setPendingAssetDocuments,
        pendingCorporateDocuments, setPendingCorporateDocuments, financialTransactions, setFinancialTransactions,
        isFinancialLoading, setIsFinancialLoading, lawsuitFinances, setLawsuitFinances,
        isEditingFinancial, setIsEditingFinancial, editingFinancial, setEditingFinancial,
        lawsuitDocFile, setLawsuitDocFile, assetDocFile, setAssetDocFile, corporateDocFile, setCorporateDocFile,
        personForQSARef, corporateDocUploadRef, lawsuitDocUploadRef, assetDocUploadRef,
        cities, setCities, isLoadingCities, setIsLoadingCities, chambers, setChambers, isLoadingChambers, setIsLoadingChambers,
        confirmModal, setConfirmModal, justificationText, setJustificationText, historyData, setHistoryData,
        statusPopover, setStatusPopover, financeStartDate, setFinanceStartDate, financeEndDate, setFinanceEndDate,
        pendingStatusChange, setPendingStatusChange,
        movements, isMovementsLoading
    } = nx;

    // Handlers
    const {
        triggerConfirm, handleOpenHistory, handleQuickStatusUpdate, handleConfirmStatusChange,
        handleSaveLawsuit, handleSaveTask, handleSaveEvent, handleSaveAsset, handleSaveEntity,
        handleDeleteLawsuit, handleDeleteAsset, handleDeleteEntity,
        handleCreateLawsuitFromCRM, handleCreateCorporateEntityFromCRM,
        handleDownloadFile, handleOpenNexoVisual, handleEditEntity,
        handleDeleteDocument, handleDeleteLawsuitDocument, handleDeleteAssetDocument,
        handleSaveDocument, handleSummarizeWithAI, handleFetchGlobalDocuments,
        handleSaveFinancialTransaction, handleDeleteFinancialTransaction,
        handleSaveLawsuitDocument, handleSaveAssetDocument, handleSaveShareholder,
        handleDeleteShareholder, handleSummarizeDocument, handleSoftDeleteLawsuit,
        handleSoftDeleteAsset, handleSoftDeleteEvent, handleSoftDeleteEntity,
        handleDropLawsuit, handleDragStartLawsuit, handleDropTask, handleDragStartTask,
        handleDropAsset, handleDragStartAsset, handleDropEntity, handleDragStartEntity,
        handleEditGlobalDocumentOrigin, handleDeleteGlobalDocument, handleFetchLawsuitFinances
    } = nx;

    useEffect(() => {
        if (activeTab && activeTab !== 'overview' && activeTab !== 'agenda' && activeTab !== 'tarefas' && activeTab !== 'processos') {
            fetchTab(activeTab);
        }
    }, [activeTab, fetchTab]);

    // Wrapped Kanban Handlers to match expected signatures (Event instead of ID)
    const onDropLawsuit = (e: React.DragEvent, status: string) => {
        const id = e.dataTransfer.getData('lawsuitId');
        if (id) nx.handleDropLawsuit(id, status);
    };

    const onDropTask = (e: React.DragEvent, status: string) => {
        const id = e.dataTransfer.getData('taskId');
        if (id) nx.handleDropTask(id, status);
    };

    const onDropAsset = (e: React.DragEvent, status: string) => {
        const id = e.dataTransfer.getData('assetId');
        if (id) nx.handleDropAsset(id, status);
    };

    const onDropEntity = (e: React.DragEvent, status: string) => {
        const id = e.dataTransfer.getData('entityId');
        if (id) nx.handleDropEntity(id, status);
    };

    const getColumnTranslation = (col: string) => {
        const map: Record<string, string> = {
            'A Fazer': t('common.statuses.tasks.todo'),
            'Em Andamento': t('common.statuses.tasks.inProgress'),
            'Concluído': t('common.statuses.tasks.done'),
            'Atrasado': t('common.statuses.tasks.delayed')
        };
        return map[col] || col;
    };

    const columns = ['A Fazer', 'Em Andamento', 'Concluído', 'Atrasado'];
    const preferences = { theme: 'indigo' };

    const [currentDate, setCurrentDate] = useState(new Date());


    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">{t('modules.nexus.title')}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('modules.nexus.subtitle')}</p>
                        </div>
                    </div>

                    {/* Tabs Container - Nexus Premium Style */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-fit border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                        {[
                            { id: 'overview', icon: <LayoutDashboard size={14} />, label: `0. ${t('modules.nexus.tabs.overview')}` },
                            { id: 'pessoas', icon: <Users size={14} />, label: `1. ${t('modules.nexus.tabs.people')}` },
                            { id: 'processos', icon: <Scale size={14} />, label: `2. ${t('modules.nexus.tabs.processes')}` },
                            { id: 'tarefas', icon: <Zap size={14} />, label: `3. ${t('modules.nexus.tabs.tasks')}` },
                            { id: 'agenda', icon: <Calendar size={14} />, label: `4. ${t('modules.nexus.tabs.calendar')}` },
                            { id: 'ativos', icon: <Shield size={14} />, label: `5. ${t('modules.nexus.tabs.assets')}` },
                            { id: 'societario', icon: <LockIcon size={14} />, label: `6. ${t('modules.nexus.tabs.corporate')}` },
                            { id: 'documentos', icon: <FileText size={14} />, label: `7. Documentos` }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Master Context Selector */}
                    {isMaster && (
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden shrink-0">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{t('management.users.roleLabel')} Master</span>
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none whitespace-nowrap">{t('management.users.masterFilter.selectClient') || 'Selecione o Cliente'}</span>
                            </div>
                            <div className="relative">
                                <select
                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-xs font-black tracking-widest text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer min-w-[260px] appearance-none pr-10"
                                    value={selectedUserId}
                                    onChange={e => {
                                        const newId = e.target.value;
                                        setSelectedUserId(newId);
                                        if (isMaster) onSelectClient(newId);
                                    }}
                                >
                                    <option value="">--- {t('management.users.masterFilter.selectClient') || 'Selecione um Cliente'} ---</option>
                                    <optgroup label={t('management.users.masterFilter.clients')?.toUpperCase() || 'CLIENTES (SÓCIOS ADM)'}>
                                        {allClients.filter((u: any) => u.id !== user.id).map((c: any) => {
                                            const rawName = typeof c.name === 'object' ? ((c.name as any).pt || (c.name as any).en || '') : (c.name || '');
                                            const formattedName = rawName.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                            const formattedEmail = (c.email || '').toLowerCase();
                                            return (
                                                <option key={c.id} value={c.id}>
                                                    🏢 {formattedName} ({formattedEmail})
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 💡 MAIN CONTENT AREA - Nexus 2.0 Router */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'overview' && (
                    <OverviewTab
                        t={t} locale={locale} loading={loading} lawsuits={lawsuits} tasks={tasks} assets={assets} 
                        financialStats={financialStats} financeStartDate={financeStartDate} 
                        setFinanceStartDate={setFinanceStartDate} financeEndDate={financeEndDate} 
                        setFinanceEndDate={setFinanceEndDate} fetchAll={() => fetchAll()} credentials={credentials}
                        targetUserId={selectedUserId}
                    />
                )}
                {activeTab === 'pessoas' && (
                    <CrmTab
                        t={t}
                        credentials={credentials}
                        preferences={preferences}
                        user={user}
                        persons={persons}
                        loading={loading}
                        selectedUserId={selectedUserId}
                        fetchAll={fetchAll}
                        handleCreateLawsuitFromCRM={handleCreateLawsuitFromCRM}
                        handleCreateCorporateEntityFromCRM={handleCreateCorporateEntityFromCRM}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                    />
                )}

                {activeTab === 'processos' && (
                    <LawsuitsTab 
                        t={t}
                        locale={t('locale')}
                        lawsuits={lawsuits}
                        filteredLawsuits={filteredLawsuits}
                        processViewStyle={processViewStyle}
                        setProcessViewStyle={setProcessViewStyle}
                        lawsuitSearch={lawsuitSearch}
                        setLawsuitSearch={setLawsuitSearch}
                        lawsuitStatusFilter={lawsuitStatusFilter}
                        setLawsuitStatusFilter={setLawsuitStatusFilter}
                        lawsuitLawyerFilter={lawsuitLawyerFilter}
                        setLawsuitLawyerFilter={setLawsuitLawyerFilter}
                        team={team}
                        persons={persons}
                        loading={loading}
                        LAWSUIT_STATUSES={LAWSUIT_STATUSES}
                        handleDropLawsuit={onDropLawsuit}
                        handleDragStartLawsuit={handleDragStartLawsuit}
                        handleOpenHistory={handleOpenHistory}
                        handleSoftDeleteLawsuit={handleSoftDeleteLawsuit}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        renderStatusBadge={(id, currentStatus, type, options) => (
                            <NexusStatusBadge
                                id={id}
                                currentStatus={currentStatus}
                                type={type}
                                options={options}
                                setStatusPopover={setStatusPopover}
                            />
                        )}
                        setEditingLawsuit={setEditingLawsuit}
                        setPendingLawsuitDocuments={setPendingLawsuitDocuments}
                        setIsLawsuitModalOpen={setIsLawsuitModalOpen}
                        setActiveLawsuitTab={setActiveLawsuitTab}
                        setActiveTab={setActiveTab}
                        setEditingTask={setEditingTask}
                        setIsTaskModalOpen={setIsTaskModalOpen}
                        setActiveTaskTab={setActiveTaskTab}
                        setEditingAsset={setEditingAsset}
                        setIsAssetModalOpen={setIsAssetModalOpen}
                        setEditingLawsuitDoc={setEditingLawsuitDoc}
                        setIsLawsuitDocModalOpen={setIsLawsuitDocModalOpen}
                    />
                )}

                {activeTab === 'tarefas' && (
                    <TasksTab
                        t={t}
                        credentials={credentials}
                        lawsuits={lawsuits}
                        filteredTasks={filteredTasks}
                        team={team}
                        loading={loading}
                        view={view}
                        setView={setView}
                        filterSearchTerm={filterSearchTerm}
                        setFilterSearchTerm={setFilterSearchTerm}
                        filterResponsibleId={filterResponsibleId}
                        setFilterResponsibleId={setFilterResponsibleId}
                        filterLawsuitId={filterLawsuitId}
                        setFilterLawsuitId={setFilterLawsuitId}
                        setEditingTask={setEditingTask}
                        setIsTaskModalOpen={setIsTaskModalOpen}
                        setActiveTaskTab={setActiveTaskTab}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleDropTask={onDropTask}
                        handleDragStartTask={handleDragStartTask}
                    />
                )}

                {activeTab === 'agenda' && (
                    <CalendarTab
                        t={t}
                        credentials={credentials}
                        team={team}
                        lawsuits={lawsuits}
                        events={events}
                        filteredEvents={filteredEvents}
                        eventView={eventView}
                        setEventView={setEventView}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        setEditingEvent={setEditingEvent}
                        setIsEventModalOpen={setIsEventModalOpen}
                        handleSoftDeleteEvent={handleSoftDeleteEvent}
                        filterSearchTerm={filterSearchTerm}
                        setFilterSearchTerm={setFilterSearchTerm}
                        filterResponsibleId={filterResponsibleId}
                        setFilterResponsibleId={setFilterResponsibleId}
                        filterLawsuitId={filterLawsuitId}
                        setFilterLawsuitId={setFilterLawsuitId}
                    />
                )}

                {activeTab === 'ativos' && (
                    <AssetsTab
                        t={t}
                        credentials={credentials}
                        persons={persons}
                        lawsuits={lawsuits}
                        loading={loading}
                        assetSearch={assetSearch}
                        setAssetSearch={setAssetSearch}
                        assetStatusFilter={assetStatusFilter}
                        setAssetStatusFilter={setAssetStatusFilter}
                        assetTypeFilter={assetTypeFilter}
                        setAssetTypeFilter={setAssetTypeFilter}
                        assetViewStyle={assetViewStyle}
                        setAssetViewStyle={setAssetViewStyle}
                        filteredAssets={filteredAssets}
                        ASSET_STATUSES={ASSET_STATUSES}
                        handleDropAsset={onDropAsset}
                        handleDragStartAsset={handleDragStartAsset}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleOpenHistory={handleOpenHistory}
                        handleSoftDeleteAsset={handleSoftDeleteAsset}
                        setEditingAsset={setEditingAsset}
                        setIsAssetModalOpen={setIsAssetModalOpen}
                        setEditingAssetDoc={setEditingAssetDoc}
                        setIsAssetDocModalOpen={setIsAssetDocModalOpen}
                        renderStatusBadge={(id, currentStatus, type, options) => (
                            <NexusStatusBadge
                                id={id}
                                currentStatus={currentStatus}
                                type={type}
                                options={options}
                                setStatusPopover={setStatusPopover}
                            />
                        )}
                    />
                )}

                {activeTab === 'societario' && (
                    <SocietarioTab
                        t={t}
                        corporateSearchTerm={corporateSearchTerm}
                        setCorporateSearchTerm={setCorporateSearchTerm}
                        corporateViewStyle={corporateViewStyle}
                        setCorporateViewStyle={setCorporateViewStyle}
                        filteredEntities={filteredEntities}
                        ENTITY_STATUSES={ENTITY_STATUSES}
                        handleDropEntity={onDropEntity}
                        handleDragStartEntity={handleDragStartEntity}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleOpenHistory={handleOpenHistory}
                        handleEditEntity={handleEditEntity}
                        handleSoftDeleteEntity={handleSoftDeleteEntity}
                        setEditingEntity={setEditingEntity}
                        setShareholders={setShareholders}
                        setCorporateDocuments={setCorporateDocuments}
                        setIsEntityModalOpen={setIsEntityModalOpen}
                        setActiveEntityTab={setActiveEntityTab}
                        setEditingDocument={setEditingDocument}
                        setIsDocumentModalOpen={setIsDocumentModalOpen}
                        personForQSARef={personForQSARef}
                        renderStatusBadge={(id, currentStatus, type, options) => (
                            <NexusStatusBadge
                                id={id}
                                currentStatus={currentStatus}
                                type={type}
                                options={options}
                                setStatusPopover={setStatusPopover}
                            />
                        )}
                    />
                )}

                {activeTab === 'documentos' && (
                    <DocumentsTab
                        docSearch={docSearch}
                        setDocSearch={setDocSearch}
                        docOriginFilter={docOriginFilter}
                        setDocOriginFilter={setDocOriginFilter}
                        docTypeFilter={docTypeFilter}
                        setDocTypeFilter={setDocTypeFilter}
                        isGlobalDocsLoading={isGlobalDocsLoading}
                        filteredGlobalDocuments={filteredGlobalDocuments}
                        uniqueDocTypes={uniqueDocTypes}
                        handleOpenNexoVisual={handleOpenNexoVisual}
                        handleSummarizeDocument={handleSummarizeDocument}
                        handleDownloadFile={handleDownloadFile}
                        handleEditGlobalDocumentOrigin={handleEditGlobalDocumentOrigin}
                        handleDeleteGlobalDocument={handleDeleteGlobalDocument}
                    />
                )}
            </div>


            <LawsuitModal
                isLawsuitModalOpen={isLawsuitModalOpen}
                setIsLawsuitModalOpen={setIsLawsuitModalOpen}
                setLawsuitTimeline={setLawsuitTimeline}
                setActiveLawsuitTab={setActiveLawsuitTab}
                editingLawsuit={editingLawsuit}
                handleOpenNexoVisual={handleOpenNexoVisual}
                setActiveTab={setActiveTab}
                setEditingAsset={setEditingAsset}
                setIsAssetModalOpen={setIsAssetModalOpen}
                activeLawsuitTab={activeLawsuitTab}
                persons={persons}
                setEditingLawsuit={setEditingLawsuit}
                isLoadingCities={isLoadingCities}
                cities={cities}
                handleSaveLawsuit={handleSaveLawsuit}
                lawsuitTimeline={lawsuitTimeline}
                team={team}
                user={user}
                aiLawsuitSummary={aiLawsuitSummary}
                isAiSummarizing={isAiSummarizing}
                handleSummarizeWithAI={handleSummarizeWithAI}
                lawsuitDocuments={lawsuitDocuments}
                pendingLawsuitDocuments={pendingLawsuitDocuments}
                setEditingLawsuitDoc={setEditingLawsuitDoc}
                setIsLawsuitDocModalOpen={setIsLawsuitDocModalOpen}
                handleSummarizeDocument={handleSummarizeDocument}
                handleDeleteLawsuitDocument={handleDeleteLawsuitDocument}
                setPendingLawsuitDocuments={setPendingLawsuitDocuments}
                handleFetchLawsuitFinances={handleFetchLawsuitFinances}
                formatCNJ={formatCNJ}
                ESFERAS={ESFERAS}
                UFS={UFS}
                TRIBUNAIS={TRIBUNAIS}
                RITOS={RITOS}
                chambers={chambers}
                lawsuitFinances={lawsuitFinances}
                isFinancialLoading={isFinancialLoading}
                handleSaveFinancialTransaction={handleSaveFinancialTransaction}
                handleDeleteFinancialTransaction={handleDeleteFinancialTransaction}
                isLawsuitTimelineLoading={isLawsuitTimelineLoading}
                formatCurrency={formatCurrency}
                setAiLawsuitSummary={setAiLawsuitSummary}
                isLawsuitDocModalOpen={isLawsuitDocModalOpen}
                editingLawsuitDoc={editingLawsuitDoc}
                handleSaveLawsuitDocument={handleSaveLawsuitDocument}
                lawsuitDocUploadRef={lawsuitDocUploadRef}
                lawsuitDocFile={lawsuitDocFile}
                setLawsuitDocFile={setLawsuitDocFile}
                movements={movements}
                isMovementsLoading={isMovementsLoading}
            />

            <CrmModal
                isCrmModalOpen={isCrmModalOpen}
                setIsCrmModalOpen={setIsCrmModalOpen}
                editingPerson={editingPerson}
                setEditingPerson={setEditingPerson}
                activeCrmTab={activeCrmTab}
                setActiveCrmTab={setActiveCrmTab}
                selectedUserId={selectedUserId}
                onSuccess={fetchAll}
            />

            {/* Task Drawer (Slide-over Workflow Pattern) */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setActiveTaskTab('basic'); }}
                editingTask={editingTask}
                setEditingTask={setEditingTask}
                activeTaskTab={activeTaskTab}
                setActiveTaskTab={setActiveTaskTab}
                handleSaveTask={handleSaveTask}
                lawsuits={lawsuits}
                team={team}
                columns={columns}
                getColumnTranslation={getColumnTranslation}
            />

            {/* Event Drawer */}
            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                editingEvent={editingEvent}
                setEditingEvent={setEditingEvent}
                handleSaveEvent={handleSaveEvent}
                t={t}
                lawsuits={lawsuits}
                team={team}
            />

            {/* Asset Modal (Slide-over) */}
            <AssetModal
                isOpen={isAssetModalOpen}
                onClose={() => { setIsAssetModalOpen(false); setActiveAssetTab('basic'); }}
                editingAsset={editingAsset}
                setEditingAsset={setEditingAsset}
                activeTab={activeAssetTab}
                setActiveTab={setActiveAssetTab}
                handleSaveAsset={handleSaveAsset}
                persons={persons}
                lawsuits={lawsuits}
                justificationText={justificationText}
                setJustificationText={setJustificationText}
                assetTimeline={assetTimeline}
                setAssetTimeline={setAssetTimeline}
                isTimelineLoading={isAssetTimelineLoading}
                team={team}
                user={user}
                assetDocuments={assetDocuments}
                pendingAssetDocuments={pendingAssetDocuments}
                setPendingAssetDocuments={setPendingAssetDocuments}
                isAssetDocModalOpen={isAssetDocModalOpen}
                setIsAssetDocModalOpen={setIsAssetDocModalOpen}
                editingAssetDoc={editingAssetDoc}
                setEditingAssetDoc={setEditingAssetDoc}
                handleSaveAssetDocument={handleSaveAssetDocument}
                assetDocUploadRef={assetDocUploadRef}
                assetDocFile={assetDocFile}
                setAssetDocFile={setAssetDocFile}
                handleDownloadFile={handleDownloadFile}
                handleSummarizeDocument={handleSummarizeDocument}
                handleDeleteAssetDocument={handleDeleteAssetDocument}
            />

            {/* Corporate Entity Modal (The "Big One") */}
            <CorporateEntityModal
                isOpen={isEntityModalOpen}
                onClose={() => { setIsEntityModalOpen(false); setActiveEntityTab('basic'); }}
                editingEntity={editingEntity}
                setEditingEntity={setEditingEntity}
                activeTab={activeEntityTab}
                setActiveTab={setActiveEntityTab}
                handleSaveEntity={handleSaveEntity}
                handleOpenNexoVisual={handleOpenNexoVisual}
                shareholders={shareholders}
                corporateDocuments={corporateDocuments}
                pendingCorporateDocuments={pendingCorporateDocuments}
                setPendingCorporateDocuments={setPendingCorporateDocuments}
                corporateTimeline={corporateTimeline}
                isTimelineLoading={isCorporateTimelineLoading}
                team={team}
                user={user}
                justificationText={justificationText}
                setJustificationText={setJustificationText}
                handleDeleteShareholder={handleDeleteShareholder}
                handleDeleteDocument={handleDeleteDocument}
                handleDownloadFile={handleDownloadFile}
                handleSummarizeDocument={handleSummarizeDocument}
                isShareholderModalOpen={isShareholderModalOpen}
                setIsShareholderModalOpen={setIsShareholderModalOpen}
                editingShareholder={editingShareholder}
                setEditingShareholder={setEditingShareholder}
                handleSaveShareholder={handleSaveShareholder}
                isDocumentModalOpen={isDocumentModalOpen}
                setIsDocumentModalOpen={setIsDocumentModalOpen}
                editingDocument={editingDocument}
                setEditingDocument={setEditingDocument}
                handleSaveDocument={handleSaveDocument}
                corporateDocUploadRef={corporateDocUploadRef}
                setCorporateDocFile={setCorporateDocFile}
                ENTITY_TYPES={ENTITY_TYPES}
                TAX_REGIMES={TAX_REGIMES}
                ENTITY_STATUSES={ENTITY_STATUSES}
                formatCurrency={formatCurrency}
            />

            {/* Custom Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                t={t}
            />

            {/* Quick Status Popover */}
            <AnimatePresence>
                {statusPopover && (
                    <div key="status-popover-overlay" className="fixed inset-0 z-[500]">
                        <div 
                            className="absolute inset-0" 
                            onClick={() => setStatusPopover(null)} 
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            style={{ 
                                position: 'fixed', 
                                left: Math.min(statusPopover.rect.x, typeof window !== 'undefined' ? window.innerWidth - 180 : statusPopover.rect.x), 
                                top: statusPopover.rect.y + 8,
                                minWidth: '160px'
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[501] overflow-hidden p-2"
                        >
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-1">
                                {t('common.status')}
                            </div>
                            {statusPopover.options.map((opt, idx) => (
                                <button
                                    key={opt || `status-opt-${idx}`}
                                    onClick={() => handleQuickStatusUpdate(statusPopover.id, statusPopover.type, opt)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                                        statusPopover.currentStatus === opt 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    {opt}
                                    {statusPopover.currentStatus === opt && <Check size={14} className="text-indigo-600" />}
                                </button>
                            ))}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Justification Modal */}
            <AnimatePresence>
                {isJustificationModalOpen && (
                    <div key="justification-modal-overlay" className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => { setIsJustificationModalOpen(false); setPendingStatusChange(null); }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.justification.title')}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {t('modules.nexus.modals.justification.subtitle')}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <textarea
                                    value={justificationText}
                                    onChange={(e) => setJustificationText(e.target.value)}
                                    placeholder={t('modules.nexus.modals.justification.placeholder')}
                                    className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 transition-all outline-none resize-none"
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setIsJustificationModalOpen(false); setPendingStatusChange(null); }}
                                        className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleConfirmStatusChange}
                                        className="py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {t('common.confirm')} <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Analysis Modal */}
            <AnimatePresence mode="wait">
                {aiInfoModal.isOpen && (
                    <div key="ai-info-modal-overlay" className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => setAiInfoModal(prev => ({ ...prev, isOpen: false }))}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-900/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.lawsuit.ai.title')}</h3>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-1">CogniÃ§Ã£o Artificial Veritum</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAiInfoModal(prev => ({ ...prev, isOpen: false }))}
                                    className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-rose-500 shadow-sm"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> {aiInfoModal.title}
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50">
                                        <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line text-base italic">
                                            "{aiInfoModal.summary}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 italic">
                                        As informaÃ§Ãµes apresentadas sÃ£o geradas por inteligÃªncia artificial e devem ser validadas por um profissional jurÃ­dico antes de qualquer tomada de decisÃ£o.
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <button
                                    onClick={() => setAiInfoModal(prev => ({ ...prev, isOpen: false }))}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                >
                                    {t('common.confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

                {isHistoryModalOpen && historyData && (
                    <div key="history-modal-overlay" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => setIsHistoryModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                        <HistoryIcon className="text-indigo-600" size={18} /> {t('modules.nexus.modals.lawsuit.timeline.title')}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {historyData.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                                >
                                    <XCircle size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
                                {historyData.isLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <Loader2 size={40} className="text-indigo-600 animate-spin" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('modules.nexus.modals.lawsuit.timeline.loadingAudit')}</p>
                                    </div>
                                ) : historyData.timeline.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                                            <HistoryIcon size={40} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">Nenhum registro de histÃ³rico encontrado para este item.</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-indigo-100 dark:bg-indigo-900/30" />
                                        
                                        <div className="space-y-8">
                                            {historyData.timeline.map((entry, idx) => (
                                                <div key={entry.id || `history-entry-${idx}`} className="relative pl-12">
                                                    <div className="absolute left-0 top-1 w-[42px] h-[42px] rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/10 z-10">
                                                        {entry.action === 'CREATE' ? <Plus size={16} className="text-emerald-500" /> :
                                                         entry.action === 'STATUS_CHANGE' ? <Zap size={16} className="text-amber-500" /> :
                                                         <FileText size={16} className="text-indigo-500" />}
                                                    </div>

                                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{entry.action}</div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                                                <Clock size={12} /> {entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : 'Sem data'}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed mb-4">{entry.description}</p>
                                                        
                                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px] text-slate-500">
                                                                {team.find(t => t.id === entry.user_id)?.full_name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">ResponsÃ¡vel</span>
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{team.find(t => t.id === entry.user_id)?.full_name || 'Sistema'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="w-full py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-[10px] border border-slate-200 dark:border-slate-700"
                                >
                                    {t('common.back')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                <NexoVisual 
                    key="nexo-visual-component"                    isOpen={isNexoVisualOpen}
                    onClose={() => setIsNexoVisualOpen(false)}
                    initialData={nexoData}
                    selectedUserId={selectedUserId}
                    persons={persons}
                    team={team}
                    assets={assets}
                    lawsuits={lawsuits}
                    tasks={tasks}
                    corporateEntities={corporateEntities}
                    onEdit={(type, data, category) => {
                        // 1. Logic for Roles: "Opening the modal to which they belong"
                        if (category && ['Autor', 'RÃ©u', 'ResponsÃ¡vel', 'ProprietÃ¡rio', 'SÃ³cio', 'GestÃ£o', 'Origem'].includes(category)) {
                             if (nexoData?.origin_type === 'lawsuit') { 
                                 setEditingLawsuit(nexoData.data); 
                                 setIsLawsuitModalOpen(true); 
                                 return; 
                             }
                             if (nexoData?.origin_type === 'asset') { 
                                 setEditingAsset(nexoData.data); 
                                 setIsAssetModalOpen(true); 
                                 return; 
                             }
                             if (nexoData?.origin_type === 'corporate') { 
                                 setEditingEntity(nexoData.data); 
                                 setIsEntityModalOpen(true); 
                                 return; 
                             }
                        }

                        if (type === 'lawsuit') { setEditingLawsuit(data); setIsLawsuitModalOpen(true); }
                        else if (type === 'asset') { setEditingAsset(data); setIsAssetModalOpen(true); }
                        else if (type === 'corporate') { setEditingEntity(data); setIsEntityModalOpen(true); }
                        else if (type === 'task') { setEditingTask(data); setIsTaskModalOpen(true); }
                        else if (type === 'person') { 
                            setActiveTab('pessoas');
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('CRM_OPEN_MODAL', { detail: data }));
                            }, 100);
                        }
                        else if (type === 'lawsuit_document') {
                            setEditingLawsuitDoc(data);
                            const law = lawsuits.find(l => l.id === data.lawsuit_id);
                            if (law) setEditingLawsuit(law);
                            setIsLawsuitDocModalOpen(true);
                        }
                        else if (type === 'asset_document') {
                            setEditingAssetDoc(data);
                            const asset = assets.find(a => a.id === data.asset_id);
                            if (asset) setEditingAsset(asset);
                            setIsAssetDocModalOpen(true);
                        }
                        else if (type === 'corporate_document') {
                            setEditingDocument(data);
                            const entity = corporateEntities.find(e => e.id === data.entity_id);
                            if (entity) {
                                setEditingEntity(entity);
                                setIsEntityModalOpen(true);
                            } else {
                                setIsDocumentModalOpen(true);
                            }
                        }
                    }}
                    refreshTrigger={visualRefreshTrigger}
                />
        </div>
    );
};

export default Nexus;

