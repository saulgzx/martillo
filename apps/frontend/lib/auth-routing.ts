import type { UserPublic, UserRole } from '@martillo/shared';

const ADMIN_ROLES: UserRole[] = ['SUPERADMIN', 'ADMIN', 'AUCTIONEER'];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}

export function resolveHomePathByRole(role: UserRole | null | undefined): string {
  return isAdminRole(role) ? '/admin/auctions' : '/dashboard';
}

export function resolveHomePathByUser(user: UserPublic | null | undefined): string {
  return resolveHomePathByRole(user?.role);
}
