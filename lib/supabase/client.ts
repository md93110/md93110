import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  console.log("SUPABASE URL présente :", !!url);
  console.log("SUPABASE KEY présente :", !!key);

  if (!url || !key) {
    throw new Error(
      "Variables Supabase absentes. Vérifie .env.local et redémarre Next.js."
    );
  }

  return createBrowserClient(url, key);
}