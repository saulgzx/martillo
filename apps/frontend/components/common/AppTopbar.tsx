'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@martillo/shared';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { isAdminRole } from '@/lib/auth-routing';
import { apiClient } from '@/lib/api';

export function AppTopbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [hasAuthCookie, setHasAuthCookie] = useState(false);
  const [cookieRole, setCookieRole] = useState<UserRole | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const [notifUnread, setNotifUnread] = useState<number>(0);

  useEffect(() => {
    setHasAuthCookie(document.cookie.includes('martillo_auth=1'));
    const roleCookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('martillo_role='))
      ?.split('=')[1];
    if (roleCookie === 'SUPERADMIN' || roleCookie === 'ADMIN' || roleCookie === 'USER') {
      setCookieRole(roleCookie);
      return;
    }
    setCookieRole(null);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!accountOpen) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (accountRef.current && accountRef.current.contains(target)) return;
      setAccountOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [accountOpen]);

  const showAuthenticatedMenu = isAuthenticated || hasAuthCookie;
  const effectiveRole = user?.role ?? cookieRole;
  const accountLabel = useMemo(() => 'Mi cuenta', []);
  const isAdmin = isAdminRole(effectiveRole);

  useEffect(() => {
    if (!showAuthenticatedMenu || !isAdmin) return;

    let cancelled = false;
    async function loadUnread() {
      try {
        const res = await apiClient.get<{
          success: boolean;
          data: { unreadTotal: number };
        }>('/api/admin/notifications?limit=1&unreadOnly=true');
        if (!cancelled) setNotifUnread(res.data.data.unreadTotal ?? 0);
      } catch {
        if (!cancelled) setNotifUnread(0);
      }
    }

    void loadUnread();
    const timer = window.setInterval(loadUnread, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAdmin, showAuthenticatedMenu]);

  return (
    <header className="rounded-xl border border-border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Logo size={32} />
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/">Inicio</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/auctions">Remates</Link>
          </Button>
          {showAuthenticatedMenu ? (
            <>
              {isAdmin ? (
                <Button asChild size="sm">
                  <Link href="/admin">Panel Admin</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/my-adjudications">Mis adjudicaciones</Link>
                  </Button>
                </>
              )}
              {isAdmin ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/notifications">
                    Notificaciones
                    {notifUnread > 0 ? (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                        {notifUnread > 99 ? '99+' : notifUnread}
                      </span>
                    ) : null}
                  </Link>
                </Button>
              ) : null}
              <div className="relative" ref={accountRef}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAccountOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                >
                  {accountLabel}
                </Button>
                {accountOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-border bg-background p-3 shadow-lg"
                  >
                    <div className="px-2 py-2">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.fullName ?? 'Usuario'}
                      </p>
                      <p className="mt-0.5 break-all text-xs text-muted-foreground">
                        {user?.email ?? ''}
                      </p>
                    </div>

                    <div className="my-2 h-px w-full bg-border" />

                    <div className="flex flex-col gap-2">
                      {!isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAccountOpen(false);
                            router.push('/profile');
                          }}
                        >
                          Mi cuenta
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAccountOpen(false);
                            router.push('/admin');
                          }}
                        >
                          Ir al panel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          setAccountOpen(false);
                          await logout();
                          router.push('/login');
                        }}
                      >
                        Cerrar sesion
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Ingresar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
