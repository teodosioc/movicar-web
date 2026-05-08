import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { inspectionId } = body;

    if (!inspectionId) {
      return NextResponse.json(
        { error: "inspectionId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca vistoria
    const { data: inspection, error: inspectionError } = await supabase
      .from("inspections")
      .select(`
        id,
        created_at,
        driver_name,
        vehicle:vehicles (
          id,
          plate,
          model
        )
      `)
      .eq("id", inspectionId)
      .single();

    if (inspectionError || !inspection) {
      console.error(inspectionError);

      return NextResponse.json(
        { error: "Vistoria não encontrada" },
        { status: 404 }
      );
    }

    // Busca admins
    const { data: admins, error: adminError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "admin")
      .eq("active", true);

    if (adminError) {
      console.error(adminError);

      return NextResponse.json(
        { error: "Erro ao buscar admins" },
        { status: 500 }
      );
    }

    if (!admins || admins.length === 0) {
      return NextResponse.json(
        { error: "Nenhum admin encontrado" },
        { status: 404 }
      );
    }

    // Cria notificações
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type: "inspection_completed",
      title: "Nova vistoria realizada",
      message: `O motorista ${inspection.driver_name} concluiu a vistoria do veículo ${inspection.vehicle?.plate}.`,
      link: `/dashboard/inspections/${inspection.id}`,
    }));

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error(notificationError);

      return NextResponse.json(
        { error: "Erro ao criar notificações" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}