'use server';

import { Lawsuit, Task, CalendarEvent, Credentials, UserPreferences, Asset, CorporateEntity, Shareholder, CorporateDocument, LawsuitDocument, AssetDocument, TimelineEntry, GlobalDocument, FinancialTransaction, Movement, Organization } from '@/types';

import { RepositoryFactory } from '@/lib/db/repositories/repository-factory';
import { createMasterServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/security';
import { DatabaseService } from '@/services/database';
import { sendEmail } from '@/lib/email';

/**
 * Securesly resolves credentials for the target user (tenant)
 */
async function resolveSecurityContext(targetUserId?: string) {
    const supabaseMaster = await createMasterServerClient();
    const { data: { user } } = await supabaseMaster.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: userProfile } = await supabaseMaster
        .from('users')
        .select('parent_user_id')
        .eq('id', user.id)
        .maybeSingle();

    let resolvedId = user.id;

    if (!targetUserId || targetUserId === user.id) {
        if (userProfile?.parent_user_id) {
            resolvedId = userProfile.parent_user_id;
        }
    } else {
        let isMaster = user.user_metadata?.role === 'Master';
        if (!isMaster) {
            const { data: profile } = await supabaseMaster.from('users').select('role').eq('id', user.id).single();
            isMaster = profile?.role === 'Master';
        }

        if (isMaster) {
            resolvedId = targetUserId;
        } else {
            throw new Error('Unauthorized to access other tenant data');
        }
    }

    const adminSupabase = createAdminClient();
    const { data: tenantConfig } = await adminSupabase
        .from('tenant_configs')
        .select('*')
        .eq('owner_id', resolvedId)
        .maybeSingle();

    const safeDecrypt = (val: string | undefined, fieldName: string): string | undefined => {
        if (!val) return undefined;
        if (val.startsWith('http') || val.split(':').length < 3) return val;
        try {
            return decrypt(val);
        } catch (e) {
            console.error(`[BYODB] Decryption error in ${fieldName}`);
            return undefined;
        }
    };

    const credentials: Credentials = {
        supabaseUrl: safeDecrypt(tenantConfig?.custom_supabase_url, 'url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: safeDecrypt(tenantConfig?.custom_supabase_key_encrypted, 'key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        geminiKey: safeDecrypt(tenantConfig?.custom_gemini_key_encrypted, 'gemini') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        dbConnectionString: safeDecrypt(tenantConfig?.db_connection_encrypted, 'connection')
    };

    const userPrefs: UserPreferences = {
        user_id: resolvedId,
        language: 'pt',
        theme: 'dark'
    };

    return { credentials, preferences: userPrefs, userId: user.id };
}

/* Timeline / Audit Actions */
export async function listTimelineEntries(entityType: string, entityId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTimelineRepository(credentials, preferences);
        const data = await repo.list(entityType, entityId);
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listTimelineEntries):', error);
        throw error;
    }
}

export async function saveTimelineEntry(entry: Partial<TimelineEntry>, targetUserId?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTimelineRepository(credentials, preferences);
        return await repo.save({ ...entry, user_id: userId });
    } catch (error: any) {
        console.error('Server Action Error (saveTimelineEntry):', error);
        throw error;
    }
}

/* Financial Actions */
export async function listFinancialTransactions(lawsuitId?: string, personId?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getFinancialRepository(credentials, preferences);
        
        let data: FinancialTransaction[] = [];
        if (lawsuitId) {
            data = await repo.listByLawsuit(lawsuitId);
        } else if (personId) {
            data = await repo.listByPerson(personId);
        }
        
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listFinancialTransactions):', error);
        throw error;
    }
}

export async function saveFinancialTransaction(transaction: Partial<FinancialTransaction>, targetUserId?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getFinancialRepository(credentials, preferences);
        
        const result = await repo.save({ ...transaction, user_id: userId });
        
        // Log to timeline if it's linked to a lawsuit or person
        if (transaction.lawsuit_id) {
            const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);
            await timelineRepo.save({
                entity_type: 'lawsuit',
                entity_id: transaction.lawsuit_id,
                action: 'FINANCIAL_UPDATE',
                description: `Transação financeira: ${transaction.title} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount || 0)}`,
                user_id: userId
            });
        }
        
        return result;
    } catch (error: any) {
        console.error('Server Action Error (saveFinancialTransaction):', error);
        throw error;
    }
}

