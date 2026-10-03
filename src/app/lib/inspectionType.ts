export type InspectionType =
  | "entry"
  | "exit"
  | "consignment_return"
  | "extraordinary";

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  entry: "Entrada",
  exit: "Saída",
  consignment_return: "Devolução de consignado",
  extraordinary: "Extraordinária",
};

export function isInspectionType(value: unknown): value is InspectionType {
  return typeof value === "string" && value in INSPECTION_TYPE_LABELS;
}

export function formatInspectionType(value?: string | null): string {
  return isInspectionType(value) ? INSPECTION_TYPE_LABELS[value] : "-";
}
