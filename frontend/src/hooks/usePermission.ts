import { useAuthStore } from '../stores/authStore';

export function usePermission(permissionCode: string): boolean {
  const permissions = useAuthStore((state) => state.permissions);
  return permissions.includes(permissionCode);
}

export function useHasAnyPermission(...permissionCodes: string[]): boolean {
  const permissions = useAuthStore((state) => state.permissions);
  return permissionCodes.some((code) => permissions.includes(code));
}
