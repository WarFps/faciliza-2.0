
import React, { useState } from 'react';

const LicenseGenerator: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!clientName || !expiryDate) return;
    
    // Formato da Chave: NOME|DATA|FACILIZA-99
    const key = `${clientName.trim()}|${expiryDate}|FACILIZA-99`;
    setGeneratedKey(key);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border-l-8 border-indigo-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">
            🔑
          </div>
          <div>
            <h3 className="text-2xl font-black italic tracking-tight">Gerador de Licenças</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Painel do Desenvolvedor</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">Nome do Cliente / Empresa</label>
              <input 
                type="text"
                placeholder="Ex: Padaria do João"
                className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">Válido Até (Expiração)</label>
              <input 
                type="date"
                className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!clientName || !expiryDate}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            Gerar Chave de Licença Comercial
          </button>

          {generatedKey && (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4">
              <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 ml-1">Chave Gerada (Envie para o cliente)</label>
              <div className="flex gap-2">
                <input 
                  readOnly
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-emerald-400 font-mono text-sm"
                  value={generatedKey}
                />
                <button 
                  onClick={copyToClipboard}
                  className={`px-8 rounded-2xl font-black text-[10px] uppercase transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="mt-4 text-[10px] text-slate-500 italic text-center">
                Instrução: Peça para o cliente colar este código na tela de ativação do Faciliza.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
        <div className="text-2xl mt-1">💡</div>
        <div>
          <h4 className="font-black text-indigo-900 text-sm uppercase tracking-tight mb-1">Como vender?</h4>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Você pode vender assinaturas mensais ou anuais. Quando o pagamento cair, você gera a chave com a data correspondente e envia para o cliente. Quando a data chegar, o sistema bloqueará o acesso dele automaticamente solicitando uma nova chave.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LicenseGenerator;
