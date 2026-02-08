export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Expense {
  id: string;
  name: string;
  category: 'Filamento' | 'Accesorio' | 'Otro';
  amount: number;
  date: string;
}

export interface Filament {
  id: string;
  name: string;
  color: string;
  material: string;
  initialStock: number; // in grams
  currentStock: number; // in grams
  pricePerKg: number;
}

export interface Quote {
  id: string;
  clientName: string;
  date: string;
  filamentUsed: number; // in grams
  printTime: number; // in hours
  totalPrice: number;
  status: 'Pendiente' | 'Confirmado' | 'Completado';
}
