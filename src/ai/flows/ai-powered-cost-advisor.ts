'use server';

/**
 * @fileOverview Un asesor de costos impulsado por IA para trabajos de impresión 3D.
 *
 * - getOptimalPricingStrategy - Una función que sugiere estrategias de precios óptimas.
 * - AIPoweredCostAdvisorInput - El tipo de entrada para la función getOptimalPricingStrategy.
 * - AIPoweredCostAdvisorOutput - El tipo de retorno para la función getOptimalPricingStrategy.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPoweredCostAdvisorInputSchema = z.object({
  marketData: z.string().describe('Datos de mercado en tiempo real para productos impresos en 3D similares.'),
  materialCosts: z.string().describe('Costos detallados del filamento y otros materiales utilizados.'),
  productionFactors: z.string().describe('Información sobre factores de producción como tiempo de impresión, costo de electricidad y uso de la máquina.'),
  currentPrice: z.number().describe('El precio actual de la pieza impresa en 3D.'),
  profitMargin: z.number().describe('El margen de beneficio deseado para el trabajo de impresión.'),
});
export type AIPoweredCostAdvisorInput = z.infer<typeof AIPoweredCostAdvisorInputSchema>;

const AIPoweredCostAdvisorOutputSchema = z.object({
  suggestedPricingStrategy: z.string().describe('Sugerencia impulsada por IA para una estrategia de precios óptima para maximizar la rentabilidad.'),
  estimatedProfit: z.number().describe('El beneficio estimado basado en la estrategia de precios sugerida.'),
  justification: z.string().describe('La justificación de la estrategia de precios sugerida.'),
});
export type AIPoweredCostAdvisorOutput = z.infer<typeof AIPoweredCostAdvisorOutputSchema>;

export async function getOptimalPricingStrategy(input: AIPoweredCostAdvisorInput): Promise<AIPoweredCostAdvisorOutput> {
  return aiPoweredCostAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredCostAdvisorPrompt',
  input: {schema: AIPoweredCostAdvisorInputSchema},
  output: {schema: AIPoweredCostAdvisorOutputSchema},
  prompt: `Eres un asesor de precios impulsado por IA para empresas de impresión 3D. Analiza los datos proporcionados y sugiere una estrategia de precios óptima.

Datos de mercado en tiempo real: {{{marketData}}}
Costos de materiales: {{{materialCosts}}}
Factores de producción: {{{productionFactors}}}
Precio actual: {{{currentPrice}}}
Margen de beneficio deseado: {{{profitMargin}}}

Basado en esta información, sugiere una estrategia de precios, estima el beneficio y proporciona una justificación para tu sugerencia.

Devuelve tu respuesta en formato JSON.
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
