import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { ad_id, event_type } = body;

    if (!ad_id || !event_type) {
      return NextResponse.json(
        {
          success: false,
          error: "ad_id et event_type sont obligatoires",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!["impression", "click", "completion"].includes(event_type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Type d'événement invalide",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { error } = await supabase.rpc("record_ad_event", {
      p_ad_id: ad_id,
      p_event_type: event_type,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible d'enregistrer l'événement",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}