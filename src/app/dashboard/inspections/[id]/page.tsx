"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { buildKmTraveledByInspectionId } from "@/app/lib/inspectionKmPeriod";
import { ArrowLeft, MapPin, X } from "lucide-react";

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
};

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadInspection();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadInspection = async () => {
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
        .select("*")
        .eq("inspection_id", inspectionId);

      if (mediaError) throw mediaError;

      const mediaWithUrls = await Promise.all(
        (mediaData || []).map(async (m: any) => {
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
      console.error(err);
      setKmTraveledInPeriod(null);
      alert("Erro ao carregar vistoria");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("pt-BR");
  };

  const openMaps = () => {
    if (inspection?.latitude == null || inspection?.longitude == null) return;

    window.open(
      `https://www.google.com/maps?q=${inspection.latitude},${inspection.longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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
              <p>{inspection.driver_name || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Data</p>
              <p>{formatDate(inspection.finished_at || inspection.created_at)}</p>
            </div>

            <div>
              <p className="text-slate-500">Status</p>
              <p className="font-semibold text-green-600">{inspection.status}</p>
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
            <button
              onClick={openMaps}
              className="mt-4 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <MapPin size={16} />
              Ver no mapa
            </button>
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
                      onClick={() => m.signed_url && setSelectedImage(m.signed_url)}
                      className="block w-full cursor-zoom-in"
                    >
                      <img
                        src={m.signed_url || ""}
                        alt="Foto da vistoria"
                        className="h-40 w-full object-cover transition hover:scale-[1.02]"
                      />
                    </button>
                  ) : (
                    <video
                      src={m.signed_url || ""}
                      controls
                      className="h-40 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative max-h-[95vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white"
            >
              <X size={20} />
            </button>

            <img
              src={selectedImage}
              alt="Imagem ampliada da vistoria"
              className="max-h-[95vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </main>
  );
}