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
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const loginSchema = z.object({
  email: z.string().email('Email no válido.'),
  password: z.string().min(1, 'La contraseña no puede estar vacía.'),
});
type LoginValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z.string().email('Email no válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type SignupValues = z.infer<typeof signupSchema>;

function AppLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-primary">
            <path fill="currentColor" d="M12 2 L2 7 L12 12 L22 7 L12 2 Z M2 9 L12 14 L22 9 L12 19 L2 9 Z"/>
        </svg>
    );
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.88 1.62-4.42 0-8.03-3.6-8.03-8.03s3.6-8.03 8.03-8.03c2.5 0 4.12.98 5.1 1.9l2.5-2.5C18.16 3.7 15.65 2.5 12.48 2.5c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.94 0 11.7-4.8 11.7-11.96 0-.8-.07-1.46-.2-2.12H12.48z"
        fill="currentColor"
      />
    </svg>
);

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

  const {
    register: signupRegister,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSigningUp },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });


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

  const onSignUp: SubmitHandler<SignupValues> = async ({ email, password }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        toast({
          title: '¡Cuenta Creada!',
          description: 'Hemos enviado un enlace de verificación a tu email.',
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      let description = 'Ocurrió un error al registrar tu cuenta.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Esta dirección de email ya está en uso por otra cuenta.';
      }
      toast({
        variant: 'destructive',
        title: 'Error de registro',
        description: description,
      });
    }
  };
  
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error con Google',
        description: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
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
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
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
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        O continúa con
                        </span>
                    </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continuar con Google
                </Button>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
             <Card>
                <CardHeader>
                    <CardTitle>Crear una cuenta</CardTitle>
                    <CardDescription>Ingresa tus datos para registrarte.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignupSubmit(onSignUp)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="tu@email.com"
                                {...signupRegister('email')}
                            />
                            {signupErrors.email && <p className="text-sm text-destructive">{signupErrors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Contraseña</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                {...signupRegister('password')}
                            />
                            {signupErrors.password && <p className="text-sm text-destructive">{signupErrors.password.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="signup-confirm-password">Confirmar Contraseña</Label>
                            <Input
                                id="signup-confirm-password"
                                type="password"
                                {...signupRegister('confirmPassword')}
                            />
                            {signupErrors.confirmPassword && <p className="text-sm text-destructive">{signupErrors.confirmPassword.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isSigningUp}>
                            {isSigningUp ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>
                    </form>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
