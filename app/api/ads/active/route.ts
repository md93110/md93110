import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

type AdRow = {
  id: string;
  campaign_id: string;
  name: string;
  title: string | null;
  description: string | null;
  type: string;
  media_url: string | null;
  destination_url: string | null;
  status: string | null;
  target_categories: unknown;
};

function normalizeCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTargetCategories(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedCategory =
      searchParams.get("category")?.trim() || "";

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Variables Supabase manquantes."
      );

      return NextResponse.json(
        {
          success: false,
          ads: [],
          error:
            "Configuration Supabase manquante.",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase
      .from("ads")
      .select(
        `
          id,
          campaign_id,
          name,
          title,
          description,
          type,
          media_url,
          destination_url,
          status,
          target_categories
        `
      )
      .eq("status", "active");

    if (error) {
      console.error(
        "Erreur récupération HORZ ADS :",
        error
      );

      return NextResponse.json(
        {
          success: false,
          ads: [],
          error:
            "Impossible de récupérer les publicités.",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const rows = (data ?? []) as AdRow[];

    console.log(
      "HORZ ADS CONFIG :",
      {
        url: supabaseUrl,
        hasServiceRole:
          Boolean(
            process.env.SUPABASE_SERVICE_ROLE_KEY
          ),
        hasPublishable:
          Boolean(
            process.env
              .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          ),
      }
    );

    console.log(
      "HORZ ADS DEBUG - rows reçues :",
      rows
    );

    const eligibleAds = rows.filter(
      (ad: AdRow) => {
        const targets =
          getTargetCategories(
            ad.target_categories
          );

        // [] = toutes les catégories
        if (targets.length === 0) {
          return true;
        }

        // Une publicité ciblée nécessite
        // une catégorie transmise par l'application.
        if (!requestedCategory) {
          return false;
        }

        const normalizedRequested =
          normalizeCategory(
            requestedCategory
          );

        return targets.some(
          (target: string) =>
            normalizeCategory(target) ===
            normalizedRequested
        );
      }
    );

    return NextResponse.json(
      {
        success: true,
        ads: eligibleAds.map(
          (ad: AdRow) => ({
            ad_id: ad.id,
            campaign_id: ad.campaign_id,
            name: ad.name,
            title: ad.title,
            description: ad.description,
            type: ad.type,
            media_url: ad.media_url,
            destination_url:
              ad.destination_url,
            status: ad.status,
            target_categories:
              ad.target_categories,
          })
        ),
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error(
      "Erreur API HORZ ADS :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        ads: [],
        error:
          "Une erreur est survenue.",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}