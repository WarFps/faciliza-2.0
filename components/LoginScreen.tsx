
import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onResetLicense: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin, onResetLicense }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (selectedUser && selectedUser.pin === pin) {
      onLogin(selectedUser);
    } else {
      setError('PIN incorreto. Tente novamente.');
      setPin('');
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-6 z-[180]">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 mx-auto mb-4">
             <span className="text-2xl text-white">👤</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 italic tracking-tight">Faciliza Gestão</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Acesso ao Sistema</p>
        </div>

        {!selectedUser ? (
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
              {users.map(user => (
                <button 
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-xl font-black text-slate-400 mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {user.name.charAt(0)}
                  </div>
                  <p className="font-black text-slate-700 text-sm mb-1">{user.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{user.role}</p>
                  {user.isMaster && <span className="mt-2 text-[8px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase">Dono</span>}
                </button>
              ))}
            </div>

            <div className="text-center border-t border-slate-200 pt-8">
              <button 
                onClick={onResetLicense}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                ⚙️ Alterar Chave de Licença
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
              {selectedUser.isMaster && <div className="absolute top-0 right-0 p-4"><span className="text-amber-400 text-xl">👑</span></div>}
              
              <button onClick={() => setSelectedUser(null)} className="text-[10px] font-black uppercase text-slate-400 mb-6 hover:text-indigo-600 transition-colors">← Trocar Usuário</button>
              
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-6 shadow-xl shadow-indigo-100">
                {selectedUser.name.charAt(0)}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-1">{selectedUser.name}</h3>
              <p className="text-[10px] text-indigo-600 uppercase font-black mb-10 tracking-widest">{selectedUser.role}</p>

              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Digite seu PIN</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    placeholder="••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-center text-2xl tracking-[1em] font-black outline-none focus:border-indigo-500 transition-all"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {error && (
                  <p className="text-rose-500 text-xs font-bold">{error}</p>
                )}

                <button 
                  type="submit"
                  disabled={pin.length < 4}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-20"
                >
                  Entrar no Sistema
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
