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
import { collection, doc, addDoc, getDoc, deleteDoc } from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  useUser,
} from "@/firebase";
import type { Expense } from "@/lib/types";
import { useSettings } from "@/hooks/use-settings";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { settings } = useSettings();

  const expensesPath = user ? `users/${user.uid}/expenses` : null;
  const { data: expenses, isLoading } = useCollection<Expense>(expensesPath);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
    null
  );

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsSheetOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsSheetOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return;
    const expenseDocRef = doc(
      firestore,
      "users",
      user.uid,
      "expenses",
      expenseId
    );
    const expenseSnap = await getDoc(expenseDocRef);
    if (expenseSnap.exists()) {
      const expenseData = expenseSnap.data();
      await addDoc(collection(firestore, "users", user.uid, "trash"), {
        originalId: expenseSnap.id,
        originalCollection: "expenses",
        deletedAt: new Date().toISOString(),
        data: expenseData,
      });
      await deleteDoc(expenseDocRef);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expensesCollection = user ? collection(firestore, `users/${user.uid}/expenses`) : null;
    if (!user || !expensesCollection) return;

    const formData = new FormData(event.currentTarget);
    const newExpenseData = {
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      date: new Date(formData.get("date") as string).toISOString(),
    };

    if (editingExpense) {
      const expenseDoc = doc(
        firestore,
        "users",
        user.uid,
        "expenses",
        editingExpense.id
      );
      setDocumentNonBlocking(expenseDoc, newExpenseData, { merge: true });
    } else {
      addDocumentNonBlocking(expensesCollection, newExpenseData);
    }
    setIsSheetOpen(false);
    setEditingExpense(null);
  };

  const sortedExpenses = React.useMemo(() => {
    return expenses
      ? [...expenses].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      : [];
  }, [expenses]);

  return (
    <>
      <PageHeader
        title="Gastos"
        description="Realiza un seguimiento de todos los gastos de tu negocio."
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Gastos</CardTitle>
              <CardDescription>
                Una lista de todos los gastos registrados.
              </CardDescription>
            </div>
            <Button onClick={handleAddExpense}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-4">
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            {!isLoading &&
              sortedExpenses.map((expense) => (
                <Card key={expense.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium">
                      {expense.description}
                    </CardTitle>
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
                          onClick={() => handleEditExpense(expense)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive"
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex items-end justify-between">
                    <div className="text-sm text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                    <div className="text-lg font-bold">
                      {settings.currency}
                      {expense.amount.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  sortedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {settings.currency}
                        {expense.amount.toFixed(2)}
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
                              onClick={() => handleEditExpense(expense)}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteExpense(expense.id)}
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

          {!isLoading && sortedExpenses.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              No hay gastos para mostrar.
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(isOpen) => {
          setIsSheetOpen(isOpen);
          if (!isOpen) setEditingExpense(null);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingExpense ? "Editar Gasto" : "Añadir Nuevo Gasto"}
            </SheetTitle>
            <SheetDescription>
              {editingExpense
                ? "Actualiza los detalles de este gasto."
                : "Rellena los detalles para el nuevo gasto."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingExpense?.description}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={editingExpense?.amount}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={
                    editingExpense?.date
                      ? editingExpense.date.split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">
                {editingExpense ? "Guardar Cambios" : "Crear Gasto"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
