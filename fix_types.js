const fs = require('fs');
let modalContent = fs.readFileSync('src/components/modules/nexus/modals/LawsuitModal.tsx', 'utf8');

const interfaceStr = `
import { Lawsuit, Person, TeamMember, LawsuitDocument, TimelineEntry, FinancialTransaction } from '@/types';

interface LawsuitModalProps {
    isLawsuitModalOpen: boolean;
    setIsLawsuitModalOpen: any;
    setLawsuitTimeline: any;
    setActiveLawsuitTab: any;
    editingLawsuit: Partial<Lawsuit> | null;
    handleOpenNexoVisual: any;
    setActiveTab: any;
    setEditingAsset: any;
    setIsAssetModalOpen: any;
    activeLawsuitTab: string;
    persons: Person[];
    setEditingLawsuit: any;
    isLoadingCities: boolean;
    cities: any[];
    handleSaveLawsuit: any;
    lawsuitTimeline: TimelineEntry[];
    team: TeamMember[];
    user: any;
    aiLawsuitSummary: string | null;
    isAiSummarizing: boolean;
    handleSummarizeWithAI: any;
    lawsuitDocuments: LawsuitDocument[];
    pendingLawsuitDocuments: any[];
    setEditingLawsuitDoc: any;
    setIsLawsuitDocModalOpen: any;
    handleSummarizeDocument: any;
    handleDeleteLawsuitDocument: any;
    setPendingLawsuitDocuments: any;
    handleFetchLawsuitFinances: any;
    formatCurrency: any;
    formatCNJ: any;
    ESFERAS: string[];
    UFS: string[];
    TRIBUNAIS: Record<string, any>;
    RITOS: Record<string, string[]>;
    chambers: any[];
    lawsuitFinances: FinancialTransaction[];
    isFinancialLoading: boolean;
    handleSaveFinancialTransaction: any;
    handleDeleteFinancialTransaction: any;
    isLawsuitTimelineLoading: boolean;
    setAiLawsuitSummary: any;
}

export const LawsuitModal = (props: LawsuitModalProps) => {
`;

modalContent = modalContent.replace("export const LawsuitModal = (props: any) => {", interfaceStr);
fs.writeFileSync('src/components/modules/nexus/modals/LawsuitModal.tsx', modalContent);
