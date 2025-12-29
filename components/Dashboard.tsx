import { useMemo, useState, useEffect } from 'react';
import { Product, Transaction, RemoteSalePoint } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  remotePoints?: RemoteSalePoint[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, remotePoints = [] }) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const totalStock = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const stockValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);
  const sales = transactions.filter(t => t.type === 'sale');
  const revenue = sales.reduce((acc, t) => acc + t.totalValue, 0);

  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLimit);

  // Lógica de verificação de sessões abertas há mais de 24h
  const overdueSessions = useMemo(() => {
    const now = new Date().getTime();
    const dayInMs = 24 * 60 * 60 * 1000;
    return remotePoints.flatMap(point => 
      point.sessions
        .filter(s => s.status === 'open' && (now - new Date(s.date).getTime()) > dayInMs)
        .map(s => ({ pointName: point.name, date: s.date }))
    );
  }, [remotePoints]);

  const stockDistribution = products.map(p => ({
    name: p.name,
    qty: p.stockQuantity
  })).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const fetchAISuggestion = async () => {
    if (transactions.length === 0 || loadingSuggestion) return;
    setLoadingSuggestion(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise este histórico de vendas e estoque:
      Produtos em baixo estoque: ${JSON.stringify(lowStockProducts.map(p => ({name: p.name, qty: p.stockQuantity, min: p.minStockLimit})))}
      Vendas recentes: ${JSON.stringify(transactions.slice(-10).map(t => ({name: t.productName, qty: t.quantity})))}
      Com base nisso, sugira 2 produtos para reposição prioritária e por que em uma frase curta em Português.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setSuggestion(result.text || "Continue monitorando as vendas para mais sugestões.");
    } catch (e) {
      console.error(e);
      setSuggestion("Erro ao gerar sugestão de IA.");
    } finally {
      setLoadingSuggestion(false);
    }
  };

  useEffect(() => {
    fetchAISuggestion();
  }, [lowStockProducts.length]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Estoque Total" value={totalStock} icon="📦" color="bg-blue-500" />
        <StatCard title="Valor em Estoque" value={`R$ ${stockValue.toFixed(2)}`} icon="💰" color="bg-emerald-500" />
        <StatCard title="Vendas do Período" value={`R$ ${revenue.toFixed(2)}`} icon="📈" color="bg-indigo-500" />
        <StatCard title="Alertas Ativos" value={lowStockProducts.length + overdueSessions.length} icon="⚠️" color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Alertas Críticos
            </h3>
            <div className="space-y-3">
              {/* Overdue Sessions Alertas */}
              {overdueSessions.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100 animate-pulse">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-amber-800 uppercase">Caixa Pendente (Atrasado)</span>
                    <span className="text-sm font-bold text-amber-700">{s.pointName}</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-white px-2 py-1 rounded-lg">ABERTO EM {new Date(s.date).toLocaleDateString()}</span>
                </div>
              ))}

              {/* Low Stock Alertas */}
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-sm font-bold text-rose-800">{p.name}</span>
                  <span className="text-xs font-bold text-rose-600">Restam {p.stockQuantity} / Mín: {p.minStockLimit}</span>
                </div>
              ))}
              
              {lowStockProducts.length === 0 && overdueSessions.length === 0 && (
                <p className="text-center text-slate-400 py-10 text-sm italic">Tudo em conformidade!</p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2">
                <span className="text-lg animate-pulse">✨</span> Sugestão da IA
              </h3>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-800 italic leading-relaxed">
                {loadingSuggestion ? "Analisando histórico..." : suggestion || "Aguardando mais dados de vendas."}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6">Distribuição de Estoque</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Movimentações Críticas</h3>
            <div className="space-y-4">
              {transactions.slice(-4).reverse().map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b last:border-b-0 border-slate-50">
                  <div className="flex gap-3 items-center">
                    <div className={`w-2 h-2 rounded-full ${t.type === 'sale' ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                    <div>
                      <p className="font-medium text-sm">{t.productName}</p>
                      <p className="text-xs text-slate-400">{new Date(t.date).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${t.type === 'sale' ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {t.type === 'sale' ? '-' : '+'}{t.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-current/20 text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;