
import React, { useState } from 'react';
import { Credentials } from '@/types';
import { GeminiService } from '@/services/gemini';
import { MessageCircle, Phone, Globe, Send, User, Check } from 'lucide-react';

const Vox: React.FC<{ credentials: Credentials }> = ({ credentials }) => {
    const [selectedChat, setSelectedChat] = useState<number>(0);
    const [inputText, setInputText] = useState('');
    const [translating, setTranslating] = useState(false);
    const gemini = new GeminiService(credentials.geminiKey);

    const chats = [
        { id: 0, name: 'Carlos Eduardo', lastMsg: 'Obrigado pela explicação, Dr.', time: '10:45', unread: 0 },
        { id: 1, name: 'Mariana Santos', lastMsg: 'Como está o andamento da liminar?', time: 'Ontem', unread: 2 },
        { id: 2, name: 'Construtora Forte', lastMsg: 'Aguardamos a guia para pagamento.', time: '23 Out', unread: 0 },
    ];

    const handleTranslateAndSend = async () => {
        if (!inputText) return;
        setTranslating(true);
        try {
            const translated = await gemini.translateLegalese(inputText);
            setInputText(translated || '');
        } catch (e) {
            console.error(e);
        } finally {
            setTranslating(false);
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors min-h-[600px]">
            {/* Contact List */}
            <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 transition-colors">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Vox Clientis</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">CRM & Portal do Cliente</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat.id)}
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedChat === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-4 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-r-4 border-transparent'}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border-2 border-indigo-100 dark:border-indigo-900/30">
                                <img src={`https://ui-avatars.com/api/?name=${chat.name}&background=random`} alt={chat.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{chat.name}</h4>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{chat.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{chat.lastMsg}</p>
                            </div>
                            {chat.unread > 0 && (
                                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-sm shadow-indigo-600/30">
                                    {chat.unread}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/20 transition-colors">
                <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-indigo-100 dark:border-indigo-900/30">
                            <img src={`https://ui-avatars.com/api/?name=${chats[selectedChat].name}&background=random`} alt="Avatar" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white leading-none mb-1">{chats[selectedChat].name}</h4>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all shadow-sm">
                            <Phone size={18} />
                        </button>
                        <button className="p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all shadow-sm">
                            <User size={18} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <div className="flex justify-center mb-4">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Hoje</span>
                    </div>

                    <div className="flex flex-col items-start max-w-[80%] animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm transition-colors font-medium">
                            Boa tarde Dr. Como está o meu processo de danos morais? Alguma novidade no sistema?
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-1 font-bold">10:42</span>
                    </div>

                    <div className="flex flex-col items-end self-end max-w-[80%] animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg text-sm font-medium">
                            O processo está concluso para despacho. Isso significa que o juiz já está com os papéis e deve dar uma decisão em breve.
                        </div>
                        <div className="flex items-center gap-1 mt-1 mr-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">10:45</span>
                            <Check size={12} className="text-indigo-500 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>

                <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="relative bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 flex items-center gap-2 transition-colors">
                        <button
                            onClick={handleTranslateAndSend}
                            disabled={translating}
                            title="Traduzir Juridiquês via IA"
                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all flex items-center gap-2 text-xs font-black whitespace-nowrap active:scale-95 disabled:opacity-50"
                        >
                            <Globe size={18} /> {translating ? 'Traduzindo...' : 'Limpar Juridiquês'}
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                        <input
                            placeholder="Digite sua mensagem (a IA pode simplificar para você)..."
                            className="flex-1 bg-transparent border-none py-2 px-3 text-sm focus:outline-none dark:text-white font-medium"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !translating && setInputText('')}
                        />
                        <button className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex-shrink-0 active:scale-95">
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 px-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Pressione Enter para enviar ou use o tradutor inteligente acima.</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Vox;
