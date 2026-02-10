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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  useUser,
} from "@/firebase";
import type { Expense, Filament } from "@/lib/types";
import { useSettings } from "@/hooks/use-settings";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type ExpenseFormData = {
  description: string;
  amount: number;
  date: string;
  // Filament fields
  filamentName: string;
  filamentColor: string;
  grams: number;
};

const getTodayLocalYYYYMMDD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultExpenseForm: ExpenseFormData = {
  description: "",
  amount: 0,
  date: getTodayLocalYYYYMMDD(),
  filamentName: "",
  filamentColor: "",
  grams: 0,
};

export default function ExpensesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { settings } = useSettings();
  const { toast } = useToast();

  const expensesQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "expenses");
  }, [user, firestore]);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const filamentsQuery = React.useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "filaments");
  }, [user, firestore]);
  const { data: filaments, isLoading: isLoadingFilaments } = useCollection<Filament>(filamentsQuery);

  const isLoading = isLoadingExpenses || isLoadingFilaments;

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [expenseType, setExpenseType] = React.useState<"general" | "filament">(
    "general"
  );
  const [formData, setFormData] =
    React.useState<ExpenseFormData>(defaultExpenseForm);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFilamentSelection = (filamentId: string) => {
    const selectedFilament = filaments?.find(f => f.id === filamentId);
    if (selectedFilament) {
        setFormData(prev => ({
            ...prev,
            filamentName: selectedFilament.name,
            filamentColor: selectedFilament.color,
        }));
    }
  };

  const resetForm = () => {
    setFormData(defaultExpenseForm);
    setExpenseType("general");
  };

  const handleAddExpense = () => {
    resetForm();
    setFormData({
      ...defaultExpenseForm,
      date: getTodayLocalYYYYMMDD(),
    });
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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const expensesCollection = collection(firestore, `users/${user.uid}/expenses`);

    if (expenseType === 'filament') {
      if (!formData.filamentName || !formData.filamentColor || !formData.grams || !formData.amount) {
        toast({ variant: "destructive", title: "Error", description: "Todos los campos de filamento son obligatorios." });
        return;
      }
      
      const filamentsCollection = collection(firestore, `users/${user.uid}/filaments`);
      const q = query(filamentsCollection, where("name", "==", formData.filamentName), where("color", "==", formData.filamentColor));

      try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Filament exists, update it with weighted average cost
          const filamentDoc = querySnapshot.docs[0];
          const existingFilament = filamentDoc.data() as Filament;
          
          const existingStockInG = existingFilament.stockLevel;
          const existingCostPerKg = existingFilament.costPerKg;

          // Calculate total value of existing stock
          const existingTotalValue = (existingCostPerKg / 1000) * existingStockInG;
          
          // New stock values
          const newStockInG = formData.grams;
          const newStockValue = formData.amount;

          // Calculate new totals
          const newTotalStockInG = existingStockInG + newStockInG;
          const newTotalValue = existingTotalValue + newStockValue;

          // Calculate new weighted average cost per kg, avoiding division by zero.
          const newAverageCostPerKg = newTotalStockInG > 0 ? (newTotalValue / newTotalStockInG) * 1000 : 0;
          
          const filamentRef = doc(firestore, `users/${user.uid}/filaments`, filamentDoc.id);
          await updateDoc(filamentRef, {
            stockLevel: newTotalStockInG,
            costPerKg: newAverageCostPerKg 
          });

        } else {
          // New filament, calculate costPerKg directly
          const newCostPerKg = formData.grams > 0 ? (formData.amount / formData.grams) * 1000 : 0;
          await addDoc(filamentsCollection, {
            name: formData.filamentName,
            color: formData.filamentColor,
            stockLevel: formData.grams,
            costPerKg: newCostPerKg
          });
        }

        const expenseDescription = `Compra de ${formData.grams}g de filamento ${formData.filamentName} ${formData.filamentColor}`;
        await addDoc(expensesCollection, {
          description: expenseDescription,
          amount: formData.amount,
          date: new Date(formData.date).toISOString(),
        });
        
        toast({ title: "Gasto y filamento registrados" });

      } catch (error: any) {
        console.error("Error processing filament purchase:", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo registrar la compra del filamento." });
      }

    } else {
      if (!formData.description || formData.amount <= 0) {
        toast({ variant: "destructive", title: "Error", description: "La descripción y una cantidad válida son obligatorias." });
        return;
      }
      const newExpenseData = {
        description: formData.description,
        amount: formData.amount,
        date: new Date(formData.date).toISOString(),
      };
      addDocumentNonBlocking(expensesCollection, newExpenseData);
    }

    setIsSheetOpen(false);
    resetForm();
  };

  const sortedExpenses = React.useMemo(() => {
    return expenses
      ? [...expenses].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      : [];
  }, [expenses]);

  const formatDateForDisplay = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const correctedDate = new Date(year, month, day);
    return correctedDate.toLocaleDateString();
  };

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
                      {formatDateForDisplay(expense.date)}
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
                        {formatDateForDisplay(expense.date)}
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
          if (!isOpen) resetForm();
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Añadir Nuevo Gasto</SheetTitle>
            <SheetDescription>
              Rellena los detalles para el nuevo gasto.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expenseType" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={expenseType}
                  onValueChange={(v: "general" | "filament") =>
                    setExpenseType(v)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Gasto General</SelectItem>
                    <SelectItem value="filament">Compra de Filamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {expenseType === "general" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Descripción
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
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
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                </>
              )}

              {expenseType === "filament" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="existingFilament" className="text-right">
                        Pre-rellenar
                    </Label>
                    <Select onValueChange={handleFilamentSelection}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Seleccionar filamento existente..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filaments?.map((filament) => (
                                <SelectItem key={filament.id} value={filament.id}>
                                    {filament.name} - {filament.color}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="filamentName" className="text-right">
                      Nombre Filamento
                    </Label>
                    <Input
                      id="filamentName"
                      name="filamentName"
                      value={formData.filamentName}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                      placeholder="Ej: PLA, PETG"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="filamentColor" className="text-right">
                      Color
                    </Label>
                    <Input
                      id="filamentColor"
                      name="filamentColor"
                      value={formData.filamentColor}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                      placeholder="Ej: Rojo, Negro"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="grams" className="text-right">
                      Gramos
                    </Label>
                    <Input
                      id="grams"
                      name="grams"
                      type="number"
                      value={formData.grams}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                      placeholder="Ej: 1000 para 1kg"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Costo Total
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">Crear Gasto</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
