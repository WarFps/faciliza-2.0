
export interface License {
  key: string;
  clientName: string;
  expiryDate: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockLimit: number;
  category: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  stockQuantity: number;
  unit: string; // kg, un, l, etc
}

export interface Contact {
  id: string;
  name: string;
  type: 'customer' | 'supplier' | 'employee';
  phone: string;
  email: string;
  address: string;
}

export type TransactionStatus = 'pending' | 'paid' | 'partial' | 'cancelled';

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'stock_in' | 'stock_out';
  source?: 'direct' | 'remote'; 
  locationName?: string;       
  staffNames?: string;        
  quantity: number;
  totalValue: number;
  totalCost: number;          
  paidAmount: number;
  status: TransactionStatus;
  date: string;
  entityId?: string; 
  isPaid?: boolean;  
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  pin: string; // Senha numérica para login
  isMaster?: boolean; 
  permissions: {
    viewDashboard: boolean;
    manageProducts: boolean;
    manageStock: boolean;
    manageContacts: boolean;
    manageRemoteSales: boolean;
    viewReports: boolean;
    manageTeam: boolean;
    useAI: boolean;
  };
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  PRODUCTS = 'products',
  STOCK = 'stock',
  CONTACTS = 'contacts',
  REPORTS = 'reports',
  TEAM = 'team',
  REMOTE_SALES = 'remote_sales',
  AI_COMMAND = 'ai_command',
  LICENSE_GEN = 'license_generator'
}

export interface RemoteSaleItem {
  productId: string;
  name: string;
  costPrice: number;
  salePrice: number;
  quantityTaken: number;
  quantitySold: number;
}

export interface RemoteExpense {
  description: string;
  value: number;
}

export interface RemoteSaleSession {
  id: string;
  date: string;
  staffNames: string;
  status: 'open' | 'closed';
  items: RemoteSaleItem[];
  payments: {
    credit: number;
    debit: number;
    pix: number;
    cash: number;
  };
  expenses: number;
  expenseList?: RemoteExpense[];
  notes: string;
}

export interface RemoteSalePoint {
  id: string;
  name: string;
  sessions: RemoteSaleSession[];
}
