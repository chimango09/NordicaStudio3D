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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { collection, doc } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Quote, Client, Filament } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type QuoteWithClientName = Quote & { clientName: string; id: string };

export default function QuotesPage() {
  const firestore = useFirestore();
  const { settings } = useSettings();

  const quotesCollection = useMemoFirebase(() => collection(firestore, "quotes"), [firestore]);
  const { data: quotesData, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesCollection);

  const clientsCollection = useMemoFirebase(() => collection(firestore, "clients"), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const filamentsCollection = useMemoFirebase(() => collection(firestore, "filaments"), [firestore]);
  const { data: filaments, isLoading: isLoadingFilaments } = useCollection<Filament>(filamentsCollection);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedQuote, setSelectedQuote] = React.useState<QuoteWithClientName | null>(null);

  const [formValues, setFormValues] = React.useState({
    clientId: "",
    filamentId: "",
    filamentUsedGrams: 0,
    printingTimeHours: 0,
    description: ""
  });
  const [calculatedPrice, setCalculatedPrice] = React.useState(0);
  const [costs, setCosts] = React.useState({
    materialCost: 0,
    machineCost: 0,
    electricityCost: 0,
  });
  
  const isLoading = isLoadingQuotes || isLoadingClients || isLoadingFilaments;

  const handleFormChange = (value: string, name: string) => {
     setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormValues(prev => ({...prev, [name]: parseFloat(value) || value}));
  }

  React.useEffect(() => {
    const { filamentId, filamentUsedGrams, printingTimeHours } = formValues;
    const filament = filaments?.find((f) => f.id === filamentId);

    if (filament && filamentUsedGrams > 0 && printingTimeHours > 0) {
      const materialCost = (filament.costPerKg / 1000) * filamentUsedGrams;
      const machineCost = settings.machineCost * printingTimeHours;
      const electricityCost = (settings.printerConsumptionWatts / 1000) * printingTimeHours * settings.electricityCost;
      
      const totalCost = materialCost + machineCost + electricityCost;
      const finalPrice = totalCost * (1 + settings.profitMargin / 100);
      const roundedPrice = Math.round(finalPrice / 100) * 100;

      setCosts({ materialCost, machineCost, electricityCost });
      setCalculatedPrice(roundedPrice);
    } else {
      setCalculatedPrice(0);
      setCosts({ materialCost: 0, machineCost: 0, electricityCost: 0 });
    }
  }, [formValues, filaments, settings]);

  const handleCreateQuote = () => {
    if (calculatedPrice <= 0 || !formValues.clientId || !formValues.filamentId) return;

    const quoteData = {
      ...formValues,
      price: calculatedPrice,
      status: 'Pendiente' as const,
      date: new Date().toISOString(),
      ...costs
    };
    addDocumentNonBlocking(quotesCollection, quoteData);
    
    // Update filament stock
    const filamentToUpdate = filaments?.find(f => f.id === formValues.filamentId);
    if (filamentToUpdate) {
        const filamentDoc = doc(firestore, "filaments", formValues.filamentId);
        const newStockLevel = filamentToUpdate.stockLevel - formValues.filamentUsedGrams;
        setDocumentNonBlocking(filamentDoc, { stockLevel: newStockLevel }, { merge: true });
    }

    setIsSheetOpen(false);
    setFormValues({
        clientId: "",
        filamentId: "",
        filamentUsedGrams: 0,
        printingTimeHours: 0,
        description: ""
    });
    setCosts({ materialCost: 0, machineCost: 0, electricityCost: 0 });
  }

  const handleDeleteQuote = (quoteId: string) => {
    const quoteToDelete = quotes.find(q => q.id === quoteId);

    if (quoteToDelete) {
        const filamentToRestore = filaments?.find(f => f.id === quoteToDelete.filamentId);
        if (filamentToRestore) {
            const filamentDoc = doc(firestore, "filaments", quoteToDelete.filamentId);
            const newStockLevel = filamentToRestore.stockLevel + quoteToDelete.filamentUsedGrams;
            setDocumentNonBlocking(filamentDoc, { stockLevel: newStockLevel }, { merge: true });
        }
    }
    
    const quoteDoc = doc(firestore, 'quotes', quoteId);
    deleteDocumentNonBlocking(quoteDoc);
  }

  const handleStatusChange = (quoteId: string, status: Quote['status']) => {
    const quoteDoc = doc(firestore, 'quotes', quoteId);
    setDocumentNonBlocking(quoteDoc, { status }, { merge: true });
  };
  
  const handleViewDetails = (quote: QuoteWithClientName) => {
    setSelectedQuote(quote);
    setIsDetailsOpen(true);
  };

  const quotes: QuoteWithClientName[] = React.useMemo(() => {
    return quotesData?.map(quote => ({
      ...quote,
      id: quote.id,
      clientName: clients?.find(c => c.id === quote.clientId)?.name || 'N/A'
    })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  }, [quotesData, clients])

  const getFilamentForQuote = (quote: Quote) => {
      return filaments?.find(f => f.id === quote.filamentId);
  }
  
  const calculateTotalCost = (quote: Quote) => (quote.materialCost || 0) + (quote.machineCost || 0) + (quote.electricityCost || 0);
  const calculateProfit = (quote: Quote) => quote.price - calculateTotalCost(quote);


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
              {isLoading && Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                    <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 ml-auto"/></TableCell>
                    <TableCell><Skeleton className="h-8 w-8"/></TableCell>
                </TableRow>
              ))}
              {!isLoading && quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.clientName}</TableCell>
                  <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={quote.status === 'Entregado' ? 'default' : quote.status === 'Imprimiendo' ? 'secondary' : 'outline'}>
                        {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {settings.currency}
                    {quote.price.toFixed(2)}
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
                        <DropdownMenuItem onClick={() => handleViewDetails(quote)}>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <span>Cambiar Estado</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Pendiente')}>Pendiente</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Imprimiendo')}>Imprimiendo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Entregado')}>Entregado</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => handleDeleteQuote(quote.id)} className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            {!isLoading && quotes.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">
                    No hay cotizaciones para mostrar.
                </div>
            )}
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
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select name="clientId" required onValueChange={(val) => handleFormChange(val, "clientId")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" placeholder="Descripción del trabajo..." onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filament">Filamento</Label>
              <Select name="filamentId" required onValueChange={(val) => handleFormChange(val, "filamentId")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un filamento" />
                </SelectTrigger>
                <SelectContent>
                  {filaments?.map(f => <SelectItem key={f.id} value={f.id}>{f.name} - {f.color}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="filamentUsedGrams">Filamento (g)</Label>
                    <Input id="filamentUsedGrams" name="filamentUsedGrams" type="number" onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="printingTimeHours">Tiempo (horas)</Label>
                    <Input id="printingTimeHours" name="printingTimeHours" type="number" onChange={handleInputChange} required />
                </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg border bg-card p-4">
            <h3 className="text-lg font-semibold">Precio Calculado</h3>
            <p className="text-3xl font-bold text-primary mt-2">
                {settings.currency}{calculatedPrice.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Basado en los costos configurados y el margen de beneficio.</p>
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" onClick={handleCreateQuote} disabled={calculatedPrice <= 0 || !formValues.clientId || !formValues.filamentId}>
                Confirmar Cotización
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
            {selectedQuote && (
                <>
                <DialogHeader>
                    <DialogTitle>Detalles de la Cotización</DialogTitle>
                    <DialogDescription>
                        Desglose de costos y ganancias para la cotización de {selectedQuote.clientName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium">Resumen</h4>
                        <p className="text-sm text-muted-foreground">{selectedQuote.description || "Sin descripción."}</p>
                    </div>
                    <Separator/>
                    <div className="grid gap-2">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Filamento</span>
                            <span>{getFilamentForQuote(selectedQuote)?.name} ({getFilamentForQuote(selectedQuote)?.color})</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Precio de Venta</span>
                            <span className="font-bold">{settings.currency}{selectedQuote.price.toFixed(2)}</span>
                        </div>
                    </div>
                    <Separator/>
                     <div>
                        <h4 className="font-medium">Desglose de Costos</h4>
                         <div className="grid gap-2 mt-2">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Costo de Material</span>
                                <span>{settings.currency}{(selectedQuote.materialCost || 0).toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Costo de Máquina</span>
                                <span>{settings.currency}{(selectedQuote.machineCost || 0).toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Costo de Electricidad</span>
                                <span>{settings.currency}{(selectedQuote.electricityCost || 0).toFixed(2)}</span>
                            </div>
                              <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                                <span>Costo Total</span>
                                <span>{settings.currency}{calculateTotalCost(selectedQuote).toFixed(2)}</span>
                            </div>
                        </div>
                     </div>
                     <Separator/>
                     <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Ganancia</span>
                        <span>{settings.currency}{calculateProfit(selectedQuote).toFixed(2)}</span>
                    </div>
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
