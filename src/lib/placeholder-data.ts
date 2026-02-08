import type { Client, Expense, Filament, Quote } from './types';

export const DUMMY_CLIENTS: Client[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890', address: '123 Main St, Anytown, USA' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '234-567-8901', address: '456 Oak Ave, Somecity, USA' },
  { id: '3', name: 'Maker Studio', email: 'contact@makerstudio.com', phone: '345-678-9012', address: '789 Pine Ln, Yourtown, USA' },
];

export const DUMMY_EXPENSES: Expense[] = [
  { id: '1', name: 'PLA Filament - Black', category: 'Filament', amount: 25.99, date: '2023-10-01' },
  { id: '2', name: 'Nozzle Cleaning Kit', category: 'Accessory', amount: 15.50, date: '2023-10-05' },
  { id: '3', name: 'PETG Filament - White', category: 'Filament', amount: 29.99, date: '2023-10-10' },
  { id: '4', name: 'Cloud Service Subscription', category: 'Other', amount: 10.00, date: '2023-10-15' },
];

export const DUMMY_FILAMENTS: Filament[] = [
  { id: '1', name: 'Prusament PLA', color: 'Galaxy Black', material: 'PLA', initialStock: 1000, currentStock: 750, pricePerKg: 29.99 },
  { id: '2', name: 'eSun PETG', color: 'Fire Engine Red', material: 'PETG', initialStock: 1000, currentStock: 450, pricePerKg: 24.99 },
  { id: '3', name: 'Overture TPU', color: 'Space Gray', material: 'TPU', initialStock: 500, currentStock: 500, pricePerKg: 32.99 },
  { id: '4', name: 'MatterHackers ABS', color: 'True Blue', material: 'ABS', initialStock: 1000, currentStock: 120, pricePerKg: 28.00 },
];

export const DUMMY_QUOTES: Quote[] = [
  { id: 'Q1001', clientName: 'John Doe', date: '2023-10-02', filamentUsed: 150, printTime: 8, totalPrice: 45.75, status: 'Completed' },
  { id: 'Q1002', clientName: 'Jane Smith', date: '2023-10-11', filamentUsed: 300, printTime: 16, totalPrice: 90.50, status: 'Confirmed' },
  { id: 'Q1003', clientName: 'Maker Studio', date: '2023-10-20', filamentUsed: 50, printTime: 2, totalPrice: 15.25, status: 'Pending' },
];

export const DUMMY_SETTINGS = {
  electricityCost: 0.15, // per kWh
  machineCost: 0.5, // per hour
  profitMargin: 30, // in percent
  currency: '$',
};
