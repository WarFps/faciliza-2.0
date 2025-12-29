
import React, { useState } from 'react';
import { Product, Contact } from '../types';

interface StockManagerProps {
  products: Product[];
  contacts: Contact[];
  updateStock: (id: string, qty: number, type: 'stock_in' | 'stock_out' | 'sale', entityId?: string, isPaid?: boolean) => void;
  canEdit: boolean;
}

const StockManager: React.FC<StockManagerProps> = ({ products, contacts, updateStock, canEdit }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [qty, setQty] = useState(0);
  const [type, setType] = useState<'stock_in' | 'stock_out' | 'sale'>('stock_in');
  const [isPaid, setIsPaid] = useState(true);

  const handleUpdate = () => {
    if (!selectedProduct || qty === 0) return;
    const finalQty = (type === 'stock_in') ? qty : -qty;
    updateStock(selectedProduct, finalQty, type, selectedContact || undefined, isPaid);
    setQty(0);
    setSelectedContact('');
    setIsPaid(true);
  };

  if (!canEdit) return <div className="p-10 text-center bg-white rounded-2xl border">Você não tem permissão para gerenciar estoque.</div>;

  const relevantContacts = contacts.filter(c => 
    type === 'sale' ? c.type === 'customer' : c.type === 'supplier'
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold mb-6">Lançamento de Estoque</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Produto</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
              >
                <option value="">Escolher mercadoria...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Atual: {p.stockQuantity})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                {type === 'sale' ? 'Cliente' : type === 'stock_in' ? 'Fornecedor' : 'Entidade (Opcional)'}
              </label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedContact}
                onChange={e => setSelectedContact(e.target.value)}
              >
                <option value="">{type === 'sale' ? 'Venda Avulsa' : type === 'stock_in' ? 'Entrada Genérica' : 'Nenhum'}</option>
                {relevantContacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Quantidade</label>
              <input 
                type="number" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={qty || ''}
                onChange={e => setQty(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Operação</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={type}
                onChange={e => {
                  setType(e.target.value as any);
                  setSelectedContact('');
                }}
              >
                <option value="stock_in">Entrada (+)</option>
                <option value="stock_out">Ajuste / Perda (-)</option>
                <option value="sale">Venda (Saída)</option>
              </select>
            </div>
          </div>

          {type === 'sale' && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <input 
                type="checkbox" 
                id="isPaid" 
                className="w-5 h-5 accent-indigo-600"
                checked={isPaid}
                onChange={e => setIsPaid(e.target.checked)}
              />
              <label htmlFor="isPaid" className="text-sm font-bold text-slate-700">Venda foi paga? (Desmarque se for "fiado")</label>
            </div>
          )}

          <button 
            onClick={handleUpdate}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
              type === 'stock_in' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'
            }`}
          >
            Confirmar Operação
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-center border-l-8 border-indigo-500">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-4">Gestão Estratégica</h3>
          <p className="text-slate-300 leading-relaxed opacity-90 text-sm">
            Vincule cada venda a um <span className="text-indigo-400 font-bold italic underline">Cliente</span> para construir um histórico de preferência e fidelidade. 
            Vincule entradas a <span className="text-emerald-400 font-bold italic underline">Fornecedores</span> para rastrear a origem de seus produtos.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold">✨</div>
            <span className="text-xs text-slate-400">Dica: Use a IA para registrar vendas complexas rapidamente.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManager;
