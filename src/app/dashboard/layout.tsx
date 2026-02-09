'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Boxes,
  Calculator,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  PanelLeft,
  ReceiptText,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { getAuth, signOut, updatePassword, updateEmail } from 'firebase/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from '@/hooks/use-settings';


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

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

const emailSchema = z.object({
  newEmail: z.string().email('Por favor, ingresa un email válido.'),
});
type EmailFormValues = z.infer<typeof emailSchema>;


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const { settings, isLoading: isLoadingSettings } = useSettings();
  const [showBackupReminder, setShowBackupReminder] = React.useState(false);

  React.useEffect(() => {
    if (isLoadingSettings || !settings || settings.backupReminderDays === 0) {
      setShowBackupReminder(false);
      return;
    }

    const lastBackupDateStr = localStorage.getItem('lastBackupDate');
    if (!lastBackupDateStr) {
      setShowBackupReminder(true);
      return;
    }

    const lastBackupDate = new Date(lastBackupDateStr);
    const today = new Date();
    const daysSinceLastBackup = (today.getTime() - lastBackupDate.getTime()) / (1000 * 3600 * 24);

    setShowBackupReminder(daysSinceLastBackup > settings.backupReminderDays);

  }, [settings, isLoadingSettings, pathname]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset: resetPasswordForm,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });
  
  const {
    register: emailRegister,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: isChangingEmail },
    reset: resetEmailForm,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const onPasswordChangeSubmit: SubmitHandler<PasswordFormValues> = async (data) => {
    if (!user) return;
    try {
      await updatePassword(user, data.newPassword);
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
      setIsPasswordDialogOpen(false);
      resetPasswordForm();
    } catch (error: any) {
      let description = "Ocurrió un error al cambiar tu contraseña.";
      if (error.code === 'auth/requires-recent-login') {
        description = "Esta operación es sensible y requiere autenticación reciente. Por favor, cierra sesión y vuelve a ingresar antes de intentarlo de nuevo.";
      }
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: description,
      });
    }
  };
  
  const onEmailChangeSubmit: SubmitHandler<EmailFormValues> = async (data) => {
    if (!user) return;
    try {
      await updateEmail(user, data.newEmail);
      toast({
        title: "Email actualizado",
        description: "Tu dirección de email ha sido cambiada. Se cerrará tu sesión para que vuelvas a ingresar.",
      });
      setIsEmailDialogOpen(false);
      resetEmailForm();
      setTimeout(() => {
        handleSignOut();
      }, 3000);
    } catch (error: any) {
      let description = "Ocurrió un error al cambiar tu email.";
      if (error.code === 'auth/requires-recent-login') {
        description = "Esta operación es sensible y requiere autenticación reciente. Por favor, cierra sesión y vuelve a ingresar antes de intentarlo de nuevo.";
      } else if (error.code === 'auth/email-already-in-use') {
        description = "Esta dirección de email ya está en uso por otra cuenta.";
      }
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: description,
      });
    }
  };

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
    <>
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
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                        <Bell className="h-5 w-5" />
                        {showBackupReminder && (
                            <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-destructive flex" />
                        )}
                        <span className="sr-only">Notificaciones</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {showBackupReminder && settings ? (
                        <DropdownMenuItem asChild className="cursor-pointer !p-0">
                            <Link href="/dashboard/settings" className="flex flex-col items-start gap-1 p-2">
                                <p className="font-medium">Recordatorio de copia de seguridad</p>
                                <p className="text-xs text-muted-foreground whitespace-normal">Ha pasado más de {settings.backupReminderDays} días desde tu último backup.</p>
                            </Link>
                        </DropdownMenuItem>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center p-4">
                            No hay notificaciones nuevas.
                        </div>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
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
                    onClick={() => setIsEmailDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Cambiar Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsPasswordDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Cambiar Contraseña</span>
                  </DropdownMenuItem>
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

      <Dialog open={isEmailDialogOpen} onOpenChange={(isOpen) => {
        setIsEmailDialogOpen(isOpen);
        if (!isOpen) {
          resetEmailForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Email</DialogTitle>
            <DialogDescription>
             Ingresa tu nueva dirección de email. Se cerrará tu sesión actual para que vuelvas a ingresar con el nuevo email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit(onEmailChangeSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newEmail">Nuevo Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder={user.email ?? ""}
                  {...emailRegister("newEmail")}
                />
                {emailErrors.newEmail && <p className="text-sm text-destructive">{emailErrors.newEmail.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isChangingEmail}>
                {isChangingEmail ? "Actualizando..." : "Actualizar Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPasswordDialogOpen} onOpenChange={(isOpen) => {
        setIsPasswordDialogOpen(isOpen);
        if (!isOpen) {
          resetPasswordForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu nueva contraseña. Esta operación es sensible y puede requerir que inicies sesión de nuevo si tu sesión actual es muy antigua.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onPasswordChangeSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...register("newPassword")}
                />
                {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
