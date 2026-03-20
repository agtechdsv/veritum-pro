import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    Lawsuit, Task, CalendarEvent, Asset, CorporateEntity, 
    Shareholder, CorporateDocument, LawsuitDocument, AssetDocument, 
    TeamMember, Person, GlobalDocument, FinancialTransaction, TimelineEntry 
} from '@/types';
import { 
    listLawsuits, listTasks, listEvents, listTeam, listAssets, 
    listCorporateEntities, getFinancialStats, listTimelineEntries, listAllGlobalDocuments 
} from '@/app/actions/nexus-actions';
import { listPersons } from '@/app/actions/crm-actions';
import { createDynamicClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/toast';
import { useTranslation } from '@/contexts/language-context';

export const useNexusCore = (selectedClientId: string, user: any, isMaster: boolean, financeStartDate: string, financeEndDate: string) => {
    const { t } = useTranslation();
    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; }, [t]);
    const [selectedUserId, setSelectedUserId] = useState<string>(selectedClientId || (isMaster ? '' : user.id));
    
    // Core Data States
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [corporateEntities, setCorporateEntities] = useState<CorporateEntity[]>([]);
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [corporateDocuments, setCorporateDocuments] = useState<CorporateDocument[]>([]);
    const [lawsuitDocuments, setLawsuitDocuments] = useState<LawsuitDocument[]>([]);
    const [assetDocuments, setAssetDocuments] = useState<AssetDocument[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalDocuments, setGlobalDocuments] = useState<GlobalDocument[]>([]);
    const [isGlobalDocsLoading, setIsGlobalDocsLoading] = useState(false);
    const [financialStats, setFinancialStats] = useState({ totalCredits: 0, totalDebits: 0, balance: 0 });

    // Track what has already been fetched for targetUserId - using Ref to avoid infinite loops in useCallback/useEffect
    const fetchedEntitiesRef = useRef<Set<string>>(new Set());
    const isFetchingRef = useRef<boolean>(false);
    const lastFetchParamsRef = useRef<string>('');

    const fetchAll = useCallback(async (force = false) => {
        const targetUserId = selectedUserId;
        if (isMaster && !targetUserId) {
            setLawsuits([]); setEvents([]); setLoading(false);
            return;
        }

        // Avoid concurrent or redundant fetches
        const currentParams = `${targetUserId}_${financeStartDate}_${financeEndDate}_${isMaster}`;
        if (!force && isFetchingRef.current) return;
        if (!force && lastFetchParamsRef.current === currentParams) {
            setLoading(false);
            return;
        }

        isFetchingRef.current = true;
        setLoading(true);

        try {
            // If forced or first time for this user, fetch CORE data
            const isFirstFetchForUser = !fetchedEntitiesRef.current.has(`${targetUserId}_core`) || force;

            if (isFirstFetchForUser) {
                const [lawResult, taskResult, eventResult, teamResult, finStatsResult, assetResult, personResult, entityResult] = await Promise.all([
                    listLawsuits('', targetUserId),
                    listTasks('', targetUserId),
                    listEvents('', targetUserId),
                    listTeam(targetUserId),
                    getFinancialStats(undefined, undefined, targetUserId, financeStartDate, financeEndDate),
                    listAssets(undefined, undefined, targetUserId),
                    listPersons('', targetUserId),
                    listCorporateEntities('', targetUserId)
                ]);

                if (lawResult.data) setLawsuits(lawResult.data);
                if (taskResult.data) setTasks(taskResult.data);
                if (eventResult.data) setEvents(eventResult.data);
                if (teamResult?.data) setTeam(teamResult.data);
                if (finStatsResult?.data) setFinancialStats(finStatsResult.data);
                if (assetResult?.data) setAssets(assetResult.data);
                if (personResult?.data) setPersons(personResult.data);
                if (entityResult?.data) setCorporateEntities(entityResult.data);
                
                fetchedEntitiesRef.current.add(`${targetUserId}_core`);
                // Mark these as fetched for their specific tabs too
                fetchedEntitiesRef.current.add(`${targetUserId}_tab_ativos`);
                fetchedEntitiesRef.current.add(`${targetUserId}_tab_pessoas`);
                fetchedEntitiesRef.current.add(`${targetUserId}_tab_societario`);
                
                lastFetchParamsRef.current = currentParams;
            }
        } catch (err: any) {
            console.error('Error loading Nexus core data:', err);
            toast.error(tRef.current('common.errors.loadData'));
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [selectedUserId, isMaster, financeStartDate, financeEndDate]); // Removed t to stabilize

    const fetchTab = useCallback(async (tabId: string, force = false) => {
        const targetUserId = selectedUserId;
        if (!targetUserId) return;

        // Check if already fetched
        if (fetchedEntitiesRef.current.has(`${targetUserId}_tab_${tabId}`) && !force) return;

        if (tabId === 'ativos') {
            const res = await listAssets(undefined, undefined, targetUserId);
            if (res?.data) setAssets(res.data);
        } else if (tabId === 'documentos') {
            setIsGlobalDocsLoading(true);
            const res = await listAllGlobalDocuments(targetUserId);
            if (res?.data) setGlobalDocuments(res.data);
            setIsGlobalDocsLoading(false);
        } else if (tabId === 'pessoas') {
            const res = await listPersons('', targetUserId);
            if (res.data) setPersons(res.data);
        } else if (tabId === 'societario') {
            const res = await listCorporateEntities('', targetUserId);
            if (res?.data) setCorporateEntities(res.data);
        }

        fetchedEntitiesRef.current.add(`${targetUserId}_tab_${tabId}`);
    }, [selectedUserId]);

    useEffect(() => {
        // Clear fetched tracking when client changes significantly
        fetchedEntitiesRef.current.clear();
    }, [selectedUserId]);

    useEffect(() => {
        // We removed the automated fetchAll from here to prevent loops.
        // It will be triggered by useNexusLogic or initially in component.
    }, []);

    return {
        selectedUserId,
        setSelectedUserId,
        lawsuits,
        setLawsuits,
        tasks,
        setTasks,
        events,
        setEvents,
        assets,
        setAssets,
        corporateEntities,
        setCorporateEntities,
        shareholders,
        setShareholders,
        corporateDocuments,
        setCorporateDocuments,
        lawsuitDocuments,
        setLawsuitDocuments,
        assetDocuments,
        setAssetDocuments,
        team,
        setTeam,
        persons,
        setPersons,
        loading,
        setLoading,
        globalDocuments,
        setGlobalDocuments,
        isGlobalDocsLoading,
        setIsGlobalDocsLoading,
        financialStats,
        setFinancialStats,
        fetchAll,
        fetchTab
    };
};
