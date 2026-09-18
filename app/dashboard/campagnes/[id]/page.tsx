"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  name: string;
  objective: string;
  description: string | null;
  format: string;
  location: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
  created_at: string;
};

export default function CampagneDetailPage() {
  const params = useParams();
  const router = useRouter();

  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCampaign() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(
          "Vous devez être connecté pour consulter cette campagne."
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select(
          "id, name, objective, description, format, location, start_date, end_date, budget, status, created_at"
        )
        .eq("id", campaignId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        setErrorMessage("Impossible de trouver cette campagne.");
        setLoading(false);
        return;
      }

      setCampaign(data);
      setLoading(false);
    }

    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

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

  async function handleDelete() {
    if (!campaign) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la campagne "${campaign.name}" ?\n\nCette action est définitive.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(
          "Vous devez être connecté pour supprimer cette campagne."
        );
        setDeleting(false);
        return;
      }

      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur suppression campagne :", error);
        setErrorMessage(
          "Impossible de supprimer la campagne. Veuillez réessayer."
        );
        setDeleting(false);
        return;
      }

      alert("Campagne supprimée avec succès !");

      router.push("/dashboard/campagnes");
      router.refresh();
    } catch (error) {
      console.error("Erreur inattendue :", error);

      setErrorMessage(
        "Une erreur inattendue est survenue. Veuillez réessayer."
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <p className="text-slate-400">
          Chargement de la campagne...
        </p>
      </main>
    );
  }

  if (errorMessage && !campaign) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
            <h1 className="text-2xl font-bold">
              Campagne introuvable
            </h1>

            <p className="mt-3 text-red-300">
              {errorMessage}
            </p>

            <Link
              href="/dashboard/campagnes"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              ← Retour à mes campagnes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
            <h1 className="text-2xl font-bold">
              Campagne introuvable
            </h1>

            <p className="mt-3 text-red-300">
              Cette campagne n'existe pas ou n'est plus disponible.
            </p>

            <Link
              href="/dashboard/campagnes"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              ← Retour à mes campagnes
            </Link>
          </div>
        </div>
      </main>
    );
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

          <Link
            href="/dashboard/campagnes"
            className="rounded-lg border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/5"
          >
            ← Mes campagnes
          </Link>

        </div>
      </header>

      {/* CONTENU */}
      <section className="mx-auto max-w-5xl px-6 py-12">

        {/* TITRE */}
        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Détail de la campagne
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h2 className="text-4xl font-bold">
                {campaign.name}
              </h2>

              <p className="mt-2 text-slate-400">
                Consultez les informations de votre campagne.
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${getStatusClass(
                campaign.status
              )}`}
            >
              {getStatusLabel(campaign.status)}
            </span>

          </div>
        </div>

        {/* INFORMATIONS */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">

          <div className="border-b border-white/10 px-6 py-5">
            <h3 className="text-xl font-semibold">
              Informations
            </h3>
          </div>

          <div className="divide-y divide-white/10">

            {/* NOM */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-400">
                Nom de la campagne
              </span>

              <span className="font-medium">
                {campaign.name}
              </span>
            </div>

            {/* OBJECTIF */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-400">
                Objectif
              </span>

              <span className="font-medium">
                {campaign.objective}
              </span>
            </div>

            {/* FORMAT */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-400">
                Format
              </span>

              <span className="font-medium">
                {campaign.format}
              </span>
            </div>

            {/* EMPLACEMENT */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-400">
                Emplacement
              </span>

              <span className="font-medium">
                {campaign.location}
              </span>
            </div>

            {/* DATE DEBUT */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-400">
                Date de début
              </span>

              <span className="font-medium">
                {campaign.start_date}
              </span>
            </div>

            {/* DATE FIN */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-400">
                Date de fin
              </span>

              <span className="font-medium">
                {campaign.end_date}
              </span>
            </div>

            {/* BUDGET */}
            <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-slate-400">
                Budget
              </span>

              <span className="text-xl font-bold">
                {Number(campaign.budget).toLocaleString(
                  "fr-FR",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}{" "}
                €
              </span>

            </div>

          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">

          <h3 className="text-xl font-semibold">
            Description
          </h3>

          <p className="mt-4 leading-7 text-slate-400">
            {campaign.description || "Aucune description."}
          </p>

        </div>

        {/* MESSAGE ERREUR SUPPRESSION */}
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
            {errorMessage}
          </div>
        )}

        {/* ACTIONS */}
        <div className="mt-8 flex flex-wrap gap-4">

          {/* RETOUR */}
          <Link
            href="/dashboard/campagnes"
            className="rounded-xl border border-white/10 px-6 py-3 font-medium text-slate-300 transition hover:bg-white/5"
          >
            ← Retour
          </Link>

          {/* MODIFIER */}
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/campagnes/modifier/${campaignId}`
              )
            }
            disabled={deleting}
            className="rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Modifier
          </button>

          {/* SUPPRIMER */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Suppression..." : "Supprimer la campagne"}
          </button>

        </div>

      </section>
    </main>
  );
}