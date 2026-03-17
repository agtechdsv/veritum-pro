import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, Upload, XCircle, ChevronDown, CheckCircle2, Search, Plus, Lock as LockIcon, AlertTriangle } from 'lucide-react';
import { createDynamicClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/toast';
import { useModule } from '@/app/veritumpro/layout';

// 💎 Premium File Upload Component
export const PremiumFileUpload = React.forwardRef<{ upload: () => Promise<string | null> }, {
    onUploadComplete?: (url: string) => void;
    onFileSelect?: (file: File | null) => void;
    bucket: string;
    path: string;
    label: string;
    accept?: string;
    isManual?: boolean;
}>(({ onUploadComplete, onFileSelect, bucket, path, label, accept = "*", isManual }, ref) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { credentials } = useModule();

    const handleUpload = async (file: File): Promise<string | null> => {
        if (!file) return null;
        setUploading(true);
        setProgress(10);

        try {
            const supabase = createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            setProgress(30);
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            setProgress(70);
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            setProgress(100);
            if (onUploadComplete) onUploadComplete(publicUrl);
            return publicUrl;
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Erro ao carregar arquivo: ' + error.message);
            return null;
        } finally {
            setTimeout(() => {
                setUploading(false);
                setProgress(0);
            }, 1000);
        }
    };

    React.useImperativeHandle(ref, () => ({
        upload: async () => {
            if (selectedFile) {
                return await handleUpload(selectedFile);
            }
            return null;
        }
    }));

    const onSelect = (file: File) => {
        if (isManual) {
            setSelectedFile(file);
            if (onFileSelect) onFileSelect(file);
        } else {
            handleUpload(file);
        }
    };

    return (
        <div 
            className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-4 ${
                dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'} ${selectedFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) onSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => {
                if (!uploading) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = accept;
                    input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) onSelect(file);
                    };
                    input.click();
                }
            }}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-indigo-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{progress}% Carregando...</span>
                </div>
            ) : selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="p-4 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
                        <Check size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Clique para trocar o arquivo</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                        <Upload size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{label}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Arraste ou clique para selecionar</p>
                    </div>
                </>
            )}
        </div>
    );
});

PremiumFileUpload.displayName = 'PremiumFileUpload';

export const PremiumCombobox: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
    disabled?: boolean;
    creatable?: boolean;
}> = ({ value, onChange, options, placeholder, disabled, creatable }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Sync search term with value when closed
    useEffect(() => {
        if (!isOpen) setSearchTerm(value);
    }, [value, isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalize = (str: string) =>
        (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredOptions = options.filter(opt =>
        normalize(opt).includes(normalize(searchTerm))
    ).slice(0, 50);

    const showAddOption = creatable && searchTerm && !options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-text'}`}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                                setSearchTerm('');
                            }}
                            className="p-1 hover:text-rose-500 transition-colors pointer-events-auto"
                        >
                            <XCircle size={14} className="text-slate-300" />
                        </button>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-[110] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-64 overflow-y-auto no-scrollbar">
                            {showAddOption && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(searchTerm.toUpperCase());
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-6 py-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border-b border-slate-50 dark:border-slate-800 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                            <Plus size={14} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Cadastrar Novo</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase">{searchTerm}</span>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold uppercase tracking-tight flex items-center justify-between group ${value === opt ? 'bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        {opt}
                                        {value === opt && <CheckCircle2 size={16} className="text-indigo-600" />}
                                    </button>
                                ))
                            ) : !showAddOption && (
                                <div className="p-8 text-center">
                                    <Search size={24} className="mx-auto text-slate-200 mb-2" />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhum resultado encontrado</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// 🔒 Blocked Tab Content Overlay
export const BlockedTabOverlay: React.FC<{ message: string }> = ({ message }) => (
    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mb-8 shadow-inner border border-amber-100 dark:border-amber-800">
            <LockIcon size={32} />
        </div>
        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-3">CONTEÚDO BLOQUEADO</h4>
        <p className="text-slate-500 font-bold text-center max-w-[320px] mb-8 leading-relaxed">{message}</p>
        
        <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">SALVE O REGISTRO PRIMEIRO</span>
        </div>
    </div>
);

// Helper for KPI area
export const TrendingUp = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
