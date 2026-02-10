"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
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
  collection,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  useUser,
} from "@/firebase";
import type { Client } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

type ClientFormData = Omit<Client, "id">;

const defaultClientForm: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export default function ClientsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const clientsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "clients");
  }, [user, firestore]);
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [formData, setFormData] =
    React.useState<ClientFormData>(defaultClientForm);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClient = () => {
    setFormData(defaultClientForm);
    setIsSheetOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    const clientDocRef = doc(firestore, "users", user.uid, "clients", clientId);
    const clientSnap = await getDoc(clientDocRef);
    if (clientSnap.exists()) {
      const clientData = clientSnap.data();
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: clientSnap.id,
        originalCollection: "clients",
        deletedAt: new Date().toISOString(),
        data: clientData,
      });
      await deleteDoc(clientDocRef);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const clientsCollection = collection(
      firestore,
      `users/${user.uid}/clients`
    );
    addDocumentNonBlocking(clientsCollection, formData);

    setIsSheetOpen(false);
  };

  const resetState = () => {
    setFormData(defaultClientForm);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gestiona tus clientes y su información."
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Una lista de todos tus clientes.</CardDescription>
            </div>
            <Button onClick={handleAddClient}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            {!isLoading &&
              clients?.map((client) => (
                <Card key={client.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-destructive"
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    {client.email && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-semibold">Email:</span>{" "}
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-semibold">Teléfono:</span>{" "}
                        {client.phone}
                      </div>
                    )}
                    {client.address && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-semibold">Dirección:</span>{" "}
                        {client.address}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  clients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.address}</TableCell>
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
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-destructive"
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {!isLoading && clients?.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              No hay clientes para mostrar.
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(isOpen) => {
          setIsSheetOpen(isOpen);
          if (!isOpen) {
            resetState();
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Añadir Nuevo Cliente</SheetTitle>
            <SheetDescription>
              Rellena los detalles para el nuevo cliente.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Dirección
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">Crear Cliente</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
