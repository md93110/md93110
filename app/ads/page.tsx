"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ad = {
  ad_id: string;
  campaign_id: string;
  name: string;
  title: string | null;
  description: string | null;
  type: string;
  media_url: string | null;
  destination_url: string | null;
};

const supabase = createClient();

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const trackedImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function loadAds() {
      const { data, error } = await supabase.rpc("get_active_ads");

      if (error) {
        console.error("Erreur diffusion publicitaire :", error);
        setAds([]);
        setLoading(false);
        return;
      }

      const activeAds = (data || []) as Ad[];

      setAds(activeAds);

      // Enregistrer une impression pour chaque publicité affichée
      for (const ad of activeAds) {
        if (trackedImpressions.current.has(ad.ad_id)) {
          continue;
        }

        trackedImpressions.current.add(ad.ad_id);

        const { error: eventError } = await supabase.rpc(
          "record_ad_event",
          {
            p_ad_id: ad.ad_id,
            p_event_type: "impression",
          }
        );

        if (eventError) {
          console.error(
            "Erreur enregistrement impression :",
            eventError
          );
        }
      }

      setLoading(false);
    }

    loadAds();
  }, []);

  async function handleAdClick(adId: string) {
    const { error } = await supabase.rpc("record_ad_event", {
      p_ad_id: adId,
      p_event_type: "click",
    });

    if (error) {
      console.error("Erreur enregistrement clic :", error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">
          Chargement de la publicité...
        </p>
      </main>
    );
  }

  if (ads.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">
          Aucune publicité disponible actuellement.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {ads.map((ad) => (
          <article
            key={ad.ad_id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            {ad.media_url && ad.type === "video" ? (
              <video
                src={ad.media_url}
                controls
                playsInline
                className="w-full max-h-[600px] object-contain bg-black"
              />
            ) : ad.media_url ? (
              <img
                src={ad.media_url}
                alt={ad.title || ad.name}
                className="w-full max-h-[600px] object-contain bg-black"
              />
            ) : null}

            <div className="p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Publicité
              </p>

              <h1 className="mt-2 text-2xl font-bold">
                {ad.title || ad.name}
              </h1>

              {ad.description && (
                <p className="mt-3 text-gray-400">
                  {ad.description}
                </p>
              )}

              {ad.destination_url && (
                <a
                  href={ad.destination_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleAdClick(ad.ad_id)}
                  className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200"
                >
                  Découvrir
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}