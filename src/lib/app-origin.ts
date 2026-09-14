type AppOriginEnvironment = Readonly<Record<string, string | undefined>>;

export function resolveAppOrigin(env: AppOriginEnvironment = process.env): string {
  return env.APP_ORIGIN
    ?? env.NEXTAUTH_URL
    ?? (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000');
}
