import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Network, Shield, XCircle, Scale, Building2, User as UserIcon, 
    Briefcase, FileText, CheckCircle2, Users, Zap, Search, 
    Maximize2, Minimize2, ChevronRight, Info, Pencil
} from 'lucide-react';
import { 
    Lawsuit, LawsuitDocument, Task, Person, TeamMember, Asset, 
    CorporateEntity, Shareholder, CorporateDocument, AssetDocument 
} from '@/types';
import { 
    listShareholders, listCorporateDocuments, listLawsuitDocuments, 
    listAssetDocuments, listPersonParticipations 
} from '@/app/actions/nexus-actions';

interface NexoVisualProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: { origin_type: 'lawsuit' | 'corporate' | 'asset' | 'task' | 'document' | 'person' | 'lawsuit_document' | 'asset_document' | 'corporate_document', id: string, title: string, data: any } | null;
    selectedUserId: string;
    persons: Person[];
    team: TeamMember[];
    assets: Asset[];
    lawsuits: Lawsuit[];
    tasks: Task[];
    corporateEntities: CorporateEntity[];
    onEdit?: (type: string, data: any, category?: string) => void;
    refreshTrigger?: number;
}

export const NexoVisual: React.FC<NexoVisualProps> = ({
    isOpen,
    onClose,
    initialData,
    selectedUserId,
    persons,
    team,
    assets,
    lawsuits,
    tasks,
    corporateEntities,
    onEdit,
    refreshTrigger = 0
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [nexoData, setNexoData] = useState(initialData);
    const [zoom, setZoom] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Sub-data states for the current exploration session
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [corporateDocuments, setCorporateDocuments] = useState<CorporateDocument[]>([]);
    const [lawsuitDocuments, setLawsuitDocuments] = useState<LawsuitDocument[]>([]);
    const [assetDocuments, setAssetDocuments] = useState<AssetDocument[]>([]);

    // Reset nexoData when initialData changes from parent
    useEffect(() => {
        if (initialData) {
            setNexoData(initialData);
            setZoom(1);
            setSelectedNode(null);
        }
    }, [initialData]);

    // Fetch detailed sub-data for the current node
    useEffect(() => {
        if (isOpen && nexoData?.id) {
            const { origin_type, id } = nexoData;
            setIsLoading(true);

            const performFetch = async () => {
                try {
                    // Reset sub-data before fetching new node data
                    setShareholders([]);
                    setCorporateDocuments([]);
                    setLawsuitDocuments([]);
                    setAssetDocuments([]);

                    if (origin_type === 'corporate') {
                        const [sResult, dResult] = await Promise.all([
                            listShareholders(id, selectedUserId),
                            listCorporateDocuments(id, selectedUserId)
                        ]);
                        if (sResult.data) setShareholders(sResult.data);
                        if (dResult.data) setCorporateDocuments(dResult.data);
                    } else if (origin_type === 'lawsuit') {
                        const result = await listLawsuitDocuments(id, selectedUserId);
                        if (result.data) setLawsuitDocuments(result.data);
                    } else if (origin_type === 'asset') {
                        const result = await listAssetDocuments(id, selectedUserId);
                        if (result.data) setAssetDocuments(result.data);
                    } else if (origin_type === 'person') {
                        const result = await listPersonParticipations(id, selectedUserId);
                        if (result.data) {
                            setShareholders(result.data.map((s: any) => ({
                                ...s,
                                shareholder_name: s.entity?.legal_name || 'Holding Desconhecida'
                            })));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching Nexo Visual sub-data:', error);
                } finally {
                    setTimeout(() => setIsLoading(false), 600);
                }
            };

            performFetch();
        }
    }, [nexoData?.id, selectedUserId, isOpen, refreshTrigger]);

    const handleNavigate = (type: string, data: any) => {
        let title = '';
        if (type === 'lawsuit') title = data.case_title || data.cnj_number;
        else if (type === 'corporate') title = data.legal_name;
        else if (type === 'person') title = data.full_name;
        else if (type === 'asset' || type === 'task') title = data.title;
        else if (type === 'lawsuit_document' || type === 'asset_document' || type === 'corporate_document') title = data.title;
        else if (type === 'document') title = data.title;
        else if (data.shareholder_name) title = data.shareholder_name;

        setNexoData({
            origin_type: type as any,
            id: data.id,
            title: title || 'Sem Título',
            data: data
        });
        setSelectedNode(null);
    };

    if (!isOpen || !nexoData) return null;

    // Reactivity fix: Find the latest version of the focused entity in props
    const currentData = (() => {
        if (!nexoData) return null;
        const { origin_type, id } = nexoData;
        
        switch (origin_type) {
            case 'lawsuit': return lawsuits.find(l => l.id === id) || nexoData.data;
            case 'person': return persons.find(p => p.id === id) || nexoData.data;
            case 'asset': return assets.find(a => a.id === id) || nexoData.data;
            case 'corporate': return corporateEntities.find(c => c.id === id) || nexoData.data;
            case 'task': return tasks.find(t => t.id === id) || nexoData.data;
            case 'lawsuit_document': return lawsuitDocuments.find(d => d.id === id) || nexoData.data;
            case 'asset_document': return assetDocuments.find(d => d.id === id) || nexoData.data;
            case 'corporate_document': return corporateDocuments.find(d => d.id === id) || nexoData.data;
            default: return nexoData.data;
        }
    })();

    const displayTitle = (() => {
        if (nexoData.origin_type === 'lawsuit') return currentData.case_title || currentData.cnj_number || nexoData.title;
        if (nexoData.origin_type === 'corporate') return currentData.legal_name || nexoData.title;
        if (nexoData.origin_type === 'person') return currentData.full_name || nexoData.title;
        if (nexoData.origin_type === 'asset' || nexoData.origin_type === 'task' || nexoData.origin_type.includes('document')) return currentData.title || nexoData.title;
        return nexoData.title;
    })();

    const baseRadius = 240;
    const neighbors: any[] = [];
    const { origin_type, id } = nexoData;
    const data = currentData; // Use the live data for neighbor calculation
    
    // Neighbors Calculation Logic
    if (origin_type === 'lawsuit') {
        const author = persons.find(p => p.id === data.author_id);
        if (author) neighbors.push({ label: author.full_name, icon: UserIcon, hex: '#3b82f6', bg: 'bg-blue-500', cat: 'Autor', type: 'person', data: author });

        const def = persons.find(p => p.id === data.defendant_id);
        if (def) neighbors.push({ label: def.full_name, icon: UserIcon, hex: '#f43f5e', bg: 'bg-rose-500', cat: 'Réu', type: 'person', data: def });
        
        const lawyer = team.find(t => t.id === data.responsible_lawyer_id);
        if (lawyer) neighbors.push({ label: lawyer.full_name, icon: Briefcase, hex: '#f59e0b', bg: 'bg-amber-500', cat: 'Responsável', type: 'person', data: lawyer });
        
        assets.filter(a => a.lawsuit_id === id).forEach(a => neighbors.push({ label: a.title, icon: Shield, hex: '#10b981', bg: 'bg-emerald-500', cat: 'Ativo', type: 'asset', data: a }));
        lawsuitDocuments.filter(d => d.lawsuit_id === id).forEach(d => neighbors.push({ label: d.title, icon: FileText, hex: '#64748b', bg: 'bg-slate-500', cat: 'Documento', type: 'lawsuit_document', data: d }));
        tasks.filter(t => t.lawsuit_id === id).forEach(t => neighbors.push({ label: t.title, icon: CheckCircle2, hex: '#8b5cf6', bg: 'bg-purple-500', cat: 'Tarefa', type: 'task', data: t }));
    } else if (origin_type === 'corporate') {
        shareholders.filter(s => s.entity_id === id).forEach(s => {
            let neighborData = null;
            let neighborType: any = null;
            if (s.person_shareholder_id) {
                neighborData = persons.find(p => p.id === s.person_shareholder_id);
                neighborType = 'person';
            } else if (s.corporate_shareholder_id) {
                neighborData = corporateEntities.find(e => e.id === s.corporate_shareholder_id);
                neighborType = 'corporate';
            }
            neighbors.push({ label: s.shareholder_name, icon: Users, hex: '#3b82f6', bg: 'bg-blue-500', cat: 'Sócio', type: neighborType, data: neighborData || s });
        });
        corporateDocuments.filter(d => d.entity_id === id).forEach(d => neighbors.push({ label: d.title, icon: FileText, hex: '#64748b', bg: 'bg-slate-500', cat: 'Documento', type: 'corporate_document', data: d }));
    } else if (origin_type === 'person') {
        lawsuits.filter(l => l.author_id === id || l.defendant_id === id).forEach(l => neighbors.push({ label: l.case_title || l.cnj_number, icon: Scale, hex: '#8b5cf6', bg: 'bg-purple-500', cat: 'Processo', type: 'lawsuit', data: l }));
        lawsuits.filter(l => l.responsible_lawyer_id === id).forEach(l => neighbors.push({ label: l.case_title || l.cnj_number, icon: Briefcase, hex: '#f59e0b', bg: 'bg-amber-500', cat: 'Gestão', type: 'lawsuit', data: l }));
        assets.filter(a => a.person_id === id).forEach(a => neighbors.push({ label: a.title, icon: Shield, hex: '#10b981', bg: 'bg-emerald-500', cat: 'Ativo', type: 'asset', data: a }));
        shareholders.forEach(s => {
            const entity = (s as any).entity || corporateEntities.find(e => e.id === s.entity_id);
            if (entity) neighbors.push({ label: entity.legal_name, icon: Building2, hex: '#3b82f6', bg: 'bg-blue-500', cat: 'Sociedade/PJ', type: 'corporate', data: entity });
        });
        tasks.filter(t => t.responsible_id === id).forEach(t => neighbors.push({ label: t.title, icon: CheckCircle2, hex: '#f59e0b', bg: 'bg-amber-500', cat: 'Tarefa', type: 'task', data: t }));
    } else if (origin_type === 'asset') {
        const owner = persons.find(p => p.id === data.person_id);
        if (owner) neighbors.push({ label: owner.full_name, icon: UserIcon, hex: '#3b82f6', bg: 'bg-blue-500', cat: 'Proprietário', type: 'person', data: owner });
        const lawsuit = lawsuits.find(l => l.id === data.lawsuit_id);
        if (lawsuit) neighbors.push({ label: lawsuit.case_title || lawsuit.cnj_number, hex: '#8b5cf6', icon: Scale, bg: 'bg-purple-500', cat: 'Processo', type: 'lawsuit', data: lawsuit });
        assetDocuments.filter(d => d.asset_id === id).forEach(d => neighbors.push({ label: d.title, icon: FileText, hex: '#64748b', bg: 'bg-slate-500', cat: 'Documento', type: 'asset_document', data: d }));
    } else if (origin_type === 'task') {
        const lawsuit = lawsuits.find(l => l.id === data.lawsuit_id);
        if (lawsuit) neighbors.push({ label: lawsuit.case_title || lawsuit.cnj_number, hex: '#8b5cf6', icon: Scale, bg: 'bg-purple-500', cat: 'Processo', type: 'lawsuit', data: lawsuit });
        const resp = team.find(t => t.id === data.responsible_id);
        if (resp) neighbors.push({ label: resp.full_name, icon: UserIcon, hex: '#f59e0b', bg: 'bg-amber-500', cat: 'Responsável', type: 'person', data: resp });
    } else if (origin_type === 'document' || origin_type === 'lawsuit_document' || origin_type === 'asset_document' || origin_type === 'corporate_document') {
        const oType = data.origin_type || (data.lawsuit_id ? 'lawsuit' : data.asset_id ? 'asset' : data.entity_id ? 'corporate' : null);
        const oId = data.origin_id || data.lawsuit_id || data.asset_id || data.entity_id;

        if (oType === 'lawsuit') {
            const law = lawsuits.find(l => l.id === oId);
            if (law) neighbors.push({ label: law.case_title || law.cnj_number, hex: '#8b5cf6', icon: Scale, bg: 'bg-purple-500', cat: 'Origem', type: 'lawsuit', data: law });
        } else if (oType === 'corporate') {
            const entity = corporateEntities.find(e => e.id === oId);
            if (entity) neighbors.push({ label: entity.legal_name, icon: Building2, hex: '#3b82f6', bg: 'bg-blue-500', cat: 'Origem', type: 'corporate', data: entity });
        } else if (oType === 'asset') {
            const asset = assets.find(a => a.id === oId);
            if (asset) neighbors.push({ label: asset.title, icon: Shield, hex: '#10b981', bg: 'bg-emerald-500', cat: 'Origem', type: 'asset', data: asset });
        }
    }

    // Filter neighbors based on search
    const filteredNeighbors = searchTerm 
        ? neighbors.filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()) || n.cat.toLowerCase().includes(searchTerm.toLowerCase()))
        : neighbors;

    const renderCenterIcon = () => {
        const iconSize = 48;
        const colorClass = "text-indigo-600 mb-2";
        switch (nexoData.origin_type) {
            case 'lawsuit': return <Scale size={iconSize} className={colorClass} />;
            case 'corporate': return <Building2 size={iconSize} className={colorClass} />;
            case 'asset': return <Shield size={iconSize} className={colorClass} />;
            case 'task': return <CheckCircle2 size={iconSize} className={colorClass} />;
            case 'person': return <UserIcon size={iconSize} className={colorClass} />;
            default: return <FileText size={iconSize} className={colorClass} />;
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-3xl flex flex-col overflow-hidden font-sans"
            >
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full" />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" />
                </div>

                {/* Header */}
                <div className="p-8 flex items-center justify-between border-b border-white/5 relative z-50 bg-slate-950/40 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                <Network size={26} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Nexo Visual</h2>
                                <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                                    <Zap size={10} /> Nexus Graph Engine v2.0
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="hidden lg:flex items-center ml-8 relative group">
                            <Search className="absolute left-4 text-white/30 group-focus-within:text-indigo-400 transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Filtrar conexões..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-6 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-4 px-5 py-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner"
                                >
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [4, 12, 4], opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                                className="w-1 bg-indigo-400 rounded-full"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] animate-pulse">
                                        Mapeando Nodes...
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <Minimize2 size={16} />
                            </button>
                            <span className="text-[10px] font-black text-white/60 w-10 text-center uppercase tracking-tighter">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>

                        <div className="h-10 w-px bg-white/10 mx-2" />

                        <button 
                            onClick={onClose}
                            className="p-4 text-white/30 hover:text-white hover:bg-rose-500/20 rounded-full transition-all group relative"
                        >
                            <XCircle size={32} className="group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                        </button>
                    </div>
                </div>

                {/* Main Interactive Workspace */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Right Info Panel (Conditional) */}
                    <AnimatePresence>
                        {selectedNode && (
                            <motion.div 
                                initial={{ x: 400, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 400, opacity: 0 }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 w-80 z-[100] bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16" />
                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl ${selectedNode.bg} text-white flex items-center justify-center mb-6 shadow-xl`}>
                                        <selectedNode.icon size={24} />
                                    </div>
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-2 block">{selectedNode.cat}</span>
                                    <h3 className="text-xl font-black text-white leading-tight mb-4 tracking-tighter">{selectedNode.label}</h3>
                                    
                                    <div className="space-y-4 mb-8">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">ID de Referência</p>
                                            <code className="text-[10px] text-indigo-400 font-mono">#{selectedNode.data?.id?.substring(0, 8) || 'N/A'}</code>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleNavigate(selectedNode.type, selectedNode.data)}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
                                        >
                                            Focar Conexão <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button 
                                            onClick={() => setSelectedNode(null)}
                                            className="p-3.5 bg-white/10 text-white/60 hover:text-white rounded-2xl border border-white/10 transition-all"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                    {onEdit && selectedNode.type && (
                                        <button 
                                            onClick={() => onEdit(selectedNode.type, selectedNode.data, selectedNode.cat)}
                                            className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <Pencil size={14} /> Editar Detalhes
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Interactive Canvas */}
                    <div 
                        ref={containerRef}
                        className="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
                    >
                        <motion.div 
                            key={nexoData.id} 
                            style={{ scale: zoom }}
                            className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                        >
                            {/* SVG Connections Layout */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                {!isLoading && filteredNeighbors.map((n, i) => {
                                    const angle = (i / filteredNeighbors.length) * 2 * Math.PI;
                                    const radius = baseRadius + (i % 2 === 0 ? 0 : 60);
                                    const x2 = Math.cos(angle) * radius;
                                    const y2 = Math.sin(angle) * radius;
                                    const nodeKey = `line-${n.type}-${n.data?.id || n.label}-${nexoData.id}-${i}`;
                                    
                                    return (
                                        <motion.line
                                            key={nodeKey}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 0.15 }}
                                            transition={{ duration: 1, delay: 0.2 + i * 0.04 }}
                                            x1="50%" y1="50%"
                                            x2={`calc(50% + ${x2}px)`} y2={`calc(50% + ${y2}px)`}
                                            stroke={n.hex}
                                            strokeWidth="2"
                                            strokeDasharray="8 8"
                                        />
                                    );
                                })}
                            </svg>

                            {/* Center Subject Node */}
                            <div className="relative z-50">
                                <AnimatePresence>
                                    {isLoading && (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                                                className="absolute inset-0 rounded-full border border-indigo-500/40 pointer-events-none"
                                            />
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: [1, 3], opacity: [0.2, 0] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                                                className="absolute inset-0 rounded-full border border-blue-400/20 pointer-events-none"
                                            />
                                        </>
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    key={`center-${nexoData.id}`}
                                    drag
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    dragElastic={0.8}
                                    dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                                    className="relative w-56 h-56 bg-white dark:bg-slate-900 rounded-full border-[6px] border-indigo-600 shadow-[0_0_80px_rgba(79,70,229,0.4)] flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
                                >
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {renderCenterIcon()}
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight line-clamp-2 tracking-tighter mb-2">
                                        {displayTitle}
                                    </h4>
                                    <div className="px-4 py-1.5 bg-indigo-600 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-600/30">
                                        Foco Central
                                    </div>
                                    
                                    {onEdit && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEdit(nexoData.origin_type, nexoData.data, 'Foco Central'); }}
                                            className="absolute -top-2 -right-2 p-3 bg-white dark:bg-slate-800 border-2 border-indigo-600 rounded-2xl text-indigo-600 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    )}
                                </motion.div>
                            </div>

                            {/* Peripheral Connected Nodes */}
                            {!isLoading && filteredNeighbors.map((n, i) => {
                                const angle = (i / filteredNeighbors.length) * 2 * Math.PI;
                                const radius = baseRadius + (i % 2 === 0 ? 0 : 60);
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                const nodeKey = `node-${n.type}-${n.data?.id || n.label}-${nexoData.id}-${i}`;
                                const isSelected = selectedNode?.label === n.label;
                                
                                return (
                                    <motion.div
                                        key={nodeKey}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        style={{ x, y, position: 'absolute' }}
                                        transition={{ 
                                            scale: { type: 'spring', damping: 12, stiffness: 180, delay: 0.3 + i * 0.05 },
                                            opacity: { duration: 0.4, delay: 0.3 + i * 0.05 }
                                        }}
                                        onClick={() => setSelectedNode(n)}
                                        onDoubleClick={() => n.type && n.data && handleNavigate(n.type, n.data)}
                                        className={`absolute w-44 p-4 ${isSelected ? 'bg-indigo-600/20 border-indigo-400/50 ring-4 ring-indigo-500/20' : 'bg-slate-900/60 border-white/10'} backdrop-blur-xl border rounded-[2.5rem] flex flex-col items-center text-center group cursor-pointer hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all hover:scale-105 shadow-2xl z-30`}
                                    >
                                        <div className={`p-4 ${n.bg} text-white rounded-[1.2rem] mb-3 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative`}>
                                            <n.icon size={22} />
                                            {n.type && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                                                    <Info size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-[0.25em] mb-1.5 transition-colors ${isSelected ? 'text-indigo-400' : 'text-white/40 group-hover:text-indigo-400'}`}>{n.cat}</span>
                                        <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight px-2 group-hover:scale-105 transition-transform">
                                            {n.label}
                                        </span>
                                        
                                        {/* Edit Button for Peripheral Node */}
                                        {onEdit && n.type && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onEdit(n.type, n.data, n.cat); }}
                                                className="absolute -top-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-50 border border-white/20"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        )}

                                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[7px] font-black text-white uppercase tracking-widest hover:bg-white/20">
                                                Detalhes
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

                {/* Footer Controls & Legend */}
                <div className="p-8 flex justify-between items-center relative z-50 bg-slate-950/60 backdrop-blur-md border-t border-white/5">
                    <div className="flex gap-8">
                        {[
                            { color: 'bg-blue-500', label: 'Pessoas', icon: UserIcon },
                            { color: 'bg-emerald-500', label: 'Ativos', icon: Shield },
                            { color: 'bg-slate-500', label: 'Documentos', icon: FileText },
                            { color: 'bg-indigo-500', label: 'Corporativo', icon: Building2 },
                            { color: 'bg-purple-500', label: 'Jurídico', icon: Scale }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 group cursor-default">
                                <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    <item.icon size={12} />
                                </div>
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] transition-colors group-hover:text-white/70">{item.label}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Sincronização Ativa</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[8px] font-black text-emerald-500/80 uppercase">Modo Inteligência</span>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-3">
                                <Users size={12} className="text-indigo-400" /> {neighbors.length} Conexões Mapeadas
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
