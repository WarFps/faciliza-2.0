
import React, { useState, useRef, useEffect } from 'react';
import { parseAICommand } from '../services/geminiService';
import { Product, AppTab } from '../types';

interface AICommandCenterProps {
  products: Product[];
  addProduct: (p: any) => void;
  updateStock: (productId: string, qty: number, type: 'sale' | 'stock_in' | 'stock_out', entityId?: string, isPaid?: boolean, source?: 'direct' | 'remote') => void;
  setActiveTab: (tab: AppTab) => void;
  addContact: (c: any) => void;
}

const AICommandCenter: React.FC<AICommandCenterProps> = ({ products, addProduct, updateStock, setActiveTab, addContact }) => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        processCommand(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const processCommand = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', text }]);
    
    try {
      const context = { products: products.map(p => ({ id: p.id, name: p.name })) };
      const result = await parseAICommand(text, context);
      
      let aiText = "Comando processado com sucesso!";

      if (result.action === 'ADD_PRODUCT') {
        addProduct(result.data);
        aiText = `Beleza! Acabei de cadastrar o produto "${result.data.name}" no sistema.`;
      } else if (result.action === 'ADD_CONTACT') {
        addContact({ ...result.data, email: '', address: '' });
        const typeLabel = result.data.type === 'customer' ? 'cliente' : result.data.type === 'supplier' ? 'fornecedor' : 'funcionário';
        aiText = `OK! Adicionei "${result.data.name}" à sua lista de ${typeLabel}s.`;
      } else if (result.action === 'UPDATE_STOCK') {
        // Busca inteligente pelo nome aproximado
        const product = products.find(p => 
          p.id === result.data.productId || 
          p.name.toLowerCase().includes(result.data.name?.toLowerCase() || '')
        );

        if (product) {
          const qty = result.data.quantityChange;
          const type = qty < 0 ? 'stock_out' : (text.toLowerCase().includes('vendi') ? 'sale' : 'stock_in');
          
          updateStock(product.id, Math.abs(qty), type, undefined, true, 'direct');
          aiText = `Feito! Atualizei o estoque de "${product.name}". Operação: ${type === 'sale' ? 'Venda' : (type === 'stock_in' ? 'Entrada' : 'Saída')}.`;
        } else {
          aiText = "Não encontrei esse produto no cadastro. Verifique o nome ou cadastre-o primeiro.";
        }
      } else if (result.action === 'ERROR') {
        aiText = result.data.message || "Desculpe, não entendi muito bem. Pode repetir de outra forma?";
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Opa, tive um probleminha técnico aqui. Pode tentar de novo?" }]);
    } finally {
      setIsProcessing(false);
      setCommand('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden flex flex-col h-[600px]">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-2xl font-black italic tracking-tight flex items-center gap-3">
              <span className="animate-pulse">✨</span> Assistente Faciliza
            </h3>
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest opacity-80">Gestão por Voz e Texto</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-rose-400 animate-ping' : 'bg-indigo-400'}`}></div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-sm border border-slate-100 animate-bounce">💬</div>
              <h4 className="font-black text-slate-800 mb-2">Como posso ajudar hoje?</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[250px]">
                "Vendi 10 coxinhas hoje"<br/>
                "Chegaram 50 cocas do fornecedor"<br/>
                "Cadastre o cliente Paulo"
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-[1.8rem] text-sm font-bold shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white px-6 py-4 rounded-[1.8rem] border flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-indigo-300 transition-all">
            <button 
              onClick={toggleListening}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-lg shrink-0 ${
                isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-200' : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm border border-slate-100'
              }`}
            >
              {isListening ? '🛑' : '🎤'}
            </button>
            <input 
              type="text" 
              placeholder="Digite um comando aqui..."
              className="flex-1 bg-transparent px-4 py-2 outline-none font-black text-slate-700 text-sm placeholder:text-slate-300"
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && processCommand(command)}
            />
            <button 
              onClick={() => processCommand(command)}
              disabled={isProcessing || !command.trim()}
              className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl hover:bg-indigo-700 disabled:opacity-20 shadow-lg shadow-indigo-200 transition-all active:scale-90 shrink-0"
            >
              🚀
            </button>
          </div>
          <p className="text-center text-[8px] font-black text-slate-300 uppercase mt-4 tracking-widest">Tecnologia Gemini AI Ativa</p>
        </div>
      </div>
    </div>
  );
};

export default AICommandCenter;
