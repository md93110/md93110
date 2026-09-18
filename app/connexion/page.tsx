"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold">HORZ ADS</div>

          <h1 className="mt-6 text-3xl font-bold">
            Se connecter
          </h1>

          <p className="mt-2 text-slate-400">
            Accédez à votre espace annonceur.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <label
            htmlFor="email"
            className="block text-sm mb-2"
          >
            Adresse e-mail
          </label>

          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@entreprise.fr"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
          />

          <label
            htmlFor="password"
            className="block text-sm mb-2 mt-5"
          >
            Mot de passe
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          {message && (
            <p className="mt-4 rounded-lg bg-slate-800 px-4 py-3 text-sm text-slate-300">
              {message}
            </p>
          )}

          <div className="mt-6 text-center text-sm text-slate-400">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="font-semibold text-white hover:underline"
            >
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}