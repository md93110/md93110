"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ad = {
  id: string;
  campaign_id: string;
  name: string;
  title: string | null;
  description: string | null;
  type: string;
  media_url: string | null;
  destination_url: string | null;
  status: string;
  created_at: string;
};

export default function PublicitesPage() {
  const supabase = createClient();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAds() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("ads")
          .select(
            "id, campaign_id, name, title, description, type, media_url, destination_url, status, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erreur chargement publicités :", error);
          setLoading(false);
          return;
        }

        setAds(data || []);
      } catch (error) {
        console.error("Erreur publicités :", error);
      } finally {
        setLoading(false);
      }
    }

    loadAds();
  }, []);

  function getTypeLabel(type: string) {
    switch (type) {
      case "banner":
        return "Bannière";
      case "video":
        return "Vidéo";
      case "sponsored":
        return "Contenu sponsorisé";
      default:
        return type;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "draft":
        return "Brouillon";
      case "active":
        return "Active";
      case "paused":
        return "En pause";
      case "completed":
        return "Terminée";
      default:
        return status || "Brouillon";
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400";

      case "paused":
        return "bg-orange-500/10 text-orange-400";

      case "completed":
        return "bg-slate-500/10 text-slate-400";

      default:
        return "bg-blue-500/10 text-blue-400";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold">
                HORZ <span className="text-blue-400">ADS</span>
              </h1>
            </Link>

            <p className="text-sm text-slate-400">
              Espace annonceur
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 md:block">
              Mes publicités
            </span>

            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              Retour au dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 py-8 md:block">
          <nav className="space-y-2 pr-6">
            <Link
              href="/dashboard"
              className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/campagnes"
              className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Mes campagnes
            </Link>

            <Link
              href="/dashboard/publicites"
              className="block rounded-xl bg-blue-500/10 px-4 py-3 font-medium text-blue-400"
            >
              Mes publicités
            </Link>

            <Link
              href="/dashboard/statistiques"
              className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Statistiques
            </Link>

            <Link
              href="/dashboard/facturation"
              className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Facturation
            </Link>
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 px-6 py-10 md:px-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-blue-400">
                PUBLICITÉS
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Mes publicités
              </h2>

              <p className="mt-2 text-slate-400">
                Gérez les publicités associées à vos campagnes.
              </p>
            </div>

            <Link
              href="/dashboard/publicites/nouvelle"
              className="rounded-xl bg-blue-500 px-5 py-3 text-center font-semibold hover:bg-blue-400"
            >
              + Nouvelle publicité
            </Link>
          </div>

          {/* Liste */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 p-6">
              <h3 className="text-xl font-semibold">
                Vos publicités
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Les publicités de votre compte sont affichées ici.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  Chargement des publicités...
                </div>
              ) : ads.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                    📢
                  </div>

                  <h4 className="mt-5 text-lg font-semibold">
                    Aucune publicité
                  </h4>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                    Vous n'avez encore créé aucune publicité.
                    Commencez par créer votre première publicité.
                  </p>

                  <Link
                    href="/dashboard/publicites/nouvelle"
                    className="mt-6 inline-block rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold hover:bg-blue-400"
                  >
                    Créer une publicité
                  </Link>
                </div>
              ) : (
                ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold">
                        {ad.name}
                      </h4>

                      {ad.title && (
                        <p className="mt-1 text-sm text-slate-300">
                          {ad.title}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-slate-400">
                        {getTypeLabel(ad.type)}
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(
                          ad.status
                        )}`}
                      >
                        {getStatusLabel(ad.status)}
                      </span>

                      <Link
                        href={`/dashboard/publicites/${ad.id}`}
                        className="text-sm font-medium text-blue-400 hover:text-blue-300"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}