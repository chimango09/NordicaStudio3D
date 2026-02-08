"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc, addDoc, getDoc, deleteDoc } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Filament, Accessory } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryPage() {
  const firestore = useFirestore();
  const { settings } = useSettings();
  
  const filamentsCollection = useMemoFirebase(() => collection(firestore, "filaments"), [firestore]);
  const { data: filaments, isLoading: isLoadingFilaments } = useCollection<Filament>(filamentsCollection);

  const accessoriesCollection = useMemoFirebase(() => collection(firestore, "accessories"), [firestore]);
  const { data: accessories, isLoading: isLoadingAccessories } = useCollection<Accessory>(accessoriesCollection);

  const [isFilamentSheetOpen, setIsFilamentSheetOpen] = React.useState(false);
  const [editingFilament, setEditingFilament] = React.useState<Filament | null>(null);

  const [isAccessorySheetOpen, setIsAccessorySheetOpen] = React.useState(false);
  const [editingAccessory, setEditingAccessory] = React.useState<Accessory | null>(null);

  const isLoading = isLoadingFilaments || isLoadingAccessories;

  const handleOpenFilamentSheet = (filament: Filament | null) => {
    setEditingFilament(filament);
    setIsFilamentSheetOpen(true);
  };

  const handleDeleteFilament = async (filamentId: string) => {
    const filamentDocRef = doc(firestore, "filaments", filamentId);
    const filamentSnap = await getDoc(filamentDocRef);
    if (filamentSnap.exists()) {
        const filamentData = filamentSnap.data();
        await addDoc(collection(firestore, "trash"), {
            originalId: filamentSnap.id,
            originalCollection: 'filaments',
            deletedAt: new Date().toISOString(),
            data: filamentData
        });
        await deleteDoc(filamentDocRef);
    }
  };

  const handleFilamentFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const filamentData = {
      name: formData.get("name") as string,
      color: formData.get("color") as string,
      stockLevel: parseFloat(formData.get("stockLevel") as string),
      costPerKg: parseFloat(formData.get("costPerKg") as string),
    };

    if (editingFilament) {
      const filamentDoc = doc(firestore, "filaments", editingFilament.id);
      setDocumentNonBlocking(filamentDoc, filamentData, { merge: true });
    } else {
      addDocumentNonBlocking(filamentsCollection, filamentData);
    }
    setIsFilamentSheetOpen(false);
  };

  const handleOpenAccessorySheet = (accessory: Accessory | null) => {
    setEditingAccessory(accessory);
    setIsAccessorySheetOpen(true);
  };

  const handleDeleteAccessory = async (accessoryId: string) => {
    const accessoryDocRef = doc(firestore, "accessories", accessoryId);
    const accessorySnap = await getDoc(accessoryDocRef);
    if (accessorySnap.exists()) {
        const accessoryData = accessorySnap.data();
        await addDoc(collection(firestore, "trash"), {
            originalId: accessorySnap.id,
            originalCollection: 'accessories',
            deletedAt: new Date().toISOString(),
            data: accessoryData
        });
        await deleteDoc(accessoryDocRef);
    }
  };

  const handleAccessoryFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const accessoryData = {
      name: formData.get("name") as string,
      stockLevel: parseInt(formData.get("stockLevel") as string, 10),
      cost: parseFloat(formData.get("cost") as string),
    };

    if (editingAccessory) {
      const accessoryDoc = doc(firestore, "accessories", editingAccessory.id);
      setDocumentNonBlocking(accessoryDoc, accessoryData, { merge: true });
    } else {
      addDocumentNonBlocking(accessoriesCollection, accessoryData);
    }
    setIsAccessorySheetOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Rastrea y gestiona tus niveles de stock de filamentos y accesorios."
      />
      <Tabs defaultValue="filaments">
        <div className="flex justify-between items-center mb-4">
            <TabsList>
                <TabsTrigger value="filaments">Filamentos</TabsTrigger>
                <TabsTrigger value="accessories">Accesorios</TabsTrigger>
            </TabsList>
            <TabsContent value="filaments" className="m-0">
                <Button onClick={() => handleOpenFilamentSheet(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Filamento
                </Button>
            </TabsContent>
            <TabsContent value="accessories" className="m-0">
                <Button onClick={() => handleOpenAccessorySheet(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Accesorio
                </Button>
            </TabsContent>
        </div>

        <TabsContent value="filaments">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoadingFilaments && Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
            {!isLoadingFilaments && filaments?.map((filament) => (
              <Card key={filament.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{filament.name}</CardTitle>
                      <CardDescription>{filament.color}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 rounded-full border" style={{ backgroundColor: filament.color.toLowerCase().replace(/ /g, "") }}></div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenFilamentSheet(filament)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteFilament(filament.id)} className="text-destructive">Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground"><span>Nivel de Stock</span><span>{filament.stockLevel}g</span></div>
                    <Progress value={(filament.stockLevel / 1000) * 100} className="mt-1 h-2" />
                  </div>
                  <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Costo por kg</span><span className="font-medium">{settings.currency}{filament.costPerKg.toFixed(2)}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
          {!isLoadingFilaments && filaments?.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">No hay filamentos para mostrar.</div>
          )}
        </TabsContent>

        <TabsContent value="accessories">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoadingAccessories && Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
            {!isLoadingAccessories && accessories?.map((accessory) => (
              <Card key={accessory.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{accessory.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenAccessorySheet(accessory)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteAccessory(accessory.id)} className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nivel de Stock</span><span>{accessory.stockLevel} unidades</span></div>
                    <div className="flex justify-between items-center text-sm mt-2"><span className="text-muted-foreground">Costo por unidad</span><span className="font-medium">{settings.currency}{accessory.cost.toFixed(2)}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
          {!isLoadingAccessories && accessories?.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">No hay accesorios para mostrar.</div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={isFilamentSheetOpen} onOpenChange={(isOpen) => { setIsFilamentSheetOpen(isOpen); if (!isOpen) setEditingFilament(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingFilament ? "Editar Filamento" : "Añadir Nuevo Filamento"}</SheetTitle>
            <SheetDescription>{editingFilament ? "Actualiza los detalles de este filamento." : "Rellena los detalles para el nuevo filamento."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFilamentFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nombre</Label><Input id="name" name="name" defaultValue={editingFilament?.name} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="color" className="text-right">Color</Label><Input id="color" name="color" defaultValue={editingFilament?.color} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="stockLevel" className="text-right">Stock (g)</Label><Input id="stockLevel" name="stockLevel" type="number" defaultValue={editingFilament?.stockLevel} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="costPerKg" className="text-right">Costo por Kg</Label><Input id="costPerKg" name="costPerKg" type="number" step="0.01" defaultValue={editingFilament?.costPerKg} className="col-span-3" required /></div>
            </div>
            <SheetFooter><Button type="submit">{editingFilament ? "Guardar Cambios" : "Crear Filamento"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={isAccessorySheetOpen} onOpenChange={(isOpen) => { setIsAccessorySheetOpen(isOpen); if (!isOpen) setEditingAccessory(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingAccessory ? "Editar Accesorio" : "Añadir Nuevo Accesorio"}</SheetTitle>
            <SheetDescription>{editingAccessory ? "Actualiza los detalles de este accesorio." : "Rellena los detalles para el nuevo accesorio."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAccessoryFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nombre</Label><Input id="name" name="name" defaultValue={editingAccessory?.name} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="stockLevel" className="text-right">Stock (unidades)</Label><Input id="stockLevel" name="stockLevel" type="number" defaultValue={editingAccessory?.stockLevel} className="col-span-3" required /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="cost" className="text-right">Costo (por unidad)</Label><Input id="cost" name="cost" type="number" step="0.01" defaultValue={editingAccessory?.cost} className="col-span-3" required /></div>
            </div>
            <SheetFooter><Button type="submit">{editingAccessory ? "Guardar Cambios" : "Crear Accesorio"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
