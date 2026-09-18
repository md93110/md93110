"use client";



import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";



type Stat = {

  ad_id: string;

  ad_name: string;

  type: string;

  impressions: number;

  clicks: number;

  completions: number;

  ctr: number;

  completion_rate: number;

};



const supabase = createClient();



export default function StatistiquesPage() {

  const [stats, setStats] = useState<Stat[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);



  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStats([]);
        return;
      }

      const [
        { data: statsData, error: statsError },
        { data: adsData, error: adsError },
      ] = await Promise.all([
        supabase.rpc("get_ad_stats"),
        supabase
          .from("ads")
          .select("id, type")
          .eq("user_id", user.id),
      ]);

      if (statsError) {
        console.error("Erreur statistiques :", statsError);
        setStats([]);
        return;
      }

      if (adsError) {
        console.error(
          "Erreur récupération types publicités :",
          adsError
        );
      }

      const rawStats = (statsData || []) as Array<{
        ad_id: string;
        ad_name: string;
        impressions: number;
        clicks: number;
        completions: number;
        ctr: number;
        completion_rate: number;
      }>;

      const typeByAdId = new Map<string, string>(
        (adsData || []).map((ad: { id: string; type: string }) => [
          ad.id,
          ad.type,
        ])
      );

      const mergedStats: Stat[] = rawStats.map((stat) => ({
        ...stat,
        type: typeByAdId.get(stat.ad_id) || "banner",
      }));

      setStats(mergedStats);
    } catch (error) {
      console.error("Erreur chargement statistiques :", error);
      setStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {

    loadStats();



    // Actualisation automatique toutes les 10 secondes

    const interval = setInterval(() => {

      loadStats(true);

    }, 10000);



    return () => clearInterval(interval);

  }, [loadStats]);



  const totalImpressions = stats.reduce(

    (total, stat) => total + Number(stat.impressions),

    0

  );



  const totalClicks = stats.reduce(

    (total, stat) => total + Number(stat.clicks),

    0

  );



  const totalVideoImpressions = stats.reduce(
    (total, stat) =>
      total + (stat.type === "video" ? Number(stat.impressions) : 0),
    0
  );

  const totalCompletions = stats.reduce(
    (total, stat) =>
      total + (stat.type === "video" ? Number(stat.completions) : 0),
    0
  );



  const totalCtr =

    totalImpressions > 0

      ? ((totalClicks / totalImpressions) * 100).toFixed(2)

      : "0.00";



  const totalCompletionRate =
    totalVideoImpressions > 0
      ? ((totalCompletions / totalVideoImpressions) * 100).toFixed(2)
      : "0.00";



  if (loading) {

    return (

      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center">

        <p className="text-gray-400">

          Chargement des statistiques...

        </p>

      </main>

    );

  }



  return (

    <main className="min-h-screen bg-[#020617] text-white">

      <div className="mx-auto max-w-7xl px-6 py-10">



        {/* EN-TÊTE */}

        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-sm font-medium uppercase tracking-widest text-blue-400">

              ANALYTICS

            </p>



            <h1 className="mt-2 text-4xl font-bold">

              Statistiques

            </h1>



            <p className="mt-3 text-gray-400">

              Suivez les performances de vos publicités.

            </p>

          </div>



          <button

            onClick={() => loadStats(true)}

            disabled={refreshing}

            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"

          >

            {refreshing ? "Actualisation..." : "Actualiser"}

          </button>

        </div>



        {/* RÉSUMÉ */}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">



          {/* IMPRESSIONS */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <p className="text-sm text-gray-400">

              Impressions

            </p>



            <p className="mt-3 text-4xl font-bold">

              {totalImpressions}

            </p>



            <p className="mt-2 text-xs text-gray-500">

              Publicités affichées

            </p>

          </div>



          {/* CLICS */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <p className="text-sm text-gray-400">

              Clics

            </p>



            <p className="mt-3 text-4xl font-bold">

              {totalClicks}

            </p>



            <p className="mt-2 text-xs text-gray-500">

              Interactions enregistrées

            </p>

          </div>



          {/* CTR */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <p className="text-sm text-gray-400">

              CTR

            </p>



            <p className="mt-3 text-4xl font-bold text-blue-400">

              {totalCtr}%

            </p>



            <p className="mt-2 text-xs text-gray-500">

              Taux de clic

            </p>

          </div>



          {/* COMPLÉTIONS */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <p className="text-sm text-gray-400">

              Complétions

            </p>



            <p className="mt-3 text-4xl font-bold text-green-400">

              {totalCompletions}

            </p>



            <p className="mt-2 text-xs text-gray-500">

              Publicités vidéo terminées

            </p>

          </div>



        </div>



        {/* TAUX DE COMPLÉTION */}

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">



            <div>

              <p className="text-sm text-gray-400">

                Taux de complétion

              </p>



              <p className="mt-1 text-sm text-gray-500">

                Pourcentage des publicités ayant été regardées jusqu'à la fin.

              </p>

            </div>



            <p className="text-3xl font-bold text-green-400">

              {totalCompletionRate}%

            </p>



          </div>

        </div>



        {/* DÉTAIL PAR PUBLICITÉ */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">



          <div className="border-b border-white/10 px-6 py-5">

            <h2 className="text-xl font-semibold">

              Performances par publicité

            </h2>



            <p className="mt-1 text-sm text-gray-400">

              Résultats enregistrés par HORZ ADS.

            </p>

          </div>



          {stats.length === 0 ? (



            <div className="px-6 py-12 text-center text-gray-500">

              Aucune statistique disponible.

            </div>



          ) : (



            <div className="divide-y divide-white/10">



              {stats.map((stat) => {



                const impressions = Number(stat.impressions);

                const clicks = Number(stat.clicks);

                const completions = Number(stat.completions);



                const ctr =

                  impressions > 0

                    ? ((clicks / impressions) * 100).toFixed(2)

                    : "0.00";



                const completionRate =

                  impressions > 0

                    ? ((completions / impressions) * 100).toFixed(2)

                    : "0.00";



                return (

                  <div

                    key={stat.ad_id}

                    className="grid gap-6 px-6 py-6 md:grid-cols-6 md:items-center"

                  >



                    {/* PUBLICITÉ */}

                    <div className="md:col-span-2">

                      <p className="font-semibold">

                        {stat.ad_name}

                      </p>



                      <p className="mt-1 text-xs text-gray-500">

                        Publicité

                      </p>

                    </div>



                    {/* IMPRESSIONS */}

                    <div>

                      <p className="text-xs uppercase tracking-wider text-gray-500">

                        Impressions

                      </p>



                      <p className="mt-1 text-lg font-semibold">

                        {impressions}

                      </p>

                    </div>



                    {/* CLICS */}

                    <div>

                      <p className="text-xs uppercase tracking-wider text-gray-500">

                        Clics

                      </p>



                      <p className="mt-1 text-lg font-semibold">

                        {clicks}

                      </p>

                    </div>



                    {/* CTR */}

                    <div>

                      <p className="text-xs uppercase tracking-wider text-gray-500">

                        CTR

                      </p>



                      <p className="mt-1 text-lg font-semibold text-blue-400">

                        {ctr}%

                      </p>

                    </div>
                  {/* COMPLÉTIONS — VIDÉOS UNIQUEMENT */}
                  {stat.type === "video" && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">
                        Complétions
                      </p>

                      <p className="mt-1 text-lg font-semibold text-green-400">
                        {completions}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {completionRate}% terminé
                      </p>
                    </div>
                  )}



                  </div>

                );

              })}



            </div>



          )}



        </div>



        {/* INFORMATION */}

        <div className="mt-6 text-center text-xs text-gray-600">

          Les statistiques sont actualisées automatiquement toutes les 10 secondes.

        </div>



      </div>

    </main>

  );

}