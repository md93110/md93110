"use client";



import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";



export default function ModifierCampagnePage() {

  const params = useParams();

  const router = useRouter();



  const id = params.id as string;



  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");



  const [campaignName, setCampaignName] = useState("");

  const [objective, setObjective] = useState("Notoriété");

  const [description, setDescription] = useState("");

  const [format, setFormat] = useState("Bannière");

  const [location, setLocation] = useState("Page d'accueil");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("pending");



  // --------------------------------------------------

  // CONVERSION DES VALEURS DE LA BASE

  // --------------------------------------------------



  function normalizeFormat(value: string) {

    const normalized = value

      .toLowerCase()

      .trim()

      .normalize("NFD")

      .replace(/[\u0300-\u036f]/g, "");



    if (normalized === "video") {

      return "Vidéo";

    }



    if (normalized === "banniere" || normalized === "banner") {

      return "Bannière";

    }



    if (

      normalized === "contenu sponsorise" ||

      normalized === "sponsored content"

    ) {

      return "Contenu sponsorisé";

    }



    return value || "Bannière";

  }



  // --------------------------------------------------

  // CHARGEMENT DE LA CAMPAGNE

  // --------------------------------------------------



  useEffect(() => {

    async function loadCampaign() {

      const supabase = createClient();



      const {

        data: { user },

      } = await supabase.auth.getUser();



      if (!user) {

        router.push("/connexion");

        return;

      }



      const { data, error } = await supabase

        .from("campaigns")

        .select("\*")

        .eq("id", id)

        .eq("user_id", user.id)

        .single();



      if (error || !data) {

        console.error("Erreur chargement campagne :", error);



        setMessage("Impossible de trouver cette campagne.");

        setLoading(false);

        return;

      }



      // Remplissage des champs

      setCampaignName(data.name || "");

      setObjective(data.objective || "Notoriété");

      setDescription(data.description || "");



      // CORRECTION DU FORMAT

      setFormat(normalizeFormat(data.format || ""));



      setLocation(data.location || "Page d'accueil");

      setStartDate(data.start_date || "");

      setEndDate(data.end_date || "");

      setBudget(data.budget?.toString() || "");
    setStatus(data.status || "pending");



      setLoading(false);

    }



    if (id) {

      loadCampaign();

    }

  }, [id, router]);



  // --------------------------------------------------

  // ENREGISTREMENT

  // --------------------------------------------------



  async function handleSave(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();



    setMessage("");



    // Vérification du nom

    if (!campaignName.trim()) {

      setMessage("Veuillez renseigner le nom de la campagne.");

      return;

    }



    // Vérification des dates

    if (!startDate || !endDate) {

      setMessage("Veuillez sélectionner les dates de diffusion.");

      return;

    }



    // Vérification de l'ordre des dates

    if (endDate < startDate) {

      setMessage(

        "La date de fin doit être après la date de début."

      );

      return;

    }



    // Vérification du budget

    if (!budget || Number(budget) <= 0) {

      setMessage("Veuillez renseigner un budget valide.");

      return;

    }



    setSaving(true);



    const supabase = createClient();



    const {

      data: { user },

    } = await supabase.auth.getUser();



    if (!user) {

      router.push("/connexion");

      return;

    }



    // --------------------------------------------------

    // MISE À JOUR SUPABASE

    // --------------------------------------------------



    const { error } = await supabase

      .from("campaigns")

      .update({

        name: campaignName.trim(),

        objective,

        description: description.trim(),



        // On enregistre la valeur française proprement

        format,



        location,

        start_date: startDate,

        end_date: endDate,

        budget: Number(budget),
      status,

      })

      .eq("id", id)

      .eq("user_id", user.id);



    if (error) {

      console.error(

        "Erreur modification campagne :",

        error

      );



      setMessage(

        "Erreur lors de l'enregistrement des modifications."

      );



      setSaving(false);

      return;

    }



    // --------------------------------------------------

    // SUCCÈS

    // --------------------------------------------------



    alert("Campagne modifiée avec succès !");



    router.push(`/dashboard/campagnes/${id}`);

    router.refresh();

  }



  // --------------------------------------------------

  // CHARGEMENT

  // --------------------------------------------------



  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">

        <p className="text-slate-400">

          Chargement de la campagne...

        </p>

      </main>

    );

  }



  // --------------------------------------------------

  // PAGE

  // --------------------------------------------------



  return (

    <main className="min-h-screen bg-slate-950 text-white">



      {/* HEADER */}

      <header className="border-b border-white/10 bg-slate-950">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">



          <div>

            <h1 className="text-2xl font-bold tracking-tight">

              HORZ{" "}

              <span className="text-blue-400">

                ADS

              </span>

            </h1>



            <p className="text-sm text-slate-400">

              Espace annonceur

            </p>

          </div>



          <button

            type="button"

            onClick={() =>

              router.push(

                `/dashboard/campagnes/${id}`

              )

            }

            className="rounded-lg border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"

          >

            ← Retour

          </button>



        </div>

      </header>



      {/* CONTENU */}

      <section className="mx-auto max-w-4xl px-6 py-14">



        {/* TITRE */}

        <div className="mb-10">



          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">

            PUBLICITÉ

          </p>



          <h2 className="mt-3 text-4xl font-bold tracking-tight">

            Modifier la campagne

          </h2>



          <p className="mt-3 text-slate-400">

            Modifiez les informations de votre campagne

            publicitaire.

          </p>



        </div>



        {/* FORMULAIRE */}

        <form

          onSubmit={handleSave}

          className="rounded-2xl border border-white/10 bg-slate-900 p-8"

        >



          <div className="space-y-6">



            {/* NOM */}

            <div>



              <label

                htmlFor="campaignName"

                className="mb-2 block text-sm font-medium"

              >

                Nom de la campagne

              </label>



              <input

                id="campaignName"

                type="text"

                value={campaignName}

                onChange={(e) =>

                  setCampaignName(e.target.value)

                }

                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

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

                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

              >

                <option value="Notoriété">

                  Notoriété

                </option>



                <option value="Générer du trafic">

                  Générer du trafic

                </option>



                <option value="Conversion">

                  Conversion

                </option>

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

                rows={5}

                value={description}

                onChange={(e) =>

                  setDescription(e.target.value)

                }

                className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

              />



            </div>



            {/* FORMAT */}

            <div>



              <label

                htmlFor="format"

                className="mb-2 block text-sm font-medium"

              >

                Format publicitaire

              </label>



              <select

                id="format"

                value={format}

                onChange={(e) =>

                  setFormat(e.target.value)

                }

                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

              >



                <option value="Bannière">

                  Bannière

                </option>



                <option value="Vidéo">

                  Vidéo

                </option>



                <option value="Contenu sponsorisé">

                  Contenu sponsorisé

                </option>



              </select>



            </div>



            {/* EMPLACEMENT */}

            <div>



              <label

                htmlFor="location"

                className="mb-2 block text-sm font-medium"

              >

                Emplacement

              </label>



              <select

                id="location"

                value={location}

                onChange={(e) =>

                  setLocation(e.target.value)

                }

                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

              >



                <option value="Page d'accueil">

                  Page d'accueil

                </option>



                <option value="Actualités">

                  Actualités

                </option>



                <option value="Sports">

                  Sports

                </option>



                <option value="Culture">

                  Culture

                </option>



                <option value="Toutes les pages">

                  Toutes les pages

                </option>



              </select>



            </div>



            {/* DATES */}

            <div className="grid gap-6 md:grid-cols-2">



              {/* DATE DEBUT */}

              <div>



                <label

                  htmlFor="startDate"

                  className="mb-2 block text-sm font-medium"

                >

                  Date de début

                </label>



                <input

                  id="startDate"

                  type="date"

                  value={startDate}

                  onChange={(e) =>

                    setStartDate(e.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

                />



              </div>



              {/* DATE FIN */}

              <div>



                <label

                  htmlFor="endDate"

                  className="mb-2 block text-sm font-medium"

                >

                  Date de fin

                </label>



                <input

                  id="endDate"

                  type="date"

                  value={endDate}

                  onChange={(e) =>

                    setEndDate(e.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

                />



              </div>



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

                step="0.01"

                value={budget}

                onChange={(e) =>

                  setBudget(e.target.value)

                }

                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"

              />



            </div>



            {/* STATUT */}
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium"
            >
              Statut de la campagne
            </label>

            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="pending">En attente</option>
              <option value="active">Active</option>
              <option value="paused">En pause</option>
              <option value="completed">Terminée</option>
            </select>
          </div>

          {/* MESSAGE D'ERREUR */}

            {message && (

              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">

                {message}

              </div>

            )}



            {/* BOUTONS */}

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">



              <button

                type="button"

                onClick={() =>

                  router.push(

                    `/dashboard/campagnes/${id}`

                  )

                }

                className="rounded-xl border border-white/10 px-6 py-3 font-medium text-slate-300 transition hover:bg-white/5"

              >

                Annuler

              </button>



              <button

                type="submit"

                disabled={saving}

                className="rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"

              >

                {saving

                  ? "Enregistrement..."

                  : "Enregistrer les modifications"}

              </button>



            </div>



          </div>



        </form>



      </section>



    </main>

  );

}