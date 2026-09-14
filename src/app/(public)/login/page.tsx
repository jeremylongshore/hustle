'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { safeLoginRedirect } from '@/lib/auth-redirect';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        signIn('credentials', { email, password, redirect: false }),
        new Promise<never>((_, reject) => {
          deadline = setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), 15_000);
        }),
      ]);

      if (!result || result.error) {
        const err = result?.error ?? '';
        if (err.includes('EMAIL_NOT_VERIFIED')) {
          setError('Please verify your email before signing in. Check your inbox for the verification link.');
        } else {
          setError('Invalid email or password.');
        }
        return;
      }
      // Accept only a relative in-app destination from the query string.
      router.push(safeLoginRedirect(callbackUrl));
    } catch (error) {
      setError(error instanceof Error && error.message === 'LOGIN_TIMEOUT'
        ? 'Sign-in timed out. Please try again.'
        : 'Unable to sign in right now. Please try again.');
    } finally {
      if (deadline) clearTimeout(deadline);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/sport-path.jpg')" }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
          <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-2 text-center">
            Welcome Back
          </h1>
          <p className="font-body text-zinc-500 text-center mb-8">
            Sign in to your Hustle account
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body placeholder:text-zinc-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body placeholder:text-zinc-400"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-3 rounded-full font-display font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a
              href="/reset-password"
              className="block text-sm font-body text-amber-600 hover:text-amber-700 hover:underline underline-offset-4"
            >
              Forgot your password?
            </a>
            <p className="text-sm font-body text-zinc-500">
              Don&apos;t have an account?{' '}
              <a
                href="/register"
                className="text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-4"
              >
                Sign up free
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
