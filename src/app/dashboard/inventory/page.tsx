"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal, Edit } from "lucide-react";
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
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  useUser,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Filament, Accessory } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

type FilamentFormData = Omit<Filament, "id">;
type AccessoryFormData = Omit<Accessory, "id">;

const defaultFilamentForm: FilamentFormData = {
  name: "",
  color: "",
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

  const isLoading = isLoadingFilaments || isLoadingAccessories;

  const filamentToEdit = editingFilamentId ? filaments?.find(f => f.id === editingFilamentId) : null;
  const accessoryToEdit = editingAccessoryId ? accessories?.find(a => a.id === editingAccessoryId) : null;

  React.useEffect(() => {
    if (filamentToEdit) {
        setFilamentFormData({
            name: filamentToEdit.name,
            color: filamentToEdit.color,
            stockLevel: filamentToEdit.stockLevel,
            costPerKg: filamentToEdit.costPerKg,
        });
        setIsFilamentSheetOpen(true);
    }
  }, [filamentToEdit]);

  React.useEffect(() => {
    if (accessoryToEdit) {
        setAccessoryFormData({
            name: accessoryToEdit.name,
            stockLevel: accessoryToEdit.stockLevel,
            cost: accessoryToEdit.cost,
        });
        setIsAccessorySheetOpen(true);
    }
  }, [accessoryToEdit]);

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

  const handleAddFilament = () => {
    setEditingFilamentId(null);
    setFilamentFormData(defaultFilamentForm);
    setIsFilamentSheetOpen(true);
  };
  
  const handleEditFilament = (filamentId: string) => {
    setEditingFilamentId(filamentId);
  }

  const handleDeleteFilament = async (filamentId: string) => {
    if (!user) return;
    const filamentDocRef = doc(
      firestore,
      "users",
      user.uid,
      "filaments",
      filamentId
    );
    const filamentSnap = await getDoc(filamentDocRef);
    if (filamentSnap.exists()) {
      const filamentData = filamentSnap.data();
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: filamentSnap.id,
        originalCollection: "filaments",
        deletedAt: new Date().toISOString(),
        data: filamentData,
      });
      await deleteDoc(filamentDocRef);
    }
  };

  const handleFilamentFormSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!user) return;
    
    if (editingFilamentId) {
        const filamentDoc = doc(firestore, 'users', user.uid, 'filaments', editingFilamentId);
        updateDocumentNonBlocking(filamentDoc, filamentFormData);
    } else {
        const filamentsCollection = collection(firestore, `users/${user.uid}/filaments`);
        addDocumentNonBlocking(filamentsCollection, filamentFormData);
    }
    setIsFilamentSheetOpen(false);
  };

  const handleAddAccessory = () => {
    setEditingAccessoryId(null);
    setAccessoryFormData(defaultAccessoryForm);
    setIsAccessorySheetOpen(true);
  };

  const handleEditAccessory = (accessoryId: string) => {
    setEditingAccessoryId(accessoryId);
  }

  const handleDeleteAccessory = async (accessoryId: string) => {
    if (!user) return;
    const accessoryDocRef = doc(
      firestore,
      "users",
      user.uid,
      "accessories",
      accessoryId
    );
    const accessorySnap = await getDoc(accessoryDocRef);
    if (accessorySnap.exists()) {
      const accessoryData = accessorySnap.data();
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: accessorySnap.id,
        originalCollection: "accessories",
        deletedAt: new Date().toISOString(),
        data: accessoryData,
      });
      await deleteDoc(accessoryDocRef);
    }
  };

  const handleAccessoryFormSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!user) return;
    
    if (editingAccessoryId) {
        const accessoryDoc = doc(firestore, 'users', user.uid, 'accessories', editingAccessoryId);
        updateDocumentNonBlocking(accessoryDoc, accessoryFormData);
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
            {isLoadingFilaments &&
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            {!isLoadingFilaments &&
              filaments?.map((filament) => (
                <Card key={filament.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{filament.name}</CardTitle>
                        <CardDescription>{filament.color}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 rounded-full border"
                          style={{
                            backgroundColor: filament.color
                              .toLowerCase()
                              .replace(/ /g, ""),
                          }}
                        ></div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditFilament(filament.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteFilament(filament.id)}
                              className="text-destructive"
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Nivel de Stock</span>
                        <span>{filament.stockLevel}g</span>
                      </div>
                      <Progress
                        value={(filament.stockLevel / 1000) * 100}
                        className="mt-1 h-2"
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Costo por kg
                      </span>
                      <span className="font-medium">
                        {settings.currency}
                        {filament.costPerKg.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {!isLoadingFilaments && filaments?.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No hay filamentos para mostrar.
            </div>
          )}
        </TabsContent>

        <TabsContent value="accessories">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoadingAccessories &&
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            {!isLoadingAccessories &&
              accessories?.map((accessory) => (
                <Card key={accessory.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{accessory.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditAccessory(accessory.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteAccessory(accessory.id)
                            }
                            className="text-destructive"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Nivel de Stock
                      </span>
                      <span>{accessory.stockLevel} unidades</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-muted-foreground">
                        Costo por unidad
                      </span>
                      <span className="font-medium">
                        {settings.currency}
                        {accessory.cost.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {!isLoadingAccessories && accessories?.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No hay accesorios para mostrar.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet
        open={isFilamentSheetOpen}
        onOpenChange={(isOpen) => {
          setIsFilamentSheetOpen(isOpen);
          if (!isOpen) {
            setEditingFilamentId(null);
            setFilamentFormData(defaultFilamentForm);
          };
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingFilamentId ? 'Editar Filamento' : 'Añadir Nuevo Filamento'}</SheetTitle>
            <SheetDescription>
              {editingFilamentId ? 'Actualiza los detalles del filamento.' : 'Rellena los detalles para el nuevo filamento.'}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFilamentFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={filamentFormData.name}
                  onChange={handleFilamentInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">
                  Color
                </Label>
                <Input
                  id="color"
                  name="color"
                  value={filamentFormData.color}
                  onChange={handleFilamentInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockLevel" className="text-right">
                  Stock (g)
                </Label>
                <Input
                  id="stockLevel"
                  name="stockLevel"
                  type="number"
                  value={filamentFormData.stockLevel}
                  onChange={handleFilamentInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="costPerKg" className="text-right">
                  Costo por Kg
                </Label>
                <Input
                  id="costPerKg"
                  name="costPerKg"
                  type="number"
                  step="0.01"
                  value={filamentFormData.costPerKg}
                  onChange={handleFilamentInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">
                {editingFilamentId ? 'Guardar Cambios' : 'Crear Filamento'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isAccessorySheetOpen}
        onOpenChange={(isOpen) => {
          setIsAccessorySheetOpen(isOpen);
          if (!isOpen) {
            setEditingAccessoryId(null);
            setAccessoryFormData(defaultAccessoryForm);
          };
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingAccessoryId ? 'Editar Accesorio' : 'Añadir Nuevo Accesorio'}</SheetTitle>
            <SheetDescription>
            {editingAccessoryId ? 'Actualiza los detalles del accesorio.' : 'Rellena los detalles para el nuevo accesorio.'}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAccessoryFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={accessoryFormData.name}
                  onChange={handleAccessoryInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockLevel" className="text-right">
                  Stock (unidades)
                </Label>
                <Input
                  id="stockLevel"
                  name="stockLevel"
                  type="number"
                  value={accessoryFormData.stockLevel}
                  onChange={handleAccessoryInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">
                  Costo (por unidad)
                </Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  value={accessoryFormData.cost}
                  onChange={handleAccessoryInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">
                {editingAccessoryId ? 'Guardar Cambios' : 'Crear Accesorio'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