export async function deleteFinancialTransaction(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getFinancialRepository(credentials, preferences);
        await repo.delete(id);
        return { success: true };
    } catch (error: any) {
        console.error('Server Action Error (deleteFinancialTransaction):', error);
        throw error;
    }
}

export async function getFinancialStats(lawsuitId?: string, personId?: string, targetUserId?: string, startDate?: string, endDate?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getFinancialRepository(credentials, preferences);
        const data = await repo.getStats(lawsuitId, personId, startDate, endDate);
        return { data, error: null };
    } catch (error: any) {
        console.error('Server Action Error (getFinancialStats):', error);
        return { data: { totalCredits: 0, totalDebits: 0, balance: 0, efficiency: 0, categories: [] }, error: error.code || error.message };
    }
}

/* Lawsuits Actions */
export async function listLawsuits(searchTerm?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        const data = await repo.list(searchTerm);
        return { data, credentialsUsed: credentials.supabaseUrl, solvedId: preferences.user_id };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listLawsuits):', errorMsg);
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"lawsuits\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table lawsuits missing).'
            };
        }
        throw error;
    }
}

export async function saveLawsuit(lawsuit: Partial<Lawsuit>, targetUserId?: string, justification?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);

        let oldLawsuit: Lawsuit | null = null;
        if (lawsuit.id) {
            oldLawsuit = await repo.getById(lawsuit.id);
        }

        const saved = await repo.save(lawsuit);

        // Audit Trail
        if (oldLawsuit) {
            // Status Change
            if (lawsuit.status && oldLawsuit.status !== lawsuit.status) {
                await timelineRepo.save({
                    entity_type: 'lawsuit',
                    entity_id: saved.id,
                    action: 'STATUS_CHANGE',
                    description: `Alterou status de "${oldLawsuit.status}" para "${lawsuit.status}"${justification ? ` | Motivo: ${justification}` : ''}`,
                    old_values: { status: oldLawsuit.status, justification },
                    new_values: { status: lawsuit.status, justification },
                    user_id: userId
                });
            }
            
            // Financial Change (Provision)
            if (lawsuit.provision_amount !== undefined && oldLawsuit.provision_amount !== lawsuit.provision_amount) {
                await timelineRepo.save({
                    entity_type: 'lawsuit',
                    entity_id: saved.id,
                    action: 'FINANCIAL_UPDATE',
                    description: `Alteração no valor de provisão: de R$ ${oldLawsuit.provision_amount?.toLocaleString('pt-BR')} para R$ ${lawsuit.provision_amount?.toLocaleString('pt-BR')}`,
                    old_values: { provision_amount: oldLawsuit.provision_amount },
                    new_values: { provision_amount: lawsuit.provision_amount },
                    user_id: userId
                });
            }

            // Probability Change
            if (lawsuit.probability_of_success && oldLawsuit.probability_of_success !== lawsuit.probability_of_success) {
                await timelineRepo.save({
                    entity_type: 'lawsuit',
                    entity_id: saved.id,
                    action: 'RISK_UPDATE',
                    description: `Alteração na probabilidade de êxito: de "${oldLawsuit.probability_of_success}" para "${lawsuit.probability_of_success}"`,
                    old_values: { probability: oldLawsuit.probability_of_success },
                    new_values: { probability: lawsuit.probability_of_success },
                    user_id: userId
                });
            }

            // Financial Change (Value)
            if (lawsuit.value !== undefined && oldLawsuit.value !== lawsuit.value) {
                await timelineRepo.save({
                    entity_type: 'lawsuit',
                    entity_id: saved.id,
                    action: 'FINANCIAL_UPDATE',
                    description: `Alteração no valor da causa: de R$ ${oldLawsuit.value?.toLocaleString('pt-BR')} para R$ ${lawsuit.value?.toLocaleString('pt-BR')}`,
                    old_values: { value: oldLawsuit.value },
                    new_values: { value: lawsuit.value },
                    user_id: userId
                });
            }

            // Parties Change (Author/Defendant)
            if (lawsuit.author_id !== undefined && oldLawsuit.author_id !== lawsuit.author_id) {
                await timelineRepo.save({
                    entity_type: 'lawsuit',
                    entity_id: saved.id,
                    action: 'PARTIES_UPDATE',
                    description: `Alteração do Autor do processo`,
                    old_values: { author_id: oldLawsuit.author_id },
                    new_values: { author_id: lawsuit.author_id },
                    user_id: userId
                });
            }
            if (lawsuit.defendant_id !== undefined && oldLawsuit.defendant_id !== lawsuit.defendant_id) {
                await timelineRepo.save({
                    entity_type: 'lawsuit',
                    entity_id: saved.id,
                    action: 'PARTIES_UPDATE',
                    description: `Alteração do Réu do processo`,
                    old_values: { defendant_id: oldLawsuit.defendant_id },
                    new_values: { defendant_id: lawsuit.defendant_id },
                    user_id: userId
                });
            }

            // Responsibility Change
            if (lawsuit.responsible_lawyer_id && oldLawsuit.responsible_lawyer_id !== lawsuit.responsible_lawyer_id) {
                await timelineRepo.save({
                    entity_type: 'lawsuit',
                    entity_id: saved.id,
                    action: 'TEAM_UPDATE',
                    description: `Alteração do advogado responsável pelo processo`,
                    old_values: { responsible_id: oldLawsuit.responsible_lawyer_id },
                    new_values: { responsible_id: lawsuit.responsible_lawyer_id },
                    user_id: userId
                });
            }
        } else if (!oldLawsuit) {
             await timelineRepo.save({
                entity_type: 'lawsuit',
                entity_id: saved.id,
                action: 'CREATE',
                description: `Processo criado`,
                new_values: saved,
                user_id: userId
            });
        }

        return saved;
    } catch (error: any) {
        console.error('Server Action Error (saveLawsuit):', error.message);
        throw error;
    }
}

