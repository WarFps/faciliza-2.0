
import React, { useState, useEffect } from 'react';
import { License } from '../types';

interface LicensePortalProps {
  onActivate: (license: License) => void;
}

const LicensePortal: React.FC<LicensePortalProps> = ({ onActivate }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('faciliza_license');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (new Date(parsed.expiryDate) < new Date()) {
          setIsExpired(true);
        }
      } catch (e) {}
    }
  }, []);

  const validateKey = (key: string) => {
    try {
      // Lógica de validação simulada: NOME|YYYY-MM-DD|HASH
      const parts = key.split('|');
      if (parts.length !== 3) throw new Error("Formato de chave inválido.");
      
      const [name, expiry, hash] = parts;
      
      // Validação básica de data
      const expiryDate = new Date(expiry);
      const now = new Date();
      
      if (isNaN(expiryDate.getTime())) throw new Error("Data de expiração inválida.");
      if (expiryDate < now) throw new Error("Esta licença já expirou.");
      if (hash !== "FACILIZA-99") throw new Error("Assinatura de segurança inválida.");

      return {
        key,
        clientName: name,
        expiryDate: expiry,
        isActive: true
      };
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validLicense = validateKey(keyInput.trim());
    if (validLicense) {
      onActivate(validLicense);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[200]">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 relative overflow-hidden group transition-all duration-700 ${isExpired ? 'bg-rose-600 shadow-rose-500/20' : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-12 h-12 z-10">
              <circle cx="12" cy="12" r="9" opacity="0.3" fill="white" />
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">Faciliza</h1>
          <p className={`text-sm font-black uppercase tracking-widest ${isExpired ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
            {isExpired ? 'Licença Expirada!' : 'Ativação de Software'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          {isExpired && (
            <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-[10px] text-rose-200 font-bold uppercase tracking-widest leading-relaxed text-center">
              Seus dados estão seguros! <br/> Insira uma nova chave para continuar operando.
            </div>
          )}
          
          <form onSubmit={handleActivate} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 ml-1">Chave de Ativação</label>
              <input 
                type="text" 
                placeholder="Insira a nova chave aqui..."
                className="w-full bg-white/10 border border-white/10 rounded-2xl p-5 text-white font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs font-bold text-center animate-shake">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              {isExpired ? 'Renovar Licença' : 'Ativar Sistema'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              O Faciliza mantém seus dados salvos localmente.<br/>
              A expiração apenas bloqueia o acesso às funções.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensePortal;
