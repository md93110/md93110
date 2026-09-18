"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  name: string;
  objective: string;
  format: string;
  location: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
  created_at: string;
};

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCampaigns() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("Vous devez être connecté pour voir vos campagnes.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select(
          "id, name, objective, format, location, start_date, end_date, budget, status, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement campagnes :", error);
        setErrorMessage("Impossible de charger vos campagnes.");
        setLoading(false);
        return;
      }

      setCampaigns(data || []);
      setLoading(false);
    }

    loadCampaigns();
  }, []);

  function getStatusLabel(status: string) {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "En attente";
      case "completed":
        return "Terminée";
      case "paused":
        return "En pause";
      default:
        return status || "En attente";
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400";

      case "completed":
        return "bg-slate-700/50 text-slate-300";

      case "paused":
        return "bg-amber-500/10 text-amber-400";

      default:
        return "bg-blue-500/10 text-blue-400";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              HORZ <span className="text-blue-400">ADS</span>
            </h1>

            <p className="text-sm text-slate-400">
              Espace annonceur
            </p>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/campagnes/nouvelle"
              className="rounded-lg bg-blue-500 px-5 py-3 font-semibold transition hover:bg-blue-400"
            >
              + Nouvelle campagne
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENU */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Publicité
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-4xl font-bold">
                Mes campagnes
              </h2>

              <p className="mt-2 text-slate-400">
                Retrouvez toutes vos campagnes publicitaires.
              </p>
            </div>

            <Link
              href="/dashboard/campagnes/nouvelle"
              className="rounded-xl bg-blue-500 px-6 py-3 font-semibold transition hover:bg-blue-400"
            >
              + Créer une campagne
            </Link>
          </div>
        </div>

        {/* CHARGEMENT */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            Chargement de vos campagnes...
          </div>
        )}

        {/* ERREUR */}
        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {errorMessage}
          </div>
        )}

        {/* AUCUNE CAMPAGNE */}
        {!loading && !errorMessage && campaigns.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <h3 className="text-xl font-semibold">
              Aucune campagne
            </h3>

            <p className="mt-2 text-slate-400">
              Vous n'avez pas encore créé de campagne publicitaire.
            </p>

            <Link
              href="/dashboard/campagnes/nouvelle"
              className="mt-6 inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold transition hover:bg-blue-400"
            >
              Créer ma première campagne
            </Link>
          </div>
        )}

        {/* LISTE DES CAMPAGNES */}
        {!loading && !errorMessage && campaigns.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-6 py-5">
              <h3 className="text-xl font-semibold">
                Toutes mes campagnes
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {campaigns.length} campagne
                {campaigns.length > 1 ? "s" : ""} enregistrée
                {campaigns.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="px-6 py-6 transition hover:bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    {/* INFOS */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-semibold">
                          {campaign.name}
                        </h4>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            campaign.status
                          )}`}
                        >
                          {getStatusLabel(campaign.status)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                        <span>
                          Format :{" "}
                          <span className="text-slate-300">
                            {campaign.format}
                          </span>
                        </span>

                        <span>
                          Emplacement :{" "}
                          <span className="text-slate-300">
                            {campaign.location}
                          </span>
                        </span>

                        <span>
                          Objectif :{" "}
                          <span className="text-slate-300">
                            {campaign.objective}
                          </span>
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-slate-500">
                        {campaign.start_date} → {campaign.end_date}
                      </p>
                    </div>

                    {/* BUDGET */}
                    <div className="flex items-center justify-between gap-8 lg:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Budget
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {Number(campaign.budget).toLocaleString(
                            "fr-FR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          €
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/campagnes/${campaign.id}`}
                        className="rounded-lg border border-white/10 px-4 py-2 transition hover:bg-white/5"
                        >
                        Voir
                        </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}