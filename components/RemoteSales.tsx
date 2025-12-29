
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RemoteSalePoint, RemoteSaleSession, Product, RemoteSaleItem, RemoteExpense, AppTab } from '../types';
import { parseFinancialVoice } from '../services/geminiService';

interface RemoteSalesProps {
  points: RemoteSalePoint[];
  products: Product[];
  addPoint: (name: string) => void;
  updatePoint: (point: RemoteSalePoint) => void;
  updateStock: (productId: string, qty: number, type: 'sale' | 'stock_in' | 'stock_out', entityId?: string, isPaid?: boolean, source?: 'direct' | 'remote', locationName?: string, staffNames?: string) => void;
  canViewProfit: boolean;
  setActiveTab: (tab: AppTab) => void;
}

const RemoteSales: React.FC<RemoteSalesProps> = ({ points, products, addPoint, updatePoint, updateStock, canViewProfit, setActiveTab }) => {
  const [showAddPointModal, setShowAddPointModal] = useState(false);
  const [newPointName, setNewPointName] = useState('');
  
  const [activeSessionPoint, setActiveSessionPoint] = useState<RemoteSalePoint | null>(null);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [viewingHistoryPoint, setViewingHistoryPoint] = useState<RemoteSalePoint | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [productSearch, setProductSearch] = useState('');

  // Voice IA State
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Local state for the "Open Session" modal
  const [sessionStaff, setSessionStaff] = useState('');
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});

  // Closing session state
  const [closingSession, setClosingSession] = useState<RemoteSaleSession | null>(null);
  const [closingPayments, setClosingPayments] = useState({ credit: 0, debit: 0, pix: 0, cash: 0 });
  
  // Detalhamento de despesas no fechamento
  const [closingExpensesList, setClosingExpensesList] = useState<RemoteExpense[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseVal, setNewExpenseVal] = useState(0);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceAnalysis(transcript);
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []); 

  const handleVoiceAnalysis = async (transcript: string) => {
    setIsProcessingVoice(true);
    try {
      const result = await parseFinancialVoice(transcript);
      if (result) {
        setClosingPayments(prev => ({
          credit: result.credit || prev.credit,
          debit: result.debit || prev.debit,
          pix: result.pix || prev.pix,
          cash: result.cash || prev.cash
        }));
        if (result.expenses > 0) {
          setClosingExpensesList(prev => [...prev, { description: 'Gasto Citado (IA)', value: result.expenses }]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const toggleVoiceCapture = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      setIsListening(true);
      try { recognitionRef.current?.start(); } catch (e) { setIsListening(false); }
    }
  };

  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPointName.trim()) return;
    addPoint(newPointName);
    setNewPointName('');
    setShowAddPointModal(false);
  };

  const openSession = (point: RemoteSalePoint) => {
    setActiveSessionPoint(point);
    setSessionStaff('');
    setLocalQuantities({}); 
    setProductSearch('');
    setShowOpenSessionModal(true);
  };

  const updateLocalQty = (productId: string, qty: number) => {
    setLocalQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const handleFinalOpen = () => {
    if (!activeSessionPoint || !sessionStaff) return;
    
    const sessionItems: RemoteSaleItem[] = (Object.entries(localQuantities) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          name: product?.name || 'Produto Removido',
          costPrice: product?.costPrice || 0,
          salePrice: product?.salePrice || 0,
          quantityTaken: qty,
          quantitySold: 0
        };
      });

    if (sessionItems.length === 0) {
      alert("Por favor, adicione pelo menos uma mercadoria para levar.");
      return;
    }

    const newSession: RemoteSaleSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      staffNames: sessionStaff,
      status: 'open',
      items: sessionItems,
      payments: { credit: 0, debit: 0, pix: 0, cash: 0 },
      expenses: 0,
      expenseList: [],
      notes: ''
    };

    sessionItems.forEach(item => {
      updateStock(item.productId, -item.quantityTaken, 'stock_out', undefined, true, 'remote', activeSessionPoint.name, sessionStaff);
    });

    updatePoint({ ...activeSessionPoint, sessions: [...activeSessionPoint.sessions, newSession] });
    setShowOpenSessionModal(false);
    setActiveSessionPoint(null);
  };

  const handleFinalClose = () => {
    if (!activeSessionPoint || !closingSession) return;

    closingSession.items.forEach(item => {
      const leftover = item.quantityTaken - item.quantitySold;
      if (leftover > 0) {
        updateStock(item.productId, leftover, 'stock_in', undefined, true, 'remote', activeSessionPoint.name, closingSession.staffNames);
      }
      if (item.quantitySold > 0) {
        updateStock(item.productId, item.quantitySold, 'sale', undefined, true, 'remote', activeSessionPoint.name, closingSession.staffNames);
      }
    });

    const totalExpenses = closingExpensesList.reduce((acc, e) => acc + e.value, 0);
    const updatedSession: RemoteSaleSession = {
      ...closingSession,
      status: 'closed',
      payments: closingPayments,
      expenses: totalExpenses,
      expenseList: closingExpensesList
    };

    const updatedSessions = activeSessionPoint.sessions.map(s => s.id === closingSession.id ? updatedSession : s);
    updatePoint({ ...activeSessionPoint, sessions: updatedSessions });
    setShowCloseSessionModal(false);
    setActiveSessionPoint(null);
    setClosingSession(null);
  };

  const calculateProfit = (session: RemoteSaleSession, payments: any, expenseList: RemoteExpense[]) => {
    const revenue = (Object.values(payments) as number[]).reduce((a, b) => a + b, 0);
    const cost = session.items.reduce((acc, item) => acc + (item.quantitySold * item.costPrice), 0);
    const totalExpenses = expenseList.reduce((acc, e) => acc + e.value, 0);
    return revenue - cost - totalExpenses;
  };

  const expectedRevenue = useMemo(() => {
    if (!closingSession) return 0;
    return closingSession.items.reduce((acc, item) => acc + (item.quantitySold * item.salePrice), 0);
  }, [closingSession]);

  const totalInformed = useMemo(() => (Object.values(closingPayments) as number[]).reduce((a, b) => a + b, 0), [closingPayments]);
  const totalExpensesSum = useMemo(() => closingExpensesList.reduce((acc, e) => acc + e.value, 0), [closingExpensesList]);
  const difference = totalInformed - expectedRevenue;

  const filteredHistory = useMemo(() => {
    if (!viewingHistoryPoint) return [];
    const sessions = viewingHistoryPoint.sessions.filter(s => s.status === 'closed');
    if (historyFilter === 'all') return sessions;
    const now = new Date();
    return sessions.filter(s => {
      const sDate = new Date(s.date);
      if (historyFilter === 'day') return sDate.toDateString() === now.toDateString();
      if (historyFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return sDate >= weekAgo;
      }
      if (historyFilter === 'month') return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [viewingHistoryPoint, historyFilter]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Pontos de Vendas Remotas</h3>
          <p className="text-sm text-slate-500">Gestão de carrinhos e quiosques externos.</p>
        </div>
        <button 
          onClick={() => setShowAddPointModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
        >
          + Novo Ponto de Venda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {points.map(point => {
          const activeSession = point.sessions.find(s => s.status === 'open');
          return (
            <div key={point.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${activeSession ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>📡</div>
                {activeSession ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase animate-pulse">Caixa Aberto</span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase">Indisponível</span>
                )}
              </div>
              <h4 className="text-xl font-bold mb-4">{point.name}</h4>
              <div className="mt-auto">
                {activeSession ? (
                  <button 
                    onClick={() => {
                      setActiveSessionPoint(point);
                      setClosingSession(activeSession);
                      setClosingPayments({ credit: 0, debit: 0, pix: 0, cash: 0 });
                      setClosingExpensesList([]);
                      setShowCloseSessionModal(true);
                    }}
                    className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-rose-600 transition-all"
                  >
                    Fechar Caixa
                  </button>
                ) : (
                  <button 
                    onClick={() => openSession(point)}
                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-all"
                  >
                    Abrir Novo Caixa
                  </button>
                )}
                {point.sessions.some(s => s.status === 'closed') && (
                  <button onClick={() => setViewingHistoryPoint(point)} className="w-full mt-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600">Ver Histórico</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ABRIR CAIXA - Onde você preenche a mercadoria inicial */}
      {showOpenSessionModal && activeSessionPoint && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl my-auto animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-black text-slate-800 mb-6 italic">Abrir Caixa: {activeSessionPoint.name}</h4>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Responsáveis</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                  placeholder="Ex: Ana e João"
                  value={sessionStaff}
                  onChange={e => setSessionStaff(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga Inicial de Mercadorias</label>
                  <input 
                    type="text"
                    placeholder="Buscar produto..."
                    className="p-2 bg-slate-100 rounded-lg text-xs outline-none border border-slate-200 w-40"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
                
                {products.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50">
                    <p className="text-sm font-bold text-slate-600 mb-4">Nenhum produto cadastrado!</p>
                    <button onClick={() => { setShowOpenSessionModal(false); setActiveTab(AppTab.PRODUCTS); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Ir para Cadastro</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center group hover:border-indigo-300 transition-all">
                        <div className="flex-1 mr-4">
                          <p className="text-xs font-black text-slate-800 leading-tight">{product.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black">Estoque: {product.stockQuantity}</p>
                        </div>
                        <input 
                          type="number" 
                          min="0"
                          max={product.stockQuantity}
                          className="w-16 p-2 bg-white border border-slate-300 rounded-xl text-center font-black text-sm focus:border-indigo-500 outline-none"
                          placeholder="0"
                          value={localQuantities[product.id] || ''}
                          onChange={e => updateLocalQty(product.id, Math.min(product.stockQuantity, Math.max(0, parseInt(e.target.value) || 0)))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button onClick={() => setShowOpenSessionModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                <button 
                  onClick={handleFinalOpen} 
                  disabled={!sessionStaff || products.length === 0 || Object.values(localQuantities).every(q => q === 0)} 
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30"
                >
                  Confirmar e Abrir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FECHAR CAIXA - Igual ao anterior, mas refinado */}
      {showCloseSessionModal && activeSessionPoint && closingSession && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-5xl shadow-2xl my-auto animate-in zoom-in-95 duration-200">
             {/* Conteúdo de fechamento idêntico ao anterior, garantindo funcionalidade IA */}
             <div className="flex justify-between items-center mb-8">
               <h4 className="text-2xl font-black italic">Fechar Caixa: {activeSessionPoint.name}</h4>
               <button onClick={() => setShowCloseSessionModal(false)} className="text-slate-400 text-2xl">✕</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* 1. Itens */}
               <div className="space-y-4">
                 <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Conferir Vendas</h5>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                   {closingSession.items.map((item, idx) => (
                     <div key={item.productId} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                       <div>
                         <p className="font-bold text-xs">{item.name}</p>
                         <p className="text-[9px] text-slate-400 uppercase font-black">Levou: {item.quantityTaken}</p>
                       </div>
                       <input 
                         type="number" 
                         className="w-14 p-2 bg-white border border-slate-300 rounded-xl text-center font-bold text-sm"
                         value={item.quantitySold || ''}
                         onChange={e => {
                           const newItems = [...closingSession.items];
                           newItems[idx].quantitySold = Math.min(item.quantityTaken, parseInt(e.target.value) || 0);
                           setClosingSession({ ...closingSession, items: newItems });
                         }}
                       />
                     </div>
                   ))}
                 </div>
               </div>
               {/* 2. Financeiro */}
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Recebidos</h5>
                   <button onClick={toggleVoiceCapture} className={`px-4 py-1.5 rounded-full text-[10px] font-black ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}>
                     {isListening ? 'ESCUTANDO...' : '✨ IA VOZ'}
                   </button>
                 </div>
                 <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl">
                    <PaymentInput label="Crédito" val={closingPayments.credit} setVal={v => setClosingPayments({...closingPayments, credit: v})} />
                    <PaymentInput label="Débito" val={closingPayments.debit} setVal={v => setClosingPayments({...closingPayments, debit: v})} />
                    <PaymentInput label="PIX" val={closingPayments.pix} setVal={v => setClosingPayments({...closingPayments, pix: v})} />
                    <PaymentInput label="Dinheiro" val={closingPayments.cash} setVal={v => setClosingPayments({...closingPayments, cash: v})} />
                 </div>
                 <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase">Diferença:</span>
                    <span className={`text-sm font-black ${difference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      R$ {difference.toFixed(2)}
                    </span>
                 </div>
               </div>
               {/* 3. Despesas */}
               <div className="space-y-4">
                 <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">3. Gastos do Dia</h5>
                 <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                   <div className="flex gap-2">
                     <input placeholder="Ex: Gelo" className="flex-1 p-2 bg-white border border-rose-200 rounded-lg text-xs font-bold" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} />
                     <input type="number" placeholder="R$" className="w-20 p-2 bg-white border border-rose-200 rounded-lg text-xs font-bold" value={newExpenseVal || ''} onChange={e => setNewExpenseVal(parseFloat(e.target.value) || 0)} />
                     <button onClick={() => { if(newExpenseDesc && newExpenseVal) { setClosingExpensesList([...closingExpensesList, {description: newExpenseDesc, value: newExpenseVal}]); setNewExpenseDesc(''); setNewExpenseVal(0); } }} className="bg-rose-500 text-white px-3 rounded-lg text-[10px] font-black">ADD</button>
                   </div>
                   <div className="space-y-1">
                     {closingExpensesList.map((ex, i) => <div key={i} className="flex justify-between text-[10px] font-bold text-rose-800"><span>• {ex.description}</span><span>R$ {ex.value.toFixed(2)}</span></div>)}
                   </div>
                 </div>
                 {canViewProfit && (
                   <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lucro Líquido</p>
                      <p className="text-3xl font-black italic">R$ {calculateProfit(closingSession, closingPayments, closingExpensesList).toFixed(2)}</p>
                   </div>
                 )}
               </div>
             </div>
             <div className="flex gap-4 mt-8 pt-8 border-t">
                <button onClick={() => setShowCloseSessionModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400">Voltar</button>
                <button onClick={handleFinalClose} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Confirmar e Encerrar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentInput = ({ label, val, setVal }: { label: string, val: number, setVal: (v: number) => void }) => (
  <div>
    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">{label}</label>
    <input 
      type="number" 
      step="0.01"
      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-black text-slate-700"
      value={val || ''}
      onChange={e => setVal(parseFloat(e.target.value) || 0)}
    />
  </div>
);

export default RemoteSales;
