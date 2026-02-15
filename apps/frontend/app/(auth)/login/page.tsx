'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/store/auth.store';
import { resolveHomePathByUser } from '@/lib/auth-routing';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      const auth = await login(values);
      const targetPath = resolveHomePathByUser(auth.user);
      if (typeof window !== 'undefined') {
        window.location.assign(targetPath);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'No se pudo iniciar sesiÃ³n');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('email')}
        />
      </FormField>

      <FormField label="Contraseña" error={errors.password?.message}>
        <div className="flex gap-2">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('password')}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </Button>
        </div>
      </FormField>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner />
            Ingresando...
          </span>
        ) : (
          'Ingresar'
        )}
      </Button>

      {apiError ? (
        <p className="text-center text-sm font-medium text-destructive">{apiError}</p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-primary underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
