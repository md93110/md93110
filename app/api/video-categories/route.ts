import { NextResponse } from "next/server";

const WIX_VIDEOS_URL =
  "https://horzmedia.com/_functions/horzVideos";

export async function GET() {
  try {
    const response = await fetch(WIX_VIDEOS_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          categories: [],
          error: `Wix HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const videos: Array<{ category?: unknown }> = Array.isArray(
      data?.videos
    )
      ? data.videos
      : [];

    const categoryValues: string[] = videos
      .map((video) =>
        typeof video.category === "string"
          ? video.category.trim()
          : ""
      )
      .filter(
        (value): value is string => value.length > 0
      );

    const categories: string[] = Array.from(
      new Set<string>(categoryValues)
    ).sort((a: string, b: string) =>
      a.localeCompare(b, "fr")
    );

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error(
      "Erreur API catégories Wix :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        categories: [],
        error:
          "Impossible de récupérer les catégories Wix.",
      },
      { status: 500 }
    );
  }
}
