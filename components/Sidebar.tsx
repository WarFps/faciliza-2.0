
import React, { useState } from 'react';
import { AppTab, User } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const tabs = [
    { id: AppTab.DASHBOARD, label: 'Painel', icon: '📊' },
    { id: AppTab.PRODUCTS, label: 'Produtos', icon: '📦' },
    { id: AppTab.STOCK, label: 'Estoque', icon: '🔄' },
    { id: AppTab.CONTACTS, label: 'Contatos', icon: '🤝' },
    { id: AppTab.REMOTE_SALES, label: 'Vendas Remota', icon: '📡' },
    { id: AppTab.REPORTS, label: 'Relatórios', icon: '📝' },
    { id: AppTab.TEAM, label: 'Equipe', icon: '👥' },
    { id: AppTab.AI_COMMAND, label: 'Assistente IA', icon: '✨' },
  ];

  const adminTools = [
    { id: AppTab.LICENSE_GEN, label: 'Gerador de Chaves', icon: '🔑' },
  ];

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-slate-900 text-white p-3 rounded-xl shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 shadow-xl z-[58] flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7 z-10">
              <circle cx="12" cy="12" r="9" opacity="0.3" fill="white" />
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
            Faciliza
          </h2>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          {user.isMaster && (
            <div className="pt-8 pb-2">
              <p className="px-4 text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 opacity-50">Ferramentas Master</p>
              {adminTools.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                    activeTab === tab.id 
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                      : 'text-slate-500 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="pt-6 shrink-0 border-t border-slate-800/50 mt-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black border border-white/10 shadow-inner">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold truncate leading-none mb-1">{user.name}</p>
                <p className="text-[9px] text-slate-500 uppercase font-black opacity-60 leading-none">{user.role}</p>
              </div>
              <button 
                onClick={onLogout}
                className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                title="Sair"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
