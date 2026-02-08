import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

const metrics = [
  {
    icon: DollarSign,
    title: "Ingresos Totales",
    value: "ARS$ 45,231.89",
    change: "+20.1% desde el mes pasado",
    color: "text-green-500",
  },
  {
    icon: ReceiptText,
    title: "Gastos Totales",
    value: "ARS$ 12,874.21",
    change: "+15.3% desde el mes pasado",
    color: "text-red-500",
  },
  {
    icon: DollarSign,
    title: "Beneficio Total",
    value: "ARS$ 32,357.68",
    change: "+22.4% desde el mes pasado",
    color: "text-green-500",
  },
  {
    icon: Package,
    title: "Cotizaciones Activas",
    value: "12",
    change: "+5 desde la semana pasada",
    color: "text-blue-500",
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Panel"
        description="Aquí tienes un resumen rápido de tu negocio de impresión 3D."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Un registro de cotizaciones recientes e impresiones completadas.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No hay actividad reciente para mostrar.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Niveles de Stock de Filamento</CardTitle>
                <CardDescription>Un resumen de tu inventario actual.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Los niveles de inventario son estables.</p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
