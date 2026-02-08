'use client';

import * as React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email no válido.'),
  password: z.string().min(1, 'La contraseña no puede estar vacía.'),
});
type LoginValues = z.infer<typeof loginSchema>;


function AppLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-primary">
            <path fill="currentColor" d="M12 2 L2 7 L12 12 L22 7 L12 2 Z M2 9 L12 14 L22 9 L12 19 L2 9 Z"/>
        </svg>
    );
}

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoggingIn },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });


  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const onLogin: SubmitHandler<LoginValues> = async ({ email, password }) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: 'El email o la contraseña son incorrectos.',
      });
    }
  };

  if (isUserLoading || user) {
    return (
         <div className="flex min-h-screen w-full bg-background items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <AppLogo />
                <p className="text-muted-foreground">Cargando...</p>
            </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6 items-center flex-col gap-3">
            <AppLogo/>
            <h1 className="text-2xl font-semibold">Nórdica Studio 3D</h1>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
                Ingresa tus credenciales para acceder al panel de control.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...loginRegister('email')}
                />
                {loginErrors.email && (
                    <p className="text-sm text-destructive">
                    {loginErrors.email.message}
                    </p>
                )}
                </div>
                <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                    id="login-password"
                    type="password"
                    {...loginRegister('password')}
                />
                {loginErrors.password && (
                    <p className="text-sm text-destructive">
                    {loginErrors.password.message}
                    </p>
                )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                </Button>
            </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
