import { useState } from 'react';
import { 
    Lawsuit, Task, CalendarEvent, Asset, CorporateEntity, 
    Shareholder, CorporateDocument, LawsuitDocument, AssetDocument, Person, GlobalDocument, FinancialTransaction, TimelineEntry 
} from '@/types';

export const useNexusUI = () => {
    // Current date for calendar
    const [currentDate, setCurrentDate] = useState(new Date());

    // Active Tab & View Styles
    const [activeTab, setActiveTab] = useState<'overview' | 'pessoas' | 'processos' | 'tarefas' | 'agenda' | 'ativos' | 'societario' | 'documentos'>('overview');
    const [processViewStyle, setProcessViewStyle] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [assetViewStyle, setAssetViewStyle] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [corporateViewStyle, setCorporateViewStyle] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [view, setView] = useState<'kanban' | 'list'>('kanban'); // tasks view
    const [eventView, setEventView] = useState<'calendar' | 'list'>('calendar');

    // Modal States
    const [isLawsuitModalOpen, setIsLawsuitModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [isShareholderModalOpen, setIsShareholderModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isNexoVisualOpen, setIsNexoVisualOpen] = useState(false);
    const [isLawsuitDocModalOpen, setIsLawsuitDocModalOpen] = useState(false);
    const [isAssetDocModalOpen, setIsAssetDocModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);

    // Editing States
    const [editingLawsuit, setEditingLawsuit] = useState<Partial<Lawsuit> | null>(null);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
    const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [editingEntity, setEditingEntity] = useState<Partial<CorporateEntity> | null>(null);
    const [editingShareholder, setEditingShareholder] = useState<Partial<Shareholder> | null>(null);
    const [editingDocument, setEditingDocument] = useState<Partial<CorporateDocument> | null>(null);
    const [editingLawsuitDoc, setEditingLawsuitDoc] = useState<Partial<LawsuitDocument> | null>(null);
    const [editingAssetDoc, setEditingAssetDoc] = useState<Partial<AssetDocument> | null>(null);

    // Sub-Tab States
    const [activeCrmTab, setActiveCrmTab] = useState<'basic' | 'advanced'>('basic');
    const [activeAssetTab, setActiveAssetTab] = useState<'basic' | 'advanced' | 'docs' | 'timeline'>('basic');
    const [activeLawsuitTab, setActiveLawsuitTab] = useState<'basic' | 'advanced' | 'docs' | 'timeline' | 'financeiro' | 'ai'>('basic');
    const [activeEntityTab, setActiveEntityTab] = useState<'basic' | 'qsa' | 'docs' | 'timeline'>('basic');
    const [activeTaskTab, setActiveTaskTab] = useState<'basic' | 'advanced'>('basic');

    return {
        currentDate, setCurrentDate,
        activeTab, setActiveTab,
        processViewStyle, setProcessViewStyle,
        assetViewStyle, setAssetViewStyle,
        corporateViewStyle, setCorporateViewStyle,
        view, setView,
        eventView, setEventView,
        
        isLawsuitModalOpen, setIsLawsuitModalOpen,
        isTaskModalOpen, setIsTaskModalOpen,
        isEventModalOpen, setIsEventModalOpen,
        isAssetModalOpen, setIsAssetModalOpen,
        isCrmModalOpen, setIsCrmModalOpen,
        isEntityModalOpen, setIsEntityModalOpen,
        isShareholderModalOpen, setIsShareholderModalOpen,
        isDocumentModalOpen, setIsDocumentModalOpen,
        isNexoVisualOpen, setIsNexoVisualOpen,
        isLawsuitDocModalOpen, setIsLawsuitDocModalOpen,
        isAssetDocModalOpen, setIsAssetDocModalOpen,
        isHistoryModalOpen, setIsHistoryModalOpen,
        isJustificationModalOpen, setIsJustificationModalOpen,
        
        editingLawsuit, setEditingLawsuit,
        editingTask, setEditingTask,
        editingEvent, setEditingEvent,
        editingAsset, setEditingAsset,
        editingPerson, setEditingPerson,
        editingEntity, setEditingEntity,
        editingShareholder, setEditingShareholder,
        editingDocument, setEditingDocument,
        editingLawsuitDoc, setEditingLawsuitDoc,
        editingAssetDoc, setEditingAssetDoc,
        
        activeCrmTab, setActiveCrmTab,
        activeAssetTab, setActiveAssetTab,
        activeLawsuitTab, setActiveLawsuitTab,
        activeEntityTab, setActiveEntityTab,
        activeTaskTab, setActiveTaskTab,
    };
};
