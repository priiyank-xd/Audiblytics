'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { isApiStorageBackend } from '@/lib/config/storage-backend';

function AuthSkeleton() {
  return (
    <div className="flex min-h-[min(70vh,32rem)] flex-col justify-center gap-3 py-8">
      <div className="h-8 max-w-sm rounded-md bg-muted" />
      <div className="h-24 w-full rounded-xl bg-muted" />
    </div>
  );
}

export type AuthGateProps = {
  children: ReactNode;
};

/** Redirects unauthenticated users to `/login` when `STORAGE_BACKEND=api` (BV4.3). */
export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? '';
  const router = useRouter();

  useEffect(() => {
    if (!isApiStorageBackend() || loading || user || pathname === '/login') return;
    router.replace('/login');
  }, [loading, user, pathname, router]);

  if (!isApiStorageBackend()) {
    return children;
  }

  if (loading) {
    return <AuthSkeleton />;
  }

  if (pathname === '/login') {
    return children;
  }

  if (!user) {
    return <AuthSkeleton />;
  }

  return children;
}
