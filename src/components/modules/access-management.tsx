'use client'

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, CheckCircle2, XCircle, Layout, Filter, Scale, FileEdit, DollarSign, BarChart3, MessageSquare, ShieldAlert, ChevronRight, Check, ChevronDown, Database, Layers, Package, Wand2, Sparkles } from 'lucide-react';
import { AccessGroup, GroupPermission, User, ModuleId, Suite, Feature, GroupTemplate } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from '../ui/toast';

interface Props {
    currentUser: User;
}

const AccessManagement: React.FC<Props> = ({ currentUser }) => {
    const [groups, setGroups] = useState<AccessGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Partial<AccessGroup> | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<AccessGroup | null>(null);

    // Feature-level RBAC state
    const [suites, setSuites] = useState<Suite[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [templates, setTemplates] = useState<GroupTemplate[]>([]);
    const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
    const [expandedSuites, setExpandedSuites] = useState<string[]>([]);

    const supabase = createMasterClient();

    useEffect(() => {
        fetchGroups();
        fetchSuites();
        fetchFeatures();
        fetchTemplates();
    }, []);

    useEffect(() => {
        const orphanFeatures = features.filter(f => !suites.some(s => s.id === f.suite_id));
        console.log('RBAC Sync Diagnostic:', {
            totalSuites: suites.length,
            totalFeatures: features.length,
            orphanFeaturesCount: orphanFeatures.length,
            firstSuite: suites[0] ? { id: suites[0].id, name: suites[0].name } : 'None',
            firstFeature: features[0] ? { id: features[0].id, suite_id: features[0].suite_id, name: features[0].display_name } : 'None',
            mismatchDetected: orphanFeatures.length > 0 && features.length > 0
        });

        if (orphanFeatures.length > 0) {
            console.warn('Orphan Features Detected (IDs do not match any suite):', orphanFeatures.slice(0, 5));
        }
    }, [suites, features]);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('group_templates').select('*').order('name');
        if (data) setTemplates(data);
    };

    const fetchGroups = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('access_groups')
            .select('*')
            .eq('admin_id', currentUser.id);

        if (!error && data) setGroups(data);
        setLoading(false);
    };

    const fetchSuites = async () => {
        const { data, error } = await supabase
            .from('suites')
            .select('*')
            .eq('active', true)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching suites:', error.message, error.details);
            toast.error('Erro ao carregar módulos do sistema.');
        }
        if (data) setSuites(data);
    };

    const fetchFeatures = async () => {
        const { data, error } = await supabase
            .from('features')
            .select('*')
            .order('display_name', { ascending: true });

        if (error) {
            console.error('Error fetching features:', error.message, error.details);
            toast.error('Erro ao carregar funcionalidades.');
        }
        if (data) setFeatures(data);
    };

    const fetchGroupPermissions = async (groupId: string) => {
        const { data, error } = await supabase
            .from('group_permissions')
            .select('feature_id')
            .eq('group_id', groupId);

        if (!error && data) {
            setSelectedFeatureIds(data.map((p: any) => p.feature_id));
        } else {
            setSelectedFeatureIds([]);
        }
    };

    const handleOpenModal = async (group?: AccessGroup) => {
        if (group) {
            setEditingGroup(group);
            await fetchGroupPermissions(group.id);
        } else {
            setEditingGroup({ name: '' });
            setSelectedFeatureIds([]);
            setExpandedSuites([]);
        }
        setIsModalOpen(true);
    };

    const handleSaveGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup?.name) return;

        // Validar duplicidade local antes de tentar salvar
        const isDuplicate = groups.some(g =>
            g.name.toLowerCase() === editingGroup.name?.toLowerCase() && g.id !== editingGroup.id
        );

        if (isDuplicate) {
            toast.error(`Já existe um grupo com o nome "${editingGroup.name}"`);
            return;
        }

        try {
            let groupId = editingGroup.id;

            if (groupId) {
                // Update Group Name
                const { error: groupError } = await supabase.from('access_groups').update({ name: editingGroup.name }).eq('id', groupId);
                if (groupError) throw groupError;
            } else {
                // Create Group
                const { data, error } = await supabase
                    .from('access_groups')
                    .insert({ name: editingGroup.name, admin_id: currentUser.id })
                    .select()
                    .single();

                if (error) throw error;
                groupId = data.id;
            }

            // Sync Permissions (Delete old, Insert new)
            await supabase.from('group_permissions').delete().eq('group_id', groupId);

            if (selectedFeatureIds.length > 0) {
                const permissionInserts = selectedFeatureIds.map(fid => ({
                    group_id: groupId,
                    feature_id: fid,
                    can_access: true
                }));

                const { error: permError } = await supabase
                    .from('group_permissions')
                    .insert(permissionInserts);

                if (permError) throw permError;
            }

            toast.success('Grupo de acesso e permissões salvos!');
            setIsModalOpen(false);
            fetchGroups();
        } catch (err: any) {
            if (err.code === '23505') {
                toast.error(`Já existe um grupo chamado "${editingGroup.name}" no seu ecossistema.`);
            } else {
                toast.error('Erro ao salvar grupo: ' + err.message);
            }
        }
    };

    const handleDeleteGroup = async (group: AccessGroup) => {
        setGroupToDelete(group);
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return;

        const { error } = await supabase.from('access_groups').delete().eq('id', groupToDelete.id);
        if (!error) {
            toast.success('Grupo removido.');
            setGroupToDelete(null);
            fetchGroups();
        } else {
            toast.error('Erro ao remover: ' + error.message);
        }
    };

    const toggleFeaturePermission = (featureId: string) => {
        setSelectedFeatureIds(prev =>
            prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId]
        );
    };

    const toggleSuiteExpansion = (suiteId: string) => {
        setExpandedSuites(prev =>
            prev.includes(suiteId) ? prev.filter(id => id !== suiteId) : [...prev, suiteId]
        );
    };

    const toggleSuiteAllFeatures = (suiteId: string) => {
        const suiteFeatures = features.filter(f => f.suite_id === suiteId).map(f => f.id);
        const allEnabled = suiteFeatures.every(id => selectedFeatureIds.includes(id));

        if (allEnabled) {
            // Disable all for this suite
            setSelectedFeatureIds(prev => prev.filter(id => !suiteFeatures.includes(id)));
        } else {
            // Enable all for this suite
            const otherIds = selectedFeatureIds.filter(id => !suiteFeatures.includes(id));
            setSelectedFeatureIds([...otherIds, ...suiteFeatures]);
        }
    };

    const applyTemplate = (template: GroupTemplate) => {
        setSelectedFeatureIds(template.default_features);
        setEditingGroup(prev => ({ ...prev, name: template.name }));

        // Auto-expand suites that have features in this template
        const suitesWithFeatures = suites
            .filter(s => features.some(f => f.suite_id === s.id && template.default_features.includes(f.id)))
            .map(s => s.id);
        setExpandedSuites(suitesWithFeatures);

        toast.success(`Template "${template.name}" aplicado!`);
    };

    const getIcon = (key: string) => {
        const normalized = key.toLowerCase();
        if (normalized.includes('nexus')) return Scale;
        if (normalized.includes('scriptor')) return FileEdit;
        if (normalized.includes('valorem')) return DollarSign;
        if (normalized.includes('cognitio')) return BarChart3;
        if (normalized.includes('vox')) return MessageSquare;
        if (normalized.includes('sentinel')) return ShieldAlert;
        return Package;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Grupos de Acesso</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight uppercase text-xs">Refinamento Granular: Defina permissões por funcionalidade.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                    <Plus size={20} /> Novo Grupo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-50">Sincronizando Ecossistema...</div>
                ) : groups.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Shield className="mx-auto mb-4 text-slate-300" size={48} />
                        <p className="text-slate-400 font-bold">Nenhum grupo de acesso criado.</p>
                    </div>
                ) : groups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Shield size={24} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(group)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all">
                                    <FileEdit size={18} />
                                </button>
                                <button onClick={() => handleDeleteGroup(group)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded-lg transition-all" title="Excluir">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{group.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mb-6 uppercase tracking-widest opacity-60">Criado em {new Date(group.created_at!).toLocaleDateString('pt-BR')}</p>

                        <div className="flex flex-wrap gap-2">
                            {suites.map(s => (
                                <div key={s.id} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-30" title={s.name}>
                                    {React.createElement(getIcon(s.suite_key), { size: 14 })}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Access Group Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-12 relative overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                {editingGroup?.id ? 'Configurar Permissões' : 'Novo Grupo RBAC'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">Ative funcionalidades específicas para este perfil.</p>
                        </div>

                        <form onSubmit={handleSaveGroup} className="flex-1 flex flex-col min-h-0">
                            {/* Header and Templates (Fixed) */}
                            <div className="space-y-8 mb-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação do Grupo</label>
                                    <input
                                        required
                                        placeholder="Ex: Equipe de Triagem, Controladoria, Sócios..."
                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold shadow-sm"
                                        value={editingGroup?.name || ''}
                                        onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                        <Wand2 size={12} className="text-indigo-500" /> Usar Template (Acesso Rápido)
                                    </label>
                                    <div className="relative group/select">
                                        <select
                                            onChange={(e) => {
                                                const template = templates.find(t => t.id === e.target.value);
                                                if (template) applyTemplate(template);
                                                else if (e.target.value === 'clear') {
                                                    setSelectedFeatureIds([]);
                                                    toast.success('Permissões limpas.');
                                                }
                                            }}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600 appearance-none cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-700"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Selecione um template para preenchimento rápido...</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>✨ {t.name}</option>
                                            ))}
                                            <option value="clear" className="text-rose-500 font-bold border-t border-slate-200 mt-2">🛑 Limpar Seleção</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Granular Permissions (Scrollable) */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Permissões Granulares por Suíte</label>
                                <div className="space-y-3">
                                    {suites.map(suite => {
                                        const suiteFeatures = features.filter(f => f.suite_id === suite.id);
                                        const isExpanded = expandedSuites.includes(suite.id);
                                        const enabledInSuite = suiteFeatures.filter(f => selectedFeatureIds.includes(f.id));
                                        const allEnabled = suiteFeatures.length > 0 && enabledInSuite.length === suiteFeatures.length;
                                        const Icon = getIcon(suite.suite_key);

                                        return (
                                            <div key={suite.id} className={`rounded-[2rem] border transition-all overflow-hidden ${enabledInSuite.length > 0 ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'}`}>
                                                <div className="flex items-center justify-between p-4">
                                                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleSuiteExpansion(suite.id)}>
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${enabledInSuite.length > 0 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{suite.name}</h4>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{enabledInSuite.length} de {suiteFeatures.length} Ativos</p>
                                                        </div>
                                                        <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSuiteAllFeatures(suite.id)}
                                                        className={`ml-4 p-2 rounded-xl transition-all ${allEnabled ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
                                                        title="Alternar Tudo"
                                                    >
                                                        {allEnabled ? <CheckCircle2 size={18} /> : <Layers size={18} />}
                                                    </button>
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-5 pt-0 grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                                        {suiteFeatures.map(f => {
                                                            const isActive = selectedFeatureIds.includes(f.id);
                                                            return (
                                                                <button
                                                                    key={f.id}
                                                                    type="button"
                                                                    onClick={() => toggleFeaturePermission(f.id)}
                                                                    className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] border-2 transition-all text-left group/feat shadow-sm ${isActive
                                                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500 dark:text-emerald-100'
                                                                        : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                                                        }`}
                                                                >
                                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isActive
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                                        : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                                                                        }`}>
                                                                        {isActive && <Check size={14} strokeWidth={4} />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className={`block text-xs font-black uppercase tracking-tight transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                            {f.display_name}
                                                                        </span>
                                                                        {f.description && (
                                                                            <span className={`text-[9px] font-bold normal-case block leading-relaxed mt-1 transition-opacity ${isActive ? 'opacity-100 text-emerald-600/80 dark:text-emerald-500/80' : 'opacity-60 text-slate-500 dark:text-slate-500'}`}>
                                                                                {f.description}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fixed Bottom Actions */}
                            <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">Cancelar</button>
                                <button type="submit" className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all text-xs">Salvar Configuração</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {groupToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300 text-slate-900 dark:text-white">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-12 text-center relative overflow-hidden">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
                            <ShieldAlert size={40} />
                        </div>
                        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Excluir?</h2>
                        <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed uppercase tracking-tight">
                            Remover o grupo <span className="font-black text-slate-800 dark:text-white underline">{groupToDelete.name}</span>?
                            <br />
                            <span className="text-[10px] text-rose-500 font-bold block mt-2 whitespace-nowrap overflow-hidden text-ellipsis">Usuários vinculados perderão acesso granular.</span>
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDeleteGroup}
                                className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all text-xs"
                            >
                                Sim, Remover Grupo
                            </button>
                            <button
                                onClick={() => setGroupToDelete(null)}
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessManagement;
