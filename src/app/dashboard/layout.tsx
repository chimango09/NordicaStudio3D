'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  Calculator,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  ReceiptText,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { href: '/dashboard/quotes', icon: Calculator, label: 'Cotizaciones' },
  { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
  { href: '/dashboard/inventory', icon: Boxes, label: 'Inventario' },
  { href: '/dashboard/expenses', icon: ReceiptText, label: 'Gastos' },
  { href: '/dashboard/trash', icon: Trash2, label: 'Papelera' },
];

const settingsItem = {
  href: '/dashboard/settings',
  icon: Settings,
  label: 'Configuración',
};

const AppLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-6 w-6 text-primary"
  >
    <path
      fill="currentColor"
      d="M12 2 L2 7 L12 12 L22 7 L12 2 Z M2 9 L12 14 L22 9 L12 19 L2 9 Z"
    />
  </svg>
);

function NavLink({
  item,
  isCollapsed,
}: {
  item: (typeof navItems)[0];
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
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start overflow-hidden"
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span
                className={cn(
                  'ml-4 transition-all duration-300',
                  isCollapsed && 'w-0 opacity-0'
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
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth);
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AppLogo />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const desktopNav = (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-lg overflow-hidden"
        >
          <AppLogo />
          <span
            className={cn(
              'whitespace-nowrap transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-2'
            )}
          >
            Nórdica Studio 3D
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>
      <div className="mt-auto space-y-1 p-2">
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
      <SheetContent side="left" className="w-64 p-0 bg-card">
        <SheetHeader>
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SheetDescription className="sr-only">
            Menú principal de la aplicación
          </SheetDescription>
        </SheetHeader>
        <div className="flex h-16 items-center border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <AppLogo />
            <span className="ml-2">Nórdica Studio 3D</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Link href={item.href}>
                <item.icon className="mr-4 h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 p-2 border-t">
          <Button
            asChild
            variant={pathname === settingsItem.href ? 'secondary' : 'ghost'}
            className="w-full justify-start"
          >
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
        <header className="flex h-16 shrink-0 items-center border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-6 w-6" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            {mobileNav}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}