'use server';

/**
 * @fileOverview An AI-powered cost advisor for 3D printing jobs.
 *
 * - getOptimalPricingStrategy - A function that suggests optimal pricing strategies.
 * - AIPoweredCostAdvisorInput - The input type for the getOptimalPricingStrategy function.
 * - AIPoweredCostAdvisorOutput - The return type for the getOptimalPricingStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPoweredCostAdvisorInputSchema = z.object({
  marketData: z.string().describe('Real-time market data for similar 3D printed products.'),
  materialCosts: z.string().describe('Detailed costs of the filament and other materials used.'),
  productionFactors: z.string().describe('Information on production factors like printing time, electricity cost, and machine usage.'),
  currentPrice: z.number().describe('The current price for the 3D printed piece.'),
  profitMargin: z.number().describe('The desired profit margin for the print job.'),
});
export type AIPoweredCostAdvisorInput = z.infer<typeof AIPoweredCostAdvisorInputSchema>;

const AIPoweredCostAdvisorOutputSchema = z.object({
  suggestedPricingStrategy: z.string().describe('AI-powered suggestion for optimal pricing strategy to maximize profitability.'),
  estimatedProfit: z.number().describe('The estimated profit based on the suggested pricing strategy.'),
  justification: z.string().describe('The justification for the suggested pricing strategy.'),
});
export type AIPoweredCostAdvisorOutput = z.infer<typeof AIPoweredCostAdvisorOutputSchema>;

export async function getOptimalPricingStrategy(input: AIPoweredCostAdvisorInput): Promise<AIPoweredCostAdvisorOutput> {
  return aiPoweredCostAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredCostAdvisorPrompt',
  input: {schema: AIPoweredCostAdvisorInputSchema},
  output: {schema: AIPoweredCostAdvisorOutputSchema},
  prompt: `You are an AI-powered pricing advisor for 3D printing businesses. Analyze the provided data and suggest an optimal pricing strategy.

Real-time Market Data: {{{marketData}}}
Material Costs: {{{materialCosts}}}
Production Factors: {{{productionFactors}}}
Current Price: {{{currentPrice}}}
Desired Profit Margin: {{{profitMargin}}}

Based on this information, suggest a pricing strategy, estimate the profit, and provide a justification for your suggestion.

Output your response in JSON format.
`,
});

const aiPoweredCostAdvisorFlow = ai.defineFlow(
  {
    name: 'aiPoweredCostAdvisorFlow',
    inputSchema: AIPoweredCostAdvisorInputSchema,
    outputSchema: AIPoweredCostAdvisorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
