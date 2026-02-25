'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pt } from '@/locales/pt';
import { en } from '@/locales/en';
import { es } from '@/locales/es';

type Locale = 'pt' | 'en' | 'es';
type Translations = typeof pt;

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, variables?: Record<string, any>) => any;
}

const translations: Record<Locale, Translations> = { pt, en, es };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>('pt');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedLocale = localStorage.getItem('veritum-locale') as Locale;
        if (savedLocale && (['pt', 'en', 'es'].includes(savedLocale))) {
            setLocaleState(savedLocale);
        }
        setIsLoaded(true);
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('veritum-locale', newLocale);
    };

    const t = (key: string, variables?: Record<string, any>): any => {
        const keys = key.split('.');
        let current: any = translations[locale];

        for (const k of keys) {
            if (current[k] === undefined) {
                // Fallback to PT if key is missing in chosen locale
                let fallback: any = translations['pt'];
                for (const fk of keys) {
                    if (fallback[fk] === undefined) return key;
                    fallback = fallback[fk];
                }
                current = fallback;
                break;
            }
            current = current[k];
        }

        if (typeof current === 'string' && variables) {
            // Simple string interpolation for components (Trans-like)
            // If the user passed a function/component for a variable, they probably want to wrap a part of the text.
            // But our t function currently returns string. 
            // For complex stuff, we might want to return ReactNode.
            // However, to keep it simple, we'll just handle plain string replacement here.
            Object.entries(variables).forEach(([name, value]) => {
                if (typeof value === 'string' || typeof value === 'number') {
                    current = current.replace(`{${name}}`, String(value));
                }
            });
        }

        return current !== undefined && current !== null ? current : key;
    };

    // Prevent hydration flickers by waiting for locale to load from localStorage
    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {isLoaded ? children : <div className="opacity-0">{children}</div>}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
