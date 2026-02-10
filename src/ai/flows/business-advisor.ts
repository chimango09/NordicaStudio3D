'use server';
/**
 * @fileOverview An AI-powered business advisor for 3D printing businesses.
 * - getBusinessAnalysis - A function that analyzes business data and provides insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Quote, Expense, Filament, Accessory, Client, Settings } from '@/lib/types';

// Define input schema
const BusinessDataSchema = z.object({
  quotes: z.array(z.any()).describe('List of all quotes.'),
  expenses: z.array(z.any()).describe('List of all expenses.'),
  filaments: z.array(z.any()).describe('List of all filaments in inventory.'),
  accessories: z.array(z.any()).describe('List of all accessories in inventory.'),
  clients: z.array(z.any()).describe('List of all clients.'),
  settings: z.any().describe('The application settings, including costs and profit margins.'),
});
export type BusinessData = z.infer<typeof BusinessDataSchema>;

// Define output schema
const InsightSchema = z.object({
  title: z.string().describe('A short, catchy title for the insight.'),
  description: z.string().describe('A detailed explanation of the insight, providing context and data.'),
  recommendation: z.string().describe('A concrete, actionable recommendation based on the insight.'),
  emoji: z.string().optional().describe('An emoji that visually represents the insight (e.g., "💰", "📈", "⚠️").'),
});

const AnalysisOutputSchema = z.object({
  profitabilityAnalysis: z.array(InsightSchema).describe('Insights related to the profitability of quotes and clients.'),
  inventoryManagement: z.array(InsightSchema).describe('Insights about inventory levels, such as low stock or slow-moving items.'),
  costSavingOpportunities: z.array(InsightSchema).describe('Recommendations for reducing operational or material costs.'),
  salesOpportunities: z.array(InsightSchema).describe('Insights about potential sales, upselling, or client re-engagement.'),
});
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;


// The main function to be called from the frontend
export async function getBusinessAnalysis(input: BusinessData): Promise<AnalysisOutput> {
  return businessAdvisorFlow(input);
}


const advisorPrompt = ai.definePrompt({
  name: 'businessAdvisorPrompt',
  input: { schema: BusinessDataSchema },
  output: { schema: AnalysisOutputSchema },
  prompt: `You are an expert business advisor for a small 3D printing company. Your task is to analyze the provided business data and generate actionable insights. The data includes quotes, expenses, inventory (filaments and accessories), client lists, and business settings (like profit margin and costs).

  Analyze the data from these perspectives:

  1.  **Profitability Analysis:**
      *   Identify the most and least profitable quotes (profit = price - (materialCost + accessoryCost + machineCost + electricityCost)).
      *   Which clients are the most profitable?
      *   Are there any quotes that were sold at a loss? Highlight them.

  2.  **Inventory Management:**
      *   Identify filaments or accessories with low stock levels (e.g., less than 250g for filaments).
      *   Are there any inventory items that haven't been used in recent quotes? (slow-moving stock).
      *   Based on recent quotes, what materials are most popular?

  3.  **Cost-Saving Opportunities:**
      *   Analyze expenses. Are there recurring high costs that could be optimized?
      *   Based on machine usage costs and electricity, could printing times be optimized (e.g., printing overnight if electricity is cheaper)? (Acknowledge if you don't have time-of-day cost data).
      *   Is the profit margin in the settings appropriate?

  4.  **Sales Opportunities:**
      *   Identify clients who haven't placed an order in a while but were previously frequent customers.
      *   Are there opportunities to upsell accessories with certain types of prints?
      *   Suggest a promotion or a special offer based on popular items or to clear out slow-moving stock.

  For each insight, provide a clear title, a detailed description explaining your finding with specific data points (e.g., "Quote #XYZ for Client A was the most profitable, generating $50 in profit"), and a concrete, actionable recommendation. Add a relevant emoji to each insight.

  Here is the data:
  - Quotes: {{{json quotes}}}
  - Expenses: {{{json expenses}}}
  - Filaments: {{{json filaments}}}
  - Accessories: {{{json accessories}}}
  - Clients: {{{json clients}}}
  - Settings: {{{json settings}}}
  `,
});

const businessAdvisorFlow = ai.defineFlow(
  {
    name: 'businessAdvisorFlow',
    inputSchema: BusinessDataSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await advisorPrompt(input);
    if (!output) {
      throw new Error('The AI advisor failed to generate an analysis.');
    }
    return output;
  }
);
