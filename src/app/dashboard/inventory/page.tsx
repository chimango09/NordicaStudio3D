import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DUMMY_FILAMENTS, DUMMY_SETTINGS } from "@/lib/placeholder-data";
import { PageHeader } from "@/components/shared/page-header";

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Filament Inventory"
        description="Track and manage your filament stock levels."
      />
       <div className="flex justify-end mb-4">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Filament
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DUMMY_FILAMENTS.map((filament) => {
          const stockPercentage =
            (filament.currentStock / filament.initialStock) * 100;
          return (
            <Card key={filament.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{filament.name}</CardTitle>
                        <CardDescription>
                            {filament.material} - {filament.color}
                        </CardDescription>
                    </div>
                    <div className="flex h-6 w-6 rounded-full border" style={{backgroundColor: filament.color.toLowerCase().replace(/ /g, '')}}></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Stock Level</span>
                    <span>
                      {filament.currentStock}g / {filament.initialStock}g
                    </span>
                  </div>
                  <Progress value={stockPercentage} className="mt-1 h-2" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Price per kg</span>
                  <span className="font-medium">
                    {DUMMY_SETTINGS.currency}
                    {filament.pricePerKg.toFixed(2)}
                  </span>
                </div>
                 <Button variant="outline" size="sm" className="w-full mt-4">
                    Restock
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
