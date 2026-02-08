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
  marketData: z.string().min(10, "Please provide more details on market data."),
  materialCosts: z.string().min(10, "Please describe material costs."),
  productionFactors: z.string().min(10, "Please describe production factors."),
  currentPrice: z.coerce.number().positive("Current price must be positive."),
  profitMargin: z.coerce.number().min(0, "Profit margin cannot be negative."),
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
      setError("Failed to get pricing advice. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="AI-Powered Cost Advisor"
        description="Get optimal pricing strategies for your print jobs using AI."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Provide the details of your print job and market conditions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="marketData">Market Data</Label>
                <Textarea
                  id="marketData"
                  placeholder="e.g., Similar products sell for $20-$30 on Etsy. High demand for custom colors."
                  {...register("marketData")}
                />
                {errors.marketData && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.marketData.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="materialCosts">Material Costs</Label>
                <Textarea
                  id="materialCosts"
                  placeholder="e.g., 150g of PLA filament at $25/kg. $0.50 for post-processing supplies."
                  {...register("materialCosts")}
                />
                {errors.materialCosts && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.materialCosts.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="productionFactors">Production Factors</Label>
                <Textarea
                  id="productionFactors"
                  placeholder="e.g., 8-hour print time. Electricity cost is $0.15/kWh. Printer maintenance is $0.50/hour."
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
                  <Label htmlFor="currentPrice">Current Price ($)</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    {...register("currentPrice")}
                  />
                  {errors.currentPrice && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.currentPrice.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="profitMargin">Desired Profit Margin (%)</Label>
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
                    Getting Advice...
                  </>
                ) : (
                  "Get Pricing Advice"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Recommendation</CardTitle>
            <CardDescription>
              Our AI's suggestion for the optimal pricing strategy.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[400px] items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Analyzing data...</span>
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
                  Your pricing advice will appear here once you submit the form.
                </p>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Suggested Strategy</h3>
                  <p className="mt-1 text-lg font-semibold">{result.suggestedPricingStrategy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Justification</h3>
                  <p className="mt-1">{result.justification}</p>
                </div>
                <Card className="bg-primary/10">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estimated Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      ${result.estimatedProfit.toFixed(2)}
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
