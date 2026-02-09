"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Trash2, FileDown } from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  DropdownMenuSeparator,
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
import { collection, doc, increment, getDoc, addDoc, deleteDoc } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
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

// TypeScript declaration for the autoTable plugin
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}


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

  const canCreateQuote = React.useMemo(() => {
    const hasContent = formValues.materials.some(m => m.filamentId && m.grams > 0) || 
                       formValues.accessories.some(a => a.accessoryId && a.quantity > 0) ||
                       formValues.printingTimeHours > 0;
    return hasContent && calculatedPrice > 0 && !!formValues.clientId;
  }, [calculatedPrice, formValues]);
  
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

    const machineCost = settings.machineCost * (printingTimeHours || 0);
    const electricityCost = (settings.printerConsumptionWatts / 1000) * (printingTimeHours || 0) * settings.electricityCost;
    
    const totalCost = materialCost + accessoryCost + machineCost + electricityCost;
    
    if (totalCost > 0) {
        const finalPrice = totalCost * (1 + settings.profitMargin / 100);
        const roundedPrice = Math.ceil(finalPrice / 100) * 100;
        setCosts({ materialCost, accessoryCost, machineCost, electricityCost });
        setCalculatedPrice(roundedPrice);
    } else {
        setCalculatedPrice(0);
        setCosts({ materialCost: 0, accessoryCost: 0, machineCost: 0, electricityCost: 0 });
    }
  }, [formValues, filaments, accessories, settings]);

  const handleCreateQuote = () => {
    if (!canCreateQuote) return;

    const finalMaterials = formValues.materials
      .filter((mat) => mat.filamentId && mat.grams > 0)
      .map(({ key, ...rest }) => rest);

    const finalAccessories = formValues.accessories
      .filter((acc) => acc.accessoryId && acc.quantity > 0)
      .map(({ key, ...rest }) => rest);

    const quoteData = {
      clientId: formValues.clientId,
      description: formValues.description,
      printingTimeHours: formValues.printingTimeHours,
      materials: finalMaterials,
      accessories: finalAccessories,
      price: calculatedPrice,
      status: 'Pendiente' as const,
      date: new Date().toISOString(),
      ...costs,
    };
    
    addDocumentNonBlocking(quotesCollection, quoteData);

    quoteData.materials.forEach((mat) => {
      const filamentDoc = doc(firestore, 'filaments', mat.filamentId);
      updateDocumentNonBlocking(filamentDoc, { stockLevel: increment(-mat.grams) });
    });
    quoteData.accessories.forEach((acc) => {
      const accessoryDoc = doc(firestore, 'accessories', acc.accessoryId);
      updateDocumentNonBlocking(accessoryDoc, { stockLevel: increment(-acc.quantity) });
    });

    setIsSheetOpen(false);
    resetForm();
  };

  const handleDeleteQuote = async (quoteId: string) => {
    const quoteDocRef = doc(firestore, 'quotes', quoteId);
    const quoteSnap = await getDoc(quoteDocRef);
    if (quoteSnap.exists()) {
      const quoteData = quoteSnap.data();
      await addDoc(collection(firestore, "trash"), {
        originalId: quoteSnap.id,
        originalCollection: "quotes",
        deletedAt: new Date().toISOString(),
        data: quoteData,
      });
      await deleteDoc(quoteDocRef);
    }
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

  const handleDownloadPdf = (quote: QuoteWithClientName) => {
    const doc = new jsPDF();
    const client = clients?.find(c => c.id === quote.clientId);

    // --------------------------------
    // 📌 DATOS DEL EMISOR
    // --------------------------------
    const emitterName = settings.companyName;
    const emitterResponsible = settings.companyResponsible;
    const emitterPhone = settings.companyPhone;
    const emitterEmail = settings.companyEmail;
    const emitterLocation = settings.companyLocation;

    const startYPos = 20;
    let textXPos = 20;
    let logoHeight = 0;

    if (settings.companyLogo) {
      try {
        const imgWidth = 30;
        const imgProps = doc.getImageProperties(settings.companyLogo);
        logoHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(settings.companyLogo, 'PNG', 20, startYPos, imgWidth, logoHeight);
        textXPos = 20 + imgWidth + 10;
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(emitterName, textXPos, startYPos + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Responsable: ${emitterResponsible}`, textXPos, startYPos + 13);
    doc.text(`Tel: ${emitterPhone}`, textXPos, startYPos + 18);
    doc.text(`Email: ${emitterEmail}`, textXPos, startYPos + 23);
    doc.text(emitterLocation, textXPos, startYPos + 28);


    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("COTIZACIÓN", 190, 20, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Número: ${quote.id.substring(0, 8).toUpperCase()}`, 190, 27, { align: 'right' });
    doc.text(`Fecha: ${new Date(quote.date).toLocaleDateString()}`, 190, 34, { align: 'right' });

    const emitterBlockHeight = 30; // Approx height of the text block
    const lineY = startYPos + Math.max(logoHeight, emitterBlockHeight) + 7;
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);


    // --------------------------------
    // 👤 DATOS DEL CLIENTE
    // --------------------------------
    let clientY = lineY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CLIENTE:", 20, clientY);
    clientY += 7;
    doc.setFont("helvetica", "normal");
    doc.text(client?.name || 'N/A', 20, clientY);
    if (client?.phone) {
        clientY += 5;
        doc.text(`Teléfono: ${client.phone}`, 20, clientY);
    }

    // --------------------------------
    // 🧾 DETALLE DE LA PIEZA / SERVICIO
    // --------------------------------
    const tableBody = [];
    
    tableBody.push([
        'Pieza / Descripción',
        quote.description || 'Trabajo de impresión 3D'
    ]);
    if (quote.printingTimeHours > 0) {
      tableBody.push([
          'Tiempo de Impresión Estimado',
          `${quote.printingTimeHours} hs`
      ]);
    }

    doc.autoTable({
        startY: clientY + 10,
        head: [['Concepto', 'Detalle']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [23, 23, 23], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 110 },
        },
        didDrawPage: (data: any) => {
            let finalY = data.cursor.y;
            
            // --- Totals Section ---
            const totalsStartY = finalY + 10;
            const totalsHeight = 18;
            const totalsWidth = 85;
            const totalsX = 190 - totalsWidth; 

            doc.setFillColor(241, 245, 249);
            doc.rect(totalsX, totalsStartY, totalsWidth, totalsHeight, 'F');
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('PRECIO FINAL:', totalsX + 5, totalsStartY + 7);
            doc.text(`${settings.currency}${quote.price.toFixed(2)}`, 190, totalsStartY + 7, { align: 'right' });
            
            const downPayment = quote.price * 0.5;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Anticipo (50%):', totalsX + 5, totalsStartY + 14);
            doc.text(`${settings.currency}${downPayment.toFixed(2)}`, 190, totalsStartY + 14, { align: 'right' });

            finalY = totalsStartY + totalsHeight + 10;

            // --------------------------------
            // 💰 CONDICIONES DE PAGO
            // --------------------------------
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('CONDICIONES DE PAGO:', 20, finalY);
            doc.setFont('helvetica', 'normal');
            const paymentConditions = "El inicio de la impresión se realizará únicamente una vez abonado el anticipo del 50%.\nEl 50% restante deberá abonarse al momento de la entrega del producto.";
            const splitPayment = doc.splitTextToSize(paymentConditions, 170);
            doc.text(splitPayment, 20, finalY + 7);
            finalY += splitPayment.length * 5 + 10;
            
            // --------------------------------
            // 📜 CONDICIONES GENERALES Y ACLARACIONES
            // --------------------------------
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('CONDICIONES GENERALES Y ACLARACIONES:', 20, finalY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const conditions = [
                '• El precio corresponde exclusivamente a la pieza detallada en esta cotización.',
                '• No se realizarán modificaciones de diseño una vez iniciada la impresión.',
                '• El tiempo de entrega es estimado y puede variar según disponibilidad y complejidad de la impresión.',
                '• En caso de cancelación por parte del cliente luego de iniciado el proceso de impresión, el anticipo no será reembolsable.',
                '• El producto final puede presentar leves variaciones propias del proceso de impresión 3D.',
                '• La cotización tiene una validez de 7 días corridos desde la fecha de emisión.',
            ];
            const splitConditions = doc.splitTextToSize(conditions.join("\n"), 170);
            doc.text(splitConditions, 20, finalY + 7);

            // --------------------------------
            // 📐 FOOTER
            // --------------------------------
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                const footerText = "Documento generado automáticamente. No válido como factura fiscal.";
                doc.text(footerText, 105, 285, { align: 'center' });
            }
        },
    });

    const date = new Date(quote.date).toISOString().split('T')[0];
    doc.save(`cotizacion_${quote.clientName.replace(/\s+/g, '_')}_${date}.pdf`);
  };

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
                  <TableCell><Badge variant={quote.status === 'Entregado' ? 'success' : quote.status === 'Imprimiendo' ? 'secondary' : 'outline'}>{quote.status}</Badge></TableCell>
                  <TableCell className="text-right">{settings.currency}{quote.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(quote)}>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPdf(quote)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            <span>Descargar PDF</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger><span>Cambiar Estado</span></DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Pendiente')}>Pendiente</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Imprimiendo')}>Imprimiendo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Entregado')}>Entregado</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteQuote(quote.id)} className="text-destructive">Eliminar</DropdownMenuItem>
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
          <SheetFooter className="mt-6"><Button type="button" onClick={handleCreateQuote} disabled={!canCreateQuote}>Confirmar Cotización</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
            {selectedQuote && (
                <>
                <DialogHeader>
                    <DialogTitle>Detalles de la Cotización</DialogTitle>
                    <DialogDescription>Desglose de costos y ganancias para la cotización de {selectedQuote.clientName}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
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
                            {(selectedQuote.materials || []).map((mat, i) => {
                                const filament = filaments?.find(f => f.id === mat.filamentId);
                                const cost = filament ? (filament.costPerKg/1000) * mat.grams : 0;
                                return <div key={i} className="flex justify-between pl-2"><span className="text-muted-foreground">{filament?.name} ({mat.grams}g)</span><span>{settings.currency}{cost.toFixed(2)}</span></div>
                            })}
                            <div className="flex justify-between font-medium border-t pt-1 mt-1"><span className="text-muted-foreground">Subtotal Materiales</span><span>{settings.currency}{(selectedQuote.materialCost || 0).toFixed(2)}</span></div>
                         </div>
                         <div className="grid gap-2 mt-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Accesorios</h5>
                            {(selectedQuote.accessories || []).map((acc, i) => {
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
