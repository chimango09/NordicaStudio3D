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
import { collection, doc } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from "@/firebase";
import { useSettings } from "@/hooks/use-settings";
import type { Filament } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryPage() {
  const firestore = useFirestore();
  const { settings } = useSettings();
  const filamentsCollection = useMemoFirebase(() => collection(firestore, "filaments"), [firestore]);
  const { data: filaments, isLoading } = useCollection<Filament>(filamentsCollection);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingFilament, setEditingFilament] = React.useState<Filament | null>(null);

  const handleAddFilament = () => {
    setEditingFilament(null);
    setIsSheetOpen(true);
  };

  const handleEditFilament = (filament: Filament) => {
    setEditingFilament(filament);
    setIsSheetOpen(true);
  };

  const handleDeleteFilament = (filamentId: string) => {
    const filamentDoc = doc(firestore, "filaments", filamentId);
    deleteDocumentNonBlocking(filamentDoc);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
    setIsSheetOpen(false);
    setEditingFilament(null);
  };

  return (
    <>
      <PageHeader
        title="Inventario de Filamento"
        description="Rastrea y gestiona tus niveles de stock de filamento."
      />
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddFilament}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Filamento
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-1">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-9 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
        {!isLoading && filaments?.map((filament) => (
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
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditFilament(filament)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteFilament(filament.id)} className="text-destructive">
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
                <Progress value={(filament.stockLevel / 1000) * 100} className="mt-1 h-2" />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Costo por kg</span>
                <span className="font-medium">
                  {settings.currency}
                  {filament.costPerKg.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!isLoading && filaments?.length === 0 && (
        <div className="col-span-full py-10 text-center text-muted-foreground">
            No hay filamentos para mostrar.
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={(isOpen) => { setIsSheetOpen(isOpen); if (!isOpen) setEditingFilament(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingFilament ? "Editar Filamento" : "Añadir Nuevo Filamento"}
            </SheetTitle>
            <SheetDescription>
              {editingFilament
                ? "Actualiza los detalles de este filamento."
                : "Rellena los detalles para el nuevo filamento."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" name="name" defaultValue={editingFilament?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Color</Label>
                <Input id="color" name="color" defaultValue={editingFilament?.color} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockLevel" className="text-right">Stock (g)</Label>
                <Input id="stockLevel" name="stockLevel" type="number" defaultValue={editingFilament?.stockLevel} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="costPerKg" className="text-right">Costo por Kg</Label>
                <Input id="costPerKg" name="costPerKg" type="number" step="0.01" defaultValue={editingFilament?.costPerKg} className="col-span-3" required />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">{editingFilament ? "Guardar Cambios" : "Crear Filamento"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
