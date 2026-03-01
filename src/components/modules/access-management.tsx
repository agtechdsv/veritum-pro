'use client'

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, CheckCircle2, XCircle, Layout, Filter, Scale, FileEdit, DollarSign, BarChart3, MessageSquare, ShieldAlert, ChevronRight, Check, ChevronDown, Database, Layers, Package, Wand2, Sparkles, Lock, Briefcase, X, RefreshCw } from 'lucide-react';
import { AccessGroup, GroupPermission, User, ModuleId, Suite, Feature, GroupTemplate, Role } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from '../ui/toast';
import { useModule } from '@/app/veritum/layout';
import { useTranslation } from '@/contexts/language-context';

interface Props {
    currentUser: User;
}

const BR_FLAG = "https://flagcdn.com/w40/br.png";
const US_FLAG = "https://flagcdn.com/w40/us.png";
const ES_FLAG = "https://flagcdn.com/w40/es.png";

const AccessManagement: React.FC<Props> = ({ currentUser }) => {
    const { t, locale } = useTranslation();
    const { planPermissions } = useModule();
    const [groups, setGroups] = useState<AccessGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Partial<AccessGroup> | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<AccessGroup | null>(null);
    const [allPermissions, setAllPermissions] = useState<Record<string, string[]>>({});

    // Feature-level RBAC state
    const [suites, setSuites] = useState<Suite[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [templates, setTemplates] = useState<GroupTemplate[]>([]);
    const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
    const [expandedSuites, setExpandedSuites] = useState<string[]>([]);

    // Roles Management State
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<{ id?: string, name: string, name_loc?: any }>({ name: '', name_loc: { pt: '', en: '', es: '' } });
    const [isRoleSelectOpen, setIsRoleSelectOpen] = useState(false);

    const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>('pt');
    const [isTranslating, setIsTranslating] = useState(false);

    // Master Client Filter State
    const [clients, setClients] = useState<User[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(currentUser.id);

    const supabase = createMasterClient();

    useEffect(() => {
        if (currentUser.role === 'Master') {
            fetchClients();
        }
    }, [currentUser]);

    useEffect(() => {
        fetchGroups();
        fetchRoles();
    }, [selectedClientId, currentUser]);

    useEffect(() => {
        fetchSuites();
        fetchFeatures();
        fetchTemplates();
    }, []);

    const fetchClients = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, name, email, role, active')
            .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
            .order('name');
        if (data) setClients(data);
    };

    const fetchRoles = async () => {
        let query = supabase.from('roles').select('*');
        const isAdmin = ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(currentUser.role);

        if (currentUser.role === 'Master') {
            query = query.eq('admin_id', selectedClientId);
        } else if (isAdmin) {
            const adminIds = [currentUser.id];
            if (currentUser.parent_user_id) adminIds.push(currentUser.parent_user_id);
            query = query.in('admin_id', adminIds);
        } else {
            if (currentUser.parent_user_id) query = query.eq('admin_id', currentUser.parent_user_id);
            else query = query.eq('admin_id', currentUser.id);
        }

        const { data } = await query;
        if (data) setRoles(data);
    };

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
        let query = supabase.from('access_groups').select('*');

        const isAdmin = ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(currentUser.role);

        if (currentUser.role === 'Master') {
            query = query.eq('admin_id', selectedClientId);
        } else if (isAdmin) {
            const adminIds = [currentUser.id];
            if (currentUser.parent_user_id) adminIds.push(currentUser.parent_user_id);
            query = query.in('admin_id', adminIds);
        } else {
            query = query.eq('admin_id', currentUser.id);
        }

        const { data, error } = await query;

        if (!error && data) {
            setGroups(data);
            // Fetch ALL permissions for these groups to feed the badges
            const { data: perms } = await supabase
                .from('group_permissions')
                .select('group_id, feature_id')
                .in('group_id', data.map(g => g.id));

            if (perms) {
                const map: Record<string, string[]> = {};
                perms.forEach(p => {
                    if (!map[p.group_id]) map[p.group_id] = [];
                    map[p.group_id].push(p.feature_id);
                });
                setAllPermissions(map);
            }
        }
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
            toast.error(t('management.access.toast.loadModulesError'));
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
            toast.error(t('management.access.toast.loadFeaturesError'));
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
            setEditingGroup({
                ...group,
                name_loc: group.name_loc || { pt: group.name, en: group.name, es: group.name }
            });
            await fetchGroupPermissions(group.id);
            setSelectedRoleIds(roles.filter(r => r.access_group_id === group.id).map(r => r.id));
        } else {
            setEditingGroup({ name: '', name_loc: { pt: '', en: '', es: '' } });
            setSelectedFeatureIds([]);
            setSelectedRoleIds([]);
            setExpandedSuites([]);
        }

        // Auto-select the active locale's tab
        const activeLocale = (locale === 'en' || locale === 'es') ? locale : 'pt';
        setActiveLang(activeLocale);
        setIsModalOpen(true);
    };

    const handleTranslateGroup = async () => {
        if (!editingGroup?.name_loc?.[activeLang] || !editingGroup.name_loc[activeLang].trim()) {
            toast.error(t('management.access.toast.fillName') || 'Preencha o nome do grupo antes de traduzir.');
            return;
        }

        setIsTranslating(true);
        try {
            const payload: any = {
                groupName: editingGroup.name_loc[activeLang].trim(),
                roles: {}
            };

            selectedRoleIds.forEach(id => {
                const r = roles.find(r => r.id === id);
                if (r && r.name_loc?.[activeLang]) {
                    payload.roles[r.id] = r.name_loc[activeLang];
                }
            });

            const targetLangs = (['pt', 'en', 'es'] as const).filter(l => l !== activeLang);

            const response = await fetch('/api/ai/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload, targetLangs })
            });

            if (!response.ok) throw new Error('Translation API failed');
            const translations = await response.json();

            // apply translations to group
            const newNameLoc = { ...editingGroup.name_loc } as any;
            Object.keys(translations).forEach(lang => {
                if (translations[lang].groupName) newNameLoc[lang] = translations[lang].groupName;
            });
            setEditingGroup({ ...editingGroup, name_loc: newNameLoc });

            // apply translations to local roles state (persisted when group is saved)
            const updatedRoles = [...roles];
            Object.keys(translations).forEach(lang => {
                const transRoles = translations[lang].roles;
                if (transRoles) {
                    selectedRoleIds.forEach(id => {
                        if (transRoles[id]) {
                            const idx = updatedRoles.findIndex(r => r.id === id);
                            if (idx !== -1) {
                                updatedRoles[idx] = {
                                    ...updatedRoles[idx],
                                    name_loc: {
                                        ...(updatedRoles[idx].name_loc || { pt: updatedRoles[idx].name, en: updatedRoles[idx].name, es: updatedRoles[idx].name }),
                                        [lang]: transRoles[id]
                                    }
                                };
                            }
                        }
                    });
                }
            });
            setRoles(updatedRoles);

            toast.success(t('management.access.toast.successTranslate') || 'Tradução com IA concluída com sucesso!');
        } catch (err: any) {
            console.error(err);
            toast.error(t('management.access.toast.errorTranslate') || 'Erro ao traduzir. Verifique a API Key.');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSaveGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const baseName = editingGroup?.name_loc?.['pt'] || editingGroup?.name;
        if (!baseName) return;

        // Validar duplicidade local antes de tentar salvar
        const isDuplicate = groups.some(g =>
            g.name.toLowerCase() === baseName.toLowerCase() && g.id !== editingGroup?.id
        );

        if (isDuplicate) {
            toast.error(t('management.access.toast.duplicate', { name: baseName }));
            return;
        }

        try {
            let groupId = editingGroup?.id;

            if (groupId) {
                // Update Group Name
                const { error: groupError } = await supabase.from('access_groups').update({
                    name: baseName,
                    name_loc: editingGroup?.name_loc
                }).eq('id', groupId);
                if (groupError) throw groupError;
                toast.success(t('management.access.toast.successName'));
            } else {
                // Create New Group
                const newGroupAdminId = currentUser.role === 'Master' ? selectedClientId : currentUser.id;
                const { data: newGroup, error: groupError } = await supabase.from('access_groups').insert({
                    admin_id: newGroupAdminId,
                    name: baseName,
                    name_loc: editingGroup?.name_loc
                }).select().single();

                if (groupError) throw groupError;
                groupId = newGroup.id;
            }

            // Sync Permissions
            // 1. Delete existing
            await supabase.from('group_permissions').delete().eq('group_id', groupId);

            // 2. Insert new
            if (selectedFeatureIds.length > 0) {
                const { error: permError } = await supabase.from('group_permissions').insert(
                    selectedFeatureIds.map(fId => ({
                        group_id: groupId,
                        feature_id: fId
                    }))
                );
                if (permError) throw permError;
            }

            // Sync Roles
            if (selectedRoleIds.length > 0) {
                for (const roleId of selectedRoleIds) {
                    const localRole = roles.find(r => r.id === roleId);
                    if (localRole) {
                        const roleBaseName = localRole.name_loc?.['pt'] || localRole.name;
                        const { error: roleUpdErr } = await supabase.from('roles').update({
                            access_group_id: groupId,
                            name: roleBaseName,
                            name_loc: localRole.name_loc || { pt: localRole.name, en: localRole.name, es: localRole.name }
                        }).eq('id', roleId);
                        if (roleUpdErr) throw roleUpdErr;
                    }
                }
            }
            // Remove roles that were associated but are no longer selected
            const removedRoleIds = roles.filter(r => r.access_group_id === groupId && !selectedRoleIds.includes(r.id)).map(r => r.id);
            if (removedRoleIds.length > 0) {
                const { error: rmErr } = await supabase.from('roles').update({ access_group_id: null }).in('id', removedRoleIds);
                if (rmErr) throw rmErr;
            }

            toast.success(editingGroup?.id ? t('management.access.toast.successSave') : t('management.access.toast.successCreate'));
            setIsModalOpen(false);
            fetchGroups(); // This will also update allPermissions
            fetchRoles();
        } catch (error: any) {
            console.error('Save error:', error);
            if (error.code === '23505') {
                toast.error(t('management.access.toast.duplicate', { name: editingGroup?.name || '' }));
            } else {
                toast.error(t('management.access.toast.errorSave'));
            }
        }
    };

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        const baseRoleName = editingRole.name_loc?.['pt'] || editingRole.name;
        if (!baseRoleName.trim()) return;

        const roleName = baseRoleName.trim();

        // Check duplicate within the same admin context
        if (roles.some(r => r.name.toLowerCase() === roleName.toLowerCase() && r.id !== editingRole.id)) {
            toast.error(t('management.access.toast.duplicateRole', { name: roleName }));
            return;
        }

        try {
            if (editingRole.id) {
                // Update
                const { error } = await supabase.from('roles').update({
                    name: roleName,
                    name_loc: editingRole.name_loc
                }).eq('id', editingRole.id);
                if (error) throw error;
                toast.success(t('management.access.toast.successRoleEdit'));
            } else {
                // Insert
                const newRoleAdminId = currentUser.role === 'Master' ? selectedClientId : (currentUser.parent_user_id || currentUser.id);
                const { data, error } = await supabase.from('roles').insert({
                    name: roleName,
                    name_loc: editingRole.name_loc,
                    admin_id: newRoleAdminId,
                    access_group_id: editingGroup?.id || null
                }).select().single();

                if (error) throw error;
                toast.success(t('management.access.toast.successRoleAdd'));

                // Automatically select the newly created role
                if (data) {
                    setSelectedRoleIds(prev => [...prev, data.id]);
                }
            }

            setShowRoleModal(false);
            setEditingRole({ name: '', name_loc: { pt: '', en: '', es: '' } });
            fetchRoles();
        } catch (error: any) {
            console.error('Error saving role:', error);
            toast.error(t('management.access.toast.errorRole'));
        }
    };

    const handleDeleteGroup = async (group: AccessGroup) => {
        setGroupToDelete(group);
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return;

        const { error } = await supabase.from('access_groups').delete().eq('id', groupToDelete.id);
        if (!error) {
            toast.success(t('management.access.delete.confirm'));
            setGroupToDelete(null);
            fetchGroups();
        } else {
            toast.error(t('management.access.delete.error', { error: error.message }));
        }
    };

    const isFeatureAllowed = (feature: Feature) => {
        if (currentUser.role === 'Master') return true;
        const suite = suites.find(s => s.id === feature.suite_id);
        if (!suite) return false;
        const normalizedSuiteKey = suite.suite_key.toLowerCase().replace('_key', '');
        const suitePerm = planPermissions.find(p => p.suite_key?.toLowerCase().replace('_key', '') === normalizedSuiteKey);
        if (!suitePerm) return false;
        return suitePerm.enabled_features.includes(feature.feature_key);
    };

    const toggleFeaturePermission = (featureId: string) => {
        const feature = features.find(f => f.id === featureId);
        if (feature && !isFeatureAllowed(feature)) {
            toast.error('O plano atual não tem acesso a esta funcionalidade.');
            return;
        }
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
        const suiteFeatures = features.filter(f => f.suite_id === suiteId);
        const allowedFeatures = suiteFeatures.filter(f => isFeatureAllowed(f));
        const allowedFeatureIds = allowedFeatures.map(f => f.id);

        const allAllowedEnabled = allowedFeatureIds.length > 0 && allowedFeatureIds.every(id => selectedFeatureIds.includes(id));

        if (allAllowedEnabled) {
            // Disable all allowed for this suite
            setSelectedFeatureIds(prev => prev.filter(id => !allowedFeatureIds.includes(id)));
        } else {
            // Enable all allowed for this suite
            const otherIds = selectedFeatureIds.filter(id => !allowedFeatureIds.includes(id));
            setSelectedFeatureIds([...otherIds, ...allowedFeatureIds]);
        }
    };

    const applyTemplate = (template: GroupTemplate) => {
        const allowedFeatures = template.default_features.filter(fid => {
            const feat = features.find(f => f.id === fid);
            return feat ? isFeatureAllowed(feat) : false;
        });

        setSelectedFeatureIds(allowedFeatures);
        const localTranslations: Record<string, { en: string, es: string }> = {
            "Sócio-Administrador": { en: "Partner Administrator", es: "Socio Administrador" },
            "Advogado Sênior / Coordenador": { en: "Senior Lawyer / Coordinator", es: "Abogado Senior / Coordinador" },
            "Departamento Financeiro / Faturamento": { en: "Financial Department / Billing", es: "Departamento Financiero / Facturación" },
            "Advogado Associado / Júnior": { en: "Associate / Junior Lawyer", es: "Abogado Asociado / Junior" },
            "Secretariado / Recepção": { en: "Secretariat / Reception", es: "Secretariado / Recepción" },
            "Controladoria Jurídica (Legal Ops)": { en: "Legal Controlling (Legal Ops)", es: "Controladoría Jurídica (Legal Ops)" },
            "Estagiário / Paralegal": { en: "Intern / Paralegal", es: "Pasante / Paralegal" },
            "Cliente (Acesso Externo B2B2C)": { en: "Client (External Access B2B2C)", es: "Cliente (Acceso Externo B2B2C)" }
        };

        const loc = localTranslations[template.name];

        setEditingGroup(prev => ({
            ...prev,
            name: template.name,
            name_loc: loc ? { pt: template.name, en: loc.en, es: loc.es } : { pt: template.name, en: template.name, es: template.name }
        }));

        const hasBlockedFeatures = allowedFeatures.length < template.default_features.length;

        // Auto-expand suites that have features in this template
        const suitesWithFeatures = suites
            .filter(s => features.some(f => f.suite_id === s.id && allowedFeatures.includes(f.id)))
            .map(s => s.id);
        setExpandedSuites(suitesWithFeatures);

        if (hasBlockedFeatures) {
            toast.success(`Template "${template.name}" aplicado! (Recursos premium ignorados)`);
        } else {
            toast.success(`Template "${template.name}" aplicado!`);
        }
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
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('management.accessGroups.title') || 'Grupos de Acesso'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight uppercase text-xs">{t('management.accessGroups.subtitle') || 'Refinamento Granular: Defina permissões por funcionalidade.'}</p>
                </div>
                <div className="flex items-center gap-4">
                    {currentUser.role === 'Master' && (
                        <div className="relative group/filter z-50">
                            <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                                <Filter size={16} className="text-amber-500" />
                                <select
                                    className="bg-transparent outline-none appearance-none pr-6 cursor-pointer"
                                    value={selectedClientId}
                                    onChange={e => setSelectedClientId(e.target.value)}
                                >
                                    <option value={currentUser.id}>{t('management.access.masterGroups') || 'Master (Meus Grupos)'}</option>
                                    <optgroup label={t('management.access.privateAdmins') || 'Sócio-Administradores Privados'}>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>🏢 {c.name} ({c.email})</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={20} /> {t('management.access.newGroup')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-50">{t('management.access.syncing')}</div>
                ) : groups.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Shield className="mx-auto mb-4 text-slate-300" size={48} />
                        <p className="text-slate-400 font-bold">{t('management.access.noGroups')}</p>
                    </div>
                ) : groups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative hover:z-20">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Shield size={24} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(group)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all" title="Editar">
                                    <FileEdit size={18} />
                                </button>
                                <button onClick={() => handleDeleteGroup(group)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded-lg transition-all" title="Excluir">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{group.name_loc?.[locale as keyof typeof group.name_loc] || group.name_loc?.['pt'] || group.name}</h3>

                        <p className="text-[10px] text-slate-400 font-bold mb-6 uppercase tracking-widest opacity-60">{t('management.access.created', { date: new Date(group.created_at!).toLocaleDateString(t('common.locale_date') === 'en-US' ? 'en-US' : 'pt-BR') })}</p>

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                            {suites.map(s => {
                                const groupPerms = allPermissions[group.id] || [];
                                const suiteFeatures = features.filter(f => f.suite_id === s.id);
                                const activeFeatures = suiteFeatures.filter(f => groupPerms.includes(f.id));
                                const isActive = activeFeatures.length > 0;
                                const Icon = getIcon(s.suite_key);

                                return (
                                    <div
                                        key={s.id}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group/badge ${isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800/50'
                                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-700 opacity-40'
                                            }`}
                                    >
                                        <Icon size={18} />

                                        {/* Rich Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 bg-slate-900 dark:bg-white rounded-2xl shadow-2xl opacity-0 group-hover/badge:opacity-100 pointer-events-none transition-all z-[60] translate-y-2 group-hover/badge:translate-y-0 scale-95 group-hover/badge:scale-100">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800 dark:border-slate-100">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                    <Icon size={12} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-white dark:text-slate-900">
                                                    {t(`modules.${s.suite_key.toLowerCase().replace('_key', '')}.title`) !== `modules.${s.suite_key.toLowerCase().replace('_key', '')}.title` ? t(`modules.${s.suite_key.toLowerCase().replace('_key', '')}.title`) : s.name}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {isActive ? (
                                                    activeFeatures.map(f => (
                                                        <div key={f.id} className="flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 leading-tight">
                                                                {f.display_name?.[locale as keyof typeof f.display_name] || f.display_name?.['pt'] || f.feature_key}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 italic">{t('management.access.noAccess')}</span>
                                                )}
                                            </div>
                                            {/* Tooltip Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-slate-900 dark:border-t-white" />
                                        </div>
                                    </div>
                                );
                            })}
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
                                {editingGroup?.id ? t('management.access.modal.editTitle') : t('management.access.modal.addTitle')}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">{t('management.access.modal.subtitle')}</p>
                        </div>

                        <form onSubmit={handleSaveGroup} className="flex-1 flex flex-col min-h-0">
                            {/* Header and Templates (Fixed) */}
                            <div className="space-y-8 mb-8">
                                {/* Header and Translation */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {(['pt', 'en', 'es'] as const).map(lang => (
                                            <button
                                                key={lang}
                                                type="button"
                                                onClick={() => setActiveLang(lang)}
                                                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-110 active:scale-95 ${activeLang === lang ? 'border-indigo-600 shadow-lg shadow-indigo-600/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                                title={lang.toUpperCase()}
                                            >
                                                <img
                                                    src={lang === 'pt' ? BR_FLAG : lang === 'en' ? US_FLAG : ES_FLAG}
                                                    alt={lang}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleTranslateGroup}
                                        disabled={isTranslating}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw size={12} className={isTranslating ? 'animate-spin' : ''} />
                                        {isTranslating ? (t('management.access.modal.translating') || 'Traduzindo...') : (t('management.access.modal.translateIA') || 'Traduzir com IA')}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('management.access.modal.groupName')}</label>
                                    <input
                                        required
                                        placeholder={t('management.access.modal.groupNamePlaceholder')}
                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold shadow-sm"
                                        value={editingGroup?.name_loc?.[activeLang] || ''}
                                        onChange={e => setEditingGroup(prev => {
                                            if (!prev) return prev;
                                            return {
                                                ...prev,
                                                name_loc: {
                                                    ...(prev.name_loc || { pt: prev.name as string, en: prev.name as string, es: prev.name as string }),
                                                    [activeLang]: e.target.value
                                                }
                                            }
                                        })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                        <Wand2 size={12} className="text-indigo-500" /> {t('management.access.modal.templateLabel')}
                                    </label>
                                    <div className="relative group/select">
                                        <select
                                            onChange={(e) => {
                                                const template = templates.find(t => t.id === e.target.value);
                                                if (template) applyTemplate(template);
                                                else if (e.target.value === 'clear') {
                                                    setSelectedFeatureIds([]);
                                                    toast.success(t('management.access.modal.clearSelectionSuccess') || 'Permissões limpas.');
                                                }
                                            }}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600 appearance-none cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-700"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>{t('management.access.modal.templatePlaceholder')}</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>✨ {t.name}</option>
                                            ))}
                                            <option value="clear" className="text-rose-500 font-bold border-t border-slate-200 mt-2">🛑 {t('management.access.modal.clearSelection')}</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Roles Management MultiSelect */}
                            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6 mb-8">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                        <Briefcase size={12} className="text-indigo-500" /> {t('management.access.modal.linkedRoles')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRole({ name: '' });
                                            const activeLocale = (locale === 'en' || locale === 'es') ? locale : 'pt';
                                            setActiveLang(activeLocale);
                                            setShowRoleModal(true);
                                        }}
                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                    >
                                        <Plus size={12} /> {t('management.access.modal.newRole')}
                                    </button>
                                </div>

                                <div className="relative">
                                    <div
                                        className="min-h-[50px] w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center flex-wrap gap-2 cursor-text transition-all focus-within:ring-2 focus-within:ring-indigo-600 hover:border-slate-300 dark:hover:border-slate-700"
                                        onClick={() => setIsRoleSelectOpen(true)}
                                    >
                                        {selectedRoleIds.length === 0 && (
                                            <span className="text-xs font-medium text-slate-400 pl-2">{t('management.access.modal.rolesPlaceholder')}</span>
                                        )}
                                        {selectedRoleIds.map(id => {
                                            const role = roles.find(r => r.id === id);
                                            if (!role) return null;
                                            return (
                                                <div
                                                    key={role.id}
                                                    className="flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {role.name_loc?.[activeLang] || role.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRoleIds(prev => prev.filter(rId => rId !== id))}
                                                        className="ml-1 hover:text-indigo-500 dark:hover:text-indigo-300"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {/* Dropdown Toggle Context Area */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} className={`transition-transform duration-200 ${isRoleSelectOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Dropdown Options */}
                                    {isRoleSelectOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsRoleSelectOpen(false)}
                                            />
                                            <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-56 overflow-y-auto custom-scrollbar p-2">
                                                {roles.length === 0 ? (
                                                    <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">{t('management.access.noRoles') || 'Nenhum cargo encontrado. Crie um novo primeiro.'}</div>
                                                ) : (
                                                    (() => {
                                                        // Group roles by access_group_id
                                                        const groupedRoles: Record<string, Role[]> = {};

                                                        roles.forEach(role => {
                                                            const groupId = role.access_group_id || 'none';
                                                            if (!groupedRoles[groupId]) groupedRoles[groupId] = [];
                                                            groupedRoles[groupId].push(role);
                                                        });

                                                        return Object.keys(groupedRoles).map(groupId => {
                                                            const groupRoles = groupedRoles[groupId];
                                                            const group = groups.find(g => g.id === groupId);
                                                            const groupName = group ? (group.name_loc?.[activeLang] || group.name) : t('management.access.modal.others');

                                                            return (
                                                                <div key={groupId} className="mb-2 last:mb-0">
                                                                    <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 z-10">
                                                                        <span className="text-[10px] font-black tracking-widest uppercase text-indigo-500/80 dark:text-indigo-400/80">
                                                                            {groupName}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        {groupRoles.map(role => {
                                                                            const isSelected = selectedRoleIds.includes(role.id);
                                                                            return (
                                                                                <div
                                                                                    key={role.id}
                                                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors mx-1 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (isSelected) {
                                                                                            setSelectedRoleIds(prev => prev.filter(id => id !== role.id));
                                                                                        } else {
                                                                                            setSelectedRoleIds(prev => [...prev, role.id]);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={`flex items-center justify-center w-4 h-4 rounded border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                                                                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                                                                        </div>
                                                                                        <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'}`}>{role.name_loc?.[activeLang] || role.name}</span>
                                                                                    </div>

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setEditingRole(role);
                                                                                            const activeLocale = (locale === 'en' || locale === 'es') ? locale : 'pt';
                                                                                            setActiveLang(activeLocale);
                                                                                            setShowRoleModal(true);
                                                                                            setIsRoleSelectOpen(false);
                                                                                        }}
                                                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all opacity-50 hover:opacity-100"
                                                                                    >
                                                                                        <FileEdit size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Granular Permissions (Scrollable) */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('management.access.modal.granularTitle')}</label>
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
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('management.access.modal.featuresActive', { count: enabledInSuite.length, total: suiteFeatures.length })}</p>
                                                        </div>
                                                        <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSuiteAllFeatures(suite.id)}
                                                        className={`ml-4 p-2 rounded-xl transition-all ${allEnabled ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
                                                        title={t('management.access.modal.toggleAll')}
                                                    >
                                                        {allEnabled ? <CheckCircle2 size={18} /> : <Layers size={18} />}
                                                    </button>
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-5 pt-0 grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                                        {suiteFeatures.map(f => {
                                                            const isActive = selectedFeatureIds.includes(f.id);
                                                            const isAllowed = isFeatureAllowed(f);
                                                            return (
                                                                <button
                                                                    key={f.id}
                                                                    type="button"
                                                                    onClick={() => toggleFeaturePermission(f.id)}
                                                                    title={!isAllowed ? t('management.access.modal.planRestriction') : ""}
                                                                    className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] border-2 transition-all text-left group/feat shadow-sm ${!isAllowed
                                                                        ? 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-900/40 dark:border-slate-800/50 dark:text-slate-500 cursor-not-allowed opacity-80'
                                                                        : isActive
                                                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500 dark:text-emerald-100'
                                                                            : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                                                        }`}
                                                                >
                                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${!isAllowed
                                                                        ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                                                                        : isActive
                                                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                                            : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                                                                        }`}>
                                                                        {!isAllowed ? <Lock size={12} strokeWidth={3} /> : isActive && <Check size={14} strokeWidth={4} />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className={`block text-xs font-black uppercase tracking-tight transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                            {f.display_name?.[locale as keyof typeof f.display_name] || f.display_name?.['pt'] || f.feature_key}
                                                                        </span>
                                                                        {f.description?.pt && (
                                                                            <span className={`text-[9px] font-bold normal-case block leading-relaxed mt-1 transition-opacity ${isActive ? 'opacity-100 text-emerald-600/80 dark:text-emerald-500/80' : 'opacity-60 text-slate-500 dark:text-slate-500'}`}>
                                                                                {f.description?.[locale as keyof typeof f.description] || f.description?.['pt']}
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
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">{t('management.access.modal.close')}</button>
                                <button type="submit" className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all text-xs">{t('management.access.modal.save')}</button>
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
                        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">{t('management.access.delete.title')}</h2>
                        <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed uppercase tracking-tight">
                            {t('management.access.delete.message', { name: groupToDelete.name })}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDeleteGroup}
                                className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all text-xs"
                            >
                                {t('management.access.delete.confirm')}
                            </button>
                            <button
                                onClick={() => setGroupToDelete(null)}
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                            >
                                {t('management.access.delete.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mini Modal para Cadastro de Cargo */}
            {showRoleModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center relative overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowRoleModal(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            <X size={16} />
                        </button>

                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6">
                            <Briefcase size={32} />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                            {editingRole.id ? t('management.access.roleModal.editTitle') : t('management.access.roleModal.addTitle')}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-widest">{t('management.access.roleModal.subtitle') || 'Defina o nome da função'}</p>

                        <form onSubmit={handleSaveRole} className="space-y-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {(['pt', 'en', 'es'] as const).map(lang => (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => setActiveLang(lang)}
                                        className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-110 active:scale-95 ${activeLang === lang ? 'border-indigo-600 shadow-lg shadow-indigo-600/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                        title={lang.toUpperCase()}
                                    >
                                        <img
                                            src={lang === 'pt' ? BR_FLAG : lang === 'en' ? US_FLAG : ES_FLAG}
                                            alt={lang}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </button>
                                ))}
                            </div>
                            <input
                                required
                                autoFocus
                                placeholder={t('management.access.roleModal.namePlaceholder')}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold text-center"
                                value={editingRole.name_loc?.[activeLang] || ''}
                                onChange={(e) => setEditingRole({
                                    ...editingRole,
                                    name_loc: {
                                        ...(editingRole.name_loc || { pt: editingRole.name as string, en: editingRole.name as string, es: editingRole.name as string }),
                                        [activeLang]: e.target.value
                                    }
                                })}
                            />

                            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all text-xs">
                                {t('management.access.roleModal.save')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessManagement;
