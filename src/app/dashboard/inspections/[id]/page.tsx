"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { buildKmTraveledByInspectionId } from "@/app/lib/inspectionKmPeriod";
import { buildInspectionMapsUrl } from "@/app/lib/inspectionMapsUrl";
import InspectionMediaGallery, {
  type GalleryMediaItem,
} from "@/app/components/InspectionMediaGallery";
import { ArrowLeft, Images, MapPin } from "lucide-react";

type Inspection = {
  id: string;
  vehicle_id: string;
  driver_name: string | null;
  status: string;
  odometer: number | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string | null;
  vehicles?:
    | {
        plate: string;
        model: string | null;
        brand: string | null;
        year: string | null;
      }
    | {
        plate: string;
        model: string | null;
        brand: string | null;
        year: string | null;
      }[];
};

type InspectionVehicle = {
  plate: string;
  model: string | null;
  brand: string | null;
  year: string | null;
};

function getInspectionVehicle(
  vehicles?: Inspection["vehicles"] | null
): InspectionVehicle | null {
  if (!vehicles) return null;
  return Array.isArray(vehicles) ? vehicles[0] ?? null : vehicles;
}

type Media = {
  id: string;
  file_path: string | null;
  media_type: "photo" | "video";
  item_id: string;
  signed_url?: string | null;
  order_index: number | null;
  item_name: string | null;
};

function getInspectionStatusLabel(status?: string | null) {
  switch (String(status ?? "").toLowerCase()) {
    case "completed":
      return "Concluída";
    case "in_progress":
      return "Em andamento";
    case "pending":
      return "Pendente";
    case "cancelled":
      return "Cancelada";
    default:
      return status || "-";
  }
}

function getMediaOrderIndex(media: Media) {
  return media.order_index ?? Number.MAX_SAFE_INTEGER;
}

