
import React, { useState, useEffect, useRef } from 'react';
import { Credentials, Chat, ChatMessage, Person, Lawsuit } from '@/types';
import { GeminiService } from '@/services/gemini';
import {
    MessageCircle, Phone, Globe, Send, User, Check,
    Search, MoreHorizontal, Plus, Shield, Clock,
    CheckCircle2, AlertCircle, FileText, Sparkles,
    ChevronLeft, Scale, Info, Archive, Trash2, XCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const Vox: React.FC<{ credentials: Credentials; permissions: any }> = ({ credentials, permissions }) => {
    // Data State
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [loading, setLoading] = useState(true);

    // active Chat State
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [inputText, setInputText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
    const gemini = new GeminiService(credentials.geminiKey);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
        const subscription = supabase
            .channel('chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                const newMsg = payload.new as ChatMessage;
                if (activeChat && newMsg.chat_id === activeChat.id) {
                    setMessages(prev => [...prev, newMsg]);
                }
                // Refresh chat list for last message updates
                fetchChatsOnly();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [activeChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [chatRes, personRes, lawRes] = await Promise.all([
                supabase.from('chats').select('*').order('updated_at', { ascending: false }),
                supabase.from('persons').select('*'),
                supabase.from('lawsuits').select('*')
            ]);
            setChats(chatRes.data || []);
            setPersons(personRes.data || []);
            setLawsuits(lawRes.data || []);

            // Auto-select first chat if available
            if (chatRes.data && chatRes.data.length > 0) {
                handleSelectChat(chatRes.data[0]);
            }
        } catch (err) {
            console.error('Error fetching Vox data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchChatsOnly = async () => {
        const { data } = await supabase.from('chats').select('*').order('updated_at', { ascending: false });
        if (data) setChats(data);
    };

    const handleSelectChat = async (chat: Chat) => {
        setActiveChat(chat);
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    const handleSendMessage = async (e?: React.FormEvent, contentOverride?: string) => {
        if (e) e.preventDefault();
        const content = contentOverride || inputText;
        if (!content.trim() || !activeChat) return;

        try {
            const { error } = await supabase.from('chat_messages').insert([{
                chat_id: activeChat.id,
                content: content,
                sender_type: 'Lawyer'
            }]);
            if (error) throw error;

            // Update chat timestamp
            await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', activeChat.id);

            setInputText('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleVoxify = async () => {
        if (!inputText || isTranslating) return;
        setIsTranslating(true);
        try {
            const result = await gemini.translateLegalese(inputText);
            if (result) setInputText(result);
        } catch (err) {
            console.error('Voxify failed:', err);
        } finally {
            setIsTranslating(false);
        }
    };

    const getPersonName = (personId: string) => {
        return persons.find(p => p.id === personId)?.full_name || 'Usuário Veritum';
    };

    const filteredChats = chats.filter(c => {
        const personName = getPersonName(c.person_id).toLowerCase();
        return personName.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden high-density">
            {/* Contact List */}
            <div className="w-80 border-r border-slate-50 dark:border-slate-800 flex flex-col bg-slate-50/20 dark:bg-slate-900/40">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">VOX PRO</h2>
                        <button className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 active:scale-90 transition-transform">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-3.5 text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar conversas..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="p-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando chats...</div>
                    ) : filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat)}
                            className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-l-4 ${activeChat?.id === chat.id
                                    ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-indigo-600'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-l-transparent'
                                }`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                                    <img src={`https://ui-avatars.com/api/?name=${getPersonName(chat.person_id)}&background=random`} alt="Avatar" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-[11px] truncate uppercase">{getPersonName(chat.person_id)}</h4>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                        {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">Aguardando interação...</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-slate-50/10 dark:bg-slate-950/10">
                    <header className="p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-50 dark:border-slate-800 flex items-center justify-between z-10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30">
                                <img src={`https://ui-avatars.com/api/?name=${getPersonName(activeChat.person_id)}&background=random`} alt="Avatar" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase leading-none">{getPersonName(activeChat.person_id)}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest">Portal Ativo</span>
                                    </div>
                                    {activeChat.lawsuit_id && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                                            <Scale size={10} className="text-indigo-600" />
                                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">Nexus Link</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all"><Phone size={18} /></button>
                            <button className="p-2.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all"><Shield size={18} /></button>
                            <button className="p-2.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-rose-600 rounded-xl transition-all"><Archive size={18} /></button>
                        </div>
                    </header>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 p-8 space-y-6 overflow-y-auto no-scrollbar scroll-smooth"
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <MessageCircle size={40} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nenhuma mensagem ainda</p>
                                    <p className="text-[10px] text-slate-400 font-bold">Inicie o atendimento clicando abaixo.</p>
                                </div>
                            </div>
                        ) : messages.map((msg, i) => {
                            const isMe = msg.sender_type === 'Lawyer';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                >
                                    <div className={`p-4 rounded-3xl text-[11px] leading-relaxed font-medium shadow-sm border ${isMe
                                            ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none shadow-indigo-600/20'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-1.5 px-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-[9px] text-slate-400 font-black uppercase">
                                            {new Date(msg.created_at || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && <CheckCircle2 size={10} className="text-emerald-500" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 transition-colors">
                        <div className="max-w-4xl mx-auto space-y-3">
                            <div className="relative group bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 p-2 flex flex-col">
                                <div className="flex items-center gap-2 mb-2 p-1">
                                    <button
                                        onClick={handleVoxify}
                                        disabled={isTranslating || !inputText}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${isTranslating
                                                ? 'bg-amber-50 text-amber-600 animate-pulse'
                                                : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                                            }`}
                                    >
                                        <Sparkles size={14} className={isTranslating ? 'animate-spin' : ''} />
                                        {isTranslating ? 'Traduzindo...' : 'VOX LEGAL (IA)'}
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">O Vox Legal simplifica o juridiquês para o cliente.</span>
                                </div>
                                <div className="flex items-end gap-3 p-1">
                                    <textarea
                                        placeholder="Escreva sua mensagem operacional ou jurídica..."
                                        rows={2}
                                        className="flex-1 bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-700 dark:text-white px-2 py-1 resize-none no-scrollbar leading-relaxed"
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputText.trim()}
                                        className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/10 dark:bg-slate-950/20 text-center p-12 space-y-6">
                    <div className="relative">
                        <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center animate-pulse">
                            <MessageCircle size={64} className="text-indigo-600 opacity-50" />
                        </div>
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center">
                            <Shield size={16} className="text-emerald-500" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">Selecione um Atendimento</h3>
                        <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">Selecione um cliente na barra lateral para carregar a central de comunicação Vox PRO.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vox;
