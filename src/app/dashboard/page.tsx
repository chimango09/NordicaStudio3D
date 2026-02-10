"use client";

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Wallet, ReceiptText, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useCollection, useUser } from '@/firebase';
import { useSettings } from '@/hooks/use-settings';
import type { Quote, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  revenue: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-2))',
  },
  expenses: {
    label: 'Gastos',
    color: 'hsl(var(--chart-5))',
  },
  netProfit: {
    label: 'Ganancia Neta',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user } = useUser();
  const { settings } = useSettings();

  const quotesPath = user ? `users/${user.uid}/quotes` : null;
  const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesPath);

  const expensesPath = user ? `users/${user.uid}/expenses` : null;
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesPath);
  
  const isLoading = isLoadingQuotes || isLoadingExpenses;

  const { metrics, monthlyData } = React.useMemo(() => {
    const deliveredQuotes = quotes?.filter(q => q.status === 'Entregado') || [];
    const totalRevenue = deliveredQuotes.reduce((sum, q) => sum + q.price, 0);
    
    const totalProductionCost = deliveredQuotes.reduce((sum, q) => {
      const cost = (q.materialCost || 0) + (q.machineCost || 0) + (q.electricityCost || 0);
      return sum + cost;
    }, 0);

    const grossProfit = totalRevenue - totalProductionCost;
    const totalOperationalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const netProfit = grossProfit - totalOperationalExpenses;

    const metrics = [
      {
        icon: DollarSign,
        title: "Ingresos Totales",
        value: `${settings.currency} ${totalRevenue.toFixed(2)}`,
        description: "Total de cotizaciones entregadas.",
        colorClass: "text-chart-2",
      },
      {
        icon: TrendingUp,
        title: "Ganancia Bruta",
        value: `${settings.currency} ${grossProfit.toFixed(2)}`,
        description: "Ingresos menos costos de producción.",
        colorClass: grossProfit >= 0 ? "text-chart-2" : "text-chart-5",
      },
      {
        icon: ReceiptText,
        title: "Gastos Operativos",
        value: `${settings.currency} ${totalOperationalExpenses.toFixed(2)}`,
        description: "Todos los gastos operativos registrados.",
        colorClass: "text-chart-5",
      },
      {
        icon: Wallet,
        title: "Ganancia Neta",
        value: `${settings.currency} ${netProfit.toFixed(2)}`,
        description: "Ganancia bruta menos gastos.",
        colorClass: netProfit >= 0 ? "text-chart-2" : "text-chart-5",
      },
    ];

    const monthlySummary: { [key: string]: { revenue: number, expenses: number, netProfit: number } } = {};

    deliveredQuotes.forEach(quote => {
      const month = new Date(quote.date).toLocaleString('default', { month: 'short' });
      if (!monthlySummary[month]) {
        monthlySummary[month] = { revenue: 0, expenses: 0, netProfit: 0 };
      }
      const productionCost = (quote.materialCost || 0) + (quote.machineCost || 0) + (quote.electricityCost || 0);
      monthlySummary[month].revenue += quote.price;
      monthlySummary[month].netProfit += (quote.price - productionCost);
    });

    expenses?.forEach(expense => {
      const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
      if (!monthlySummary[month]) {
        monthlySummary[month] = { revenue: 0, expenses: 0, netProfit: 0 };
      }
      monthlySummary[month].expenses += expense.amount;
      monthlySummary[month].netProfit -= expense.amount;
    });

    const chartData = Object.entries(monthlySummary).map(([name, values]) => ({
      name,
      ...values,
    }));
    
    const monthOrder = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    chartData.sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));

    return { metrics, monthlyData: chartData };
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
                <div className={`text-2xl font-bold ${metric.colorClass}`}>{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Resumen Financiero Mensual</CardTitle>
                <CardDescription>Un desglose de ingresos, gastos y ganancias netas por mes.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> : 
                <ChartContainer config={chartConfig} className="min-h-64 w-full">
                    <BarChart data={monthlyData} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="revenue" name="Ingresos" fill="var(--color-revenue)" radius={4} />
                        <Bar dataKey="expenses" name="Gastos" fill="var(--color-expenses)" radius={4} />
                        <Bar dataKey="netProfit" name="Ganancia Neta" fill="var(--color-netProfit)" radius={4} />
                    </BarChart>
                </ChartContainer>
                }
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Estado de Cotizaciones</CardTitle>
                <CardDescription>Una visión general del estado actual de tus cotizaciones.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> :
                 <div className="text-4xl font-bold">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                            <p className="text-3xl">{quotes?.filter(q => q.status === 'Pendiente').length || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Imprimiendo</p>
                            <p className="text-3xl">{quotes?.filter(q => q.status === 'Imprimiendo').length || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Entregadas</p>
                            <p className="text-3xl">{quotes?.filter(q => q.status === 'Entregado').length || 0}</p>
                        </div>
                    </div>
                </div>
                }
            </CardContent>
        </Card>
      </div>
    </>
  );
}
