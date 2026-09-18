import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight">
            HORZ ADS
          </h1>

          <p className="mt-4 text-lg text-slate-400">
            La plateforme publicitaire de HORZ
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/connexion"
            className="rounded-xl bg-white px-8 py-4 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Se connecter
          </Link>

          <Link
            href="/inscription"
            className="rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 font-semibold transition hover:bg-slate-800"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}