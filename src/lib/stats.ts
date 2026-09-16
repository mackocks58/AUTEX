import type { Service, ServiceResult } from "@/types";

export function resultSymbol(result: ServiceResult): "X" | "✅" | "—" {
  if (result === "won") return "✅";
  if (result === "lost") return "X";
  return "—";
}

export function lastFiveStats(Services: Record<string, Service> | null | undefined): ServiceResult[] {
  if (!Services) return [];
  const rows = Object.entries(Services)
    .map(([id, v]) => ({ id, ...v }))
    .filter((b) => b.result === "won" || b.result === "lost")
    .sort((a, b) => Number(b.settledAt ?? b.createdAt) - Number(a.settledAt ?? a.createdAt))
    .slice(0, 5);

  if (!rows.length) return [];
  return rows.map((b) => b.result);
}
