"use client";

import * as React from "react";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc, addDoc, getDoc, deleteDoc } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  useUser,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Filament, Accessory } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type FilamentFormData = Omit<Filament, "id" | "spoolWeight">;
type AccessoryFormData = Omit<Accessory, "id">;

const defaultFilamentForm: FilamentFormData = {
  name: "",
  color: "",
  colorHex: "#3b82f6",
  stockLevel: 0,
  costPerKg: 0,
};

const defaultAccessoryForm: AccessoryFormData = {
  name: "",
  stockLevel: 0,
  cost: 0,
};

export default function InventoryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { settings } = useSettings();

  const filamentsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "filaments");
  }, [user, firestore]);
  const { data: filaments, isLoading: isLoadingFilaments } =
    useCollection<Filament>(filamentsQuery);

  const accessoriesQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "accessories");
  }, [user, firestore]);
  const { data: accessories, isLoading: isLoadingAccessories } =
    useCollection<Accessory>(accessoriesQuery);

  const [isFilamentSheetOpen, setIsFilamentSheetOpen] = React.useState(false);
  const [editingFilamentId, setEditingFilamentId] = React.useState<string | null>(null);
  const [filamentFormData, setFilamentFormData] =
    React.useState<FilamentFormData>(defaultFilamentForm);

  const [isAccessorySheetOpen, setIsAccessorySheetOpen] = React.useState(false);
  const [editingAccessoryId, setEditingAccessoryId] = React.useState<string | null>(null);
  const [accessoryFormData, setAccessoryFormData] =
    React.useState<AccessoryFormData>(defaultAccessoryForm);

  const handleFilamentInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setFilamentFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAccessoryInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setAccessoryFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const resetFilamentForm = () => {
    setEditingFilamentId(null);
    setFilamentFormData(defaultFilamentForm);
  };

  const resetAccessoryForm = () => {
    setEditingAccessoryId(null);
    setAccessoryFormData(defaultAccessoryForm);
  };

  const handleAddFilament = () => {
    resetFilamentForm();
    setIsFilamentSheetOpen(true);
  };

  const handleEditFilament = (filament: Filament) => {
    setEditingFilamentId(filament.id);
    setFilamentFormData({
      name: filament.name,
      color: filament.color,
      colorHex: filament.colorHex || "#3b82f6",
      stockLevel: filament.stockLevel,
      costPerKg: filament.costPerKg,
    });
    setIsFilamentSheetOpen(true);
  };

  const handleDeleteFilament = async (filamentId: string) => {
    if (!user) return;
    const filamentDocRef = doc(firestore, "users", user.uid, "filaments", filamentId);
    const filamentSnap = await getDoc(filamentDocRef);
    if (filamentSnap.exists()) {
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: filamentSnap.id,
        originalCollection: "filaments",
        deletedAt: new Date().toISOString(),
        data: filamentSnap.data(),
      });
      await deleteDoc(filamentDocRef);
    }
  };

  const handleFilamentFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (editingFilamentId) {
      const filamentRef = doc(firestore, "users", user.uid, "filaments", editingFilamentId);
      updateDocumentNonBlocking(filamentRef, filamentFormData);
    } else {
      const newFilamentData = {
        ...filamentFormData,
        spoolWeight: filamentFormData.stockLevel,
      };
      const filamentsCollection = collection(firestore, `users/${user.uid}/filaments`);
      addDocumentNonBlocking(filamentsCollection, newFilamentData);
    }
    setIsFilamentSheetOpen(false);
  };

  const handleAddAccessory = () => {
    resetAccessoryForm();
    setIsAccessorySheetOpen(true);
  };

  const handleEditAccessory = (accessory: Accessory) => {
    setEditingAccessoryId(accessory.id);
    setAccessoryFormData({
      name: accessory.name,
      stockLevel: accessory.stockLevel,
      cost: accessory.cost,
    });
    setIsAccessorySheetOpen(true);
  };

  const handleDeleteAccessory = async (accessoryId: string) => {
    if (!user) return;
    const accessoryDocRef = doc(firestore, "users", user.uid, "accessories", accessoryId);
    const accessorySnap = await getDoc(accessoryDocRef);
    if (accessorySnap.exists()) {
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: accessorySnap.id,
        originalCollection: "accessories",
        deletedAt: new Date().toISOString(),
        data: accessorySnap.data(),
      });
      await deleteDoc(accessoryDocRef);
    }
  };

  const handleAccessoryFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (editingAccessoryId) {
      const accessoryRef = doc(firestore, "users", user.uid, "accessories", editingAccessoryId);
      updateDocumentNonBlocking(accessoryRef, accessoryFormData);
    } else {
      const accessoriesCollection = collection(firestore, `users/${user.uid}/accessories`);
      addDocumentNonBlocking(accessoriesCollection, accessoryFormData);
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
            <Button onClick={handleAddFilament}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Filamento
            </Button>
          </TabsContent>
          <TabsContent value="accessories" className="m-0">
            <Button onClick={handleAddAccessory}>
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
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="line-clamp-1">{filament.name}</CardTitle>
                    <CardDescription>{filament.color}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="h-6 w-6 rounded-full border shadow-sm mr-2"
                      style={{ backgroundColor: filament.colorHex || "#3b82f6" }}
                    ></div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditFilament(filament)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Editar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteFilament(filament.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Eliminar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Stock</span>
                      <span>{filament.stockLevel}g / {filament.spoolWeight || 1000}g</span>
                    </div>
                    <Progress value={(filament.stockLevel / (filament.spoolWeight || 1000)) * 100} className="mt-1 h-2" />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Costo por kg</span>
                    <span className="font-medium">{settings.currency}{filament.costPerKg.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {!isLoadingFilaments && filaments?.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">No hay filamentos para mostrar.</div>
          )}
        </TabsContent>

        <TabsContent value="accessories">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoadingAccessories && Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
            {!isLoadingAccessories && accessories?.map((accessory) => (
              <Card key={accessory.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="line-clamp-1">{accessory.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditAccessory(accessory)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Editar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteAccessory(accessory.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Eliminar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <span>{accessory.stockLevel} unidades</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-muted-foreground">Costo unidad</span>
                    <span className="font-medium">{settings.currency}{accessory.cost.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {!isLoadingAccessories && accessories?.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">No hay accesorios para mostrar.</div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={isFilamentSheetOpen} onOpenChange={(open) => { setIsFilamentSheetOpen(open); if (!open) resetFilamentForm(); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingFilamentId ? "Editar Filamento" : "Añadir Filamento"}</SheetTitle>
            <SheetDescription>Gestiona los detalles de tu material de impresión.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFilamentFormSubmit} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={filamentFormData.name} onChange={handleFilamentInputChange} required placeholder="Ej: PLA, PETG" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color (Nombre)</Label>
              <Input id="color" name="color" value={filamentFormData.color} onChange={handleFilamentInputChange} required placeholder="Ej: Rojo, Azul" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorHex">Color Visual</Label>
              <div className="flex items-center gap-3">
                <Input id="colorHex" name="colorHex" type="color" value={filamentFormData.colorHex} onChange={handleFilamentInputChange} className="w-16 h-10 p-1 cursor-pointer" />
                <span className="text-sm font-mono">{filamentFormData.colorHex}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockLevel">Stock (gramos)</Label>
              <Input id="stockLevel" name="stockLevel" type="number" value={filamentFormData.stockLevel} onChange={handleFilamentInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerKg">Costo por Kg</Label>
              <Input id="costPerKg" name="costPerKg" type="number" step="0.01" value={filamentFormData.costPerKg} onChange={handleFilamentInputChange} required />
            </div>
            <SheetFooter className="mt-4">
              <Button type="submit">{editingFilamentId ? "Guardar Cambios" : "Crear Filamento"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={isAccessorySheetOpen} onOpenChange={(open) => { setIsAccessorySheetOpen(open); if (!open) resetAccessoryForm(); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingAccessoryId ? "Editar Accesorio" : "Añadir Accesorio"}</SheetTitle>
            <SheetDescription>Gestiona los detalles de tus componentes extra.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAccessoryFormSubmit} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="acc-name">Nombre</Label>
              <Input id="acc-name" name="name" value={accessoryFormData.name} onChange={handleAccessoryInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-stock">Stock (unidades)</Label>
              <Input id="acc-stock" name="stockLevel" type="number" value={accessoryFormData.stockLevel} onChange={handleAccessoryInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-cost">Costo por Unidad</Label>
              <Input id="acc-cost" name="cost" type="number" step="0.01" value={accessoryFormData.cost} onChange={handleAccessoryInputChange} required />
            </div>
            <SheetFooter className="mt-4">
              <Button type="submit">{editingAccessoryId ? "Guardar Cambios" : "Crear Accesorio"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
