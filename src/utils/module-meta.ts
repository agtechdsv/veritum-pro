import {
    GitBranch, FileEdit, DollarSign, BarChart3,
    MessageSquare, ShieldAlert, Zap, LucideIcon
} from 'lucide-react';
import { ModuleId } from '@/types';

export interface ModuleMeta {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
}

export const BASE_SUITE_ITEMS: ModuleMeta[] = [
    { id: ModuleId.NEXUS, label: 'Nexus', icon: GitBranch, color: 'text-indigo-500' },
    { id: ModuleId.SCRIPTOR, label: 'Scriptor', icon: FileEdit, color: 'text-amber-500' },
    { id: ModuleId.VALOREM, label: 'Valorem', icon: DollarSign, color: 'text-emerald-500' },
    { id: ModuleId.COGNITIO, label: 'Cognitio', icon: BarChart3, color: 'text-cyan-500' },
    { id: ModuleId.VOX, label: 'Vox Clientis', icon: MessageSquare, color: 'text-violet-500' },
    { id: ModuleId.SENTINEL, label: 'Sentinel', icon: ShieldAlert, color: 'text-rose-500' },
    { id: ModuleId.INTELLIGENCE, label: 'Intelligence', icon: Zap, color: 'text-amber-500' },
];

export const getModuleMeta = (id: string) => {
    const normalizedId = id.toLowerCase().replace('_key', '');
    return BASE_SUITE_ITEMS.find(item => item.id.toLowerCase() === normalizedId);
};
