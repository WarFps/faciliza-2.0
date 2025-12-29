
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  canEdit: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ products, addProduct, updateProduct, deleteProduct, canEdit }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    costPrice: 0, 
    salePrice: 0, 
    stockQuantity: 0, 
    minStockLimit: 5,
    category: '' 
  });

  useEffect(() => {
    if (confirmingDeleteId) {
      const timer = setTimeout(() => setConfirmingDeleteId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingDeleteId]);

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowModal(true);
  };

  const attemptDelete = (id: string) => {
    if (confirmingDeleteId === id) {
      deleteProduct(id);
      setConfirmingDeleteId(null);
    } else {
      setConfirmingDeleteId(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) updateProduct({ ...formData, id: editingProduct.id });
    else addProduct(formData);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 italic tracking-tight">Catálogo Geral de Mercadorias</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Controle de preços e quantidades em estoque</p>
        </div>
        {canEdit && <button onClick={() => { 
          setEditingProduct(null); 
          setFormData({ name: '', costPrice: 0, salePrice: 0, stockQuantity: 0, minStockLimit: 5, category: '' });
          setShowModal(true); 
        }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl hover:bg-indigo-700 transition-all">+ Novo Produto</button>}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b">
              <tr>
                <th className="px-6 py-5">Mercadoria</th>
                <th className="px-6 py-5 text-right">Preço Custo</th>
                <th className="px-6 py-5 text-right">Preço Venda</th>
                <th className="px-6 py-5 text-center">Estoque Atual</th>
                <th className="px-6 py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-700">{p.name}</td>
                  <td className="px-6 py-5 text-right text-slate-400 font-medium">R$ {p.costPrice.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right font-black text-indigo-600 italic">R$ {p.salePrice.toFixed(2)}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.stockQuantity <= p.minStockLimit ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                        {p.stockQuantity} un
                      </span>
                      {p.stockQuantity <= p.minStockLimit && <span className="text-[8px] font-black text-rose-400 mt-1 uppercase tracking-tighter">Reposição Urgente</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenEdit(p)} 
                        className="p-3 bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => attemptDelete(p.id)} 
                        className={`px-3 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                          confirmingDeleteId === p.id 
                            ? 'bg-rose-600 text-white shadow-lg animate-pulse' 
                            : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                        }`}
                      >
                        {confirmingDeleteId === p.id ? 'Sim?' : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic bg-white font-medium">
            Nenhuma mercadoria encontrada no sistema.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <h4 className="text-3xl font-black mb-10 italic tracking-tight text-slate-800">{editingProduct ? 'Ajustar Mercadoria' : 'Nova Mercadoria'}</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Nome do Item</label>
                <input required placeholder="Ex: Salgado de Frango" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-700 focus:bg-white focus:border-indigo-400 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Custo por Unid.</label>
                  <input required type="number" step="0.01" placeholder="R$ 0,00" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Venda por Unid.</label>
                  <input required type="number" step="0.01" placeholder="R$ 0,00" className="w-full p-5 bg-indigo-50 border-indigo-200 border rounded-2xl font-black text-indigo-600 outline-none focus:bg-white transition-all" value={formData.salePrice || ''} onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-black text-indigo-500 uppercase ml-2 mb-2 block tracking-widest">Estoque Inicial</label>
                  <input required type="number" placeholder="Ex: 50" className="w-full p-5 bg-white border border-indigo-100 rounded-2xl font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-400 transition-all" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-rose-400 uppercase ml-2 mb-2 block tracking-widest">Estoque Mínimo</label>
                  <input required type="number" placeholder="Ex: 10" className="w-full p-5 bg-white border border-rose-100 rounded-2xl font-black text-rose-500 outline-none focus:ring-2 focus:ring-rose-400 transition-all" value={formData.minStockLimit} onChange={e => setFormData({...formData, minStockLimit: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 border border-slate-200 rounded-2xl font-black text-xs uppercase text-slate-400 hover:bg-slate-50 tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar Mercadoria</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
