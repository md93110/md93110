"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const formats = [
  {
    id: "banner",
    name: "Bannière",
    description: "Publicité graphique affichée sur les pages du média.",
  },
  {
    id: "video",
    name: "Vidéo",
    description: "Spot vidéo diffusé auprès de votre audience.",
  },
  {
    id: "sponsored",
    name: "Contenu sponsorisé",
    description: "Article ou contenu éditorial mis en avant.",
  },
];

const locations = [
  "Page d'accueil",
  "Actualités",
  "Sports",
  "Culture",
  "Toutes les pages",
];

export default function NouvelleCampagnePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("Notoriété");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("banner");
  const [location, setLocation] = useState("Page d'accueil");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedFormat = formats.find((item) => item.id === format);

  function handleContinue() {
    if (!campaignName.trim()) {
      alert("Veuillez renseigner le nom de la campagne.");
      return;
    }

    if (!startDate || !endDate) {
      alert("Veuillez sélectionner les dates de diffusion.");
      return;
    }

    if (endDate < startDate) {
      alert("La date de fin doit être après la date de début.");
      return;
    }

    if (!budget || Number(budget) <= 0) {
      alert("Veuillez renseigner un budget valide.");
      return;
    }

    setStep(2);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleBack() {
    setStep(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleCreateCampaign() {
  setLoading(true);

  try {
    const supabase = createClient();

    // Vérifier l'utilisateur connecté
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Vous devez être connecté pour créer une campagne.");
      router.push("/connexion");
      return;
    }

    // Création de la campagne dans Supabase
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name: campaignName.trim(),
      objective,
      description: description.trim(),
      format,
      location,
      start_date: startDate,
      end_date: endDate,
      budget: Number(budget),
      status: "pending",
    });

    if (error) {
      console.error("Erreur création campagne :", error);
      alert("Impossible de créer la campagne : " + error.message);
      return;
    }

    // Campagne créée avec succès
    alert("Campagne créée avec succès !");

    router.push("/dashboard/campagnes");
  } catch (error) {
    console.error(error);
    alert("Une erreur est survenue lors de la création.");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
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

          <a
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      {/* CONTENU */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        {/* TITRE */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
            Nouvelle campagne
          </p>

          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            {step === 1
              ? "Créer une campagne"
              : "Vérifiez votre campagne"}
          </h2>

          <p className="mt-3 text-slate-400">
            {step === 1
              ? "Configurez votre campagne publicitaire en quelques étapes."
              : "Vérifiez les informations avant de créer votre campagne."}
          </p>
        </div>

        {/* PROGRESSION */}
        <div className="mt-10 grid grid-cols-2 gap-3">
          <div>
            <div
              className={`h-1 rounded-full ${
                step >= 1 ? "bg-blue-500" : "bg-white/10"
              }`}
            />

            <p
              className={`mt-2 text-xs font-medium ${
                step >= 1
                  ? "text-blue-400"
                  : "text-slate-500"
              }`}
            >
              1. Configuration
            </p>
          </div>

          <div>
            <div
              className={`h-1 rounded-full ${
                step >= 2 ? "bg-blue-500" : "bg-white/10"
              }`}
            />

            <p
              className={`mt-2 text-xs font-medium ${
                step >= 2
                  ? "text-blue-400"
                  : "text-slate-500"
              }`}
            >
              2. Récapitulatif
            </p>
          </div>
        </div>

        {/* ========================= */}
        {/* ETAPE 1 */}
        {/* ========================= */}

        {step === 1 && (
          <div className="mt-10 space-y-8">
            {/* INFORMATIONS */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-xl font-semibold">
                Informations de la campagne
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Présentez brièvement votre campagne.
              </p>

              <div className="mt-6 space-y-6">
                {/* NOM */}
                <div>
                  <label
                    htmlFor="campaign-name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Nom de la campagne
                  </label>

                  <input
                    id="campaign-name"
                    type="text"
                    value={campaignName}
                    onChange={(e) =>
                      setCampaignName(e.target.value)
                    }
                    placeholder="Ex : Campagne rentrée 2026"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* OBJECTIF */}
                <div>
                  <label
                    htmlFor="objective"
                    className="mb-2 block text-sm font-medium"
                  >
                    Objectif
                  </label>

                  <select
                    id="objective"
                    value={objective}
                    onChange={(e) =>
                      setObjective(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option>Notoriété</option>
                    <option>Générer du trafic</option>
                    <option>Conversion</option>
                  </select>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    rows={4}
                    placeholder="Décrivez votre campagne..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* FORMAT */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-xl font-semibold">
                Format publicitaire
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Choisissez le type de publicité que vous souhaitez diffuser.
              </p>

              <div className="mt-6 grid gap-4">
                {formats.map((item) => {
                  const selected = format === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormat(item.id)}
                      className={`w-full rounded-xl border p-5 text-left transition ${
                        selected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-slate-900 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-blue-500"
                              : "border-slate-600"
                          }`}
                        >
                          {selected && (
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold">
                            {item.name}
                          </h4>

                          <p className="mt-1 text-sm text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EMPLACEMENT */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-xl font-semibold">
                Emplacement
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Où souhaitez-vous diffuser votre publicité ?
              </p>

              <div className="mt-6">
                <select
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  {locations.map((item) => (
                    <option key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DATES + BUDGET */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-xl font-semibold">
                Diffusion et budget
              </h3>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {/* DATE DEBUT */}
                <div>
                  <label
                    htmlFor="start-date"
                    className="mb-2 block text-sm font-medium"
                  >
                    Date de début
                  </label>

                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* DATE FIN */}
                <div>
                  <label
                    htmlFor="end-date"
                    className="mb-2 block text-sm font-medium"
                  >
                    Date de fin
                  </label>

                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* BUDGET */}
                <div>
                  <label
                    htmlFor="budget"
                    className="mb-2 block text-sm font-medium"
                  >
                    Budget (€)
                  </label>

                  <input
                    id="budget"
                    type="number"
                    min="1"
                    value={budget}
                    onChange={(e) =>
                      setBudget(e.target.value)
                    }
                    placeholder="500"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* BOUTONS */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <a
                href="/dashboard"
                className="rounded-xl border border-white/10 px-6 py-3 text-center font-medium text-slate-300 transition hover:bg-white/5"
              >
                Annuler
              </a>

              <button
                type="button"
                onClick={handleContinue}
                className="rounded-xl bg-blue-500 px-6 py-3 font-semibold transition hover:bg-blue-400"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ========================= */}
        {/* ETAPE 2 */}
        {/* ========================= */}

        {step === 2 && (
          <div className="mt-10 space-y-8">
            {/* RECAPITULATIF */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    Récapitulatif
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Voici les informations de votre campagne.
                  </p>
                </div>

                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                  Prête
                </div>
              </div>

              <div className="mt-8 divide-y divide-white/10">
                {/* NOM */}
                <div className="flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
                  <span className="text-sm text-slate-400">
                    Nom de la campagne
                  </span>

                  <span className="font-medium">
                    {campaignName}
                  </span>
                </div>

                {/* OBJECTIF */}
                <div className="flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
                  <span className="text-sm text-slate-400">
                    Objectif
                  </span>

                  <span className="font-medium">
                    {objective}
                  </span>
                </div>

                {/* FORMAT */}
                <div className="flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
                  <span className="text-sm text-slate-400">
                    Format
                  </span>

                  <span className="font-medium">
                    {selectedFormat?.name}
                  </span>
                </div>

                {/* EMPLACEMENT */}
                <div className="flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
                  <span className="text-sm text-slate-400">
                    Emplacement
                  </span>

                  <span className="font-medium">
                    {location}
                  </span>
                </div>

                {/* DATES */}
                <div className="flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
                  <span className="text-sm text-slate-400">
                    Période
                  </span>

                  <span className="font-medium">
                    {startDate} → {endDate}
                  </span>
                </div>

                {/* BUDGET */}
                <div className="flex flex-col gap-2 py-5 md:flex-row md:items-center md:justify-between">
                  <span className="text-sm text-slate-400">
                    Budget
                  </span>

                  <span className="text-xl font-bold">
                    {Number(budget).toLocaleString("fr-FR")} €
                  </span>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            {description.trim() && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
                <h3 className="text-xl font-semibold">
                  Description
                </h3>

                <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-400">
                  {description}
                </p>
              </div>
            )}

            {/* MESSAGE */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
              <p className="font-medium">
                Votre campagne est prête.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Votre campagne sera enregistrée dans HORZ ADS et associée à votre compte annonceur.
              </p>
            </div>

            {/* BOUTONS */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-white/10 px-6 py-3 font-medium text-slate-300 transition hover:bg-white/5"
              >
                ← Modifier
              </button>

              <button
                type="button"
                onClick={handleCreateCampaign}
                disabled={loading}
                className="rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                
            >
                {loading ? "Création..." : "Créer la campagne"}
                </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}