
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface TeamManagementProps {
  users: User[];
  addUser: (u: Omit<User, 'id'>) => void;
  removeUser: (id: string) => void;
  currentUser: User;
  updatePermissions: (id: string, perms: User['permissions']) => void;
  canManage: boolean;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ users, addUser, removeUser, currentUser, updatePermissions, canManage }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>('employee');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (confirmingDeleteId) {
      const timer = setTimeout(() => setConfirmingDeleteId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingDeleteId]);

  if (!canManage) return <div className="p-10 text-center bg-white rounded-2xl border">Acesso restrito a gerenciamento de equipe.</div>;

  const togglePerm = (user: User, key: keyof User['permissions']) => {
    updatePermissions(user.id, {
      ...user.permissions,
      [key]: !user.permissions[key]
    });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || newUserPin.length < 4) return;

    addUser({
      name: newUserName,
      role: newUserRole,
      pin: newUserPin,
      permissions: {
        viewDashboard: true,
        manageProducts: newUserRole === 'admin',
        manageStock: true,
        manageContacts: true,
        manageRemoteSales: true,
        viewReports: newUserRole === 'admin',
        manageTeam: newUserRole === 'admin',
        useAI: true
      }
    });

    setNewUserName('');
    setNewUserPin('');
    setNewUserRole('employee');
    setShowAddModal(false);
  };

  const attemptRemoveUser = (userId: string) => {
    if (userId === currentUser.id) return;
    
    if (confirmingDeleteId === userId) {
      removeUser(userId);
      setConfirmingDeleteId(null);
    } else {
      setConfirmingDeleteId(userId);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black italic text-slate-800 tracking-tight">Controle de Colaboradores</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gerencie acessos e permissões da equipe</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          + Adicionar Membro
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {users.map(user => (
          <div key={user.id} className="p-8 flex flex-col gap-8 hover:bg-slate-50/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-100 rounded-[1.5rem] flex items-center justify-center font-black text-slate-500 text-xl shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-lg text-slate-800 tracking-tight">
                    {user.name} 
                    {user.id === currentUser.id && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-3 uppercase font-black">Você</span>
                    )}
                  </p>
                  <p className="text-[10px] text-indigo-600 uppercase font-black tracking-[0.2em]">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">PIN de Acesso</p>
                  <p className="text-xs font-mono font-bold text-slate-600">••••</p>
                </div>
                <button 
                  type="button"
                  onClick={() => attemptRemoveUser(user.id)}
                  disabled={user.id === currentUser.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                    user.id === currentUser.id 
                      ? 'opacity-20 cursor-not-allowed text-slate-300' 
                      : confirmingDeleteId === user.id
                        ? 'bg-rose-600 text-white shadow-lg animate-pulse'
                        : 'text-rose-400 bg-rose-50 hover:bg-rose-100'
                  }`}
                >
                  {confirmingDeleteId === user.id ? 'Confirmar?' : 'Remover'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PermissionToggle label="Painel" active={user.permissions.viewDashboard} onClick={() => togglePerm(user, 'viewDashboard')} />
              <PermissionToggle label="Produtos" active={user.permissions.manageProducts} onClick={() => togglePerm(user, 'manageProducts')} />
              <PermissionToggle label="Estoque" active={user.permissions.manageStock} onClick={() => togglePerm(user, 'manageStock')} />
              <PermissionToggle label="Contatos" active={user.permissions.manageContacts} onClick={() => togglePerm(user, 'manageContacts')} />
              <PermissionToggle label="Remoto" active={user.permissions.manageRemoteSales} onClick={() => togglePerm(user, 'manageRemoteSales')} />
              <PermissionToggle label="Relatórios" active={user.permissions.viewReports} onClick={() => togglePerm(user, 'viewReports')} />
              <PermissionToggle label="Equipe" active={user.permissions.manageTeam} onClick={() => togglePerm(user, 'manageTeam')} />
              <PermissionToggle label="IA (Voz)" active={user.permissions.useAI} onClick={() => togglePerm(user, 'useAI')} />
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
            <h4 className="text-3xl font-black text-slate-800 mb-8 italic text-center tracking-tight">Novo Colaborador</h4>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Maria Silva"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 transition-all font-bold text-slate-700"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Cargo</label>
                  <select 
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white font-bold text-slate-700"
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                  >
                    <option value="employee">Funcionário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">PIN (Senha)</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="1234"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white font-bold text-slate-700"
                    value={newUserPin}
                    onChange={e => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PermissionToggle = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
      active ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
    }`}
  >
    {label}
    <div className={`w-3 h-3 rounded-full transition-all ${active ? 'bg-indigo-600 shadow-lg scale-110' : 'bg-slate-300'}`}></div>
  </button>
);

export default TeamManagement;
