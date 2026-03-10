
"use client";

import * as React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { useSettings } from "@/hooks/use-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore, useUser } from "@/firebase";
import { generateExcelBackup, generateJsonBackup, importJsonBackup } from "@/lib/backup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";


const settingsSchema = z.object({
  companyName: z.string().min(1, "El nombre es obligatorio."),
  companyResponsible: z.string().min(1, "El responsable es obligatorio."),
  companyPhone: z.string().min(1, "El teléfono es obligatorio."),
  companyEmail: z.string().email("Email no válido."),
  companyLocation: z.string().min(1, "La ubicación es obligatoria."),
  companyLogo: z.string().optional(),
  electricityCost: z.coerce.number().min(0, "El costo debe ser no negativo."),
  machineCost: z.coerce.number().min(0, "El costo debe ser no negativo."),
  printerConsumptionWatts: z.coerce.number().min(0, "El consumo debe ser no negativo."),
  profitMargin: z.coerce.number().min(0, "El margen debe ser no negativo."),
  currency: z.string().min(1, "El símbolo de la moneda es obligatorio."),
  backupReminderDays: z.coerce.number().min(0, "Debe ser no negativo."),
  bankAlias: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, isLoading, saveSettings } = useSettings();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [isJsonExporting, setIsJsonExporting] = React.useState(false);
  const [isJsonImporting, setIsJsonImporting] = React.useState(false);
  const [jsonFile, setJsonFile] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings,
  });

  const companyLogoValue = watch('companyLogo');

  React.useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);


  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    saveSettings(data);
    toast({
      title: "Configuración Guardada",
      description: "Tu nueva configuración se ha guardado correctamente.",
    });
    reset(data); // To reset dirty state
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setValue('companyLogo', base64String, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExcelBackup = async () => {
    if (!user || !firestore) return;
    setIsBackingUp(true);
    try {
      await generateExcelBackup(firestore, user.uid);
      toast({
        title: "Copia de Seguridad Generada",
        description: "La descarga de tu archivo Excel ha comenzado.",
      });
      localStorage.setItem('lastBackupDate', new Date().toISOString());
    } catch (e: any) {
      console.error("Failed to generate Excel backup:", e);
      toast({
        variant: "destructive",
        title: "Error al generar la copia",
        description: e.message || "No se pudo completar la generación del backup.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };
  
  const handleJsonBackup = async () => {
    if (!user || !firestore) return;
    setIsJsonExporting(true);
    try {
      await generateJsonBackup(firestore, user.uid);
      toast({
        title: "Copia de Seguridad JSON Generada",
        description: "La descarga de tu archivo JSON ha comenzado.",
      });
      localStorage.setItem('lastBackupDate', new Date().toISOString());
    } catch (e: any) {
      console.error("Failed to generate JSON backup:", e);
      toast({
        variant: "destructive",
        title: "Error al generar la copia",
        description: e.message || "No se pudo completar la generación del backup.",
      });
    } finally {
      setIsJsonExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setJsonFile(e.target.files[0]);
    } else {
      setJsonFile(null);
    }
  };

  const handleJsonImport = async () => {
    if (!user || !firestore || !jsonFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona un archivo de backup.",
      });
      return;
    }
    setIsJsonImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error("No se pudo leer el archivo.");
        }
        const data = JSON.parse(content);

        await importJsonBackup(firestore, user.uid, data);
        
        toast({
          title: "Importación Completada",
          description: "Tus datos han sido restaurados. La página se recargará.",
        });

        // Reload the page to reflect all changes
        setTimeout(() => window.location.reload(), 2000);

      } catch (e: any) {
        console.error("Failed to import JSON backup:", e);
        toast({
          variant: "destructive",
          title: "Error al importar",
          description: e.message || "No se pudo completar la importación. Verifica que el archivo sea válido.",
        });
      } finally {
        setIsJsonImporting(false);
        setJsonFile(null);
        // Reset the file input visually
        const fileInput = document.getElementById('json-import-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsText(jsonFile);
  };


  if (isLoading) {
      return (
        <>
            <PageHeader
                title="Configuración"
                description="Configura costos, márgenes de beneficio y otros ajustes de la aplicación."
            />
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-full max-w-sm" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </>
      )
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Configura costos, márgenes de beneficio y otros ajustes de la aplicación."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Datos de la Empresa</CardTitle>
                <CardDescription>
                Configura la información de tu empresa que aparecerá en las cotizaciones.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                <Label htmlFor="companyName">Nombre del Emprendimiento</Label>
                <Input id="companyName" {...register("companyName")} />
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="companyResponsible">Nombre del Responsable</Label>
                <Input id="companyResponsible" {...register("companyResponsible")} />
                {errors.companyResponsible && <p className="text-sm text-destructive">{errors.companyResponsible.message}</p>}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="companyPhone">Teléfono de Contacto</Label>
                <Input id="companyPhone" {...register("companyPhone")} />
                {errors.companyPhone && <p className="text-sm text-destructive">{errors.companyPhone.message}</p>}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="companyEmail">Email</Label>
                <Input id="companyEmail" type="email" {...register("companyEmail")} />
                {errors.companyEmail && <p className="text-sm text-destructive">{errors.companyEmail.message}</p>}
                </div>
                <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="companyLocation">Ciudad y País</Label>
                <Input id="companyLocation" {...register("companyLocation")} />
                {errors.companyLocation && <p className="text-sm text-destructive">{errors.companyLocation.message}</p>}
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="companyLogo">Logo de la Empresa</Label>
                    <Input id="companyLogo" type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} className="pt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"/>
                    {companyLogoValue && (
                        <div className="mt-2 flex items-center gap-4">
                            <img src={companyLogoValue} alt="Previsualización del logo" className="h-20 w-auto object-contain border p-1 rounded-md bg-muted/30" />
                            <Button variant="ghost" size="sm" type="button" onClick={() => setValue('companyLogo', '', { shouldDirty: true })}>Eliminar logo</Button>
                        </div>
                    )}
                </div>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Información de Pago</CardTitle>
                <CardDescription>
                Estos datos aparecerán en el PDF de la cotización para que el cliente realice la transferencia.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                <Label htmlFor="bankAlias">Alias de CBU/CVU</Label>
                <Input id="bankAlias" placeholder="Ej: mi.emprendimiento.3d" {...register("bankAlias")} />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="bankAccountName">Nombre del Titular</Label>
                <Input id="bankAccountName" placeholder="Ej: Juan Pérez" {...register("bankAccountName")} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="bankName">Banco / Entidad</Label>
                <Input id="bankName" placeholder="Ej: Mercado Pago, Banco Nación..." {...register("bankName")} />
                </div>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Configuración de Costos</CardTitle>
                <CardDescription>
                Establece los costos utilizados para calcular los precios de las cotizaciones.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                <Label htmlFor="electricityCost">Costo de Electricidad (por kWh)</Label>
                <Input
                    id="electricityCost"
                    type="number"
                    step="0.01"
                    {...register("electricityCost")}
                />
                {errors.electricityCost && (
                    <p className="text-sm text-destructive">{errors.electricityCost.message}</p>
                )}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="printerConsumptionWatts">Consumo de Impresora (Watts)</Label>
                <Input
                    id="printerConsumptionWatts"
                    type="number"
                    step="1"
                    {...register("printerConsumptionWatts")}
                />
                {errors.printerConsumptionWatts && (
                    <p className="text-sm text-destructive">{errors.printerConsumptionWatts.message}</p>
                )}
                </div>
                <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="machineCost">Costo de Uso de Máquina (por hora)</Label>
                <Input
                    id="machineCost"
                    type="number"
                    step="0.01"
                    {...register("machineCost")}
                />
                {errors.machineCost && (
                    <p className="text-sm text-destructive">{errors.machineCost.message}</p>
                )}
                </div>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Configuración Financiera</CardTitle>
                <CardDescription>
                Gestiona los márgenes de beneficio y la configuración de la moneda.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                <Label htmlFor="profitMargin">Margen de Beneficio Predeterminado (%)</Label>
                <Input
                    id="profitMargin"
                    type="number"
                    step="1"
                    {...register("profitMargin")}
                />
                {errors.profitMargin && (
                    <p className="text-sm text-destructive">{errors.profitMargin.message}</p>
                )}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="currency">Símbolo de Moneda</Label>
                <Input id="currency" {...register("currency")} />
                {errors.currency && (
                    <p className="text-sm text-destructive">{errors.currency.message}</p>
                )}
                </div>
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>
                    Configura recordatorios para mantener tu información segura.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                    <Label htmlFor="backupReminderDays">Recordatorio de copia de seguridad</Label>
                    <Controller
                        name="backupReminderDays"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={String(field.value)}
                                onValueChange={(value) => field.onChange(Number(value))}
                            >
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Frecuencia" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Nunca</SelectItem>
                                    <SelectItem value="7">Cada 7 días</SelectItem>
                                    <SelectItem value="15">Cada 15 días</SelectItem>
                                    <SelectItem value="30">Cada 30 días</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    <p className="text-sm text-muted-foreground">
                        Te mostraremos una notificación si no has hecho un backup en el período seleccionado.
                    </p>
                    {errors.backupReminderDays && <p className="text-sm text-destructive">{errors.backupReminderDays.message}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="border-t mt-6 pt-6 flex justify-start">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Guardando..." : "Guardar toda la Configuración"}
            </Button>
        </div>
      </form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Copia de Seguridad (Excel)</CardTitle>
          <CardDescription>
            Genera una copia de seguridad de toda tu información en un único archivo Excel, con cada tipo de dato en su propia hoja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Guarda este archivo en un lugar seguro. Es ideal para tener una vista clara y estructurada de todos tus registros.
          </p>
          <Button onClick={handleExcelBackup} disabled={isBackingUp} type="button">
            {isBackingUp ? "Generando..." : "Generar Backup en Excel"}
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Copia de Seguridad (JSON)</CardTitle>
            <CardDescription>
            Exporta todos tus datos a un archivo JSON o importa un backup para restaurar tu información.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <h3 className="font-medium">Exportar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Guarda un archivo JSON con todos tus datos. Ideal para restauraciones completas.
                </p>
                <Button onClick={handleJsonBackup} disabled={isJsonExporting} type="button">
                    {isJsonExporting ? "Generando..." : "Exportar a JSON"}
                </Button>
            </div>
            <Separator />
            <div>
                <h3 className="font-medium">Importar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Selecciona un archivo de backup JSON para restaurar tus datos. <strong>Advertencia:</strong> Esta acción sobrescribirá todos los datos existentes en la aplicación.
                </p>
                <div className="flex items-center gap-4">
                    <Input id="json-import-input" type="file" accept=".json" onChange={handleFileChange} className="max-w-xs" />

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={!jsonFile || isJsonImporting}>
                                {isJsonImporting ? "Importando..." : "Importar Backup"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción es irreversible y sobrescribirá permanentemente todos tus datos actuales con el contenido del archivo de backup. No podrás deshacer esta acción.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleJsonImport}>Sí, importar y sobrescribir todo</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
