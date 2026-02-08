import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

const metrics = [
  {
    icon: DollarSign,
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1% from last month",
    color: "text-green-500",
  },
  {
    icon: ReceiptText,
    title: "Total Expenses",
    value: "$12,874.21",
    change: "+15.3% from last month",
    color: "text-red-500",
  },
  {
    icon: DollarSign,
    title: "Total Profit",
    value: "$32,357.68",
    change: "+22.4% from last month",
    color: "text-green-500",
  },
  {
    icon: Package,
    title: "Active Quotes",
    value: "12",
    change: "+5 since last week",
    color: "text-blue-500",
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Here's a quick overview of your 3D printing business."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A log of recent quotes and completed prints.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No recent activity to show.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Filament Stock Levels</CardTitle>
                <CardDescription>An overview of your current inventory.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Inventory levels are stable.</p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
