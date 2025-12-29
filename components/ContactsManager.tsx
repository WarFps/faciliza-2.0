
import React, { useState, useMemo, useEffect } from 'react';
import { Contact, Transaction, TransactionStatus, Product, RawMaterial } from '../types';

interface ContactsManagerProps {
  contacts: Contact[];
  transactions: Transaction[];
  rawMaterials: RawMaterial[];
  addContact: (c: Omit<Contact, 'id'>) => void;
  deleteContact: (id: string) => void;
  addRawMaterial: (rm: Omit<RawMaterial, 'id'>) => RawMaterial;
  updateRawMaterial: (rm: RawMaterial) => void;
  deleteRawMaterial: (id: string) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus, partialAmount?: number) => void;
  canEdit: boolean;
}

const ContactsManager: React.FC<ContactsManagerProps> = ({ 
  contacts, 
  transactions, 
  rawMaterials, 
  addContact, 
  deleteContact,
  addRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  updateTransactionStatus, 
  canEdit 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMaterialManagerModal, setShowMaterialManagerModal] = useState(false);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [orderingContact, setOrderingContact] = useState<Contact | null>(null);
  
  // Estados de confirmação de exclusão padronizados
  const [confirmingContactId, setConfirmingContactId] = useState<string | null>(null);
  const [confirmingMaterialId, setConfirmingMaterialId] = useState<string | null>(null);

  const [orderItems, setOrderItems] = useState<Record<string, number>>({});
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'un', stockQuantity: 0 });
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false);

  const [filterType, setFilterType] = useState<'customer' | 'supplier' | 'employee'>('customer');
  const [newContact, setNewContact] = useState({ name: '', type: 'customer' as const, phone: '', email: '', address: '' });

  // Auto-resets para exclusão
  useEffect(() => {
    if (confirmingContactId) {
      const t = setTimeout(() => setConfirmingContactId(null), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmingContactId]);

  useEffect(() => {
    if (confirmingMaterialId) {
      const t = setTimeout(() => setConfirmingMaterialId(null), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmingMaterialId]);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    addContact(newContact);
    setNewContact({ name: '', type: 'customer', phone: '', email: '', address: '' });
    setShowModal(false);
  };

  const filteredContacts = contacts.filter(c => c.type === filterType);

  const handleCreateRawMaterial = () => {
    if (!newMaterial.name) return;
    addRawMaterial(newMaterial);
    setNewMaterial({ name: '', unit: 'un', stockQuantity: 0 });
    setShowNewMaterialForm(false);
  };

  const handleSaveMaterialEdit = () => {
    if (editingMaterial) {
      updateRawMaterial(editingMaterial);
      setEditingMaterial(null);
    }
  };

  // Funções de Exclusão "Equipe Style"
  const attemptDeleteContact = (id: string) => {
    if (confirmingContactId === id) {
      deleteContact(id);
      setConfirmingContactId(null);
    } else {
      setConfirmingContactId(id);
    }
  };

  const attemptDeleteMaterial = (id: string) => {
    if (confirmingMaterialId === id) {
      deleteRawMaterial(id);
      setConfirmingMaterialId(null);
    } else {
      setConfirmingMaterialId(id);
    }
  };

  const sendOrderToWhatsApp = () => {
    if (!orderingContact) return;
    const itemsToOrder = (Object.entries(orderItems) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const material = rawMaterials.find(m => String(m.id) === String(id));
        return `• ${material?.name}: ${qty} ${material?.unit}`;
      });

    if (itemsToOrder.length === 0) return alert("Informe as quantidades primeiro.");
    
    const msg = encodeURIComponent(`*Pedido de Insumos*\nOlá! Gostaria de pedir:\n\n${itemsToOrder.join('\n')}\n\nFavor confirmar. Obrigado!`);
    window.open(`https://wa.me/${orderingContact.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    setShowOrderModal(false);
    setOrderItems({});
  };

  const sendBillToWhatsApp = () => {
    if (!viewingContact) return;
    const pendingTransactions = transactions.filter(t => String(t.entityId) === String(viewingContact.id) && t.status !== 'paid' && t.status !== 'cancelled');
    const totalPending = pendingTransactions.reduce((acc, t) => acc + (t.totalValue - t.paidAmount), 0);

    if (pendingTransactions.length === 0) return alert("Não há dívidas pendentes.");

    const items = pendingTransactions.map(t => `• ${t.productName}: R$ ${(t.totalValue - t.paidAmount).toFixed(2)}`);
    const msg = encodeURIComponent(`*Extrato*\nOlá! Segue resumo da conta:\n\n${items.join('\n')}\n\n*Pendente: R$ ${totalPending.toFixed(2)}*`);
    window.open(`https://wa.me/${viewingContact.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
          {['customer', 'supplier', 'employee'].map(type => (
            <button key={type} onClick={() => setFilterType(type as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === type ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              {type === 'customer' ? 'Clientes' : type === 'supplier' ? 'Fornecedores' : 'Equipe'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMaterialManagerModal(true)} className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-100 border border-amber-200">🛠️ Insumos</button>
          {canEdit && <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700">+ Novo Cadastro</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group relative hover:border-indigo-200 transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-500 text-xl">{c.name.charAt(0)}</div>
              
              <button 
                type="button"
                onClick={() => attemptDeleteContact(c.id)} 
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  confirmingContactId === c.id 
                    ? 'bg-rose-600 text-white shadow-lg animate-pulse' 
                    : 'text-rose-400 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                {confirmingContactId === c.id ? 'Confirmar?' : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
            
            <h4 className="font-black text-lg text-slate-800 tracking-tight">{c.name}</h4>
            <div className="space-y-1 mb-6 mt-2 flex-grow">
              <p className="text-xs text-slate-500 font-medium italic">📞 {c.phone || 'Sem fone'}</p>
              {c.address && <p className="text-[10px] text-slate-400 leading-tight mt-1">📍 {c.address}</p>}
            </div>
            
            <div className="flex flex-col gap-2 mt-auto">
              {c.type === 'supplier' && <button onClick={() => { setOrderingContact(c); setShowOrderModal(true); }} className="w-full py-3 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors">🛒 Pedir Insumos</button>}
              {c.type !== 'employee' && <button onClick={() => setViewingContact(c)} className="w-full py-3 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-colors">Ver Histórico</button>}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL GESTÃO DE INSUMOS */}
      {showMaterialManagerModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[150] p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <h4 className="text-2xl font-black text-slate-800 italic tracking-tight">Estoque de Insumos</h4>
              <button onClick={() => setShowMaterialManagerModal(false)} className="text-slate-400 text-3xl hover:text-slate-600 p-2">✕</button>
            </div>

            <div className="mb-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shrink-0">
              <button onClick={() => setShowNewMaterialForm(!showNewMaterialForm)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700">
                {showNewMaterialForm ? 'Fechar Cadastro' : '+ Cadastrar Novo Insumo'}
              </button>
              {showNewMaterialForm && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                  <input className="sm:col-span-2 p-4 bg-white border border-indigo-100 rounded-2xl outline-none font-bold" placeholder="Nome do Insumo" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} />
                  <input className="p-4 bg-white border border-indigo-100 rounded-2xl text-center outline-none font-bold" placeholder="unidade" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} />
                  <button onClick={handleCreateRawMaterial} className="bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-xs">Adicionar</button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-6 pr-2">
              {rawMaterials.map(rm => (
                <div key={rm.id} className="p-5 bg-white border border-slate-100 rounded-[1.8rem] flex items-center justify-between hover:border-indigo-200 transition-all">
                  {editingMaterial?.id === rm.id ? (
                    <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                      <input className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-black" value={editingMaterial.name} onChange={e => setEditingMaterial({...editingMaterial, name: e.target.value})} />
                      <input type="number" className="w-28 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center font-black" value={editingMaterial.stockQuantity} onChange={e => setEditingMaterial({...editingMaterial, stockQuantity: parseFloat(e.target.value) || 0})} />
                      <div className="flex gap-2">
                        <button onClick={handleSaveMaterialEdit} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase">Salvar</button>
                        <button onClick={() => setEditingMaterial(null)} className="bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-black text-xs uppercase">Sair</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-black text-slate-800 text-lg tracking-tight">{rm.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Estoque: <span className="text-indigo-600">{rm.stockQuantity} {rm.unit}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingMaterial({...rm})} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] tracking-widest hover:bg-indigo-100 transition-colors">EDITAR</button>
                        <button 
                          type="button"
                          onClick={() => attemptDeleteMaterial(rm.id)} 
                          className={`px-6 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                            confirmingMaterialId === rm.id 
                              ? 'bg-rose-600 text-white shadow-lg animate-pulse' 
                              : 'bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white'
                          }`}
                        >
                          {confirmingMaterialId === rm.id ? 'Confirmar?' : 'EXCLUIR'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEDIDO WHATSAPP */}
      {showOrderModal && orderingContact && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start mb-8">
              <h4 className="text-3xl font-black text-slate-800 tracking-tight italic">Solicitar ao Fornecedor</h4>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-300 text-3xl hover:text-slate-500">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {rawMaterials.map(rm => (
                <div key={rm.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex justify-between items-center hover:border-emerald-200 transition-colors">
                  <p className="font-bold text-slate-700">{rm.name}</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center font-black outline-none focus:bg-white focus:border-emerald-400 transition-all" 
                      placeholder="0" 
                      value={orderItems[rm.id] || ''} 
                      onChange={e => setOrderItems({...orderItems, [rm.id]: parseFloat(e.target.value) || 0})} 
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase w-10">{rm.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-10 pt-8 border-t border-slate-50">
              <button onClick={() => setShowOrderModal(false)} className="flex-1 py-5 border border-slate-200 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Voltar</button>
              <button onClick={sendOrderToWhatsApp} className="flex-[2] py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">Enviar via WhatsApp 💬</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO / EXTRATO CLIENTE */}
      {viewingContact && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-2xl font-black text-slate-800 italic">Extrato: {viewingContact.name}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Resumo de compras</p>
              </div>
              <button onClick={() => setViewingContact(null)} className="text-slate-400 text-3xl hover:text-slate-600">✕</button>
            </div>

            <button onClick={sendBillToWhatsApp} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all mb-6">
              Enviar Cobrança via WhatsApp 💬
            </button>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {transactions.filter(t => String(t.entityId) === String(viewingContact.id)).length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic font-medium">Nenhuma movimentação encontrada.</div>
              ) : (
                transactions.filter(t => String(t.entityId) === String(viewingContact.id)).slice().reverse().map(t => (
                  <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center hover:bg-white transition-colors">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{t.productName}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-700">R$ {t.totalValue.toFixed(2)}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO CADASTRO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
            <h4 className="text-2xl font-black mb-8 italic text-slate-800 text-center tracking-tight">Novo Cadastro</h4>
            <form onSubmit={handleSubmitContact} className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {['customer', 'supplier', 'employee'].map(t => (
                  <button key={t} type="button" onClick={() => setNewContact({...newContact, type: t as any})} className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${newContact.type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
                    {t === 'customer' ? 'Cliente' : t === 'supplier' ? 'Forn.' : 'Equipe'}
                  </button>
                ))}
              </div>
              <input required placeholder="Nome Completo" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:border-indigo-400 transition-all" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
              <input required placeholder="Telefone / WhatsApp" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:border-indigo-400 transition-all" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
              <textarea placeholder="Endereço / Observações..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 h-28 focus:bg-white focus:border-indigo-400 transition-all" value={newContact.address} onChange={e => setNewContact({...newContact, address: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-50 transition-colors">Sair</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all tracking-widest">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsManager;