export async function deleteLawsuit(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        return await repo.delete(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteLawsuit):', error.message);
        throw error;
    }
}

/* Lawsuit Documents Actions */
export async function listLawsuitDocuments(lawsuitId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        const data = await repo.listDocuments(lawsuitId);
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listLawsuitDocuments):', error);
        throw error;
    }
}

export async function saveLawsuitDocument(doc: Partial<LawsuitDocument>, targetUserId?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);
        
        const saved = await repo.saveDocument(doc);

        // Log critical documents
        const criticalTypes = ['Petição Inicial', 'Sentença', 'Acórdão', 'Contestação'];
        if (doc.lawsuit_id && doc.document_type && criticalTypes.includes(doc.document_type)) {
            await timelineRepo.save({
                entity_type: 'lawsuit',
                entity_id: doc.lawsuit_id,
                action: 'DOCUMENT_UPLOAD',
                description: `Novo documento crítico anexado: ${doc.document_type}`,
                new_values: { document_name: doc.title, type: doc.document_type },
                user_id: userId
            });
        }

        return saved;
    } catch (error: any) {
        console.error('Server Action Error (saveLawsuitDocument):', error);
        throw error;
    }
}

export async function deleteLawsuitDocument(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        return await repo.deleteDocument(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteLawsuitDocument):', error);
        throw error;
    }
}

/* Tasks Actions */
export async function listTasks(searchTerm?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTaskRepository(credentials, preferences);
        const data = await repo.list(searchTerm);
        return { data, credentialsUsed: credentials.supabaseUrl, solvedId: preferences.user_id };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listTasks):', errorMsg);
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"tasks\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table tasks missing).'
            };
        }
        throw error;
    }
}

export async function saveTask(task: Partial<Task>, targetUserId?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTaskRepository(credentials, preferences);
        const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);

        let oldTask: Task | null = null;
        if (task.id) {
            oldTask = await repo.getById(task.id);
        }

        const saved = await repo.save(task);

        // Audit Task
        if (oldTask) {
            // Completion
            if (task.status === 'Concluído' && oldTask.status !== 'Concluído') {
                if (task.lawsuit_id) {
                    await timelineRepo.save({
                        entity_type: 'lawsuit',
                        entity_id: task.lawsuit_id,
                        action: 'TASK_COMPLETED',
                        description: `Tarefa concluída: "${saved.title}"`,
                        user_id: userId
                    });
                }
            }

            // Deadline Extension
            if (task.due_date && oldTask.due_date && new Date(task.due_date).getTime() > new Date(oldTask.due_date).getTime()) {
                if (task.lawsuit_id) {
                    await timelineRepo.save({
                        entity_type: 'lawsuit',
                        entity_id: task.lawsuit_id,
                        action: 'DEADLINE_EXTENSION',
                        description: `Prazo da tarefa "${saved.title}" prorrogado para ${new Date(task.due_date).toLocaleDateString('pt-BR')}`,
                        old_values: { due_date: oldTask.due_date },
                        new_values: { due_date: task.due_date },
                        user_id: userId
                    });
                }
            }
        }

        return saved;
    } catch (error: any) {
        console.error('Server Action Error (saveTask):', error.message);
        throw error;
    }
}

