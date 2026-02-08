"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Calculator,
  LayoutDashboard,
  PanelLeft,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Panel" },
  { href: "/dashboard/quotes", icon: Calculator, label: "Cotizaciones" },
  { href: "/dashboard/clients", icon: Users, label: "Clientes" },
  { href: "/dashboard/inventory", icon: Boxes, label: "Inventario" },
  { href: "/dashboard/expenses", icon: ReceiptText, label: "Gastos" },
];

const settingsItem = {
  href: "/dashboard/settings",
  icon: Settings,
  label: "Configuración",
};

function Logo() {
  return (
    <div className="group flex items-center gap-2.5 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-5 w-5 fill-primary-foreground">
                <path d="M244.2,88.2,140.2,24.2a20,20,0,0,0-24.4,0L11.8,88.2a20,20,0,0,0,12.2,35.8H36v80a20,20,0,0,0,20,20h40a12,12,0,0,0,12-12v-48a12,12,0,0,1,24,0v48a12,12,0,0,0,12,12h40a20,20,0,0,0,20-20v-80h12a20,20,0,0,0,12.2-35.8ZM208,112H48a12,12,0,0,0-12,12v80H56a8,8,0,0,0,8-8V140a20,20,0,0,1,20-20h72a20,20,0,0,1,20,20v56a8,8,0,0,0,8,8h20V124A12,12,0,0,0,208,112ZM128,36,227.3,96H28.7Z"></path>
            </svg>
        </div>
      <span className="text-lg font-medium text-foreground">Gestor de Impresión 3D</span>
    </div>
  );
}

function NavLink({
  item,
  isCollapsed,
}: {
  item: typeof navItems[0];
  isCollapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span
                className={cn(
                  "ml-4 transition-all duration-300",
                  isCollapsed && "ml-0 w-0"
                )}
              >
                {item.label}
              </span>
            </Link>
          </Button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">{item.label}</TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const desktopNav = (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
           {isCollapsed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-5 w-5 fill-primary-foreground">
                    <path d="M244.2,88.2,140.2,24.2a20,20,0,0,0-24.4,0L11.8,88.2a20,20,0,0,0,12.2,35.8H36v80a20,20,0,0,0,20,20h40a12,12,0,0,0,12-12v-48a12,12,0,0,1,24,0v48a12,12,0,0,0,12,12h40a20,20,0,0,0,20-20v-80h12a20,20,0,0,0,12.2-35.8ZM208,112H48a12,12,0,0,0-12,12v80H56a8,8,0,0,0,8-8V140a20,20,0,0,1,20-20h72a20,20,0,0,1,20,20v56a8,8,0,0,0,8,8h20V124A12,12,0,0,0,208,112ZM128,36,227.3,96H28.7Z"></path>
                </svg>
            </div>
           ): (
            <Logo />
           )}
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>
      <div className="mt-auto space-y-2 p-4">
        <NavLink item={settingsItem} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );

  const mobileNav = (
     <Sheet>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <PanelLeft className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo />
            </Link>
        </div>
        <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => (
                <Button key={item.href} asChild variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start">
                    <Link href={item.href}>
                        <item.icon className="mr-4 h-5 w-5" />
                        {item.label}
                    </Link>
                </Button>
            ))}
        </nav>
        <div className="mt-auto space-y-2 p-4 border-t">
            <Button asChild variant={pathname === settingsItem.href ? "secondary" : "ghost"} className="w-full justify-start">
                <Link href={settingsItem.href}>
                    <settingsItem.icon className="mr-4 h-5 w-5" />
                    {settingsItem.label}
                </Link>
            </Button>
        </div>
        </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {desktopNav}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleSidebar}>
              <PanelLeft className="h-6 w-6" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            {mobileNav}
          </div>
          <div className="ml-auto">
            {/* User Profile / Actions can go here */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
