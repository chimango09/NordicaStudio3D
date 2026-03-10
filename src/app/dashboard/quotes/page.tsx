"use client";

import * as React from "react";
import { PlusCircle, Trash2, FileDown, Eye, Package } from "lucide-react";
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
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  useUser,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Quote, Client, Filament, Accessory, QuoteMaterial, QuoteAccessory, Product } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type QuoteWithClientName = Quote & { clientName: string; id: string };

type FormMaterial = QuoteMaterial & { key: number };
type FormAccessory = QuoteAccessory & { key: number };

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

const getTodayLocalYYYYMMDD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


export default function QuotesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { settings } = useSettings();

  const quotesQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'quotes');
  }, [user, firestore]);
  const { data: quotesData, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);

  const clientsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "clients");
  }, [user, firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const filamentsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "filaments");
  }, [user, firestore]);
  const { data: filaments, isLoading: isLoadingFilaments } = useCollection<Filament>(filamentsQuery);
  
  const accessoriesQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "accessories");
  }, [user, firestore]);
  const { data: accessoriesData, isLoading: isLoadingAccessories } = useCollection<Accessory>(accessoriesQuery);

  const productsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "products");
  }, [user, firestore]);
  const { data: products } = useCollection<Product>(productsQuery);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = React.useState<string | null>(null);

  const quotes: QuoteWithClientName[] = React.useMemo(() => {
    return quotesData?.map(quote => ({
      ...quote,
      id: quote.id,
      clientName: clients?.find(c => c.id === quote.clientId)?.name || 'N/A'
    })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  }, [quotesData, clients])

  const selectedQuote = React.useMemo(() => {
    if (!selectedQuoteId || !quotes) return null;
    return quotes.find(q => q.id === selectedQuoteId) ?? null;
  }, [selectedQuoteId, quotes]);

  const [formValues, setFormValues] = React.useState({
    clientId: "",
    printingTimeHours: 0,
    description: "",
    materials: [] as FormMaterial[],
    accessories: [] as FormAccessory[],
    date: getTodayLocalYYYYMMDD(),
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
  
  const resetForm = React.useCallback(() => {
    setFormValues({ clientId: "", printingTimeHours: 0, description: "", materials: [], accessories: [], date: getTodayLocalYYYYMMDD() });
    setCalculatedPrice(0);
    setCosts({ materialCost: 0, accessoryCost: 0, machineCost: 0, electricityCost: 0 });
  }, []);

  const handleLoadProduct = React.useCallback((productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    let currentKey = itemKey;
    const formMaterials = product.materials.map(m => ({ ...m, key: currentKey++ }));
    const formAccessories = product.accessories.map(a => ({ ...a, key: currentKey++ }));
    
    setItemKey(currentKey);
    setFormValues(prev => ({
      ...prev,
      description: product.description || product.name,
      printingTimeHours: product.printingTimeHours,
      materials: formMaterials,
      accessories: formAccessories,
    }));
  }, [products, itemKey]);

  const addMaterial = React.useCallback(() => {
    setFormValues(prev => ({...prev, materials: [...prev.materials, {key: itemKey, filamentId: "", grams: 0}]}));
    setItemKey(k => k + 1);
  }, [itemKey]);

  const removeMaterial = React.useCallback((key: number) => {
    setFormValues(prev => ({...prev, materials: prev.materials.filter(m => m.key !== key)}));
  }, []);

  const updateMaterial = React.useCallback((key: number, field: string, value: string | number) => {
    setFormValues(prev => ({
      ...prev, 
      materials: prev.materials.map(m => m.key === key ? {...m, [field]: value} : m)
    }));
  }, []);
  
  const addAccessory = React.useCallback(() => {
    setFormValues(prev => ({...prev, accessories: [...prev.accessories, {key: itemKey, accessoryId: "", quantity: 0}]}));
    setItemKey(k => k + 1);
  }, [itemKey]);

  const removeAccessory = React.useCallback((key: number) => {
    setFormValues(prev => ({...prev, accessories: prev.accessories.filter(a => a.key !== key)}));
  }, []);

  const updateAccessory = React.useCallback((key: number, field: string, value: string | number) => {
    setFormValues(prev => ({
      ...prev, 
      accessories: prev.accessories.map(a => a.key === key ? {...a, [field]: value} : a)
    }));
  }, []);

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
    let newPrice = 0;
    
    if (totalCost > 0) {
        const finalPrice = totalCost * (1 + settings.profitMargin / 100);
        newPrice = Math.ceil(finalPrice / 100) * 100;
    }

    setCosts(prev => {
      if (prev.materialCost === materialCost && prev.accessoryCost === accessoryCost && 
          prev.machineCost === machineCost && prev.electricityCost === electricityCost) return prev;
      return { materialCost, accessoryCost, machineCost, electricityCost };
    });

    setCalculatedPrice(prev => prev === newPrice ? prev : newPrice);

  }, [formValues, filaments, accessoriesData, settings]);

  const handleCreateQuote = () => {
    const quotesCollection = user ? collection(firestore, `users/${user.uid}/quotes`) : null;
    if (!canCreateQuote || !user || !quotesCollection) return;

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
      date: new Date(formValues.date + "T00:00:00").toISOString(),
      ...costs,
    };
    
    addDocumentNonBlocking(quotesCollection, quoteData);

    quoteData.materials.forEach((mat) => {
      const filamentDoc = doc(firestore, 'users', user.uid, 'filaments', mat.filamentId);
      updateDocumentNonBlocking(filamentDoc, { stockLevel: increment(-mat.grams) });
    });
    quoteData.accessories.forEach((acc) => {
      const accessoryDoc = doc(firestore, 'users', user.uid, 'accessories', acc.accessoryId);
      updateDocumentNonBlocking(accessoryDoc, { stockLevel: increment(-acc.quantity) });
    });

    setIsSheetOpen(false);
    resetForm();
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!user) return;
    const quoteDocRef = doc(firestore, 'users', user.uid, 'quotes', quoteId);
    const quoteSnap = await getDoc(quoteDocRef);
    if (quoteSnap.exists()) {
      const quoteData = quoteSnap.data();
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: quoteSnap.id,
        originalCollection: "quotes",
        deletedAt: new Date().toISOString(),
        data: quoteData,
      });
      await deleteDoc(quoteDocRef);
    }
  }

  const handleStatusChange = (quoteId: string, status: Quote['status']) => {
    if (!user) return;
    const quoteDoc = doc(firestore, 'users', user.uid, 'quotes', quoteId);
    setDocumentNonBlocking(quoteDoc, { status }, { merge: true });
  };
  
  const handleViewDetails = (quote: QuoteWithClientName) => {
    setSelectedQuoteId(quote.id);
    setIsDetailsOpen(true);
  };
  
  const calculateTotalCost = (quote: Quote) => (quote.materialCost || 0) + (quote.accessoryCost || 0) + (quote.machineCost || 0) + (quote.electricityCost || 0);
  const calculateProfit = (quote: Quote) => quote.price - calculateTotalCost(quote);
  
  const formatDateForDisplay = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const correctedDate = new Date(year, month, day);
    return correctedDate.toLocaleDateString();
  };

  const handleDownloadPdf = (quote: QuoteWithClientName) => {
    const doc = new jsPDF();
    const client = clients?.find(c => c.id === quote.clientId);

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
    doc.text(`Fecha: ${formatDateForDisplay(quote.date)}`, 190, 34, { align: 'right' });

    const emitterBlockHeight = 30; 
    const lineY = startYPos + Math.max(logoHeight, emitterBlockHeight) + 7;
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);


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

    const tableBody = [];
    tableBody.push(['Pieza / Descripción', quote.description || 'Trabajo de impresión 3D']);
    if (quote.printingTimeHours > 0) {
      tableBody.push(['Tiempo de Impresión Estimado', `${quote.printingTimeHours} hs`]);
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

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('CONDICIONES DE PAGO:', 20, finalY);
            doc.setFont('helvetica', 'normal');
            const paymentConditions = "El inicio de la impresión se realizará únicamente una vez abonado el anticipo del 50%.\nEl 50% restante deberá abonarse al momento de la entrega del producto.";
            const splitPayment = doc.splitTextToSize(paymentConditions, 170);
            doc.text(splitPayment, 20, finalY + 7);
            finalY += splitPayment.length * 5 + 10;
            
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
        title="Cotizaciones"
        description="Gestiona las ventas y asignación de piezas a tus clientes."
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
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {!isLoading && quotes.map((quote) => (
                <Card key={quote.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-base font-medium">{quote.clientName}</CardTitle>
                            <CardDescription>{formatDateForDisplay(quote.date)}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(quote)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteQuote(quote.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between">
                            <Select value={quote.status} onValueChange={(val: Quote['status']) => handleStatusChange(quote.id, val)}>
                              <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Imprimiendo">Imprimiendo</SelectItem>
                                <SelectItem value="Entregado">Entregado</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="text-lg font-bold">{settings.currency}{quote.price.toFixed(2)}</div>
                         </div>
                         <Button variant="outline" className="w-full h-8 text-xs" onClick={() => handleDownloadPdf(quote)}>
                            <FileDown className="mr-2 h-3 w-3" /> Descargar PDF
                         </Button>
                    </CardContent>
                </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-6 w-20"/></TableCell><TableCell><Skeleton className="h-5 w-20 ml-auto"/></TableCell><TableCell><Skeleton className="h-8 w-8 ml-auto"/></TableCell></TableRow>
                ))}
                {!isLoading && quotes.map((quote) => (
                    <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.clientName}</TableCell>
                    <TableCell>{formatDateForDisplay(quote.date)}</TableCell>
                    <TableCell>
                      <Select value={quote.status} onValueChange={(val: Quote['status']) => handleStatusChange(quote.id, val)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Imprimiendo">Imprimiendo</SelectItem>
                          <SelectItem value="Entregado">Entregado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">{settings.currency}{quote.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleViewDetails(quote)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver Detalles</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleDownloadPdf(quote)}>
                                <FileDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Descargar PDF</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteQuote(quote.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
          
          {!isLoading && quotes.length === 0 && (<div className="py-10 text-center text-muted-foreground">No hay cotizaciones para mostrar.</div>)}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={(isOpen) => { setIsSheetOpen(isOpen); if (!isOpen) resetForm(); }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Crear Nueva Cotización</SheetTitle><SheetDescription>Calcula el precio para un nuevo trabajo o asigna una pieza de tu catálogo.</SheetDescription></SheetHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select required onValueChange={(val) => setFormValues(p => ({...p, clientId: val}))}>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Cargar desde Pieza (Opcional)</Label>
              <Select onValueChange={handleLoadProduct}>
                <SelectTrigger className="bg-primary/5 border-primary/20">
                  <Package className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Selecciona una pieza del catálogo..." />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Esto rellenará automáticamente los materiales y el tiempo de impresión.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formValues.date}
                onChange={(e) => setFormValues(p => ({...p, date: e.target.value}))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Trabajo</Label>
              <Textarea id="description" name="description" value={formValues.description} placeholder="Descripción de la pieza o servicio..." onChange={(e) => setFormValues(p => ({...p, description: e.target.value}))} />
            </div>

            <Separator />

            <div>
                <Label>Materiales (Filamentos)</Label>
                <div className="mt-2 space-y-2">
                    {formValues.materials.map((mat) => (
                        <div key={mat.key} className="flex gap-2 items-center">
                          <Select value={mat.filamentId} onValueChange={(val) => updateMaterial(mat.key, 'filamentId', val)}>
                            <SelectTrigger><SelectValue placeholder="Filamento"/></SelectTrigger>
                            <SelectContent>{filaments?.map(f => <SelectItem key={f.id} value={f.id}>{f.name} - {f.color}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="number" value={mat.grams || ""} placeholder="gramos" onChange={(e) => updateMaterial(mat.key, 'grams', parseFloat(e.target.value) || 0)} className="w-28"/>
                          <Button variant="ghost" size="icon" onClick={() => removeMaterial(mat.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={addMaterial}>Añadir Filamento</Button>
            </div>
            
            <div>
                <Label>Accesorios</Label>
                 <div className="mt-2 space-y-2">
                    {formValues.accessories.map((acc) => (
                        <div key={acc.key} className="flex gap-2 items-center">
                          <Select value={acc.accessoryId} onValueChange={(val) => updateAccessory(acc.key, 'accessoryId', val)}>
                            <SelectTrigger><SelectValue placeholder="Accesorio"/></SelectTrigger>
                            <SelectContent>{accessoriesData?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="number" value={acc.quantity || ""} placeholder="cant." onChange={(e) => updateAccessory(acc.key, 'quantity', parseInt(e.target.value) || 0)} className="w-28" />
                          <Button variant="ghost" size="icon" onClick={() => removeAccessory(acc.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={addAccessory}>Añadir Accesorio</Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="printingTimeHours">Tiempo de Impresión (horas)</Label>
              <Input id="printingTimeHours" type="number" step="0.5" value={formValues.printingTimeHours || ""} onChange={(e) => setFormValues(p => ({...p, printingTimeHours: parseFloat(e.target.value) || 0}))} required />
            </div>
          </div>
          <div className="mt-4 rounded-lg border bg-card p-4">
            <h3 className="text-lg font-semibold">Precio Calculado</h3>
            <p className="text-3xl font-bold text-primary mt-2">{settings.currency}{calculatedPrice.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Puedes ajustar los materiales arriba para cambiar el precio.</p>
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" onClick={handleCreateQuote} disabled={!canCreateQuote}>Confirmar Cotización</Button>
          </SheetFooter>
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
