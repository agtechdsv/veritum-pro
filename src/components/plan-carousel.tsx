'use client'

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlanCarouselProps {
    plans: any[];
    billingCycle: 'monthly' | 'yearly';
    openAuth: (mode: 'login' | 'register') => void;
}

const DiscountBadge = ({ value }: { value: number }) => {
    if (!value || value <= 0) return null;
    return (
        <div className="absolute -top-6 -right-6 px-3 py-1.5 rounded-full text-[10px] font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse whitespace-nowrap bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 scale-110 z-20">
            {value}% OFF
        </div>
    );
};

const PlanCard = ({ plan, billingCycle, openAuth, isActive, index }: any) => {
    const isYearly = billingCycle === 'yearly';
    const basePrice = isYearly ? plan.yearly_price : plan.monthly_price;
    const discount = isYearly ? plan.yearly_discount : plan.monthly_discount;
    const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
    const installmentValue = finalPrice / 12;

    return (
        <div className={`relative p-8 rounded-[40px] border transition-all duration-500 flex flex-col h-full shrink-0 w-full sm:w-[380px] ${isActive
            ? 'scale-105 z-20 opacity-100 bg-slate-900 border-indigo-500/50 shadow-[0_0_40px_rgba(79,70,229,0.15)]'
            : 'scale-95 opacity-50 z-10 bg-slate-950 border-white/5'}`}>

            {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full tracking-[0.2em] shadow-lg">
                    MAIS POPULAR
                </div>
            )}

            <div className="mb-8">
                <h3 className="text-2xl font-black mb-2 text-white uppercase tracking-tight">{plan.name}</h3>
                <p className="text-xs font-medium text-slate-500 italic min-h-[32px]">{plan.short_desc?.pt || ''}</p>
            </div>

            <div className="mb-8 flex flex-col items-baseline gap-1 relative">
                {discount > 0 ? (
                    <span className="text-[15px] font-bold text-slate-500 line-through decoration-rose-500 decoration-2">
                        R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                ) : (
                    <div className="h-[22.5px]" />
                )}

                <div className="flex flex-col gap-0.5 relative group">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            {isYearly ? '/ ANO' : '/ MÊS'}
                        </span>
                        <DiscountBadge value={discount} />
                    </div>
                    {isYearly && (
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mt-1 animate-in fade-in slide-in-from-left-2 duration-500">
                            ou 12x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                        </p>
                    )}
                </div>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
                {(plan.features?.pt || []).map((f: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20">
                            <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 leading-tight">{f}</span>
                    </li>
                ))}
            </ul>

            <div className="space-y-3 mt-auto">
                <button
                    onClick={() => openAuth('register')}
                    className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 active:scale-95"
                >
                    TRIAL - 14 DIAS GRÁTIS
                </button>
                <button
                    onClick={() => openAuth('register')}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${plan.recommended
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                        }`}
                >
                    ASSINAR AGORA
                </button>
            </div>
        </div>
    );
};

export const PlanCarousel: React.FC<PlanCarouselProps> = ({ plans, billingCycle, openAuth }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // Initial focus on recommended plan
    useEffect(() => {
        const recommendedIndex = plans.findIndex(p => p.recommended);
        if (recommendedIndex !== -1) {
            setActiveIndex(recommendedIndex);
        }
    }, [plans]);

    const scrollNext = () => {
        if (activeIndex < plans.length - 1) {
            setActiveIndex(prev => prev + 1);
        }
    };

    const scrollPrev = () => {
        if (activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        }
    };

    return (
        <div className="relative w-full overflow-hidden py-16 group/carousel">
            {/* Impeccable Navigation Arrows */}
            <button
                onClick={scrollPrev}
                disabled={activeIndex === 0}
                className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-slate-900/50 border border-white/10 text-white flex items-center justify-center transition-all hover:bg-indigo-600 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none shadow-2xl backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 -translate-x-4 group-hover/carousel:translate-x-0 duration-500"
                title="Anterior"
            >
                <ChevronLeft size={32} strokeWidth={3} />
            </button>

            <button
                onClick={scrollNext}
                disabled={activeIndex === plans.length - 1}
                className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-slate-900/50 border border-white/10 text-white flex items-center justify-center transition-all hover:bg-indigo-600 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none shadow-2xl backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 translate-x-4 group-hover/carousel:translate-x-0 duration-500"
                title="Próximo"
            >
                <ChevronRight size={32} strokeWidth={3} />
            </button>

            {/* The Impeccable Inner Container - Mathematical Centering */}
            <div className="w-full relative py-10">
                <div
                    className="flex transition-transform duration-700 ease-out items-stretch"
                    style={{
                        transform: `translateX(calc(50% - 198px - ${activeIndex * 396}px))`
                    }}
                >
                    {plans.map((plan, i) => (
                        <div key={plan.id} className="px-2 shrink-0">
                            <PlanCard
                                index={i}
                                plan={plan}
                                billingCycle={billingCycle}
                                openAuth={openAuth}
                                isActive={activeIndex === i}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Immersive Fade Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-30 backdrop-blur-[1px]" />
            <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-gradient-to-l from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-30 backdrop-blur-[1px]" />
        </div>
    );
}
