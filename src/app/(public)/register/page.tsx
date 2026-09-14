'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const name = `${form.firstName} ${form.lastName}`.trim();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to create account. Please try again.');
        return;
      }
      router.push('/verify-email?email=' + encodeURIComponent(form.email));
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
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
            Create Account
          </h1>
          <p className="font-body text-zinc-500 text-center mb-8">
            Start tracking your athlete&apos;s performance
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body"
                  placeholder="Alex"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body"
                  placeholder="Smith"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body"
                placeholder="8+ characters"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-3 rounded-full font-display font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-body text-zinc-500">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-4"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
