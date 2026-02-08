"use client";

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, ReceiptText, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { collection } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSettings } from '@/hooks/use-settings';
import type { Quote, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { settings } = useSettings();

  const quotesCollection = useMemoFirebase(() => collection(firestore, "quotes"), [firestore]);
  const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesCollection);

  const expensesCollection = useMemoFirebase(() => collection(firestore, "expenses"), [firestore]);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesCollection);
  
  const isLoading = isLoadingQuotes || isLoadingExpenses;

  const metrics = React.useMemo(() => {
    const deliveredQuotes = quotes?.filter(q => q.status === 'Entregado') || [];
    const totalRevenue = deliveredQuotes.reduce((sum, q) => sum + q.price, 0);
    
    const totalProductionCost = deliveredQuotes.reduce((sum, q) => {
      const cost = (q.materialCost || 0) + (q.machineCost || 0) + (q.electricityCost || 0);
      return sum + cost;
    }, 0);

    const totalOperationalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const netProfit = totalRevenue - totalProductionCost - totalOperationalExpenses;

    return [
      {
        icon: DollarSign,
        title: "Ingresos Totales",
        value: `${settings.currency} ${totalRevenue.toFixed(2)}`,
        description: "Basado en cotizaciones entregadas.",
      },
      {
        icon: Package,
        title: "Costos de Producción",
        value: `${settings.currency} ${totalProductionCost.toFixed(2)}`,
        description: "Costo de cotizaciones entregadas.",
      },
      {
        icon: ReceiptText,
        title: "Gastos Operativos",
        value: `${settings.currency} ${totalOperationalExpenses.toFixed(2)}`,
        description: "Todos los gastos operativos registrados.",
      },
      {
        icon: TrendingUp,
        title: "Ganancia Neta",
        value: `${settings.currency} ${netProfit.toFixed(2)}`,
        description: "Ingresos - costos - gastos.",
      },
    ];
  }, [quotes, expenses, settings.currency]);


  return (
    <>
      <PageHeader
        title="Panel"
        description="Aquí tienes un resumen rápido de tu negocio de impresión 3D."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({length: 4}).map((_, index) => (
             <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-40 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Un registro de cotizaciones y gastos recientes.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-5 w-full" /> : 
                <p className="text-muted-foreground">
                  {quotes?.length || 0} cotizaciones y {expenses?.length || 0} gastos registrados.
                </p>
                }
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Cotizaciones Activas</CardTitle>
                <CardDescription>Cotizaciones pendientes o en impresión.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-5 w-full" /> :
                 <div className="text-4xl font-bold">
                  {quotes?.filter(q => q.status === 'Pendiente' || q.status === 'Imprimiendo').length || 0}
                </div>
                }
            </CardContent>
        </Card>
      </div>
    </>
  );
}
