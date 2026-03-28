"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitCompare, Plus, Trophy, Fuel, Banknote, Gauge, Calendar, Cog, CarFront, Ruler } from "lucide-react";
import { CarSearchSlot } from "@/components/compare/CarSearchSlot";
import type { GarageCar } from "@/lib/araba-iq-client";

function fmt(val: number | null | undefined): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("tr-TR").format(val);
}

function winner(cars: GarageCar[], key: keyof GarageCar, mode: "min" | "max"): GarageCar | null {
  const valid = cars.filter((c) => c[key] != null);
  if (valid.length === 0) return null;
  return valid.reduce((best, c) => {
    const bv = Number(best[key]);
    const cv = Number(c[key]);
    return mode === "min" ? (cv < bv ? c : best) : (cv > bv ? c : best);
  });
}

function InsightCard({ icon, title, winnerName, detail }: { icon: React.ReactNode; title: string; winnerName: string | null; detail: string }) {
  if (!winnerName) return null;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 text-primary-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[#6B7280] uppercase tracking-wider font-medium">{title}</p>
        <p className="text-[15px] font-semibold text-white mt-0.5 truncate">{winnerName}</p>
        <p className="text-sm text-[#6B7280] mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

interface SpecRowDef { label: string; icon: React.ReactNode; key: keyof GarageCar; suffix?: string }

const ALL_SPEC_ROWS: SpecRowDef[] = [
  { label: "Fiyat", icon: <Banknote className="w-3.5 h-3.5" />, key: "price", suffix: " ₺" },
  { label: "Yıl", icon: <Calendar className="w-3.5 h-3.5" />, key: "year" },
  { label: "KM", icon: <Gauge className="w-3.5 h-3.5" />, key: "mileage_km", suffix: " km" },
  { label: "Yakıt", icon: <Fuel className="w-3.5 h-3.5" />, key: "fuel_type" },
  { label: "Vites", icon: <Cog className="w-3.5 h-3.5" />, key: "transmission" },
  { label: "Kasa", icon: <CarFront className="w-3.5 h-3.5" />, key: "body_type" },
  { label: "Motor (cc)", icon: <Cog className="w-3.5 h-3.5" />, key: "engine_cc", suffix: " cc" },
  { label: "Motor Gücü", icon: <Trophy className="w-3.5 h-3.5" />, key: "horsepower", suffix: " HP" },
  { label: "Tüketim", icon: <Fuel className="w-3.5 h-3.5" />, key: "combined_fuel_consumption", suffix: " L/100km" },
  { label: "Bagaj", icon: <Ruler className="w-3.5 h-3.5" />, key: "luggage_capacity", suffix: " L" },
  { label: "Segment", icon: <CarFront className="w-3.5 h-3.5" />, key: "segment" },
];

function getActiveRows(cars: GarageCar[]): SpecRowDef[] {
  return ALL_SPEC_ROWS.filter((row) => cars.some((c) => { const v = c[row.key]; return v != null && v !== "" && v !== 0; }));
}

function getEquipmentList(cars: GarageCar[]): string[] {
  const all = new Set<string>();
  cars.forEach((c) => { if (c.equipment) c.equipment.split(",").filter(Boolean).forEach((e) => all.add(e.trim())); });
  return Array.from(all).sort();
}

const EQUIP_LABELS: Record<string, string> = {
  apple_carplay: "Apple CarPlay", android_auto: "Android Auto", rear_camera: "Geri Kamera",
  sunroof: "Sunroof", panoramic_roof: "Panoramik Tavan", adaptive_cruise_control: "Adaptif Cruise",
  lane_keep_assist: "Şerit Takip", blind_spot_warning: "Kör Nokta", head_up_display: "Head-up Display",
  led_headlights: "LED Far", automatic_park_assistant: "Otopark",
};

const MAX_SLOTS = 4;

export default function ComparePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  const isTr = locale === "tr";

  const [slots, setSlots] = useState<Array<GarageCar | null>>([null, null]);
  const [showResults, setShowResults] = useState(false);

  const setSlot = (idx: number, car: GarageCar | null) => {
    setSlots((prev) => { const next = [...prev]; next[idx] = car; return next; });
    setShowResults(false);
  };

  const addSlot = () => {
    if (slots.length < MAX_SLOTS) {
      setSlots((prev) => [...prev, null]);
      setShowResults(false);
    }
  };

  const removeSlot = (idx: number) => {
    if (slots.length > 2) {
      setSlots((prev) => prev.filter((_, i) => i !== idx));
      setShowResults(false);
    } else {
      setSlot(idx, null);
    }
  };

  const filledCars = slots.filter((s): s is GarageCar => s !== null);
  const canCompare = filledCars.length >= 2;

  const handleCompare = () => {
    if (canCompare) setShowResults(true);
  };

  const activeRows = showResults ? getActiveRows(filledCars) : [];
  const equipList = showResults ? getEquipmentList(filledCars) : [];
  const cheapest = showResults ? winner(filledCars, "price", "min") : null;
  const strongest = showResults ? winner(filledCars, "horsepower", "max") : null;
  const economical = showResults ? winner(filledCars, "combined_fuel_consumption", "min") : null;
  const lowestKm = showResults ? winner(filledCars, "mileage_km", "min") : null;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back */}
        <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> {isTr ? "Ana sayfa" : "Home"}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-primary-400" />
            {isTr ? "Araç Karşılaştır" : "Compare Cars"}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {isTr ? "Araç arayın ve karşılaştırmak istediğinizi seçin." : "Search and pick cars to compare."}
          </p>
        </div>

        {/* Slots */}
        <div className="space-y-3 mb-6">
          {slots.map((car, idx) => (
            <CarSearchSlot
              key={idx}
              value={car}
              slotIndex={idx}
              onSelect={(c) => setSlot(idx, c)}
              onClear={() => removeSlot(idx)}
              placeholder={isTr
                ? `${idx + 1}. araç ara (ör: BMW 320, Corolla...)`
                : `Search car ${idx + 1}...`}
            />
          ))}
        </div>

        {/* Add slot + Compare button */}
        <div className="flex gap-3 mb-10">
          {slots.length < MAX_SLOTS && (
            <button
              type="button"
              onClick={addSlot}
              className="flex-1 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] py-3 text-sm text-[#6B7280] hover:text-white hover:border-white/[0.15] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isTr ? "Araç ekle" : "Add car"}
            </button>
          )}
          <button
            type="button"
            onClick={handleCompare}
            disabled={!canCompare}
            className={`flex-[2] rounded-xl py-3.5 text-base font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 ${
              canCompare
                ? "btn-gradient text-white"
                : "bg-white/[0.04] border-2 border-white/[0.06] text-[#475569] cursor-not-allowed"
            }`}
          >
            <GitCompare className="w-5 h-5" />
            {canCompare
              ? (isTr ? `${filledCars.length} Aracı Karşılaştır` : `Compare ${filledCars.length} Cars`)
              : (isTr ? "En az 2 araç seçin" : "Select at least 2")}
          </button>
        </div>

        {/* Results */}
        {showResults && filledCars.length >= 2 && (
          <div className="animate-in">
            {/* Divider */}
            <div className="border-t border-white/[0.06] mb-8" />

            <h2 className="text-lg font-bold text-white font-display mb-1">
              {isTr ? "Sonuçlar" : "Results"}
            </h2>
            <p className="text-sm text-[#6B7280] mb-6">
              {filledCars.map((c) => `${c.brand} ${c.model}`).join(" vs ")}
            </p>

            {/* Insight cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              <InsightCard icon={<Banknote className="w-5 h-5" />} title={isTr ? "En Uygun Fiyat" : "Best Price"}
                winnerName={cheapest ? `${cheapest.brand} ${cheapest.model}` : null}
                detail={cheapest?.price != null ? `${fmt(cheapest.price)} ₺` : "—"} />
              <InsightCard icon={<Trophy className="w-5 h-5" />} title={isTr ? "En Güçlü" : "Most Power"}
                winnerName={strongest ? `${strongest.brand} ${strongest.model}` : null}
                detail={strongest?.horsepower != null ? `${strongest.horsepower} HP` : "—"} />
              <InsightCard icon={<Fuel className="w-5 h-5" />} title={isTr ? "En Ekonomik" : "Best Economy"}
                winnerName={economical ? `${economical.brand} ${economical.model}` : null}
                detail={economical?.combined_fuel_consumption != null ? `${economical.combined_fuel_consumption} L/100km` : "—"} />
              <InsightCard icon={<Gauge className="w-5 h-5" />} title={isTr ? "En Düşük KM" : "Lowest KM"}
                winnerName={lowestKm ? `${lowestKm.brand} ${lowestKm.model}` : null}
                detail={lowestKm?.mileage_km != null ? `${fmt(lowestKm.mileage_km)} km` : "—"} />
            </div>

            {/* Spec table */}
            {activeRows.length > 0 && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">{isTr ? "Teknik Detaylar" : "Specs"}</h3>
                <div className="rounded-xl border border-white/[0.06] overflow-x-auto mb-10">
                  <div className="min-w-[400px]">
                    <div className="grid border-b border-white/[0.06] bg-white/[0.03]"
                      style={{ gridTemplateColumns: `120px repeat(${filledCars.length}, 1fr)` }}>
                      <div className="px-3 py-3" />
                      {filledCars.map((c) => (
                        <div key={c.id} className="px-3 py-3 text-center">
                          <p className="text-sm font-semibold text-white truncate">{c.brand}</p>
                          <p className="text-xs text-[#9CA3AF] truncate">{c.model}</p>
                        </div>
                      ))}
                    </div>
                    {activeRows.map((row) => (
                      <div key={row.key} className="grid border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                        style={{ gridTemplateColumns: `120px repeat(${filledCars.length}, 1fr)` }}>
                        <div className="px-3 py-3 text-sm text-[#9CA3AF] flex items-center gap-2">
                          <span className="text-[#6B7280]">{row.icon}</span> {row.label}
                        </div>
                        {filledCars.map((c) => {
                          const val = c[row.key];
                          const display = val != null && val !== "" && val !== 0
                            ? (typeof val === "number" ? fmt(val) : String(val)) + (row.suffix || "")
                            : "—";
                          return (
                            <div key={c.id} className="px-3 py-3 text-sm text-white tabular-nums text-center font-medium">{display}</div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Equipment */}
            {equipList.length > 0 && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">{isTr ? "Donanım" : "Equipment"}</h3>
                <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
                  <div className="min-w-[400px]">
                    <div className="grid border-b border-white/[0.06] bg-white/[0.03]"
                      style={{ gridTemplateColumns: `140px repeat(${filledCars.length}, 1fr)` }}>
                      <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{isTr ? "Özellik" : "Feature"}</div>
                      {filledCars.map((c) => (
                        <div key={c.id} className="px-3 py-3 text-sm font-semibold text-white truncate text-center">{c.brand}</div>
                      ))}
                    </div>
                    {equipList.map((eq) => (
                      <div key={eq} className="grid border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                        style={{ gridTemplateColumns: `140px repeat(${filledCars.length}, 1fr)` }}>
                        <div className="px-3 py-2.5 text-sm text-[#9CA3AF]">{EQUIP_LABELS[eq] || eq}</div>
                        {filledCars.map((c) => {
                          const has = c.equipment?.split(",").map((s) => s.trim()).includes(eq);
                          return (
                            <div key={c.id} className="px-3 py-2.5 text-center">
                              {has
                                ? <span className="inline-block w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold leading-6">✓</span>
                                : <span className="text-[#475569]">—</span>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
