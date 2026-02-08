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
import { collection, doc, deleteDoc, setDoc, increment } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
} from "@/firebase";
import type { TrashItem, Quote } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const collectionDisplayNames: { [key: string]: string } = {
    clients: 'Cliente',
    quotes: 'Cotización',
    expenses: 'Gasto',
    filaments: 'Filamento',
    accessories: 'Accesorio',
};

export default function TrashPage() {
  const firestore = useFirestore();
  const trashCollection = useMemoFirebase(() => collection(firestore, "trash"), [firestore]);
  const { data: trashItems, isLoading } = useCollection<TrashItem>(trashCollection);

  const getDisplayName = (item: TrashItem) => {
    return item.data.name || item.data.description || item.originalId;
  }
  
  const handleRestoreItem = async (item: TrashItem) => {
    const originalDocRef = doc(firestore, item.originalCollection, item.originalId);
    await setDoc(originalDocRef, item.data);

    const trashDocRef = doc(firestore, "trash", item.id);
    await deleteDoc(trashDocRef);
  };
  
  const handlePermanentDelete = (item: TrashItem) => {
    const trashDocRef = doc(firestore, "trash", item.id);
    deleteDocumentNonBlocking(trashDocRef);

    // If deleting a quote, return stock
    if (item.originalCollection === 'quotes') {
      const quoteData = item.data as Quote;
      (quoteData.materials || []).forEach(mat => {
        const filamentDoc = doc(firestore, "filaments", mat.filamentId);
        updateDocumentNonBlocking(filamentDoc, { stockLevel: increment(mat.grams) });
      });
      (quoteData.accessories || []).forEach(acc => {
        const accessoryDoc = doc(firestore, "accessories", acc.accessoryId);
        updateDocumentNonBlocking(accessoryDoc, { stockLevel: increment(acc.quantity) });
      });
    }
  };

  const sortedTrashItems = React.useMemo(() => {
    return trashItems ? [...trashItems].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()) : [];
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
            <CardDescription>Los elementos en la papelera pueden ser restaurados o eliminados permanentemente.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48"/></TableCell>
                  <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                  <TableCell><Skeleton className="h-8 w-8"/></TableCell>
                </TableRow>
              ))}
              {!isLoading && sortedTrashItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{getDisplayName(item)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{collectionDisplayNames[item.originalCollection] || 'Desconocido'}</Badge>
                  </TableCell>
                  <TableCell>{new Date(item.deletedAt).toLocaleString()}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleRestoreItem(item)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePermanentDelete(item)} className="text-destructive">
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
