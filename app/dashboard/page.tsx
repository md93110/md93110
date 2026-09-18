"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type AdStat = {
  impressions: number;
  clicks: number;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignCount, setCampaignCount] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
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
          console.error("Erreur chargement dashboard :", error);
          setLoading(false);
          return;
        }

        const userCampaigns = data || [];

        setCampaigns(userCampaigns);
        setCampaignCount(userCampaigns.length);

        const budget = userCampaigns.reduce(
          (total, campaign) => total + Number(campaign.budget || 0),
          0
        );

        setTotalBudget(budget);

        const { data: statsData, error: statsError } =
          await supabase.rpc("get_ad_stats");

        if (!statsError && statsData) {
          const impressions = statsData.reduce(
            (total: number, stat: AdStat) =>
              total + Number(stat.impressions || 0),
            0
          );

          const clicks = statsData.reduce(
            (total: number, stat: AdStat) =>
              total + Number(stat.clicks || 0),
            0
          );

          setTotalImpressions(impressions);
          setTotalClicks(clicks);
        }
      } catch (error) {
        console.error("Erreur dashboard :", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR");
  }

  function formatBudget(amount: number) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "En attente";
      case "running":
        return "En cours";
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

      case "running":
        return "bg-amber-500/10 text-amber-400";

      case "completed":
        return "bg-slate-500/10 text-slate-400";

      case "paused":
        return "bg-orange-500/10 text-orange-400";

      default:
        return "bg-blue-500/10 text-blue-400";
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/connexion";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              HORZ <span className="text-blue-400">ADS</span>
            </h1>

            <p className="text-sm text-slate-400">
              Espace annonceur
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 md:block">
              Mon compte
            </span>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 py-8 md:block">
          <nav className="space-y-2 pr-6">
            <Link
              href="/dashboard"
              className="block rounded-xl bg-blue-500/10 px-4 py-3 font-medium text-blue-400"
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
              className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
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
                TABLEAU DE BORD
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Bonjour 👋
              </h2>

              <p className="mt-2 text-slate-400">
                Suivez les performances de vos campagnes publicitaires.
              </p>
            </div>

            <Link
              href="/dashboard/campagnes/nouvelle"
              className="rounded-xl bg-blue-500 px-5 py-3 text-center font-semibold hover:bg-blue-400"
            >
              + Nouvelle campagne
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {/* Campagnes */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-400">
                Campagnes
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loading ? "..." : campaignCount}
              </p>
            </div>

            {/* Impressions */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-400">
                Impressions
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loading ? "..." : totalImpressions}
              </p>
            </div>

            {/* Clics */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-400">
                Clics
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loading ? "..." : totalClicks}
              </p>
            </div>

            {/* Budget */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-400">
                Budget total
              </p>

              <p className="mt-3 text-3xl font-bold">
                {loading ? "..." : formatBudget(totalBudget)}
              </p>
            </div>
          </div>

          {/* Campaigns */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h3 className="text-xl font-semibold">
                  Campagnes récentes
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Les dernières campagnes de votre compte.
                </p>
              </div>

              <Link
                href="/dashboard/campagnes"
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Voir tout
              </Link>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-6 text-sm text-slate-400">
                  Chargement des campagnes...
                </div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-300">
                    Aucune campagne pour le moment.
                  </p>

                  <Link
                    href="/dashboard/campagnes/nouvelle"
                    className="mt-4 inline-block rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold hover:bg-blue-400"
                  >
                    Créer ma première campagne
                  </Link>
                </div>
              ) : (
                campaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h4 className="font-semibold">
                        {campaign.name}
                      </h4>

                      <p className="mt-1 text-sm text-slate-400">
                        {campaign.format} ·{" "}
                        {formatDate(campaign.start_date)} →{" "}
                        {formatDate(campaign.end_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-slate-400">
                          Budget
                        </p>

                        <p className="font-semibold">
                          {formatBudget(Number(campaign.budget))}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(
                          campaign.status
                        )}`}
                      >
                        {getStatusLabel(campaign.status)}
                      </span>

                      <Link
                        href={`/dashboard/campagnes/${campaign.id}`}
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