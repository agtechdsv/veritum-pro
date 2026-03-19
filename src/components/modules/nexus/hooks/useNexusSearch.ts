import { useState, useMemo } from 'react';
import { Task, CalendarEvent, Lawsuit, Asset, GlobalDocument, CorporateEntity, CorporateDocument, LawsuitDocument, AssetDocument } from '@/types';

export const useNexusSearch = (data: {
    tasks: Task[];
    events: CalendarEvent[];
    lawsuits: Lawsuit[];
    assets: Asset[];
    globalDocuments: GlobalDocument[];
    corporateEntities: CorporateEntity[];
    corporateDocuments: CorporateDocument[];
    lawsuitDocuments: LawsuitDocument[];
    assetDocuments: AssetDocument[];
}) => {
    // Search Term for Overview / Global Search
    const [searchTerm, setSearchTerm] = useState('');

    // Specific Domain Search Terms
    const [corporateSearchTerm, setCorporateSearchTerm] = useState('');
    const [lawsuitSearch, setLawsuitSearch] = useState('');
    const [assetSearch, setAssetSearch] = useState('');
    const [docSearch, setDocSearch] = useState('');
    
    // Global Filter Terms
    const [filterSearchTerm, setFilterSearchTerm] = useState('');
    const [filterResponsibleId, setFilterResponsibleId] = useState('');
    const [filterLawsuitId, setFilterLawsuitId] = useState('');

    // Domain Filters
    const [lawsuitStatusFilter, setLawsuitStatusFilter] = useState('');
    const [lawsuitLawyerFilter, setLawsuitLawyerFilter] = useState('');
    const [assetStatusFilter, setAssetStatusFilter] = useState('');
    const [assetTypeFilter, setAssetTypeFilter] = useState('');
    const [docTypeFilter, setDocTypeFilter] = useState('');
    const [docOriginFilter, setDocOriginFilter] = useState('');

    // Filtering logic
    const filteredTasks = useMemo(() => data.tasks.filter(t => {
        const matchSearch = filterSearchTerm ? t.title.toLowerCase().includes(filterSearchTerm.toLowerCase()) : true;
        const matchResponsible = filterResponsibleId ? t.responsible_id === filterResponsibleId : true;
        const matchLawsuit = filterLawsuitId ? t.lawsuit_id === filterLawsuitId : true;
        return matchSearch && matchResponsible && matchLawsuit;
    }), [data.tasks, filterSearchTerm, filterResponsibleId, filterLawsuitId]);

    const filteredEvents = useMemo(() => data.events.filter(e => {
        const matchSearch = filterSearchTerm ? e.title.toLowerCase().includes(filterSearchTerm.toLowerCase()) || e.event_type?.toLowerCase().includes(filterSearchTerm.toLowerCase()) : true;
        const matchResponsible = filterResponsibleId ? e.responsible_id === filterResponsibleId : true;
        const matchLawsuit = filterLawsuitId ? e.lawsuit_id === filterLawsuitId : true;
        return matchSearch && matchResponsible && matchLawsuit;
    }), [data.events, filterSearchTerm, filterResponsibleId, filterLawsuitId]);

    const filteredLawsuits = useMemo(() => data.lawsuits.filter(l => {
        const matchSearch = lawsuitSearch ? (l.cnj_number?.toLowerCase().includes(lawsuitSearch.toLowerCase()) || l.case_title?.toLowerCase().includes(lawsuitSearch.toLowerCase())) : true;
        const matchStatus = lawsuitStatusFilter ? l.status === lawsuitStatusFilter : true;
        const matchLawyer = lawsuitLawyerFilter ? l.responsible_lawyer_id === lawsuitLawyerFilter : true;
        return matchSearch && matchStatus && matchLawyer;
    }), [data.lawsuits, lawsuitSearch, lawsuitStatusFilter, lawsuitLawyerFilter]);

    const filteredAssets = useMemo(() => data.assets.filter(a => {
        const matchSearch = assetSearch ? (a.title.toLowerCase().includes(assetSearch.toLowerCase()) || a.description?.toLowerCase().includes(assetSearch.toLowerCase())) : true;
        const matchStatus = assetStatusFilter ? a.status === assetStatusFilter : true;
        const matchType = assetTypeFilter ? a.asset_type === assetTypeFilter : true;
        return matchSearch && matchStatus && matchType;
    }), [data.assets, assetSearch, assetStatusFilter, assetTypeFilter]);

    const filteredGlobalDocs = useMemo(() => data.globalDocuments.filter(d => {
        const matchSearch = docSearch ? (
            d.title.toLowerCase().includes(docSearch.toLowerCase()) || 
            d.document_type.toLowerCase().includes(docSearch.toLowerCase()) ||
            d.origin_name?.toLowerCase().includes(docSearch.toLowerCase())
        ) : true;
        const matchType = docTypeFilter ? d.document_type === docTypeFilter : true;
        const matchOrigin = docOriginFilter ? d.origin_type === docOriginFilter : true;
        return matchSearch && matchType && matchOrigin;
    }), [data.globalDocuments, docSearch, docTypeFilter, docOriginFilter]);

    const filteredEntityDocs = useMemo(() => data.corporateDocuments.filter(d => {
        const matchSearch = docSearch ? (
            d.title.toLowerCase().includes(docSearch.toLowerCase()) || 
            d.document_type?.toLowerCase().includes(docSearch.toLowerCase())
        ) : true;
        return matchSearch;
    }), [data.corporateDocuments, docSearch]);

    const filteredLawsuitDocs = useMemo(() => data.lawsuitDocuments.filter(d => {
        const matchSearch = docSearch ? (
            d.title.toLowerCase().includes(docSearch.toLowerCase()) || 
            d.document_type?.toLowerCase().includes(docSearch.toLowerCase())
        ) : true;
        return matchSearch;
    }), [data.lawsuitDocuments, docSearch]);

    const filteredAssetDocs = useMemo(() => data.assetDocuments.filter(d => {
        const matchSearch = docSearch ? (
            d.title.toLowerCase().includes(docSearch.toLowerCase()) || 
            d.document_type?.toLowerCase().includes(docSearch.toLowerCase())
        ) : true;
        return matchSearch;
    }), [data.assetDocuments, docSearch]);

    const filteredEntities = useMemo(() => data.corporateEntities.filter(e => {
        const matchSearch = corporateSearchTerm ? (
            e.legal_name.toLowerCase().includes(corporateSearchTerm.toLowerCase()) || 
            e.cnpj?.toLowerCase().includes(corporateSearchTerm.toLowerCase())
        ) : true;
        return matchSearch;
    }), [data.corporateEntities, corporateSearchTerm]);

    const uniqueDocTypes = useMemo(() => Array.from(new Set(data.globalDocuments.map(d => d.document_type))).sort(), [data.globalDocuments]);

    return {
        searchTerm, setSearchTerm,
        corporateSearchTerm, setCorporateSearchTerm,
        lawsuitSearch, setLawsuitSearch,
        assetSearch, setAssetSearch,
        docSearch, setDocSearch,
        
        filterSearchTerm, setFilterSearchTerm,
        filterResponsibleId, setFilterResponsibleId,
        filterLawsuitId, setFilterLawsuitId,
        
        lawsuitStatusFilter, setLawsuitStatusFilter,
        lawsuitLawyerFilter, setLawsuitLawyerFilter,
        assetStatusFilter, setAssetStatusFilter,
        assetTypeFilter, setAssetTypeFilter,
        docTypeFilter, setDocTypeFilter,
        docOriginFilter, setDocOriginFilter,

        filteredTasks, filteredEvents, filteredLawsuits, filteredAssets,
        filteredGlobalDocuments: filteredGlobalDocs, filteredEntityDocs, filteredLawsuitDocs, filteredAssetDocs,
        filteredEntities, uniqueDocTypes
    };
};
