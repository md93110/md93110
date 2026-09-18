"use client";



import Link from "next/link";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";



type Campaign = {

  id: string;

  name: string;

  start_date: string;

  end_date: string;

  status: string;

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



export default function NouvellePublicitePage() {

  const supabase = createClient();

  const router = useRouter();



  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");



  const [campaignId, setCampaignId] = useState("");

  const [name, setName] = useState("");

  const [type, setType] = useState("banner");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [mediaUrl, setMediaUrl] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [destinationUrl, setDestinationUrl] = useState("");

  // Catégories de vidéos récupérées automatiquement depuis Wix.
  // [] = toutes les catégories.
  const [videoCategories, setVideoCategories] = useState<string[]>([]);
  const [selectedVideoCategories, setSelectedVideoCategories] = useState<string[]>([]);




  useEffect(() => {

    async function loadCampaigns() {

      try {

        const {

          data: { user },

        } = await supabase.auth.getUser();



        if (!user) {

          router.push("/connexion");

          return;

        }



        const { data, error } = await supabase

          .from("campaigns")

          .select("id, name, start_date, end_date, status")

          .eq("user_id", user.id)

          .order("created_at", { ascending: false });



        if (error) {

          console.error("Erreur chargement campagnes :", error);

          setErrorMessage(

            "Impossible de charger vos campagnes."

          );

          return;

        }



        setCampaigns(data || []);



        if (data && data.length > 0) {

          setCampaignId(data[0].id);

        }

      } catch (error) {

        console.error("Erreur :", error);

        setErrorMessage(

          "Une erreur est survenue lors du chargement."

        );

      } finally {

        setLoadingCampaigns(false);

      }

    }



    loadCampaigns();

  async function loadVideoCategories() {
    try {
      const response = await fetch("/api/video-categories", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.categories)) {
        setVideoCategories(data.categories);
      } else {
        console.error("Erreur catégories Wix :", data);
      }
    } catch (error) {
      console.error("Erreur chargement catégories Wix :", error);
    }
  }

  loadVideoCategories();


  }, []);



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

        "Format de fichier non autorisé. Utilisez JPG, PNG, WebP, GIF, MP4, WebM ou MOV."

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



      const fileName = `${Date.now()}-${safeFileName}`;



      const filePath = `${userId}/${fileName}`;



      const { error: uploadError } = await supabase.storage

        .from("ad-media")

        .upload(filePath, selectedFile, {

          cacheControl: "3600",

          upsert: false,

          contentType: selectedFile.type,

        });



      if (uploadError) {

        console.error(

          "Erreur upload média :",

          uploadError

        );



        throw new Error(

          "Impossible d'envoyer le fichier."

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



      let finalMediaUrl = mediaUrl.trim() || null;



      if (selectedFile) {

        finalMediaUrl = await uploadMedia(user.id);

      }



      const { data, error } = await supabase

        .from("ads")

        .insert({

          campaign_id: campaignId,

          user_id: user.id,

          name: name.trim(),

          title: title.trim() || null,

          description: description.trim() || null,

          type,

          media_url: finalMediaUrl,

          destination_url: destinationUrl.trim(),

          status: "draft",
         target_categories: selectedVideoCategories,

        })

        .select("id")

        .single();



      if (error) {

        console.error(

          "Erreur création publicité :",

          error

        );



        setErrorMessage(

          "Impossible de créer la publicité. Vérifiez les informations."

        );



        return;

      }



      router.push(

        `/dashboard/publicites/${data.id}`

      );

    } catch (error) {

      console.error("Erreur :", error);



      setErrorMessage(

        error instanceof Error

          ? error.message

          : "Une erreur est survenue lors de la création."

      );

    } finally {

      setSaving(false);

    }

  }



  const acceptedFiles =

    type === "video"

      ? "video/mp4,video/webm,video/quicktime"

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



          <Link

            href="/dashboard/publicites"

            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"

          >

            Retour aux publicités

          </Link>

        </div>

      </header>



      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Intro */}

        <div>

          <p className="text-sm font-medium text-blue-400">

            PUBLICITÉS

          </p>



          <h2 className="mt-2 text-3xl font-bold">

            Nouvelle publicité

          </h2>



          <p className="mt-2 text-slate-400">

            Créez une publicité et associez-la à l'une de

            vos campagnes.

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

              Choisissez la campagne à laquelle cette

              publicité sera associée.

            </p>



            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">

                Campagne

              </label>



              {loadingCampaigns ? (

                <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-400">

                  Chargement des campagnes...

                </div>

              ) : campaigns.length === 0 ? (

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">

                  <p className="text-sm text-amber-400">

                    Vous devez d'abord créer une campagne.

                  </p>



                  <Link

                    href="/dashboard/campagnes/nouvelle"

                    className="mt-3 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"

                  >

                    Créer une campagne →

                  </Link>

                </div>

              ) : (

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

                      {campaign.name} —{" "}

                      {campaign.start_date} →{" "}

                      {campaign.end_date}

                    </option>

                  ))}

                </select>

              )}

            </div>

          </div>



          {/* Informations */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <h3 className="text-lg font-semibold">

              2\. Informations

            </h3>



            <p className="mt-1 text-sm text-slate-400">

              Définissez les informations principales de

              votre publicité.

            </p>



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

                  placeholder="Ex. Bannière rentrée 2026"

                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"

                />

              </div>



              {/* Type */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Type de publicité *

                </label>



                <select

                  value={type}

                  onChange={(event) =>

                    setType(event.target.value)

                  }

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

                  placeholder="Ex. Découvrez notre nouvelle offre"

                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"

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

                  placeholder="Décrivez votre publicité..."

                  rows={4}

                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"

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

              Sélectionnez l'image ou la vidéo de votre

              publicité.

            </p>



            <div className="mt-5">

              <label className="mb-3 block text-sm font-medium">

                Fichier média

              </label>



              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900 px-6 py-10 text-center transition hover:border-blue-500 hover:bg-slate-900/80">

                <span className="text-3xl">

                  {type === "video" ? "🎬" : "🖼️"}

                </span>



                <span className="mt-3 font-medium">

                  Choisir un fichier

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

                    Fichier sélectionné

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



            <p className="mt-1 text-sm text-slate-400">

              Indiquez la page vers laquelle l'utilisateur

              sera redirigé lorsqu'il clique sur la publicité.

            </p>



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

                placeholder="https\://www\.exemple.fr"

                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"

              />

            </div>

          </div>



          {/* Erreur */}

          {/* Ciblage vidéo */}
         <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
           <h3 className="text-lg font-semibold">
             5. Ciblage des vidéos
           </h3>

           <p className="mt-1 text-sm text-slate-400">
             Choisissez les catégories de vidéos Wix sur lesquelles cette publicité peut être diffusée.
             Si aucune catégorie n'est sélectionnée, la publicité sera disponible sur toutes les catégories.
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


         {errorMessage && (

            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">

              {errorMessage}

            </div>

          )}



          {/* Actions */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link

              href="/dashboard/publicites"

              className="rounded-xl border border-white/10 px-5 py-3 text-center font-medium hover:bg-white/5"

            >

              Annuler

            </Link>



            <button

              type="submit"

              disabled={

                saving ||

                uploading ||

                loadingCampaigns ||

                campaigns.length === 0

              }

              className="rounded-xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"

            >

              {uploading

                ? "Envoi du fichier..."

                : saving

                  ? "Création..."

                  : "Créer la publicité"}

            </button>

          </div>

        </form>

      </div>

    </main>

  );

}