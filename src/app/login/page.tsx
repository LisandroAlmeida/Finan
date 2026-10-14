import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const hasError = sp.error === "1";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6">
        <h1 className="mb-1 text-center text-xl font-semibold">💰 Finanças</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Digite a senha de acesso
        </p>
        <form action={loginAction} className="flex flex-col gap-3">
          <input
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Senha"
            className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          {hasError && <p className="text-sm text-destructive">Senha incorreta.</p>}
          <button className="h-10 rounded-[17px] bg-primary px-4 text-sm font-medium text-primary-foreground hover:brightness-110">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
