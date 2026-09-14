/** Normalize the untrusted return path before passing it to the client router. */
export function safeLoginRedirect(value: string): string {
  const base = 'https://local.invalid';
  if (!value.startsWith('/')) return '/dashboard';
  try {
    const target = new URL(value, base);
    return target.origin === base ? target.pathname + target.search + target.hash : '/dashboard';
  } catch {
    return '/dashboard';
  }
}
