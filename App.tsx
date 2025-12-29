
import React, { useState, useEffect, useCallback } from 'react';
import { Product, Transaction, User, AppTab, Contact, TransactionStatus, RemoteSalePoint, RemoteSaleSession, RawMaterial, License } from './types';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import StockManager from './components/StockManager';
import ReportSection from './components/ReportSection';
import TeamManagement from './components/TeamManagement';
import AICommandCenter from './components/AICommandCenter';
import Sidebar from './components/Sidebar';
import ContactsManager from './components/ContactsManager';
import RemoteSales from './components/RemoteSales';
import LicensePortal from './components/LicensePortal';
import LicenseGenerator from './components/LicenseGenerator';
import LoginScreen from './components/LoginScreen';

// Único dado inicial é o usuário Master para permitir configurar o sistema
const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Dono Faciliza', 
    role: 'admin',
    pin: '0000', 
    isMaster: true,
    permissions: { 
      viewDashboard: true,
      manageProducts: true, 
      manageStock: true, 
      manageContacts: true,
      manageRemoteSales: true,
      viewReports: true, 
      manageTeam: true, 
      useAI: true
    } 
  },
];

const App: React.FC = () => {
  // Estados Principais
  const [license, setLicense] = useState<License | null>(null);
  const [isLicenseChecking, setIsLicenseChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);

  // Estados de Dados
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('faciliza_products');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem('faciliza_raw_materials');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('faciliza_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('faciliza_contacts');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('faciliza_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [remotePoints, setRemotePoints] = useState<RemoteSalePoint[]>(() => {
    const saved = localStorage.getItem('faciliza_remote_points');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistência automática
  useEffect(() => { localStorage.setItem('faciliza_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('faciliza_raw_materials', JSON.stringify(rawMaterials)); }, [rawMaterials]);
  useEffect(() => { localStorage.setItem('faciliza_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('faciliza_contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('faciliza_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('faciliza_remote_points', JSON.stringify(remotePoints)); }, [remotePoints]);

  // Validação de Licença
  useEffect(() => {
    const savedLicense = localStorage.getItem('faciliza_license');
    if (savedLicense) {
      try {
        const parsed: License = JSON.parse(savedLicense);
        const expiry = new Date(parsed.expiryDate);
        if (expiry > new Date()) {
          setLicense(parsed);
        } else {
          setLicense(null); 
        }
      } catch (e) {
        setLicense(null);
      }
    }
    setIsLicenseChecking(false);

    const savedUser = sessionStorage.getItem('faciliza_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const handleActivateLicense = (newLicense: License) => {
    localStorage.setItem('faciliza_license', JSON.stringify(newLicense));
    setLicense(newLicense);
  };

  const handleResetLicense = () => {
    if (window.confirm("Isso removerá a licença atual. Seus dados serão mantidos. Continuar?")) {
      localStorage.removeItem('faciliza_license');
      setLicense(null);
      setCurrentUser(null);
      sessionStorage.removeItem('faciliza_current_user');
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('faciliza_current_user', JSON.stringify(user));
    setActiveTab(AppTab.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('faciliza_current_user');
  };

  // Handlers de Dados
  const addProduct = useCallback((p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: Date.now().toString() };
    setProducts(prev => [...prev, newProduct]);
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => [...prev.filter(p => String(p.id) !== String(id))]);
  }, []);

  const addRawMaterial = useCallback((rm: Omit<RawMaterial, 'id'>) => {
    const newRM = { ...rm, id: 'rm-' + Date.now().toString() };
    setRawMaterials(prev => [...prev, newRM]);
    return newRM;
  }, []);

  const updateRawMaterial = useCallback((updated: RawMaterial) => {
    setRawMaterials(prev => prev.map(rm => String(rm.id) === String(updated.id) ? updated : rm));
  }, []);

  const deleteRawMaterial = useCallback((id: string) => {
    setRawMaterials(prev => [...prev.filter(rm => String(rm.id) !== String(id))]);
  }, []);

  const addContact = useCallback((c: Omit<Contact, 'id'>) => {
    const newContact = { ...c, id: Date.now().toString() };
    setContacts(prev => [...prev, newContact]);
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts(prev => [...prev.filter(c => String(c.id) !== String(id))]);
  }, []);

  const addUser = useCallback((u: Omit<User, 'id'>) => {
    const newUser = { ...u, id: Date.now().toString(), isMaster: false, pin: u.pin || '1234' }; 
    setUsers(prev => [...prev, newUser]);
  }, []);

  const removeUser = useCallback((userId: string) => {
    setUsers(prev => [...prev.filter(u => String(u.id) !== String(userId))]);
  }, []);

  const addRemotePoint = (name: string) => {
    const newPoint: RemoteSalePoint = { id: Date.now().toString(), name, sessions: [] };
    setRemotePoints(prev => [...prev, newPoint]);
  };

  const updateRemotePoint = (updatedPoint: RemoteSalePoint) => {
    setRemotePoints(prev => prev.map(p => String(p.id) === String(updatedPoint.id) ? updatedPoint : p));
  };

  // FUNÇÃO DE ESTOQUE MELHORADA
  const updateStock = useCallback((
    productId: string, 
    quantityChange: number, 
    type: 'sale' | 'stock_in' | 'stock_out' = 'stock_in', 
    entityId?: string, 
    isPaid: boolean = true,
    source: 'direct' | 'remote' = 'direct',
    locationName?: string,
    staffNames?: string
  ) => {
    setProducts(prev => prev.map(p => {
      if (String(p.id) === String(productId)) {
        // Se for uma 'sale' (venda), quantityChange já vem positivo representando a quantia vendida
        // Mas no cálculo de estoque, precisamos subtrair se for venda, ou somar se for entrada.
        // Se quantityChange vier negativo (como em stock_out), somamos o negativo.
        
        let finalQtyChange = quantityChange;
        if (type === 'sale') finalQtyChange = -Math.abs(quantityChange);
        
        const newQty = p.stockQuantity + finalQtyChange;
        const absQty = Math.abs(quantityChange);
        const totalVal = absQty * (type === 'sale' ? p.salePrice : p.costPrice);
        const totalCost = absQty * p.costPrice;

        const transaction: Transaction = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          productId: p.id,
          productName: p.name,
          type,
          source: source,
          locationName: locationName,
          staffNames: staffNames,
          quantity: absQty,
          totalValue: totalVal,
          totalCost: totalCost,
          paidAmount: type === 'sale' ? (isPaid ? totalVal : 0) : totalVal,
          status: type === 'sale' ? (isPaid ? 'paid' : 'pending') : 'paid',
          date: new Date().toISOString(),
          entityId,
          isPaid: type === 'sale' ? isPaid : true 
        };
        
        setTransactions(t => [...t, transaction]);
        return { ...p, stockQuantity: Math.max(0, newQty) };
      }
      return p;
    }));
  }, []);

  const updateTransactionStatus = useCallback((transactionId: string, newStatus: TransactionStatus, partialAmount?: number) => {
    setTransactions(prev => prev.map(t => {
      if (String(t.id) === String(transactionId)) {
        if (newStatus === 'cancelled' && t.status !== 'cancelled') {
          setProducts(prods => prods.map(p => 
            String(p.id) === String(t.productId) ? { ...p, stockQuantity: p.stockQuantity + (t.type === 'sale' ? t.quantity : -t.quantity) } : p
          ));
        }
        const updatedPaidAmount = newStatus === 'paid' ? t.totalValue : (newStatus === 'partial' ? (partialAmount ?? t.paidAmount) : (newStatus === 'cancelled' ? 0 : t.paidAmount));
        return { ...t, status: newStatus, paidAmount: updatedPaidAmount };
      }
      return t;
    }));
  }, []);

  const updatePermissions = useCallback((userId: string, perms: User['permissions']) => {
    setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, permissions: perms } : u));
  }, []);

  if (isLicenseChecking) return null; 
  if (!license) return <LicensePortal onActivate={handleActivateLicense} />;
  if (!currentUser) return <LoginScreen users={users} onLogin={handleLogin} onResetLicense={handleResetLicense} />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:p-8 lg:ml-64 overflow-y-auto">
        <header className="mb-8 mt-12 lg:mt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              {activeTab === AppTab.LICENSE_GEN ? 'Administração de Licenças' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
            </h1>
            <p className="text-xs md:text-sm text-slate-500">Gestão empresarial simplificada | Licença: <span className="text-indigo-600 font-bold">{license.clientName}</span></p>
          </div>
          <div className="text-right md:text-right w-full md:w-auto p-3 bg-white rounded-xl lg:bg-transparent lg:p-0">
             <p className="text-[10px] text-slate-400 font-black uppercase">Expira em</p>
             <p className="text-sm font-bold text-slate-700">{new Date(license.expiryDate).toLocaleDateString()}</p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto pb-20">
          {activeTab === AppTab.DASHBOARD && <Dashboard products={products} transactions={transactions} remotePoints={remotePoints} />}
          {activeTab === AppTab.PRODUCTS && <ProductList products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} canEdit={currentUser.permissions.manageProducts} />}
          {activeTab === AppTab.STOCK && <StockManager products={products} contacts={contacts} updateStock={updateStock} canEdit={currentUser.permissions.manageStock} />}
          {activeTab === AppTab.CONTACTS && (
            <ContactsManager 
              contacts={contacts} 
              rawMaterials={rawMaterials}
              addContact={addContact} 
              deleteContact={deleteContact}
              addRawMaterial={addRawMaterial}
              updateRawMaterial={updateRawMaterial}
              deleteRawMaterial={deleteRawMaterial}
              transactions={transactions} 
              updateTransactionStatus={updateTransactionStatus} 
              canEdit={currentUser.permissions.manageContacts} 
            />
          )}
          {activeTab === AppTab.REPORTS && <ReportSection transactions={transactions} canView={currentUser.permissions.viewReports} remotePoints={remotePoints} />}
          {activeTab === AppTab.REMOTE_SALES && <RemoteSales points={remotePoints} products={products} addPoint={addRemotePoint} updatePoint={updateRemotePoint} updateStock={updateStock} canViewProfit={currentUser.permissions.viewReports} setActiveTab={setActiveTab} />}
          {activeTab === AppTab.TEAM && <TeamManagement users={users} addUser={addUser} removeUser={removeUser} currentUser={currentUser} updatePermissions={updatePermissions} canManage={currentUser.permissions.manageTeam} />}
          {activeTab === AppTab.AI_COMMAND && <AICommandCenter products={products} addProduct={addProduct} updateStock={updateStock} setActiveTab={setActiveTab} addContact={addContact} />}
          {activeTab === AppTab.LICENSE_GEN && currentUser.isMaster && <LicenseGenerator />}
        </div>
      </main>
    </div>
  );
};

export default App;
