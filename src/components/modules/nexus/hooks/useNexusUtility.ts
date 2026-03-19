import { TimelineEntry, EntityStatus, EntityType, TaxRegime } from '@/types';

export const formatCNJ = (value: string) => {
    const val = value.replace(/\D/g, '');
    return val
        .replace(/(\d{7})(\d)/, '$1-$2')
        .replace(/(\d{7}-\d{2})(\d)/, '$1.$2')
        .replace(/(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')
        .replace(/(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
        .replace(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2')
        .substring(0, 25);
};

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

export const getSeverityColor = (dueDate: string, status: string) => {
    if (status === 'Concluído') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Late
    if (diffHours < 24) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Urgent
    if (diffHours < 48) return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100'; // Attention
    return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200'; // Normal
};

export const getTaskUrgencyInfo = (dueDate: string, status: string) => {
    if (status === 'Concluído') return { label: 'Concluído', color: 'emerald', days: 0, isToday: false };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Atrasado', color: 'rose', days: Math.abs(diffDays), isToday: false };
    if (diffDays === 0) return { label: 'Vence Hoje', color: 'rose', days: 0, isToday: true };
    if (diffDays === 1) return { label: 'Vence Amanhã', color: 'amber', days: 1, isToday: false };
    return { label: `Em ${diffDays} dias`, color: 'slate', days: diffDays, isToday: false };
};

export const extractStoragePath = (url: string, bucket: string) => {
    try {
        const parts = url.split(`${bucket}/`);
        if (parts.length > 1) {
            // Strip query parameters
            return parts[1].split('?')[0];
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const ESFERAS = [
    'Trabalhista',
    'Cível',
    'Federal',
    'Previdenciária',
    'Tributária',
    'Criminal',
    'Família & Sucessões',
    'Eleitoral',
    'Militar'
];

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const RITOS = {
    'Trabalhista': ['Ordinário', 'Sumaríssimo', 'Sumário (Alçada)', 'Execução Trabalhista'],
    'Cível': ['Procedimento Comum', 'Sumaríssimo (Juizado Especial)', 'Execução de Título Extrajudicial', 'Monitória', 'Inventário/Arrolamento'],
    'Federal': ['Procedimento Comum', 'Sumaríssimo (JEF)', 'Execução Fiscal'],
    'Previdenciária': ['Procedimento Comum', 'Sumaríssimo (JEF)', 'Acidentário'],
    'Tributária': ['Execução Fiscal', 'Anulatória', 'Mandado de Segurança', 'Repetição de Indébito'],
    'Criminal': ['Ordinário', 'Sumário', 'Sumaríssimo', 'Tribunal do Júri', 'Execução Penal'],
    'default': ['Procedimento Comum', 'Especial', 'Mandado de Segurança']
};

export const TAX_REGIMES: TaxRegime[] = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Isenta'];
export const ENTITY_TYPES: EntityType[] = ['LTDA', 'SA', 'EIRELI', 'MEI', 'Holding', 'Associação', 'Outros'];

export const LAWSUIT_STATUSES = ['Incial', 'Ativo', 'Suspenso', 'Arquivado', 'Concluído'];
export const ASSET_STATUSES = ['Ativo', 'Bloqueado', 'Vendido', 'Em Garantia', 'Alienado', 'Inativo'];
export const ENTITY_STATUSES: EntityStatus[] = ['Ativa', 'Baixada', 'Inativa', 'Suspensa'];

export const TRIBUNAIS: Record<string, Record<string, string[]>> = {
    'Trabalhista': {
        'AC': ['TRT-14 (RO/AC)'], 'AL': ['TRT-19'], 'AP': ['TRT-8 (PA/AP)'], 'AM': ['TRT-11 (AM/RR)'],
        'BA': ['TRT-5'], 'CE': ['TRT-7'], 'DF': ['TRT-10 (DF/TO)'], 'ES': ['TRT-17'], 'GO': ['TRT-18'],
        'MA': ['TRT-16'], 'MT': ['TRT-23'], 'MS': ['TRT-24'], 'MG': ['TRT-3'], 'PA': ['TRT-8 (PA/AP)'],
        'PB': ['TRT-13'], 'PR': ['TRT-9'], 'PE': ['TRT-6'], 'PI': ['TRT-22'], 'RJ': ['TRT-1'],
        'RN': ['TRT-21'], 'RS': ['TRT-4'], 'RO': ['TRT-14 (RO/AC)'], 'RR': ['TRT-11 (AM/RR)'],
        'SC': ['TRT-12'], 'SP': ['TRT-2 (SP/GSP/Baixada)', 'TRT-15 (Interior/Litoral/Campinas)'],
        'SE': ['TRT-20'], 'TO': ['TRT-10 (DF/TO)'],
        'Superior': ['TST - Tribunal Superior do Trabalho', 'STF']
    },
    'Federal': {
        'AC': ['TRF-1'], 'AL': ['TRF-5'], 'AP': ['TRF-1'], 'AM': ['TRF-1'], 'BA': ['TRF-1'],
        'CE': ['TRF-5'], 'DF': ['TRF-1'], 'ES': ['TRF-2'], 'GO': ['TRF-1'], 'MA': ['TRF-1'],
        'MT': ['TRF-1'], 'MS': ['TRF-3'], 'MG': ['TRF-6'], 'PA': ['TRF-1'], 'PB': ['TRF-5'],
        'PR': ['TRF-4'], 'PE': ['TRF-5'], 'PI': ['TRF-1'], 'RJ': ['TRF-2'], 'RN': ['TRF-5'],
        'RS': ['TRF-4'], 'RO': ['TRF-1'], 'RR': ['TRF-1'], 'SC': ['TRF-4'], 'SP': ['TRF-3'],
        'SE': ['TRF-5'], 'TO': ['TRF-1'],
        'Superior': ['STJ - Superior Tribunal de Justiã§a', 'STF']
    },
    'Cível': {
        'AC': ['TJAC'], 'AL': ['TJAL'], 'AP': ['TJAP'], 'AM': ['TJAM'], 'BA': ['TJBA'],
        'CE': ['TJCE'], 'DF': ['TJDFT'], 'ES': ['TJES'], 'GO': ['TJGO'], 'MA': ['TJMA'],
        'MT': ['TJMT'], 'MS': ['TJMS'], 'MG': ['TJMG'], 'PA': ['TJPA'], 'PB': ['TJPB'],
        'PR': ['TJPR'], 'PE': ['TJPE'], 'PI': ['TJPI'], 'RJ': ['TJRJ'], 'RN': ['TJRN'],
        'RS': ['TJRS'], 'RO': ['TJRO'], 'RR': ['TJRR'], 'SC': ['TJSC'], 'SP': ['TJSP'],
        'SE': ['TJSE'], 'TO': ['TJTO'],
        'Superior': ['STJ', 'STF']
    }
};

TRIBUNAIS['Previdenciária'] = TRIBUNAIS['Federal'];
TRIBUNAIS['Tributária'] = TRIBUNAIS['Federal'];
TRIBUNAIS['Criminal'] = TRIBUNAIS['Cível'];
TRIBUNAIS['Família & Sucessões'] = TRIBUNAIS['Cível'];
TRIBUNAIS['Eleitoral'] = Object.fromEntries(UFS.map(uf => [uf, [`TRE-${uf}`]]));
TRIBUNAIS['Militar'] = { 'default': ['STM - Superior Tribunal Militar', 'TJM (Estadual)'] };
