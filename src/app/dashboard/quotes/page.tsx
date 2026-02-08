"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DUMMY_QUOTES,
  DUMMY_CLIENTS,
  DUMMY_FILAMENTS,
  DUMMY_SETTINGS,
} from "@/lib/placeholder-data";
import type { Quote } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";

export default function QuotesPage() {
  const [quotes, setQuotes] = React.useState<Quote[]>(DUMMY_QUOTES);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    filamentId: "",
    filamentUsed: 0,
    printTime: 0,
  });
  const [calculatedPrice, setCalculatedPrice] = React.useState(0);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement> | string, fieldName?: string) => {
    if (typeof e === "string") {
        setFormValues(prev => ({...prev, filamentId: e}));
    } else {
        const { name, value } = e.target;
        setFormValues(prev => ({...prev, [name]: Number(value)}));
    }
  };

  React.useEffect(() => {
    const { filamentId, filamentUsed, printTime } = formValues;
    const filament = DUMMY_FILAMENTS.find((f) => f.id === filamentId);

    if (filament && filamentUsed > 0 && printTime > 0) {
      const materialCost = (filament.pricePerKg / 1000) * filamentUsed;
      const machineCost = DUMMY_SETTINGS.machineCost * printTime;
      // Assuming simple energy calculation, replace with more accurate one if needed
      const electricityCost = DUMMY_SETTINGS.electricityCost * printTime * 0.2; // 0.2 kWh per hour avg.
      
      const totalCost = materialCost + machineCost + electricityCost;
      const finalPrice = totalCost * (1 + DUMMY_SETTINGS.profitMargin / 100);
      setCalculatedPrice(finalPrice);
    } else {
      setCalculatedPrice(0);
    }
  }, [formValues]);


  return (
    <>
      <PageHeader
        title="Herramienta de Cotización"
        description="Crea y gestiona cotizaciones para tus trabajos de impresión 3D."
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Lista de Cotizaciones</CardTitle>
                <CardDescription>Una lista de todas tus cotizaciones.</CardDescription>
            </div>
            <Button onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Cotización
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.id}</TableCell>
                  <TableCell>{quote.clientName}</TableCell>
                  <TableCell>{quote.date}</TableCell>
                  <TableCell>
                    <Badge variant={quote.status === 'Completado' ? 'default' : quote.status === 'Confirmado' ? 'secondary' : 'outline'}>
                        {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {DUMMY_SETTINGS.currency}
                    {quote.totalPrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Ver</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Crear Nueva Cotización</SheetTitle>
            <SheetDescription>
              Calcula el precio para un nuevo trabajo de impresión 3D.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">Cliente</Label>
              <Select name="client" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_CLIENTS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filament" className="text-right">Filamento</Label>
              <Select name="filament" required onValueChange={(val) => handleFormChange(val, "filamentId")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un filamento" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_FILAMENTS.map(f => <SelectItem key={f.id} value={f.id}>{f.name} - {f.color}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filamentUsed" className="text-right">Filamento (g)</Label>
              <Input id="filamentUsed" name="filamentUsed" type="number" className="col-span-3" onChange={handleFormChange} required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="printTime" className="text-right">Tiempo (horas)</Label>
              <Input id="printTime" name="printTime" type="number" className="col-span-3" onChange={handleFormChange} required />
            </div>
          </div>
          <div className="mt-4 rounded-lg border bg-card p-4">
            <h3 className="text-lg font-semibold">Precio Calculado</h3>
            <p className="text-3xl font-bold text-primary mt-2">
                {DUMMY_SETTINGS.currency}{calculatedPrice.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Basado en los costos configurados y el margen de beneficio.</p>
          </div>
          <SheetFooter className="mt-6">
            <Button type="submit" disabled={calculatedPrice <= 0}>Confirmar Cotización</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
