"use client";

import * as React from "react";
import { PlusCircle, Pencil, Trash2, Package, Scale } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { collection, doc, addDoc, getDoc, deleteDoc } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  useUser,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Product, Filament, Accessory, QuoteMaterial, QuoteAccessory } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type FormMaterial = QuoteMaterial & { key: number };
type FormAccessory = QuoteAccessory & { key: number };

export default function CatalogPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { settings } = useSettings();

  const productsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "products");
  }, [user, firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const filamentsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "filaments");
  }, [user, firestore]);
  const { data: filaments } = useCollection<Filament>(filamentsQuery);

  const accessoriesQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "accessories");
  }, [user, firestore]);
  const { data: accessories } = useCollection<Accessory>(accessoriesQuery);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [formValues, setFormValues] = React.useState({
    name: "",
    description: "",
    printingTimeHours: 0,
    materials: [] as FormMaterial[],
    accessories: [] as FormAccessory[],
  });
  const [itemKey, setItemKey] = React.useState(0);
  const [calculatedPrice, setCalculatedPrice] = React.useState(0);
  const [costs, setCosts] = React.useState({ materialCost: 0, accessoryCost: 0, machineCost: 0, electricityCost: 0 });

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
    const { materials, accessories: formAccessories, printingTimeHours } = formValues;
    
    const materialCost = materials.reduce((sum, mat) => {
      const filament = filaments?.find(f => f.id === mat.filamentId);
      return sum + (filament ? (filament.costPerKg / 1000) * mat.grams : 0);
    }, 0);

    const accessoryCost = formAccessories.reduce((sum, acc) => {
        const accessory = accessories?.find(a => a.id === acc.accessoryId);
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

  }, [formValues, filaments, accessories, settings]);

  const resetForm = React.useCallback(() => {
    setEditingProductId(null);
    setFormValues({ name: "", description: "", printingTimeHours: 0, materials: [], accessories: [] });
    setCalculatedPrice(0);
    setCosts({ materialCost: 0, accessoryCost: 0, machineCost: 0, electricityCost: 0 });
  }, []);

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    let currentKey = 0;
    const formMaterials = (product.materials || []).map(m => ({ ...m, key: currentKey++ }));
    const formAccessories = (product.accessories || []).map(a => ({ ...a, key: currentKey++ }));
    
    setItemKey(currentKey);
    setFormValues({
      name: product.name,
      description: product.description || "",
      printingTimeHours: product.printingTimeHours,
      materials: formMaterials,
      accessories: formAccessories,
    });
    setIsSheetOpen(true);
  };

  const handleCreateProduct = () => {
    if (!user || !formValues.name) return;

    const productData = {
      name: formValues.name,
      description: formValues.description,
      printingTimeHours: formValues.printingTimeHours,
      materials: formValues.materials.map(({ key, ...rest }) => rest),
      accessories: formValues.accessories.map(({ key, ...rest }) => rest),
      price: calculatedPrice,
      ...costs,
    };

    if (editingProductId) {
      const productRef = doc(firestore, "users", user.uid, "products", editingProductId);
      updateDocumentNonBlocking(productRef, productData);
    } else {
      const productsCollection = collection(firestore, `users/${user.uid}/products`);
      addDocumentNonBlocking(productsCollection, productData);
    }

    setIsSheetOpen(false);
    resetForm();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user) return;
    const productRef = doc(firestore, "users", user.uid, "products", productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: productSnap.id,
        originalCollection: "products",
        deletedAt: new Date().toISOString(),
        data: productSnap.data(),
      });
      await deleteDoc(productRef);
    }
  };

  return (
    <>
      <PageHeader
        title="Catálogo de Piezas"
        description="Define tus piezas habituales para cotizarlas rápidamente."
      />
      <div className="flex justify-end mb-6">
        <Button onClick={() => { resetForm(); setIsSheetOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Pieza
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoadingProducts && Array.from({length: 4}).map((_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
        {!isLoadingProducts && products?.map((product) => (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditProduct(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Eliminar</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-4">
                {product.description || "Sin descripción"}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo:</span>
                  <span>{product.printingTimeHours} hs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Scale className="h-3 w-3" /> Peso:
                  </span>
                  <span>{product.materials?.reduce((sum, m) => sum + m.grams, 0) || 0}g</span>
                </div>
                <div className="flex justify-between font-bold text-primary mt-2 pt-2 border-t">
                  <span>Precio Sugerido:</span>
                  <span>{settings.currency}{product.price.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoadingProducts && products?.length === 0 && (
        <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          No tienes piezas en el catálogo todavía.
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) resetForm(); }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingProductId ? "Editar Pieza" : "Añadir Pieza al Catálogo"}</SheetTitle>
            <SheetDescription>Configura los detalles técnicos y el precio de esta pieza.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Pieza</Label>
              <Input id="name" placeholder="Ej: Lámpara Art Deco" value={formValues.name} onChange={e => setFormValues(p => ({...p, name: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descripción (opcional)</Label>
              <Textarea id="desc" placeholder="Detalles sobre el diseño o acabado..." value={formValues.description} onChange={e => setFormValues(p => ({...p, description: e.target.value}))} />
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
                    <Input type="number" placeholder="gramos" value={mat.grams || ""} onChange={(e) => updateMaterial(mat.key, 'grams', parseFloat(e.target.value) || 0)} className="w-28"/>
                    <Button variant="ghost" size="icon" onClick={() => removeMaterial(mat.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={addMaterial}>+ Añadir Filamento</Button>
            </div>

            <div>
              <Label>Accesorios</Label>
              <div className="mt-2 space-y-2">
                {formValues.accessories.map((acc) => (
                  <div key={acc.key} className="flex gap-2 items-center">
                    <Select value={acc.accessoryId} onValueChange={(val) => updateAccessory(acc.key, 'accessoryId', val)}>
                      <SelectTrigger><SelectValue placeholder="Accesorio"/></SelectTrigger>
                      <SelectContent>{accessories?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" placeholder="cant." value={acc.quantity || ""} onChange={(e) => updateAccessory(acc.key, 'quantity', parseInt(e.target.value) || 0)} className="w-24" />
                    <Button variant="ghost" size="icon" onClick={() => removeAccessory(acc.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={addAccessory}>+ Añadir Accesorio</Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Tiempo de Impresión (horas)</Label>
              <Input id="hours" type="number" step="0.5" value={formValues.printingTimeHours || ""} onChange={e => setFormValues(p => ({...p, printingTimeHours: parseFloat(e.target.value) || 0}))} />
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="text-sm font-semibold mb-2">Precio Sugerido Calculado</h4>
              <div className="text-3xl font-bold text-primary">{settings.currency}{calculatedPrice.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Basado en tus costos de configuración y margen de beneficio.</p>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreateProduct} disabled={!formValues.name}>
              {editingProductId ? "Guardar Cambios" : "Guardar en Catálogo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
