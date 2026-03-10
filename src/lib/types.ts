
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface Filament {
  id: string;
  name: string;
  color: string;
  colorHex?: string; // Hexadecimal color for visual representation
  stockLevel: number; // in grams
  costPerKg: number;
  spoolWeight?: number;
}

export interface Accessory {
  id: string;
  name: string;
  stockLevel: number;
  cost: number;
}

export interface QuoteMaterial {
  filamentId: string;
  grams: number;
}

export interface QuoteAccessory {
  accessoryId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  materials: QuoteMaterial[];
  accessories: QuoteAccessory[];
  printingTimeHours: number;
  price: number;
  materialCost: number;
  accessoryCost: number;
  machineCost: number;
  electricityCost: number;
  createdAt?: string;
}

export interface Quote {
  id:string;
  clientId: string;
  clientName?: string; // Denormalized for display
  date: string;
  description: string;
  materials: QuoteMaterial[];
  accessories: QuoteAccessory[];
  printingTimeHours: number;
  price: number;
  status: 'Pendiente' | 'Imprimiendo' | 'Entregado';
  materialCost: number;
  accessoryCost: number;
  machineCost: number;
  electricityCost: number;
}


export interface Setting {
    id: string;
    value: string;
}

export interface Settings {
    electricityCost: number;
    machineCost: number;
    printerConsumptionWatts: number;
    profitMargin: number;
    currency: string;
    companyName: string;
    companyResponsible: string;
    companyPhone: string;
    companyEmail: string;
    companyLocation: string;
    companyLogo?: string;
    backupReminderDays: number;
    // Bank details
    bankAlias: string;
    bankAccountName: string;
    bankName: string;
}

export interface TrashItem {
  id: string;
  originalId: string;
  originalCollection: string;
  deletedAt: string;
  data: any;
}
