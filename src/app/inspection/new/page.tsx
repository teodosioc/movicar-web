"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import CameraCapture from "../../components/CameraCapture";

type InspectionItem = {
  id: string;
  name: string;
  type: "photo" | "video";
  required: boolean;
  order_index: number;
  instructions?: string | null;
};

type Vehicle = {
  id: string;
  plate: string;
};

type CapturedMediaMap = Record<
  string,
  {
    fileUrl: string;
    previewUrl: string;
    filePath: string;
    mediaType: "photo" | "video";
  }
>;

const normalizeText = (value?: string | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const getDisplayName = (itemName?: string) => {
  const normalized = normalizeText(itemName);

  if (normalized.includes("frente")) return "Foto frente";
  if (normalized.includes("traseira")) return "Foto traseira";
  if (normalized.includes("lateral direita")) return "Lateral direita";
  if (normalized.includes("lateral esquerda")) return "Lateral esquerda";
  if (
    normalized.includes("quilometragem") ||
    normalized.includes("kilometragem") ||
    normalized.includes("velocimetro") ||
    normalized.includes("painel") ||
    normalized.includes("km")
  ) {
    return "Quilometragem/Velocímetro";
  }
  if (normalized.includes("video")) return "Vídeo 360°";

  return itemName || "Etapa da vistoria";
};

const getExampleImage = (itemName?: string) => {
  const normalized = normalizeText(itemName);

  if (normalized.includes("frente")) return "/examples/foto-frente.png";
  if (normalized.includes("traseira")) return "/examples/foto-traseira.png";
  if (normalized.includes("lateral direita")) return "/examples/lateral-direita.png";
  if (normalized.includes("lateral esquerda")) return "/examples/lateral-esquerda.png";
  if (
    normalized.includes("quilometragem") ||
    normalized.includes("kilometragem") ||
    normalized.includes("velocimetro") ||
    normalized.includes("painel") ||
    normalized.includes("km")
  ) {
    return "/examples/quilometragem-velocimetro.png";
  }

  return null;
};

export default function InspectionPage() {
  const router = useRouter();

  const [items, setItems] = useState<InspectionItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<CapturedMediaMap>({});
  const [capturing, setCapturing] = useState(false);

  const currentItem = items[currentStepIndex];
  const currentItemCompleted = currentItem ? !!capturedMedia[currentItem.id] : false;
  const isLastStep = items.length > 0 && currentStepIndex === items.length - 1;

  const displayName = getDisplayName(currentItem?.name);
  const exampleImage = getExampleImage(currentItem?.name);

  const completedCount = useMemo(() => {
    return items.filter((item) => !!capturedMedia[item.id]).length;
  }, [items, capturedMedia]);

  const progressPercentage = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((completedCount / items.length) * 100);
  }, [completedCount, items.length]);

  useEffect(() => {
    loadItems();
    loadVehicles();
  }, []);

  const loadItems = async () => {
    const { data, error } = await supabase.from("inspection_items").select("*");

    if (error) {
      console.error(error);
      alert("Erro ao carregar itens.");
      return;
    }

    const ordered = (data || []).sort((a, b) => {
      if (a.type === "video") return 1;
      if (b.type === "video") return -1;
      return a.order_index - b.order_index;
    });

    setItems(ordered as InspectionItem[]);
  };

  const loadVehicles = async () => {
    const { data, error } = await supabase.from("vehicles").select("*");

    if (error) {
      console.error(error);
      alert("Erro ao carregar veículos.");
      return;
    }

    setVehicles(data || []);
  };

  const createSession = async () => {
    if (!selectedVehicle) {
      alert("Selecione um veículo.");
      return null;
    }

    if (currentSession) return currentSession;

    const { data, error } = await supabase
      .from("inspection_sessions")
      .insert([
        {
          vehicle_id: selectedVehicle,
          status: "in_progress",
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao criar sessão.");
      return null;
    }

    setCurrentSession(data);
    return data;
  };

  const handleCapture = async (file: Blob) => {
    try {
      setLoading(true);

      const session = await createSession();
      if (!session || !currentItem) return;

      const oldMedia = capturedMedia[currentItem.id];
      if (oldMedia?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(oldMedia.previewUrl);
      }

      const extension = currentItem.type === "video" ? "webm" : "jpg";
      const filePath = `${session.id}/${currentItem.type}/${Date.now()}.${extension}`;
      const previewUrl = URL.createObjectURL(file);

      const { error: uploadError } = await supabase.storage
        .from("inspections")
        .upload(filePath, file, {
          contentType: currentItem.type === "video" ? "video/webm" : "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        URL.revokeObjectURL(previewUrl);
        alert("Erro ao enviar arquivo.");
        return;
      }

      const { data: publicData } = supabase.storage
        .from("inspections")
        .getPublicUrl(filePath);

      const fileUrl = publicData.publicUrl;

      await supabase
        .from("inspection_media")
        .delete()
        .eq("session_id", session.id)
        .eq("item_id", currentItem.id);

      const { error: insertError } = await supabase.from("inspection_media").insert([
        {
          session_id: session.id,
          item_id: currentItem.id,
          file_url: fileUrl,
          file_path: filePath,
          media_type: currentItem.type,
          captured_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error(insertError);
        URL.revokeObjectURL(previewUrl);
        alert("Erro ao salvar mídia.");
        return;
      }

      setCapturedMedia((prev) => ({
        ...prev,
        [currentItem.id]: {
          fileUrl,
          previewUrl,
          filePath,
          mediaType: currentItem.type,
        },
      }));

      setCapturing(false);
    } catch (error) {
      console.error(error);
      alert("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    if (!currentItemCompleted) {
      alert("Capture a mídia antes de avançar.");
      return;
    }

    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      setCapturing(false);
    }
  };

  const finishInspection = async () => {
    if (!currentSession) {
      alert("Inicie a vistoria capturando pelo menos uma mídia.");
      return;
    }

    const requiredItems = items.filter((item) => item.required);
    const missingRequired = requiredItems.some((item) => !capturedMedia[item.id]);

    if (missingRequired) {
      alert("Ainda existem etapas obrigatórias sem captura.");
      return;
    }

    const { error } = await supabase
      .from("inspection_sessions")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
      })
      .eq("id", currentSession.id);

    if (error) {
      console.error(error);
      alert("Erro ao finalizar vistoria.");
      return;
    }

    alert("Vistoria finalizada com sucesso!");

    const rawUser = localStorage.getItem("movicar_user");
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    const role = String(parsedUser?.role ?? "").toLowerCase();

    router.push(role === "motorista" ? "/driver" : "/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("movicar_token");
    localStorage.removeItem("movicar_user_email");
    localStorage.removeItem("movicar_user");
    document.cookie = "movicar_token=; path=/; max-age=0; samesite=lax";
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-6 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nova vistoria</h1>
            <p className="text-sm text-slate-600">
              Registre as mídias do veículo por etapa no MoviCar.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Sair
          </button>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow ring-1 ring-slate-200 sm:p-5">
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 outline-none"
          >
            <option value="" className="text-slate-900">
              Selecione veículo
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} className="text-slate-900">
                {v.plate}
              </option>
            ))}
          </select>

          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm text-slate-700">
              <span>
                Etapa {items.length > 0 ? currentStepIndex + 1 : 0} de {items.length}
              </span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2 rounded bg-slate-200">
              <div
                className="h-2 rounded bg-emerald-600 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {currentItem && (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
              <h2 className="mb-3 text-xl font-bold text-slate-900">
                {displayName}
              </h2>

              {!capturing && !currentItemCompleted && exampleImage && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Siga o modelo:
                  </p>
                  <img
                    src={exampleImage}
                    alt={`Exemplo - ${displayName}`}
                    className="w-full rounded-2xl border border-slate-200 object-cover"
                  />
                </div>
              )}

              {capturing ? (
                <CameraCapture type={currentItem.type} onCapture={handleCapture} />
              ) : !currentItemCompleted ? (
                <>
                  <button
                    onClick={() => setCapturing(true)}
                    disabled={!selectedVehicle || loading}
                    className="w-full rounded-2xl bg-emerald-600 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {currentItem.type === "video" ? "Gravar vídeo" : "Tirar foto"}
                  </button>

                  {!selectedVehicle && (
                    <p className="mt-2 text-sm text-amber-700">
                      Selecione um veículo para continuar.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {capturedMedia[currentItem.id].mediaType === "photo" ? (
                    <img
                      src={capturedMedia[currentItem.id].previewUrl}
                      alt={displayName}
                      className="w-full rounded-2xl"
                    />
                  ) : (
                    <video
                      src={capturedMedia[currentItem.id].previewUrl}
                      controls
                      className="w-full rounded-2xl"
                    />
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => setCapturing(true)}
                      disabled={loading}
                      className="flex-1 rounded-2xl bg-amber-500 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Refazer
                    </button>

                    {isLastStep ? (
                      <button
                        onClick={finishInspection}
                        disabled={loading}
                        className="flex-1 rounded-2xl bg-emerald-700 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Finalizar
                      </button>
                    ) : (
                      <button
                        onClick={goToNextStep}
                        disabled={loading}
                        className="flex-1 rounded-2xl bg-emerald-700 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Próxima
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <p className="mt-3 text-sm text-slate-600">Processando...</p>
          )}
        </div>
      </div>
    </div>
  );
}