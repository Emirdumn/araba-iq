import type { RecommendationRequestBody, RecommendationResponse } from "@/types/araba-iq-recommendation";
import type { SegmentItem } from "@/types/araba-iq-recommendation";

const ARABAIQ_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ARABAIQ_API_URL) ||
  "http://localhost:8100/api/v1";

function formatFastApiDetail(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (typeof detail === "object" && detail !== null && "message" in detail) {
    return String((detail as { message: string }).message);
  }
  return String(detail);
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export async function postRecommendations(body: RecommendationRequestBody): Promise<RecommendationResponse> {
  const res = await fetch(`${ARABAIQ_BASE}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await parseJsonResponse(res)) as { detail?: unknown };
  if (!res.ok) {
    throw new Error(formatFastApiDetail(data?.detail) || `HTTP ${res.status}`);
  }
  return data as RecommendationResponse;
}

export interface CarCompareResponse {
  cars: Array<{
    car_variant_id: number;
    display_name: string;
    brand: string;
    model: string;
    segment: string;
    trim_name: string;
    year: number;
    technical: Record<string, unknown>;
    performance: Record<string, unknown>;
    market?: Record<string, unknown> | null;
  }>;
  technical_comparison: Record<string, Record<string, unknown>>;
  performance_comparison: Record<string, Record<string, unknown>>;
  market_comparison: Record<string, unknown>;
  equipment_comparison: Record<string, unknown>;
  summary_comments: string[];
}

export async function postCompare(carIds: number[]): Promise<CarCompareResponse> {
  const res = await fetch(`${ARABAIQ_BASE}/cars/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ car_ids: carIds }),
  });
  const data = (await parseJsonResponse(res)) as { detail?: unknown };
  if (!res.ok) {
    throw new Error(formatFastApiDetail(data?.detail) || `HTTP ${res.status}`);
  }
  return data as CarCompareResponse;
}

export async function fetchSegments(): Promise<SegmentItem[]> {
  const res = await fetch(`${ARABAIQ_BASE}/segments`, { method: "GET" });
  const data = (await parseJsonResponse(res)) as { detail?: unknown };
  if (!res.ok) {
    throw new Error(formatFastApiDetail(data?.detail) || `HTTP ${res.status}`);
  }
  return data as SegmentItem[];
}

// ── Garage CRUD ──

export interface GarageCar {
  id: number;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price: number | null;
  mileage_km: number | null;
  listing_url: string | null;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  segment: string | null;
  horsepower: number | null;
  engine_cc: number | null;
  combined_fuel_consumption: number | null;
  luggage_capacity: number | null;
  equipment: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type GarageCarInput = Omit<GarageCar, "id" | "created_at" | "updated_at">;

export interface GarageListResponse {
  items: GarageCar[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchGarageCars(
  opts: { limit?: number; offset?: number; search?: string } = {}
): Promise<GarageListResponse> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.search) params.set("search", opts.search);
  const qs = params.toString();
  const res = await fetch(`${ARABAIQ_BASE}/garage${qs ? `?${qs}` : ""}`);
  const data = (await parseJsonResponse(res)) as { detail?: unknown };
  if (!res.ok) throw new Error(formatFastApiDetail(data?.detail) || `HTTP ${res.status}`);
  return data as GarageListResponse;
}

export async function createGarageCar(body: Partial<GarageCarInput>): Promise<GarageCar> {
  const res = await fetch(`${ARABAIQ_BASE}/garage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await parseJsonResponse(res)) as { detail?: unknown };
  if (!res.ok) throw new Error(formatFastApiDetail(data?.detail) || `HTTP ${res.status}`);
  return data as GarageCar;
}

export async function updateGarageCar(id: number, body: Partial<GarageCarInput>): Promise<GarageCar> {
  const res = await fetch(`${ARABAIQ_BASE}/garage/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await parseJsonResponse(res)) as { detail?: unknown };
  if (!res.ok) throw new Error(formatFastApiDetail(data?.detail) || `HTTP ${res.status}`);
  return data as GarageCar;
}

export async function deleteGarageCar(id: number): Promise<void> {
  const res = await fetch(`${ARABAIQ_BASE}/garage/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = (await parseJsonResponse(res)) as { detail?: unknown };
    throw new Error(formatFastApiDetail(data?.detail) || `HTTP ${res.status}`);
  }
}

export { ARABAIQ_BASE };
