
import React, { useState, useMemo } from 'react';
import { Transaction, RemoteSalePoint } from '../types';

interface ReportSectionProps {
  transactions: Transaction[];
  canView: boolean;
  remotePoints: RemoteSalePoint[];
}

interface Stats {
  totalRevenue: number;
  totalProfit: number;
  directRevenue: number;
  remoteRevenue: number;
  remoteByLocation: Record<string, number>;
  performanceByStaff: Record<string, number>;
  count: number;
}

const ReportSection: React.FC<ReportSectionProps> = ({ transactions, canView, remotePoints }) => {
  const [filterDate, setFilterDate] = useState<'day' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'direct' | 'remote'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    let data = transactions;
    
    // Filtro de Data
    if (filterDate !== 'all') {
      const now = new Date();
      data = data.filter(t => {
        const tDate = new Date(t.date);
        if (filterDate === 'day') return tDate.toDateString() === now.toDateString();
        if (filterDate === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return tDate >= weekAgo;
        }
        if (filterDate === 'month') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        if (filterDate === 'custom') {
          const start = startDate ? new Date(startDate + 'T00:00:00') : null;
          const end = endDate ? new Date(endDate + 'T23:59:59') : null;
          if (start && end) return tDate >= start && tDate <= end;
          if (start) return tDate >= start;
          if (end) return tDate <= end;
        }
        return true;
      });
    }

    // Filtro de Origem (Essencial para não misturar Loja com Remoto)
    if (sourceFilter !== 'all') {
      data = data.filter(t => t.source === sourceFilter);
    }

    // Filtro de Localização Individual (Caso queira ver só um carrinho/evento específico)
    if (locationFilter !== 'all') {
      data = data.filter(t => t.locationName === locationFilter);
    }

    return data;
  }, [transactions, filterDate, sourceFilter, locationFilter, startDate, endDate]);

  const stats = useMemo<Stats>(() => {
    // Apenas transações do tipo venda que não foram canceladas
    const sales = filteredData.filter(t => t.type === 'sale' && t.status !== 'cancelled');
    
    const totalRevenue = sales.reduce((acc, t) => acc + t.totalValue, 0);
    const totalCost = sales.reduce((acc, t) => acc + (t.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;

    const directSales = sales.filter(t => t.source === 'direct');
    const directRevenue = directSales.reduce((acc, t) => acc + t.totalValue, 0);

    const remoteSales = sales.filter(t => t.source === 'remote');
    const remoteRevenue = remoteSales.reduce((acc, t) => acc + t.totalValue, 0);

    const remoteByLocation: Record<string, number> = {};
    const performanceByStaff: Record<string, number> = {};

    remoteSales.forEach(t => {
      if (t.locationName) {
        remoteByLocation[t.locationName] = (remoteByLocation[t.locationName] || 0) + t.totalValue;
      }
      if (t.staffNames) {
        performanceByStaff[t.staffNames] = (performanceByStaff[t.staffNames] || 0) + t.totalValue;
      }
    });

    return { 
      totalRevenue, 
      totalProfit, 
      directRevenue, 
      remoteRevenue, 
      remoteByLocation,
      performanceByStaff,
      count: sales.length 
    };
  }, [filteredData]);

  if (!canView) return <div className="p-20 text-center bg-white rounded-[2.5rem] border shadow-sm text-slate-400 font-bold italic">Você não possui permissão para ver relatórios.</div>;

  return (
    <div className="space-y-8">
      {/* Filtros Inteligentes */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Período de Análise</h4>
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
              {['all', 'day', 'week', 'month', 'custom'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterDate(f as any)}
                  className={`whitespace-nowrap flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    filterDate === f ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'all' ? 'Tudo' : f === 'day' ? 'Hoje' : f === 'week' ? '7 Dias' : f === 'month' ? 'Mês' : 'Personalizado'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem das Vendas</h4>
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
              {[
                { id: 'all', label: 'Global', icon: '🌍' },
                { id: 'direct', label: 'Loja Física', icon: '🏪' },
                { id: 'remote', label: 'Remoto', icon: '📡' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSourceFilter(s.id as any);
                    if (s.id !== 'remote') setLocationFilter('all');
                  }}
                  className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                    sourceFilter === s.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seleção de Localização Específica */}
        {(sourceFilter === 'remote' || filterDate === 'custom') && (
          <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2">
            {filterDate === 'custom' && (
              <div className="flex-1 flex gap-2">
                <input type="date" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <input type="date" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            )}
            {sourceFilter === 'remote' && (
              <div className="flex-1">
                <select 
                  className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-700 outline-none"
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                >
                  <option value="all">TODOS OS PONTOS REMOTOS</option>
                  {remotePoints.map(p => (
                    <option key={p.id} value={p.name}>{p.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards de Resumo Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white relative overflow-hidden group transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 p-6 opacity-20 text-4xl">💰</div>
          <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Faturamento Total</p>
          <p className="text-4xl font-black italic">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-6 flex justify-between items-center text-[10px] font-black uppercase tracking-tighter text-indigo-200">
             <span>{stats.count} Vendas Realizadas</span>
             {locationFilter !== 'all' && <span className="bg-indigo-700 px-2 py-1 rounded">Filtro Ativo</span>}
          </div>
        </div>

        <div className="bg-emerald-500 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100 text-white relative overflow-hidden group transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 p-6 opacity-20 text-4xl">💎</div>
          <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Lucro Líquido</p>
          <p className="text-4xl font-black italic">R$ {stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] mt-6 font-black uppercase text-emerald-100 tracking-widest">Margem de {(stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0)}%</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center border-b-8 border-b-blue-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Vendas Loja</p>
          <p className="text-2xl font-black text-slate-800">R$ {stats.directRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${(stats.directRevenue / (stats.totalRevenue || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center border-b-8 border-b-amber-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Vendas Remotas</p>
          <p className="text-2xl font-black text-slate-800">R$ {stats.remoteRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${(stats.remoteRevenue / (stats.totalRevenue || 1)) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Detalhamento por Local */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
            <span className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-xl shadow-inner">🏆</span>
            Ganhos Individuais por Local
          </h4>
          <div className="space-y-4">
            {Object.entries(stats.remoteByLocation).length > 0 ? (
              (Object.entries(stats.remoteByLocation) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([name, val], idx) => (
                <div key={name} className={`flex justify-between items-center p-5 rounded-[1.8rem] transition-all border ${locationFilter === name ? 'bg-indigo-50 border-indigo-200 shadow-md ring-2 ring-indigo-50' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</span>
                    <div>
                      <p className="text-sm font-black text-slate-700 leading-tight">{name}</p>
                      {locationFilter === name && <p className="text-[8px] text-indigo-500 font-black uppercase mt-0.5">Filtro selecionado</p>}
                    </div>
                  </div>
                  <p className="font-black text-indigo-600 text-lg italic">R$ {val.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 italic text-sm font-medium bg-slate-50 rounded-3xl border border-dashed">
                Aguardando dados de vendas remotas para este período.
              </div>
            )}
          </div>
        </div>

        {/* Extrato em Tempo Real */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center shrink-0">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Extrato de Movimentações</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Dados brutos filtrados</p>
            </div>
            <span className="text-[10px] bg-indigo-50 px-4 py-2 rounded-xl font-black text-indigo-600 uppercase shadow-sm border border-indigo-100">{filteredData.length} Itens</span>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[500px] scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest z-10">
                <tr>
                  <th className="px-6 py-4">Data / Local</th>
                  <th className="px-6 py-4">Mercadoria</th>
                  <th className="px-6 py-4 text-right">Faturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredData.slice().reverse().map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${t.source === 'remote' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                        <p className={`text-[9px] font-black uppercase tracking-tighter ${t.source === 'remote' ? 'text-amber-600' : 'text-blue-600'}`}>
                          {t.locationName || (t.source === 'remote' ? 'Ponto Remoto' : 'Loja Física')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-slate-700">{t.productName}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Qtd: {t.quantity}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-xs font-black text-slate-900 italic">R$ {t.totalValue.toFixed(2)}</p>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${t.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        {t.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-20 text-center text-slate-300 italic text-sm font-medium">Nenhum registro para exibir com os filtros atuais.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSection;
