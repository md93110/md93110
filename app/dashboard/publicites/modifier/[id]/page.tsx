"use client";



import Link from "next/link";

import { useParams, useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";



type Ad = {

  id: string;

  campaign_id: string;

  name: string;

  title: string | null;

  description: string | null;

  type: string;

  media_url: string | null;

  destination_url: string | null;

  status: string;

};



type Campaign = {

  id: string;

  name: string;

};



const MAX_FILE_SIZE = 50 * 1024 * 1024;



const ALLOWED_TYPES = [

  "image/jpeg",

  "image/png",

  "image/webp",

  "image/gif",

  "video/mp4",

  "video/webm",

  "video/quicktime",

];



export default function ModifierPublicitePage() {

  const supabase = createClient();

  const router = useRouter();

  const params = useParams();



  const adId = params.id as string;



  const [ad, setAd] = useState<Ad | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);



  const [campaignId, setCampaignId] = useState("");

  const [name, setName] = useState("");

  const [type, setType] = useState("banner");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [mediaUrl, setMediaUrl] = useState("");

  const [destinationUrl, setDestinationUrl] = useState("");

  const [status, setStatus] = useState("draft");

  // Ciblage par catégories de vidéos Wix
  // [] = toutes les catégories
  const [videoCategories, setVideoCategories] = useState<string[]>([]);
  const [selectedVideoCategories, setSelectedVideoCategories] = useState<string[]>([]);



  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);



  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");



  useEffect(() => {

    async function loadData() {

      try {

        const {

          data: { user },

        } = await supabase.auth.getUser();



        if (!user) {

          router.push("/connexion");

          return;

        }



        const { data: adData, error: adError } = await supabase

          .from("ads")

          .select(

            "id, campaign_id, name, title, description, type, media_url, destination_url, status, target_categories"

          )

          .eq("id", adId)

          .eq("user_id", user.id)

          .single();



        if (adError || !adData) {

          console.error(

            "Erreur chargement publicité :",

            adError

          );



          setErrorMessage("Publicité introuvable.");

          setLoading(false);

          return;

        }



        setAd(adData);



        setCampaignId(adData.campaign_id);

        setName(adData.name);

        setType(adData.type);

        setTitle(adData.title || "");

        setDescription(adData.description || "");

        setMediaUrl(adData.media_url || "");

        setDestinationUrl(adData.destination_url || "");

        setStatus(adData.status);

        setSelectedVideoCategories(
          Array.isArray(adData.target_categories)
            ? adData.target_categories
            : []
        );

        try {
          const categoriesResponse = await fetch("/api/video-categories");
          const categoriesData = await categoriesResponse.json();

          if (
            categoriesResponse.ok &&
            Array.isArray(categoriesData.categories)
          ) {
            setVideoCategories(categoriesData.categories);
          }
        } catch (categoryError) {
          console.error(
            "Erreur chargement catégories Wix :",
            categoryError
          );
        }



        const {

          data: campaignData,

          error: campaignError,

        } = await supabase

          .from("campaigns")

          .select("id, name")

          .eq("user_id", user.id)

          .order("created_at", { ascending: false });



        if (campaignError) {

          console.error(

            "Erreur chargement campagnes :",

            campaignError

          );

        } else {

          setCampaigns(campaignData || []);

        }

      } catch (error) {

        console.error("Erreur :", error);



        setErrorMessage(

          "Une erreur est survenue lors du chargement."

        );

      } finally {

        setLoading(false);

      }

    }



    if (adId) {

      loadData();

    }

  }, [adId]);



  function handleFileChange(

    event: React.ChangeEvent<HTMLInputElement>

  ) {

    setErrorMessage("");



    const file = event.target.files?.[0];



    if (!file) {

      setSelectedFile(null);

      return;

    }



    if (!ALLOWED_TYPES.includes(file.type)) {

      setErrorMessage(

        "Format non autorisé. Utilisez JPG, PNG, WebP, GIF, MP4, WebM ou MOV."

      );



      event.target.value = "";

      setSelectedFile(null);

      return;

    }



    if (file.size > MAX_FILE_SIZE) {

      setErrorMessage(

        "Le fichier est trop volumineux. La taille maximale est de 50 Mo."

      );



      event.target.value = "";

      setSelectedFile(null);

      return;

    }



    if (

      type === "video" &&

      !file.type.startsWith("video/")

    ) {

      setErrorMessage(

        "Pour une publicité vidéo, veuillez sélectionner une vidéo."

      );



      event.target.value = "";

      setSelectedFile(null);

      return;

    }



    if (

      type === "banner" &&

      !file.type.startsWith("image/")

    ) {

      setErrorMessage(

        "Pour une bannière, veuillez sélectionner une image."

      );



      event.target.value = "";

      setSelectedFile(null);

      return;

    }



    setSelectedFile(file);

  }



  function getStoragePathFromUrl(

    url: string | null

  ): string | null {

    if (!url) {

      return null;

    }



    const marker =

      "/storage/v1/object/public/ad-media/";



    const index = url.indexOf(marker);



    if (index === -1) {

      return null;

    }



    return decodeURIComponent(

      url.substring(index + marker.length)

    );

  }



  async function uploadMedia(userId: string) {

    if (!selectedFile) {

      return null;

    }



    setUploading(true);



    try {

      const safeFileName = selectedFile.name

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .replace(/[^a-zA-Z0-9._-]/g, "-");



      const fileName =

        `${Date.now()}-${safeFileName}`;



      const filePath =

        `${userId}/${fileName}`;



      const { error: uploadError } =

        await supabase.storage

          .from("ad-media")

          .upload(

            filePath,

            selectedFile,

            {

              cacheControl: "3600",

              upsert: false,

              contentType: selectedFile.type,

            }

          );



      if (uploadError) {

        console.error(

          "Erreur upload média :",

          uploadError

        );



        throw new Error(

          "Impossible d'envoyer le nouveau fichier."

        );

      }



      const {

        data: { publicUrl },

      } = supabase.storage

        .from("ad-media")

        .getPublicUrl(filePath);



      return publicUrl;

    } finally {

      setUploading(false);

    }

  }



  async function deleteOldMedia(

    oldMediaUrl: string | null

  ) {

    const oldPath =

      getStoragePathFromUrl(oldMediaUrl);



    if (!oldPath) {

      return;

    }



    const { error } =

      await supabase.storage

        .from("ad-media")

        .remove([oldPath]);



    if (error) {

      console.error(

        "Erreur suppression ancien média :",

        error

      );

    }

  }



  async function handleSubmit(

    event: React.FormEvent<HTMLFormElement>

  ) {

    event.preventDefault();



    setErrorMessage("");



    if (!campaignId) {

      setErrorMessage(

        "Veuillez sélectionner une campagne."

      );

      return;

    }



    if (!name.trim()) {

      setErrorMessage(

        "Veuillez donner un nom à votre publicité."

      );

      return;

    }



    if (!destinationUrl.trim()) {

      setErrorMessage(

        "Veuillez renseigner l'URL de destination."

      );

      return;

    }



    try {

      setSaving(true);



      const {

        data: { user },

      } = await supabase.auth.getUser();



      if (!user) {

        router.push("/connexion");

        return;

      }



      const oldMediaUrl = mediaUrl || null;



      let finalMediaUrl = mediaUrl.trim() || null;



      /*

       * Si un nouveau fichier a été sélectionné,

       * on l'envoie dans Supabase Storage.

       */

      if (selectedFile) {

        const uploadedUrl =

          await uploadMedia(user.id);



        if (!uploadedUrl) {

          setErrorMessage(

            "Impossible d'obtenir l'URL du nouveau média."

          );



          return;

        }



        finalMediaUrl = uploadedUrl;

      }



      const { error } = await supabase

        .from("ads")

        .update({

          campaign_id: campaignId,

          name: name.trim(),

          title: title.trim() || null,

          description:

            description.trim() || null,

          type,

          media_url: finalMediaUrl,

          destination_url:

            destinationUrl.trim(),

          status,
        target_categories: selectedVideoCategories,

        })

        .eq("id", adId)

        .eq("user_id", user.id);



      if (error) {

        console.error(

          "Erreur modification publicité :",

          error

        );



        setErrorMessage(

          "Impossible de modifier la publicité."

        );



        return;

      }



      /*

       * Si un nouveau fichier a remplacé

       * l'ancien fichier Supabase,

       * on supprime l'ancien.

       */

      if (

        selectedFile &&

        oldMediaUrl &&

        oldMediaUrl !== finalMediaUrl

      ) {

        await deleteOldMedia(oldMediaUrl);

      }



      router.push(

        `/dashboard/publicites/${adId}`

      );

    } catch (error) {

      console.error(

        "Erreur modification :",

        error

      );



      setErrorMessage(

        error instanceof Error

          ? error.message

          : "Une erreur est survenue lors de la modification."

      );

    } finally {

      setSaving(false);

    }

  }



  if (loading) {

    return (

      <main className="min-h-screen bg-slate-950 text-white">

        <div className="mx-auto max-w-4xl px-6 py-20 text-center">

          <p className="text-slate-400">

            Chargement de la publicité...

          </p>

        </div>

      </main>

    );

  }



  if (!ad) {

    return (

      <main className="min-h-screen bg-slate-950 text-white">

        <div className="mx-auto max-w-4xl px-6 py-20 text-center">

          <h1 className="text-2xl font-bold">

            Publicité introuvable

          </h1>



          <p className="mt-3 text-slate-400">

            {errorMessage}

          </p>



          <Link

            href="/dashboard/publicites"

            className="mt-6 inline-block rounded-xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400"

          >

            Retour aux publicités

          </Link>

        </div>

      </main>

    );

  }



  const acceptedFiles =

    type === "video"

      ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"

      : type === "banner"

        ? "image/jpeg,image/png,image/webp,image/gif"

        : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";



  return (

    <main className="min-h-screen bg-slate-950 text-white">

      {/* Header */}

      <header className="border-b border-white/10">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>

            <Link href="/dashboard">

              <h1 className="text-2xl font-bold">

                HORZ{" "}

                <span className="text-blue-400">

                  ADS

                </span>

              </h1>

            </Link>



            <p className="text-sm text-slate-400">

              Espace annonceur

            </p>

          </div>



          <button
            type="button"
            onClick={() => router.push(`/dashboard/publicites/${adId}`)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Retour à la publicité
          </button>

        </div>

      </header>



      {/* Content */}

      <section className="mx-auto max-w-4xl px-6 py-10">

        <div>

          <p className="text-sm font-medium text-blue-400">

            PUBLICITÉS

          </p>



          <h2 className="mt-2 text-3xl font-bold">

            Modifier la publicité

          </h2>



          <p className="mt-2 text-slate-400">

            Modifiez les informations de votre publicité.

          </p>

        </div>



        <form

          onSubmit={handleSubmit}

          className="mt-10 space-y-6"

        >

          {/* Campagne */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <h3 className="text-lg font-semibold">

              1\. Campagne

            </h3>



            <p className="mt-1 text-sm text-slate-400">

              Modifiez la campagne associée à cette publicité.

            </p>



            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">

                Campagne

              </label>



              <select

                value={campaignId}

                onChange={(event) =>

                  setCampaignId(event.target.value)

                }

                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"

              >

                {campaigns.map((campaign) => (

                  <option

                    key={campaign.id}

                    value={campaign.id}

                  >

                    {campaign.name}

                  </option>

                ))}

              </select>

            </div>

          </div>



          {/* Informations */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <h3 className="text-lg font-semibold">

              2\. Informations

            </h3>



            <div className="mt-5 space-y-5">

              {/* Nom */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Nom de la publicité *

                </label>



                <input

                  type="text"

                  value={name}

                  onChange={(event) =>

                    setName(event.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"

                />

              </div>



              {/* Type */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Type de publicité

                </label>



                <select

                  value={type}

                  onChange={(event) => {

                    setType(event.target.value);

                    setSelectedFile(null);

                  }}

                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"

                >

                  <option value="banner">

                    Bannière

                  </option>



                  <option value="video">

                    Vidéo

                  </option>



                  <option value="sponsored">

                    Contenu sponsorisé

                  </option>

                </select>

              </div>



              {/* Titre */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Titre

                </label>



                <input

                  type="text"

                  value={title}

                  onChange={(event) =>

                    setTitle(event.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"

                />

              </div>



              {/* Description */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Description

                </label>



                <textarea

                  value={description}

                  onChange={(event) =>

                    setDescription(event.target.value)

                  }

                  rows={4}

                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"

                />

              </div>

            </div>

          </div>



          {/* Média */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <h3 className="text-lg font-semibold">

              3\. Média

            </h3>



            <p className="mt-1 text-sm text-slate-400">

              Conservez le média actuel ou choisissez un

              nouveau fichier.

            </p>



            {/* Média actuel */}

            {mediaUrl && (

              <div className="mt-5 rounded-xl border border-white/10 bg-slate-900 p-4">

                <p className="text-sm font-medium text-slate-300">

                  Média actuel

                </p>



                <div className="mt-3 overflow-hidden rounded-lg">

                  {type === "video" ? (

                    <video

                      src={mediaUrl}

                      controls

                      className="max-h-64 w-full rounded-lg"

                    />

                  ) : (

                    <img

                      src={mediaUrl}

                      alt="Média actuel"

                      className="max-h-64 w-full rounded-lg object-contain"

                    />

                  )}

                </div>

              </div>

            )}



            {/* Nouveau fichier */}

            <div className="mt-5">

              <label className="mb-3 block text-sm font-medium">

                Remplacer le média

              </label>



              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900 px-6 py-10 text-center transition hover:border-blue-500 hover:bg-slate-900/80">

                <span className="text-3xl">

                  {type === "video"

                    ? "🎬"

                    : "🖼️"}

                </span>



                <span className="mt-3 font-medium">

                  Choisir un nouveau fichier

                </span>



                <span className="mt-1 text-sm text-slate-500">

                  {type === "video"

                    ? "MP4, WebM ou MOV"

                    : type === "banner"

                      ? "JPG, PNG, WebP ou GIF"

                      : "Images ou vidéos"}

                </span>



                <span className="mt-1 text-xs text-slate-600">

                  Maximum 50 Mo

                </span>



                <input

                  type="file"

                  accept={acceptedFiles}

                  onChange={handleFileChange}

                  className="hidden"

                />

              </label>



              {selectedFile && (

                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">

                  <p className="text-sm font-medium text-emerald-400">

                    Nouveau fichier sélectionné

                  </p>



                  <p className="mt-1 break-all text-sm text-slate-300">

                    {selectedFile.name}

                  </p>



                  <p className="mt-1 text-xs text-slate-500">

                    {(

                      selectedFile.size /

                      (1024 * 1024)

                    ).toFixed(2)}{" "}

                    Mo

                  </p>

                </div>

              )}

            </div>

          </div>



          {/* Destination */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <h3 className="text-lg font-semibold">

              4\. Destination

            </h3>



            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">

                URL de destination *

              </label>



              <input

                type="url"

                value={destinationUrl}

                onChange={(event) =>

                  setDestinationUrl(event.target.value)

                }

                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"

              />

            </div>

          </div>



          {/* Ciblage vidéo */}




          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">




            <h3 className="text-lg font-semibold">




              5. Ciblage des vidéos




            </h3>





            <p className="mt-1 text-sm text-slate-400">




              Choisissez les catégories de vidéos Wix sur lesquelles cette publicité peut être diffusée.




              Si aucune catégorie n'est sélectionnée, la publicité peut être diffusée sur toutes les catégories.




            </p>





            <div className="mt-5 space-y-3">




              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-4 py-3">




                <input




                  type="checkbox"




                  checked={selectedVideoCategories.length === 0}




                  onChange={() => setSelectedVideoCategories([])}




                  className="h-4 w-4"




                />




                <span className="font-medium">Toutes les catégories</span>




              </label>





              {videoCategories.length === 0 ? (




                <p className="text-sm text-slate-500">




                  Aucune catégorie Wix disponible pour le moment.




                </p>




              ) : (




                <div className="grid gap-2 sm:grid-cols-2">




                  {videoCategories.map((category) => {




                    const checked = selectedVideoCategories.includes(category);





                    return (




                      <label




                        key={category}




                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-4 py-3"




                      >




                        <input




                          type="checkbox"




                          checked={checked}




                          onChange={(event) => {




                            if (event.target.checked) {




                              setSelectedVideoCategories((current) => [




                                ...current,




                                category,




                              ]);




                            } else {




                              setSelectedVideoCategories((current) =>




                                current.filter((item) => item !== category)




                              );




                            }




                          }}




                          className="h-4 w-4"




                        />




                        <span>{category}</span>




                      </label>




                    );




                  })}




                </div>




              )}





              {selectedVideoCategories.length > 0 && (




                <p className="text-xs text-blue-400">




                  {selectedVideoCategories.length} catégorie(s) sélectionnée(s)




                </p>




              )}




            </div>




          </div>






          {/* Statut */}




          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">




            <h3 className="text-lg font-semibold">




              6. Statut




            </h3>



            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">

                Statut

              </label>



              <select

                value={status}

                onChange={(event) =>

                  setStatus(event.target.value)

                }

                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"

              >

                <option value="draft">

                  Brouillon

                </option>



                <option value="active">

                  Active

                </option>



                <option value="paused">

                  En pause

                </option>



                <option value="completed">

                  Terminée

                </option>

              </select>

            </div>

          </div>



          {/* Erreur */}

          {errorMessage && (

            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">

              {errorMessage}

            </div>

          )}



          {/* Actions */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link

              href={`/dashboard/publicites/${adId}`}

              className="rounded-xl border border-white/10 px-5 py-3 text-center font-medium hover:bg-white/5"

            >

              Annuler

            </Link>



            <button

              type="submit"

              disabled={saving || uploading}

              className="rounded-xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"

            >

              {uploading

                ? "Envoi du fichier..."

                : saving

                  ? "Enregistrement..."

                  : "Enregistrer les modifications"}

            </button>

          </div>

        </form>

      </section>

    </main>

  );

}