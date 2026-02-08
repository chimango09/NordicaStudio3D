"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getOptimalPricingStrategy,
  AIPoweredCostAdvisorInput,
  AIPoweredCostAdvisorOutput,
} from "@/ai/flows/ai-powered-cost-advisor";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { DollarSign, Lightbulb, Loader2, ServerCrash } from "lucide-react";

const formSchema = z.object({
  marketData: z.string().min(10, "Proporcione más detalles sobre los datos del mercado."),
  materialCosts: z.string().min(10, "Describa los costos de los materiales."),
  productionFactors: z.string().min(10, "Describa los factores de producción."),
  currentPrice: z.coerce.number().positive("El precio actual debe ser positivo."),
  profitMargin: z.coerce.number().min(0, "El margen de beneficio no puede ser negativo."),
});

type FormValues = AIPoweredCostAdvisorInput;

export default function AdvisorPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AIPoweredCostAdvisorOutput | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await getOptimalPricingStrategy(data);
      setResult(response);
    } catch (e) {
      setError("No se pudo obtener el asesoramiento de precios. Por favor, inténtelo de nuevo.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Asesor de Costos con IA"
        description="Obtén estrategias de precios óptimas para tus trabajos de impresión usando IA."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Trabajo</CardTitle>
            <CardDescription>
              Proporciona los detalles de tu trabajo de impresión y las condiciones del mercado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="marketData">Datos de Mercado</Label>
                <Textarea
                  id="marketData"
                  placeholder="ej., Productos similares se venden por ARS$2000-ARS$3000 en Etsy. Alta demanda de colores personalizados."
                  {...register("marketData")}
                />
                {errors.marketData && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.marketData.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="materialCosts">Costos de Material</Label>
                <Textarea
                  id="materialCosts"
                  placeholder="ej., 150g de filamento PLA a ARS$25000/kg. ARS$500 para suministros de post-procesamiento."
                  {...register("materialCosts")}
                />
                {errors.materialCosts && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.materialCosts.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="productionFactors">Factores de Producción</Label>
                <Textarea
                  id="productionFactors"
                  placeholder="ej., Tiempo de impresión de 8 horas. El costo de la electricidad es de ARS$150/kWh. El mantenimiento de la impresora es de ARS$500/hora."
                  {...register("productionFactors")}
                />
                {errors.productionFactors && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.productionFactors.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentPrice">Precio Actual (ARS$)</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    placeholder="2500.00"
                    {...register("currentPrice")}
                  />
                  {errors.currentPrice && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.currentPrice.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="profitMargin">Margen de Beneficio Deseado (%)</Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    placeholder="30"
                    {...register("profitMargin")}
                  />
                  {errors.profitMargin && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.profitMargin.message}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Obteniendo Asesoramiento...
                  </>
                ) : (
                  "Obtener Asesoramiento de Precios"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendación de la IA</CardTitle>
            <CardDescription>
              La sugerencia de nuestra IA para la estrategia de precios óptima.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[400px] items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Analizando datos...</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center gap-2 text-destructive">
                <ServerCrash className="h-8 w-8" />
                <span>{error}</span>
              </div>
            )}
            {!isLoading && !error && !result && (
              <div className="text-center text-muted-foreground">
                <Lightbulb className="mx-auto h-12 w-12" />
                <p className="mt-4">
                  Tu asesoramiento de precios aparecerá aquí una vez que envíes el formulario.
                </p>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Estrategia Sugerida</h3>
                  <p className="mt-1 text-lg font-semibold">{result.suggestedPricingStrategy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Justificación</h3>
                  <p className="mt-1">{result.justification}</p>
                </div>
                <Card className="bg-primary/10">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Beneficio Estimado</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      ARS${result.estimatedProfit.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
