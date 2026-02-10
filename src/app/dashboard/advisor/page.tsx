'use client';

import * as React from 'react';
import { Sparkles, Bot, Zap, Package, DollarSign, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { useSettings } from '@/hooks/use-settings';
import { collection } from 'firebase/firestore';
import type { Quote, Expense, Filament, Accessory, Client, Settings } from '@/lib/types';
import { getBusinessAnalysis, type AnalysisOutput } from '@/ai/flows/business-advisor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const InsightCard = ({ insight, icon: Icon }: { insight: any; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="flex-1">
        <CardTitle className="text-lg">{insight.emoji} {insight.title}</CardTitle>
        <CardDescription className="mt-1">{insight.description}</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-start gap-3 rounded-md border border-dashed border-amber-500/50 bg-amber-500/5 p-3">
        <Lightbulb className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Recomendación:</span> {insight.recommendation}</p>
      </div>
    </CardContent>
  </Card>
);

const Section = ({ title, insights, icon }: { title: string; insights: any[]; icon: React.ElementType }) => {
    if (!insights || insights.length === 0) return null;
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">{title}</h2>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} icon={icon} />
                ))}
            </div>
        </div>
    );
};


export default function AdvisorPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { settings, isLoading: isLoadingSettings } = useSettings();

    const [analysis, setAnalysis] = React.useState<AnalysisOutput | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Data fetching hooks
    const quotesQuery = React.useMemo(() => user ? collection(firestore, 'users', user.uid, 'quotes') : null, [user, firestore]);
    const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);

    const expensesQuery = React.useMemo(() => user ? collection(firestore, 'users', user.uid, 'expenses') : null, [user, firestore]);
    const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

    const filamentsQuery = React.useMemo(() => user ? collection(firestore, 'users', user.uid, 'filaments') : null, [user, firestore]);
    const { data: filaments, isLoading: isLoadingFilaments } = useCollection<Filament>(filamentsQuery);
    
    const accessoriesQuery = React.useMemo(() => user ? collection(firestore, 'users', user.uid, 'accessories') : null, [user, firestore]);
    const { data: accessories, isLoading: isLoadingAccessories } = useCollection<Accessory>(accessoriesQuery);
    
    const clientsQuery = React.useMemo(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [user, firestore]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

    const isDataLoading = isLoadingQuotes || isLoadingExpenses || isLoadingFilaments || isLoadingAccessories || isLoadingClients || isLoadingSettings;

    const handleGenerateAnalysis = async () => {
        if (isDataLoading || !quotes || !expenses || !filaments || !accessories || !clients || !settings) {
            setError("Los datos aún se están cargando. Por favor, espera un momento y vuelve a intentarlo.");
            return;
        }

        setIsLoadingAnalysis(true);
        setError(null);
        setAnalysis(null);

        try {
            const businessData = {
                quotes,
                expenses,
                filaments,
                accessories,
                clients,
                settings
            };
            const result = await getBusinessAnalysis(businessData);
            setAnalysis(result);
        } catch (e: any) {
            console.error("Error generating AI analysis:", e);
            setError(e.message || "Ocurrió un error al generar el análisis. Por favor, intenta de nuevo.");
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Asesor de Negocios IA"
                description="Obtén insights y recomendaciones personalizadas para hacer crecer tu negocio de impresión 3D."
            />

            <Card className="mb-8">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Generar Nuevo Análisis</CardTitle>
                        <CardDescription>
                            El asesor IA analizará todos tus datos para encontrar oportunidades de mejora.
                        </CardDescription>
                    </div>
                    <Button onClick={handleGenerateAnalysis} disabled={isLoadingAnalysis || isDataLoading}>
                        {isLoadingAnalysis ? (
                            <>
                                <Bot className="mr-2 h-4 w-4 animate-spin" />
                                Analizando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {analysis ? 'Volver a Analizar' : 'Analizar mi Negocio'}
                            </>
                        )}
                    </Button>
                </CardHeader>
            </Card>

            {error && (
                 <Alert variant="destructive" className="mb-8">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoadingAnalysis && (
                <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                     <Skeleton className="h-8 w-64 mt-6" />
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            )}

            {analysis && (
                <div className="space-y-8">
                    <Section title="Análisis de Rentabilidad" insights={analysis.profitabilityAnalysis} icon={DollarSign} />
                    <Section title="Gestión de Inventario" insights={analysis.inventoryManagement} icon={Package} />
                    <Section title="Oportunidades de Venta" insights={analysis.salesOpportunities} icon={Zap} />
                    <Section title="Ahorro de Costos" insights={analysis.costSavingOpportunities} icon={DollarSign} />
                </div>
            )}
             {!analysis && !isLoadingAnalysis && !error && (
                 <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                    <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Listo para analizar</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Haz clic en &quot;Analizar mi Negocio&quot; para empezar.
                    </p>
                </div>
            )}
        </>
    );
}
