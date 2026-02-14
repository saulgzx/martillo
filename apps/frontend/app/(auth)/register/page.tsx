'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { isValidChileanRut } from '@/lib/rut';
import { useAuthStore } from '@/store/auth.store';
import { resolveHomePathByUser } from '@/lib/auth-routing';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Nombre requerido'),
    rut: z.string().refine((value) => isValidChileanRut(value), 'RUT inválido'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(6, 'Teléfono inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Incluye al menos 1 mayúscula')
      .regex(/[0-9]/, 'Incluye al menos 1 número'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    await registerUser({
      fullName: values.fullName,
      rut: values.rut,
      email: values.email,
      phone: values.phone,
      password: values.password,
    });
    const nextUser = useAuthStore.getState().user ?? user;
    router.push(resolveHomePathByUser(nextUser));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nombre completo" error={errors.fullName?.message}>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('fullName')}
        />
      </FormField>

      <FormField label="RUT" error={errors.rut?.message}>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('rut')}
        />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <input
          type="email"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('email')}
        />
      </FormField>

      <FormField label="Teléfono" error={errors.phone?.message}>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('phone')}
        />
      </FormField>

      <FormField label="Contraseña" error={errors.password?.message}>
        <input
          type="password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('password')}
        />
      </FormField>

      <FormField label="Confirmar contraseña" error={errors.confirmPassword?.message}>
        <input
          type="password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('confirmPassword')}
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner />
            Creando cuenta...
          </span>
        ) : (
          'Crear cuenta'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
