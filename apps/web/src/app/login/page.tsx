'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/auth-context';
import { isApiStorageBackend } from '@/lib/config/storage-backend';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setPending(true);
      try {
        if (mode === 'login') {
          await login(email, password);
        } else {
          await register(email, password);
        }
        router.replace('/');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in failed.');
      } finally {
        setPending(false);
      }
    },
    [email, password, mode, login, register, router],
  );

  if (!isApiStorageBackend()) {
    return (
      <p className="text-body text-secondary">
        API storage is disabled. Set <code className="text-ui-sm">NEXT_PUBLIC_STORAGE_BACKEND=api</code> to use login.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-headline-2 text-foreground">Sign in to Audiblytics</h1>
        <p className="text-body text-secondary">
          Settings and progress are stored in Postgres when API mode is enabled.
        </p>
      </header>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'login' ? 'default' : 'outline'}
          onClick={() => setMode('login')}
        >
          Sign in
        </Button>
        <Button
          type="button"
          variant={mode === 'register' ? 'default' : 'outline'}
          onClick={() => setMode('register')}
        >
          Register
        </Button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
