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
  stockLevel: number; // in grams
  costPerKg: number;
}

export interface Quote {
  id: string;
  clientId: string;
  clientName?: string; // Denormalized for display
  date: string; 
  description: string;
  filamentId: string;
  filamentUsedGrams: number;
  printingTimeHours: number;
  price: number;
  status: 'Pendiente' | 'Imprimiendo' | 'Entregado';
  materialCost: number;
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
}