export async function deleteTask(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTaskRepository(credentials, preferences);
        return await repo.delete(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteTask):', error.message);
        throw error;
    }
}

/* Events Actions */
export async function listEvents(searchTerm?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getEventRepository(credentials, preferences);
        const data = await repo.list(searchTerm);
        return { data, credentialsUsed: credentials.supabaseUrl, solvedId: preferences.user_id };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listEvents):', errorMsg);
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"events\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table events missing).'
            };
        }
        throw error;
    }
}

export async function saveEvent(event: Partial<CalendarEvent>, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getEventRepository(credentials, preferences);
        return await repo.save(event);
    } catch (error: any) {
        console.error('Server Action Error (saveEvent):', error.message);
        throw error;
    }
}

export async function deleteEvent(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getEventRepository(credentials, preferences);
        return await repo.delete(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteEvent):', error.message);
        throw error;
    }
}
export async function listTeam(targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTeamRepository(credentials, preferences);
        const data = await repo.list();
        return { data };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listTeam):', errorMsg);
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"team_members\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table team_members missing).'
            };
        }
    }
}




const UF_TO_ID: Record<string, number> = {
    'AC': 12, 'AL': 27, 'AP': 16, 'AM': 13, 'BA': 29, 'CE': 23, 'DF': 53, 'ES': 32, 'GO': 52, 'MA': 21,
    'MT': 51, 'MS': 50, 'MG': 31, 'PA': 15, 'PB': 25, 'PR': 41, 'PE': 26, 'PI': 22, 'RJ': 33, 'RN': 24,
    'RS': 43, 'RO': 11, 'RR': 14, 'SC': 42, 'SP': 35, 'SE': 28, 'TO': 17
};