function logLoadInspectionError(err: unknown) {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    const code = o.code;
    const message = o.message;
    const details = o.details;
    const hint = o.hint;
    console.error("[loadInspection]", { code, message, details, hint, err });
    return;
  }
  console.error("[loadInspection]", err);
}

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = params?.id as string;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [kmTraveledInPeriod, setKmTraveledInPeriod] = useState<number | null>(
    null
  );
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  // Fotos na sequência das etapas da vistoria; vídeos ao final. Mídias sem
  // etapa identificada permanecem na lista (ordenadas por último entre as
  // fotos, sem rótulo).
  const galleryItems = useMemo<GalleryMediaItem[]>(() => {
    const photos = media.filter((m) => m.media_type === "photo");
    const videos = media.filter((m) => m.media_type !== "photo");
    return [...photos, ...videos].map((m) => ({
      id: m.id,
      url: m.signed_url ?? null,
      type: m.media_type === "photo" ? "photo" : "video",
      label: m.item_name,
    }));
  }, [media]);

  const openGallery = useCallback(
    (mediaId: string) => {
      const idx = galleryItems.findIndex((g) => g.id === mediaId);
      if (idx >= 0) setGalleryIndex(idx);
    },
    [galleryItems]
  );

  const loadInspection = useCallback(async () => {
    if (!inspectionId) {
      setInspection(null);
      setMedia([]);
      setKmTraveledInPeriod(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: inspectionData, error: inspectionError } = await supabase
        .from("inspections")
        .select(
          `
            *,
            vehicles (
              plate,
              model,
              brand,
              year
            )
          `
        )
        .eq("id", inspectionId)
        .single();

      if (inspectionError) throw inspectionError;

      let kmPeriod: number | null = null;
      if (inspectionData.vehicle_id) {
        const { data: histRows, error: histError } = await supabase
          .from("inspections")
          .select("id, vehicle_id, odometer, finished_at, created_at")
          .eq("vehicle_id", inspectionData.vehicle_id)
          .not("odometer", "is", null);

        if (histError) throw histError;
        const map = buildKmTraveledByInspectionId(histRows ?? []);
        kmPeriod = map[inspectionId] ?? null;
      }

      const { data: mediaData, error: mediaError } = await supabase
        .from("inspection_media")
        .select("id, file_path, media_type, item_id")
        .eq("inspection_id", inspectionId);

      if (mediaError) throw mediaError;

      const rawMedia = (mediaData ?? []) as Omit<
        Media,
        "signed_url" | "order_index" | "item_name"
      >[];

      const itemIds = [
        ...new Set(
          rawMedia.map((m) => m.item_id).filter((id): id is string => Boolean(id))
        ),
      ];

      const itemMetaById = new Map<
        string,
        { order_index: number | null; name: string | null }
      >();

      if (itemIds.length > 0) {
        const { data: itemsRows, error: itemsError } = await supabase
          .from("inspection_items")
          .select("id, order_index, name")
          .in("id", itemIds);

        if (itemsError) throw itemsError;

        for (const row of itemsRows ?? []) {
          const id = row.id as string;
          itemMetaById.set(id, {
            order_index:
              typeof row.order_index === "number" ? row.order_index : null,
            name: (row.name as string | null) ?? null,
          });
        }
      }

      const mediaRows: Media[] = rawMedia.map((m) => {
        const meta = itemMetaById.get(m.item_id);
        return {
          ...m,
          order_index: meta?.order_index ?? null,
          item_name: meta?.name ?? null,
        };
      });

      mediaRows.sort((a, b) => getMediaOrderIndex(a) - getMediaOrderIndex(b));

      const mediaWithUrls = await Promise.all(
        mediaRows.map(async (m) => {
          if (!m.file_path) {
            return {
              ...m,
              signed_url: null,
            };
          }

          const { data: signed, error: signedError } = await supabase.storage
            .from("inspections")
            .createSignedUrl(m.file_path, 60 * 60);

          if (signedError) {
            console.error("Erro ao gerar signed URL:", signedError);
          }

          return {
            ...m,
            signed_url: signed?.signedUrl || null,
          };
        })
      );

      setInspection(inspectionData);
      setKmTraveledInPeriod(kmPeriod);
      setMedia(mediaWithUrls);
    } catch (err) {
      logLoadInspectionError(err);
      setKmTraveledInPeriod(null);
      alert("Erro ao carregar vistoria");
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    void loadInspection();
  }, [loadInspection]);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("pt-BR");
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-600">Carregando...</div>;
  }

  if (!inspection) {
    return (
      <div className="p-6 text-center text-red-600">Vistoria não encontrada</div>
    );
  }

  const relatedVehicle = getInspectionVehicle(inspection.vehicles);
  const vehicleName = [relatedVehicle?.brand, relatedVehicle?.model]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <h1 className="text-xl font-bold text-slate-900">
            Detalhe da vistoria
          </h1>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-slate-500">Placa</p>
              <p className="font-semibold">{relatedVehicle?.plate || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Veículo</p>
              <p className="font-semibold">{vehicleName || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Motorista</p>
              <p>
                {inspection.driver_name
                  ? inspection.driver_name.split(" ")[0]
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Data</p>
              <p>{formatDate(inspection.finished_at || inspection.created_at)}</p>
            </div>

            <div>
              <p className="text-slate-500">Status</p>
              <p className="font-semibold text-green-600">
                {getInspectionStatusLabel(inspection.status)}
              </p>
            </div>

            <div>
              <p className="text-slate-500">KM</p>
              <p>
                {inspection.odometer != null
                  ? inspection.odometer.toLocaleString("pt-BR")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-slate-500">KM no período</p>
              <p>
                {kmTraveledInPeriod != null
                  ? kmTraveledInPeriod.toLocaleString("pt-BR")
                  : "-"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Diferença em relação à vistoria anterior deste veículo com
                quilometragem registrada.
              </p>
            </div>
          </div>

          {inspection.latitude != null && inspection.longitude != null && (
            <a
              href={buildInspectionMapsUrl(
                inspection.latitude,
                inspection.longitude
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <MapPin size={16} />
              Ver no mapa
            </a>
          )}
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-bold">Fotos e vídeos</h2>

          {media.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma mídia encontrada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {media.map((m) => (
                <div
                  key={m.id}
                  className="overflow-hidden rounded-2xl border bg-black"
                >
                  {m.media_type === "photo" ? (
                    <button
                      type="button"
                      onClick={() => openGallery(m.id)}
                      aria-label={`Abrir ${m.item_name ?? "foto"} na galeria`}
                      className="block w-full cursor-zoom-in focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <img
                        src={m.signed_url || ""}
                        alt={m.item_name ?? "Foto da vistoria"}
                        className="h-40 w-full object-cover transition hover:scale-[1.02]"
                      />
                    </button>
                  ) : (
                    <div>
                      <video
                        src={m.signed_url || ""}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-40 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => openGallery(m.id)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 bg-slate-900 px-2 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <Images size={16} />
                        Abrir na galeria
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {galleryIndex != null && (
        <InspectionMediaGallery
          items={galleryItems}
          initialIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </main>
  );
}