"use client";

import * as React from "react";
import { MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
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
  collection,
  doc,
  deleteDoc,
  setDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { useFirestore, useCollection, useUser } from "@/firebase";
import type { TrashItem, Quote } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const collectionDisplayNames: { [key: string]: string } = {
  clients: "Cliente",
  quotes: "Cotización",
  expenses: "Gasto",
  filaments: "Filamento",
  accessories: "Accesorio",
};

export default function TrashPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const trashQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "trash");
  }, [user, firestore]);
  const { data: trashItems, isLoading } = useCollection<TrashItem>(trashQuery);

  const getDisplayName = (item: TrashItem) => {
    return item.data.name || item.data.description || item.originalId;
  };

  const handleRestoreItem = async (item: TrashItem) => {
    if (!user) return;
    try {
      const originalDocRef = doc(
        firestore,
        "users",
        user.uid,
        item.originalCollection,
        item.originalId
      );
      await setDoc(originalDocRef, item.data);

      const trashDocRef = doc(firestore, "users", user.uid, "trash", item.id);
      await deleteDoc(trashDocRef);
      toast({ title: "Elemento Restaurado" });
    } catch (error) {
      console.error("Error restoring item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo restaurar el elemento.",
      });
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (!user) return;

    try {
      // If deleting a quote that was pending, return stock first.
      if (item.originalCollection === "quotes") {
        const quoteData = item.data as Quote;
        if (quoteData.status === "Pendiente") {
          const stockUpdates: Promise<void>[] = [];

          (quoteData.materials || []).forEach((mat) => {
            if (mat.filamentId && mat.grams > 0) {
              const filamentDocRef = doc(
                firestore,
                "users",
                user.uid,
                "filaments",
                mat.filamentId
              );
              stockUpdates.push(
                updateDoc(filamentDocRef, { stockLevel: increment(mat.grams) })
              );
            }
          });

          (quoteData.accessories || []).forEach((acc) => {
            if (acc.accessoryId && acc.quantity > 0) {
              const accessoryDocRef = doc(
                firestore,
                "users",
                user.uid,
                "accessories",
                acc.accessoryId
              );
              stockUpdates.push(
                updateDoc(accessoryDocRef, {
                  stockLevel: increment(acc.quantity),
                })
              );
            }
          });

          if (stockUpdates.length > 0) {
            await Promise.all(stockUpdates);
            toast({
              title: "Stock Restaurado",
              description:
                "Los materiales de la cotización han sido devueltos al inventario.",
            });
          }
        }
      }

      // After stock is returned (if applicable), delete the item from trash.
      const trashDocRef = doc(firestore, "users", user.uid, "trash", item.id);
      await deleteDoc(trashDocRef);

      toast({
        title: "Elemento Eliminado Permanentemente",
      });
    } catch (error) {
      console.error("Error during permanent delete:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el elemento o restaurar el stock.",
      });
    }
  };

  const sortedTrashItems = React.useMemo(() => {
    return trashItems
      ? [...trashItems].sort(
          (a, b) =>
            new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
        )
      : [];
  }, [trashItems]);

  return (
    <>
      <PageHeader
        title="Papelera"
        description="Revisa y gestiona los elementos eliminados."
      />
      <Card>
        <CardHeader>
          <CardTitle>Elementos Eliminados</CardTitle>
          <CardDescription>
            Los elementos en la papelera pueden ser restaurados o eliminados
            permanentemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-24" />
                  </CardContent>
                </Card>
              ))}
            {!isLoading &&
              sortedTrashItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base font-medium">
                        {getDisplayName(item)}
                      </CardTitle>
                      <CardDescription>
                        {new Date(item.deletedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleRestoreItem(item)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePermanentDelete(item)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Permanentemente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">
                      {collectionDisplayNames[item.originalCollection] ||
                        "Desconocido"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha de Eliminación</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  sortedTrashItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {getDisplayName(item)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {collectionDisplayNames[item.originalCollection] ||
                            "Desconocido"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(item.deletedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
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
                            <DropdownMenuItem
                              onClick={() => handleRestoreItem(item)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restaurar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePermanentDelete(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {!isLoading && sortedTrashItems.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              La papelera está vacía.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