export async function getCitiesByState(uf: string) {
    const stateId = UF_TO_ID[uf.toUpperCase()];
    // Try initials first, then numeric ID as fallback
    const targets = [uf, stateId].filter(Boolean);

    for (const target of targets) {
        console.log(`[ServerAction] Fetching cities for: ${target}`);
        try {
            const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${target}/municipios`, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 86400 } // Cache for 24 hours
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const result = data.map((c: any) => c.nome.toUpperCase()).sort();
                    console.log(`[ServerAction] Success for ${target}: found ${result.length} cities`);
                    return result;
                }
            } else {
                console.warn(`[ServerAction] IBGE returned ${res.status} for target ${target}`);
            }
        } catch (err) {
            console.error(`[ServerAction] Fetch error for ${target}:`, err);
        }
    }
    return [];
}

/* Asset Actions */
export async function listAssets(personId?: string, lawsuitId?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getAssetRepository(credentials, preferences);
        const data = await repo.list(personId, lawsuitId);
        return { data };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listAssets):', error);
        // Supabase error code 42P01 is "undefined_table"
        if (error?.code === '42P01' || errorMsg.includes("relation") || errorMsg.includes("does not exist") || errorMsg.includes("assets")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table assets missing).'
            };
        }
        throw error;
    }
}

export async function saveAsset(asset: Partial<Asset>, targetUserId?: string, justification?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getAssetRepository(credentials, preferences);
        const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);

        let oldAsset: Asset | null = null;
        if (asset.id) {
            oldAsset = await repo.getById(asset.id);
        }

        const saved = await repo.save(asset);

        // Audit Trail
        if (oldAsset) {
            // Status Change
            if (asset.status && oldAsset.status !== asset.status) {
                await timelineRepo.save({
                    entity_type: 'asset',
                    entity_id: saved.id,
                    action: 'STATUS_CHANGE',
                    description: `Alterou status de "${oldAsset.status}" para "${asset.status}"${justification ? ` | Motivo: ${justification}` : ''}`,
                    old_values: { status: oldAsset.status, justification },
                    new_values: { status: asset.status, justification },
                    user_id: userId
                });
            }

            // Revaluation (Value Change)
            if (asset.value !== undefined && oldAsset.value !== asset.value) {
                await timelineRepo.save({
                    entity_type: 'asset',
                    entity_id: saved.id,
                    action: 'REVALUATION',
                    description: `Reavaliação do ativo: de R$ ${oldAsset.value?.toLocaleString('pt-BR')} para R$ ${asset.value?.toLocaleString('pt-BR')}`,
                    old_values: { value: oldAsset.value },
                    new_values: { value: asset.value },
                    user_id: userId
                });
            }

            // Lawsuit Link/Unlink
            if (asset.lawsuit_id !== undefined && oldAsset.lawsuit_id !== asset.lawsuit_id) {
                const actionDesc = asset.lawsuit_id 
                    ? `Ativo vinculado ao processo como garantia` 
                    : `Ativo desvinculado de processo`;
                
                await timelineRepo.save({
                    entity_type: 'asset',
                    entity_id: saved.id,
                    action: asset.lawsuit_id ? 'LINK_LAWSUIT' : 'UNLINK_LAWSUIT',
                    description: actionDesc,
                    new_values: { lawsuit_id: asset.lawsuit_id },
                    user_id: userId
                });

                // Also log in lawsuit timeline if linked
                if (asset.lawsuit_id) {
                    await timelineRepo.save({
                        entity_type: 'lawsuit',
                        entity_id: asset.lawsuit_id,
                        action: 'ASSET_LINKED',
                        description: `Ativo "${saved.title}" vinculado como garantia`,
                        user_id: userId
                    });
                }
            }

            // Ownership Change
            if (asset.person_id !== undefined && oldAsset.person_id !== asset.person_id) {
                await timelineRepo.save({
                    entity_type: 'asset',
                    entity_id: saved.id,
                    action: 'OWNERSHIP_UPDATE',
                    description: `Alteração de proprietário/vínculo do ativo`,
                    old_values: { person_id: oldAsset.person_id },
                    new_values: { person_id: asset.person_id },
                    user_id: userId
                });
            }
        } else if (!oldAsset) {
            await timelineRepo.save({
                entity_type: 'asset',
                entity_id: saved.id,
                action: 'CREATE',
                description: `Ativo criado`,
                new_values: saved,
                user_id: userId
            });
        }

        return saved;
    } catch (error: any) {
        console.error('Server Action Error (saveAsset):', error.message);
        throw error;
    }
}

export async function deleteAsset(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getAssetRepository(credentials, preferences);
        return await repo.delete(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteAsset):', error.message);
        throw error;
    }
}


/* Asset Documents Actions */
export async function listAssetDocuments(assetId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getAssetRepository(credentials, preferences);
        const data = await repo.listDocuments(assetId);
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listAssetDocuments):', error);
        throw error;
    }
}

export async function saveAssetDocument(doc: Partial<AssetDocument>, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getAssetRepository(credentials, preferences);
        return await repo.saveDocument(doc);
    } catch (error: any) {
        console.error('Server Action Error (saveAssetDocument):', error);
        throw error;
    }
}

export async function deleteAssetDocument(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getAssetRepository(credentials, preferences);
        return await repo.deleteDocument(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteAssetDocument):', error);
        throw error;
    }
}

/* Corporate / Societário Actions */
export async function listCorporateEntities(searchTerm?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        const data = await repo.listEntities(searchTerm);
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listCorporateEntities):', error);
        if (error?.code === '42P01') {
            return { data: [], error: 'TABLE_NOT_FOUND' };
        }
        throw error;
    }
}

export async function saveCorporateEntity(entity: Partial<CorporateEntity>, targetUserId?: string, justification?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);

        let oldEntity: CorporateEntity | null = null;
        if (entity.id) {
            oldEntity = await repo.getEntityById(entity.id);
        }

        const saved = await repo.saveEntity(entity);

        // Audit Trail
        if (oldEntity) {
            // Status Change
            if (entity.status && oldEntity.status !== entity.status) {
                const description = `Alterou status de "${oldEntity.status}" para "${entity.status}"${justification ? ` - Justificativa: ${justification}` : ''}`;
                await timelineRepo.save({
                    entity_type: 'corporate',
                    entity_id: saved.id,
                    action: 'STATUS_CHANGE',
                    description: description,
                    old_values: { status: oldEntity.status, justification },
                    new_values: { status: entity.status, justification },
                    user_id: userId
                });
            }

            // Capital Social
            if (entity.total_capital !== undefined && oldEntity.total_capital !== entity.total_capital) {
                await timelineRepo.save({
                    entity_type: 'corporate',
                    entity_id: saved.id,
                    action: 'CAPITAL_UPDATE',
                    description: `Alteração de Capital Social: de R$ ${oldEntity.total_capital?.toLocaleString('pt-BR')} para R$ ${entity.total_capital?.toLocaleString('pt-BR')}`,
                    old_values: { capital: oldEntity.total_capital },
                    new_values: { capital: entity.total_capital },
                    user_id: userId
                });
            }
        } else if (!oldEntity) {
            await timelineRepo.save({
                entity_type: 'corporate',
                entity_id: saved.id,
                action: 'CREATE',
                description: `Entidade corporativa criada`,
                new_values: saved,
                user_id: userId
            });
        }

        return saved;
    } catch (error: any) {
        console.error('Server Action Error (saveCorporateEntity):', error);
        throw error;
    }
}

export async function deleteCorporateEntity(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        return await repo.deleteEntity(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteCorporateEntity):', error);
        throw error;
    }
}

export async function listShareholders(entityId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        const data = await repo.listShareholders(entityId);
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listShareholders):', error);
        throw error;
    }
}

export async function saveShareholder(shareholder: Partial<Shareholder>, targetUserId?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);

        let oldShareholder: Shareholder | null = null;
        if (shareholder.id) {
            const list = await repo.listShareholders(shareholder.entity_id!);
            oldShareholder = list.find(s => s.id === shareholder.id) || null;
        }

        const saved = await repo.saveShareholder(shareholder);

        // Audit QSA
        if (shareholder.entity_id) {
            if (!oldShareholder) {
                await timelineRepo.save({
                    entity_type: 'corporate',
                    entity_id: shareholder.entity_id,
                    action: 'QSA_ADD',
                    description: `Novo sócio adicionado ao QSA`,
                    new_values: { shareholder_id: saved.person_shareholder_id || saved.corporate_shareholder_id, percentage: saved.ownership_percentage },
                    user_id: userId
                });
            } else if (oldShareholder.ownership_percentage !== saved.ownership_percentage) {
                await timelineRepo.save({
                    entity_type: 'corporate',
                    entity_id: shareholder.entity_id,
                    action: 'QSA_UPDATE',
                    description: `Alteração de percentual societário`,
                    old_values: { percentage: oldShareholder.ownership_percentage },
                    new_values: { percentage: saved.ownership_percentage },
                    user_id: userId
                });
            }
        }

        return saved;
    } catch (error: any) {
        console.error('Server Action Error (saveShareholder):', error);
        throw error;
    }
}

export async function deleteShareholder(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        return await repo.deleteShareholder(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteShareholder):', error);
        throw error;
    }
}

export async function listCorporateDocuments(entityId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        const data = await repo.listDocuments(entityId);
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listCorporateDocuments):', error);
        throw error;
    }
}

export async function saveCorporateDocument(doc: Partial<CorporateDocument>, targetUserId?: string) {
    try {
        const { credentials, preferences, userId } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        const timelineRepo = RepositoryFactory.getTimelineRepository(credentials, preferences);
        
        const saved = await repo.saveDocument(doc);

        // Audit Document
        const criticalTypes = ['Contrato Social', 'Ata de Reunião', 'Ata de Assembleia', 'Acordo de Sócios'];
        if (doc.entity_id && doc.document_type && criticalTypes.includes(doc.document_type)) {
            await timelineRepo.save({
                entity_type: 'corporate',
                entity_id: doc.entity_id,
                action: 'DOCUMENT_UPLOAD',
                description: `Documento de fé pública arquivado: ${doc.document_type}`,
                new_values: { document_name: doc.title, type: doc.document_type },
                user_id: userId
            });
        }

        return saved;
    } catch (error: any) {
        console.error('Server Action Error (saveCorporateDocument):', error);
        throw error;
    }
}

export async function deleteCorporateDocument(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getCorporateRepository(credentials, preferences);
        return await repo.deleteDocument(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteCorporateDocument):', error);
        throw error;
    }
}
export async function listAllGlobalDocuments(targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const supabase = DatabaseService.getClient(credentials);

        const [lawDocs, corpDocs, assetDocs, lawsuits, corps, assets] = await Promise.all([
            supabase.from('legal_documents').select('*'),
            supabase.from('corporate_documents').select('*'),
            supabase.from('asset_documents').select('*'),
            supabase.from('lawsuits').select('id, case_title'),
            supabase.from('corporate_entities').select('id, legal_name'),
            supabase.from('assets').select('id, title')
        ]);

        const globalDocs: GlobalDocument[] = [];

        lawDocs.data?.forEach((d: any) => {
            const origin = lawsuits.data?.find((l: any) => l.id === d.lawsuit_id);
            globalDocs.push({
                id: d.id,
                title: d.title,
                document_type: d.document_type,
                file_url: d.file_url,
                created_at: d.created_at,
                event_date: d.event_date,
                origin_type: 'lawsuit',
                origin_id: d.lawsuit_id,
                origin_name: origin?.case_title || 'Processo Desconhecido'
            });
        });

        corpDocs.data?.forEach((d: any) => {
            const origin = corps.data?.find((c: any) => c.id === d.entity_id);
            globalDocs.push({
                id: d.id,
                title: d.title,
                document_type: d.document_type,
                file_url: d.file_url,
                created_at: d.created_at,
                event_date: d.event_date,
                origin_type: 'corporate',
                origin_id: d.entity_id,
                origin_name: origin?.legal_name || 'Entidade Desconhecida'
            });
        });

        assetDocs.data?.forEach((d: any) => {
            const origin = assets.data?.find((a: any) => a.id === d.asset_id);
            globalDocs.push({
                id: d.id,
                title: d.title,
                document_type: d.document_type,
                file_url: d.file_url,
                created_at: d.created_at,
                event_date: d.event_date,
                origin_type: 'asset',
                origin_id: d.asset_id,
                origin_name: origin?.title || 'Ativo Desconhecido'
            });
        });

        // Sort by creation date descending
        globalDocs.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

        return { data: globalDocs };
    } catch (error: any) {
        console.error('Server Action Error (listAllGlobalDocuments):', error);
        throw error;
    }
}

export async function listPersonParticipations(personId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const supabase = DatabaseService.getClient(credentials);
        
        const { data, error } = await supabase
            .from('corporate_shareholders')
            .select(`
                *,
                entity:corporate_entities!entity_id(*)
            `)
            .eq('person_shareholder_id', personId);
            
        if (error) throw error;
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (listPersonParticipations):', error);
        throw error;
    }
}

export async function listMovements(lawsuitId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const supabase = DatabaseService.getClient(credentials);
        
        const { data, error } = await supabase
            .from('movements')
            .select('*')
            .eq('lawsuit_id', lawsuitId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return { data: data as Movement[] };
    } catch (error: any) {
        console.error('Server Action Error (listMovements):', error);
        throw error;
    }
}

export async function getOrganizationByAdmin(adminId: string) {
    try {
        const supabase = await createMasterServerClient();
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('admin_id', adminId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data as Organization | null;
    } catch (error: any) {
        console.error('Server Action Error (getOrganizationByAdmin):', error);
        return null;
    }
}


export async function sendPaymentEmailAction(payload: {
    to: string;
    fullName: string;
    subject: string;
    html: string;
    senderName?: string;
    replyTo?: string;
}) {
    try {
        const adminClient = createAdminClient();
        console.log('Server Action: Intiating send-email via admin client for', payload.to);
        
        const result = await sendEmail(adminClient, {
            ...payload,
            scenario: 'finance'
        });

        if (!result.success) {
            console.error('Server Action Error (sendPaymentEmailAction):', result.error);
            return { success: false, error: 'Falha na comunicação com o serviço de e-mail.' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Server Action Crash (sendPaymentEmailAction):', error);
        return { success: false, error: 'Erro interno ao processar o envio.' };
    }
}
