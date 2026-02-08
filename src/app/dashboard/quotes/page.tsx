"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
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
import { collection, doc, increment } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Quote, Client, Filament, Accessory, QuoteMaterial, QuoteAccessory } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type QuoteWithClientName = Quote & { clientName: string; id: string };

type FormMaterial = QuoteMaterial & { key: number };
type FormAccessory = QuoteAccessory & { key: number };

export default function QuotesPage() {
  const firestore = useFirestore();
  const { settings } = useSettings();

  const quotesCollection = useMemoFirebase(() => collection(firestore, "quotes"), [firestore]);
  const { data: quotesData, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesCollection);

  const clientsCollection = useMemoFirebase(() => collection(firestore, "clients"), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const filamentsCollection = useMemoFirebase(() => collection(firestore, "filaments"), [firestore]);
  const { data: filaments, isLoading: isLoadingFilaments } = useCollection<Filament>(filamentsCollection);
  
  const accessoriesCollection = useMemoFirebase(() => collection(firestore, "accessories"), [firestore]);
  const { data: accessories, isLoading: isLoadingAccessories } = useCollection<Accessory>(accessoriesCollection);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedQuote, setSelectedQuote] = React.useState<QuoteWithClientName | null>(null);

  const [formValues, setFormValues] = React.useState({
    clientId: "",
    printingTimeHours: 0,
    description: "",
    materials: [] as FormMaterial[],
    accessories: [] as FormAccessory[],
  });
  const [itemKey, setItemKey] = React.useState(0);
  const [calculatedPrice, setCalculatedPrice] = React.useState(0);
  const [costs, setCosts] = React.useState({ materialCost: 0, accessoryCost: 0, machineCost: 0, electricityCost: 0 });
  
  const isLoading = isLoadingQuotes || isLoadingClients || isLoadingFilaments || isLoadingAccessories;

  const resetForm = () => {
    setFormValues({ clientId: "", printingTimeHours: 0, description: "", materials: [], accessories: [] });
    setCalculatedPrice(0);
    setCosts({ materialCost: 0, accessoryCost: 0, machineCost: 0, electricityCost: 0 });
  };

  const addMaterial = () => {
    setFormValues(prev => ({...prev, materials: [...prev.materials, {key: itemKey, filamentId: "", grams: 0}]}));
    setItemKey(k => k + 1);
  };
  const removeMaterial = (key: number) => setFormValues(prev => ({...prev, materials: prev.materials.filter(m => m.key !== key)}));
  const updateMaterial = (key: number, field: string, value: string | number) => {
    setFormValues(prev => ({...prev, materials: prev.materials.map(m => m.key === key ? {...m, [field]: value} : m)}));
  };
  
  const addAccessory = () => {
    setFormValues(prev => ({...prev, accessories: [...prev.accessories, {key: itemKey, accessoryId: "", quantity: 0}]}));
    setItemKey(k => k + 1);
  };
  const removeAccessory = (key: number) => setFormValues(prev => ({...prev, accessories: prev.accessories.filter(a => a.key !== key)}));
  const updateAccessory = (key: number, field: string, value: string | number) => {
    setFormValues(prev => ({...prev, accessories: prev.accessories.map(a => a.key === key ? {...a, [field]: value} : a)}));
  };

  React.useEffect(() => {
    const { materials, accessories, printingTimeHours } = formValues;
    const materialCost = materials.reduce((sum, mat) => {
      const filament = filaments?.find(f => f.id === mat.filamentId);
      return sum + (filament ? (filament.costPerKg / 1000) * mat.grams : 0);
    }, 0);

    const accessoryCost = accessories.reduce((sum, acc) => {
        const accessory = accessoriesData?.find(a => a.id === acc.accessoryId);
        return sum + (accessory ? accessory.cost * acc.quantity : 0);
    }, 0);

    if (printingTimeHours > 0) {
      const machineCost = settings.machineCost * printingTimeHours;
      const electricityCost = (settings.printerConsumptionWatts / 1000) * printingTimeHours * settings.electricityCost;
      
      const totalCost = materialCost + accessoryCost + machineCost + electricityCost;
      const finalPrice = totalCost * (1 + settings.profitMargin / 100);
      const roundedPrice = Math.round(finalPrice / 100) * 100;

      setCosts({ materialCost, accessoryCost, machineCost, electricityCost });
      setCalculatedPrice(roundedPrice);
    } else {
      setCalculatedPrice(0);
      setCosts({ materialCost, accessoryCost: 0, machineCost: 0, electricityCost: 0 });
    }
  }, [formValues, filaments, accessories, settings]);

  const handleCreateQuote = () => {
    if (calculatedPrice <= 0 || !formValues.clientId || formValues.materials.length === 0) return;

    const quoteData = {
      clientId: formValues.clientId,
      description: formValues.description,
      printingTimeHours: formValues.printingTimeHours,
      materials: formValues.materials.map(({key, ...rest}) => rest),
      accessories: formValues.accessories.map(({key, ...rest}) => rest),
      price: calculatedPrice,
      status: 'Pendiente' as const,
      date: new Date().toISOString(),
      ...costs
    };
    addDocumentNonBlocking(quotesCollection, quoteData);
    
    quoteData.materials.forEach(mat => {
        const filamentDoc = doc(firestore, "filaments", mat.filamentId);
        updateDocumentNonBlocking(filamentDoc, { stockLevel: increment(-mat.grams) });
    });
    quoteData.accessories.forEach(acc => {
        const accessoryDoc = doc(firestore, "accessories", acc.accessoryId);
        updateDocumentNonBlocking(accessoryDoc, { stockLevel: increment(-acc.quantity) });
    });

    setIsSheetOpen(false);
    resetForm();
  }

  const handleDeleteQuote = (quote: Quote) => {
    (quote.materials ?? []).forEach(mat => {
        const filamentDoc = doc(firestore, "filaments", mat.filamentId);
        updateDocumentNonBlocking(filamentDoc, { stockLevel: increment(mat.grams) });
    });
    (quote.accessories ?? []).forEach(acc => {
        const accessoryDoc = doc(firestore, "accessories", acc.accessoryId);
        updateDocumentNonBlocking(accessoryDoc, { stockLevel: increment(acc.quantity) });
    });
    
    const quoteDoc = doc(firestore, 'quotes', quote.id);
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
  
  const accessoriesData = accessories;
  
  const calculateTotalCost = (quote: Quote) => (quote.materialCost || 0) + (quote.accessoryCost || 0) + (quote.machineCost || 0) + (quote.electricityCost || 0);
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
                <TableHead>Cliente</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Total</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-6 w-20"/></TableCell><TableCell><Skeleton className="h-5 w-20 ml-auto"/></TableCell><TableCell><Skeleton className="h-8 w-8"/></TableCell></TableRow>
              ))}
              {!isLoading && quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.clientName}</TableCell>
                  <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant={quote.status === 'Entregado' ? 'default' : quote.status === 'Imprimiendo' ? 'secondary' : 'outline'}>{quote.status}</Badge></TableCell>
                  <TableCell className="text-right">{settings.currency}{quote.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(quote)}>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger><span>Cambiar Estado</span></DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Pendiente')}>Pendiente</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Imprimiendo')}>Imprimiendo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Entregado')}>Entregado</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => handleDeleteQuote(quote)} className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            {!isLoading && quotes.length === 0 && (<div className="py-10 text-center text-muted-foreground">No hay cotizaciones para mostrar.</div>)}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={(isOpen) => { setIsSheetOpen(isOpen); if (!isOpen) resetForm(); }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Crear Nueva Cotización</SheetTitle><SheetDescription>Calcula el precio para un nuevo trabajo de impresión 3D.</SheetDescription></SheetHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2"><Label htmlFor="client">Cliente</Label><Select required onValueChange={(val) => setFormValues(p => ({...p, clientId: val}))}><SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger><SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" placeholder="Descripción del trabajo..." onChange={(e) => setFormValues(p => ({...p, description: e.target.value}))} /></div>

            <div>
                <Label>Materiales (Filamentos)</Label>
                <div className="mt-2 space-y-2">
                    {formValues.materials.map((mat, index) => (
                        <div key={mat.key} className="flex gap-2 items-center"><Select onValueChange={(val) => updateMaterial(mat.key, 'filamentId', val)}><SelectTrigger><SelectValue placeholder="Filamento"/></SelectTrigger><SelectContent>{filaments?.map(f => <SelectItem key={f.id} value={f.id}>{f.name} - {f.color}</SelectItem>)}</SelectContent></Select><Input type="number" placeholder="gramos" onChange={(e) => updateMaterial(mat.key, 'grams', parseFloat(e.target.value) || 0)} className="w-28"/><Button variant="ghost" size="icon" onClick={() => removeMaterial(mat.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={addMaterial}>Añadir Filamento</Button>
            </div>
            
            <div>
                <Label>Accesorios</Label>
                 <div className="mt-2 space-y-2">
                    {formValues.accessories.map((acc, index) => (
                        <div key={acc.key} className="flex gap-2 items-center"><Select onValueChange={(val) => updateAccessory(acc.key, 'accessoryId', val)}><SelectTrigger><SelectValue placeholder="Accesorio"/></SelectTrigger><SelectContent>{accessoriesData?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select><Input type="number" placeholder="cantidad" onChange={(e) => updateAccessory(acc.key, 'quantity', parseInt(e.target.value) || 0)} className="w-28" /><Button variant="ghost" size="icon" onClick={() => removeAccessory(acc.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={addAccessory}>Añadir Accesorio</Button>
            </div>

            <div className="space-y-2"><Label htmlFor="printingTimeHours">Tiempo de Impresión (horas)</Label><Input id="printingTimeHours" type="number" onChange={(e) => setFormValues(p => ({...p, printingTimeHours: parseFloat(e.target.value) || 0}))} required /></div>
          </div>
          <div className="mt-4 rounded-lg border bg-card p-4"><h3 className="text-lg font-semibold">Precio Calculado</h3><p className="text-3xl font-bold text-primary mt-2">{settings.currency}{calculatedPrice.toFixed(2)}</p><p className="text-sm text-muted-foreground">Basado en los costos configurados y el margen de beneficio.</p></div>
          <SheetFooter className="mt-6"><Button type="button" onClick={handleCreateQuote} disabled={calculatedPrice <= 0 || !formValues.clientId || formValues.materials.length === 0}>Confirmar Cotización</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
            {selectedQuote && (
                <><DialogHeader><DialogTitle>Detalles de la Cotización</DialogTitle><DialogDescription>Desglose de costos y ganancias para la cotización de {selectedQuote.clientName}.</DialogDescription></DialogHeader>
                <div className="space-y-4">
                    <div><h4 className="font-medium">Resumen</h4><p className="text-sm text-muted-foreground">{selectedQuote.description || "Sin descripción."}</p></div>
                    <Separator/>
                    <div className="grid gap-2">
                        <div className="flex justify-between font-bold"><span className="text-muted-foreground">Precio de Venta</span><span>{settings.currency}{selectedQuote.price.toFixed(2)}</span></div>
                    </div>
                    <Separator/>
                     <div>
                        <h4 className="font-medium">Desglose de Costos</h4>
                         <div className="grid gap-2 mt-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Materiales</h5>
                            {(selectedQuote.materials ?? []).map((mat, i) => {
                                const filament = filaments?.find(f => f.id === mat.filamentId);
                                const cost = filament ? (filament.costPerKg/1000) * mat.grams : 0;
                                return <div key={i} className="flex justify-between pl-2"><span className="text-muted-foreground">{filament?.name} ({mat.grams}g)</span><span>{settings.currency}{cost.toFixed(2)}</span></div>
                            })}
                            <div className="flex justify-between font-medium border-t pt-1 mt-1"><span className="text-muted-foreground">Subtotal Materiales</span><span>{settings.currency}{(selectedQuote.materialCost || 0).toFixed(2)}</span></div>
                         </div>
                         <div className="grid gap-2 mt-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Accesorios</h5>
                            {(selectedQuote.accessories ?? []).map((acc, i) => {
                                const accessory = accessoriesData?.find(a => a.id === acc.accessoryId);
                                const cost = accessory ? accessory.cost * acc.quantity : 0;
                                return <div key={i} className="flex justify-between pl-2"><span className="text-muted-foreground">{accessory?.name} (x{acc.quantity})</span><span>{settings.currency}{cost.toFixed(2)}</span></div>
                            })}
                            <div className="flex justify-between font-medium border-t pt-1 mt-1"><span className="text-muted-foreground">Subtotal Accesorios</span><span>{settings.currency}{(selectedQuote.accessoryCost || 0).toFixed(2)}</span></div>
                         </div>
                         <div className="grid gap-2 mt-2">
                             <h5 className="text-sm font-medium text-muted-foreground">Costos Operativos</h5>
                             <div className="flex justify-between pl-2"><span className="text-muted-foreground">Costo de Máquina</span><span>{settings.currency}{(selectedQuote.machineCost || 0).toFixed(2)}</span></div>
                             <div className="flex justify-between pl-2"><span className="text-muted-foreground">Costo de Electricidad</span><span>{settings.currency}{(selectedQuote.electricityCost || 0).toFixed(2)}</span></div>
                        </div>
                        <div className="flex justify-between font-medium mt-2 pt-2 border-t"><span>Costo Total</span><span>{settings.currency}{calculateTotalCost(selectedQuote).toFixed(2)}</span></div>
                     </div>
                     <Separator/>
                     <div className="flex justify-between text-lg font-bold text-primary"><span>Ganancia</span><span>{settings.currency}{calculateProfit(selectedQuote).toFixed(2)}</span></div>
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
