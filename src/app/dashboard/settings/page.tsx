"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DUMMY_SETTINGS } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";

const settingsSchema = z.object({
  electricityCost: z.coerce.number().min(0, "Cost must be non-negative."),
  machineCost: z.coerce.number().min(0, "Cost must be non-negative."),
  profitMargin: z.coerce.number().min(0, "Margin must be non-negative."),
  currency: z.string().min(1, "Currency symbol is required."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DUMMY_SETTINGS,
  });

  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    // Simulate saving data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Settings saved:", data);
    toast({
      title: "Settings Saved",
      description: "Your new settings have been successfully saved.",
    });
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure costs, profit margins, and other application settings."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Cost Configuration</CardTitle>
            <CardDescription>
              Set the costs used for calculating quote prices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="electricityCost">Electricity Cost (per kWh)</Label>
              <Input
                id="electricityCost"
                type="number"
                step="0.01"
                {...register("electricityCost")}
              />
              {errors.electricityCost && (
                <p className="text-sm text-destructive">{errors.electricityCost.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="machineCost">Machine Usage Cost (per hour)</Label>
              <Input
                id="machineCost"
                type="number"
                step="0.01"
                {...register("machineCost")}
              />
               {errors.machineCost && (
                <p className="text-sm text-destructive">{errors.machineCost.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Financial Settings</CardTitle>
            <CardDescription>
              Manage profit margins and currency settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="profitMargin">Default Profit Margin (%)</Label>
              <Input
                id="profitMargin"
                type="number"
                step="1"
                {...register("profitMargin")}
              />
               {errors.profitMargin && (
                <p className="text-sm text-destructive">{errors.profitMargin.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency Symbol</Label>
              <Input id="currency" {...register("currency")} />
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </>
  );
}
