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
import { DUMMY_EXPENSES, DUMMY_SETTINGS } from "@/lib/placeholder-data";
import type { Expense } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>(DUMMY_EXPENSES);
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

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== expenseId));
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newExpenseData = {
      id: editingExpense ? editingExpense.id : String(Date.now()),
      name: formData.get("name") as string,
      category: formData.get("category") as Expense["category"],
      amount: parseFloat(formData.get("amount") as string),
      date: new Date(formData.get("date") as string).toISOString().split("T")[0],
    };

    if (editingExpense) {
      setExpenses(
        expenses.map((e) => (e.id === editingExpense.id ? newExpenseData : e))
      );
    } else {
      setExpenses([newExpenseData, ...expenses]);
    }
    setIsSheetOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track all your business-related expenses."
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Expense List</CardTitle>
                <CardDescription>A list of all recorded expenses.</CardDescription>
            </div>
            <Button onClick={handleAddExpense}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell className="text-right">
                    {DUMMY_SETTINGS.currency}
                    {expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </SheetTitle>
            <SheetDescription>
              {editingExpense
                ? "Update the details for this expense."
                : "Fill in the details for the new expense."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingExpense?.name}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select name="category" defaultValue={editingExpense?.category} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Filament">Filament</SelectItem>
                        <SelectItem value="Accessory">Accessory</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
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
                  Date
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={editingExpense?.date || new Date().toISOString().split("T")[0]}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">{editingExpense ? "Save Changes" : "Create Expense"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
