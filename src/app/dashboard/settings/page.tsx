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
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { useSettings } from "@/hooks/use-settings";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  electricityCost: z.coerce.number().min(0, "El costo debe ser no negativo."),
  machineCost: z.coerce.number().min(0, "El costo debe ser no negativo."),
  profitMargin: z.coerce.number().min(0, "El margen debe ser no negativo."),
  currency: z.string().min(1, "El símbolo de la moneda es obligatorio."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, isLoading, saveSettings } = useSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings,
  });

  React.useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);


  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    saveSettings(data);
    toast({
      title: "Configuración Guardada",
      description: "Tu nueva configuración se ha guardado correctamente.",
    });
    reset(data); // To reset dirty state
  };
  
  if (isLoading) {
      return (
        <>
            <PageHeader
                title="Configuración"
                description="Configura costos, márgenes de beneficio y otros ajustes de la aplicación."
            />
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-full max-w-sm" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
             <Card className="mt-6">
                <CardHeader>
                    <Skeleton className="h-7 w-56" />
                    <Skeleton className="h-4 w-full max-w-md" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Skeleton className="h-10 w-36" />
                </CardFooter>
            </Card>
        </>
      )
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Configura costos, márgenes de beneficio y otros ajustes de la aplicación."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Costos</CardTitle>
            <CardDescription>
              Establece los costos utilizados para calcular los precios de las cotizaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="electricityCost">Costo de Electricidad (por kWh)</Label>
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
              <Label htmlFor="machineCost">Costo de Uso de Máquina (por hora)</Label>
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
            <CardTitle>Configuración Financiera</CardTitle>
            <CardDescription>
              Gestiona los márgenes de beneficio y la configuración de la moneda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="profitMargin">Margen de Beneficio Predeterminado (%)</Label>
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
              <Label htmlFor="currency">Símbolo de Moneda</Label>
              <Input id="currency" {...register("currency")} />
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </>
  );
}
