export interface Client {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Expense {
  date: string; 
  description: string;
  amount: number;
}

export interface Filament {
  name: string;
  color: string;
  stockLevel: number; // in grams
  costPerKg: number;
}

export interface Quote {
  clientId: string;
  clientName?: string; // Denormalized for display
  date: string; 
  description: string;
  filamentId: string;
  filamentUsedGrams: number;
  printingTimeHours: number;
  price: number;
  status: 'Pendiente' | 'Confirmado' | 'Completado';
}

export interface Setting {
    value: string;
}

export interface Settings {
    electricityCost: number;
    machineCost: number;
    profitMargin: number;
    currency: string;
}
