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
      <div className="w-full max-w-sm rounded-xl border border-black/10 p-6 dark:border-white/10">
        <h1 className="mb-1 text-center text-xl font-semibold">💰 Finanças</h1>
        <p className="mb-6 text-center text-sm text-black/50 dark:text-white/50">
          Digite a senha de acesso
        </p>
        <form action={loginAction} className="flex flex-col gap-3">
          <input
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Senha"
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
          {hasError && <p className="text-sm text-red-600">Senha incorreta.</p>}
          <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
