"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Fuel, Banknote, Gauge, Calendar, Cog, CarFront, Ruler } from "lucide-react";
import { useGarageStore } from "@/stores/garage";
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

interface InsightProps {
  icon: React.ReactNode;
  title: string;
  winnerName: string | null;
  detail: string;
}

function InsightCard({ icon, title, winnerName, detail }: InsightProps) {
  if (!winnerName) return null;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 text-primary-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#6B7280] uppercase tracking-wider font-medium">{title}</p>
        <p className="text-[15px] font-semibold text-white mt-0.5 truncate">{winnerName}</p>
        <p className="text-sm text-[#6B7280] mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

interface SpecRowDef {
  label: string;
  icon: React.ReactNode;
  key: keyof GarageCar;
  suffix?: string;
}

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
  return ALL_SPEC_ROWS.filter((row) =>
    cars.some((c) => {
      const v = c[row.key];
      return v != null && v !== "" && v !== 0;
    })
  );
}

function getEquipmentList(cars: GarageCar[]): string[] {
  const all = new Set<string>();
  cars.forEach((c) => {
    if (c.equipment) c.equipment.split(",").filter(Boolean).forEach((e) => all.add(e.trim()));
  });
  return Array.from(all).sort();
}

const EQUIP_LABELS: Record<string, string> = {
  apple_carplay: "Apple CarPlay", android_auto: "Android Auto", rear_camera: "Geri Kamera",
  sunroof: "Sunroof", panoramic_roof: "Panoramik Tavan", adaptive_cruise_control: "Adaptif Cruise",
  lane_keep_assist: "Şerit Takip", blind_spot_warning: "Kör Nokta", head_up_display: "Head-up Display",
  led_headlights: "LED Far", automatic_park_assistant: "Otopark",
};

export default function GarageComparePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  const isTr = locale === "tr";

  const cars = useGarageStore((s) => s.selectedCars());
  const load = useGarageStore((s) => s.load);
  const allCars = useGarageStore((s) => s.cars);

  useEffect(() => {
    if (allCars.length === 0) load();
  }, [allCars.length, load]);

  if (cars.length < 2) {
    return (
      <div className="min-h-screen pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 pt-10">
          <Link href={`/${locale}/garage`} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {isTr ? "Garaja dön" : "Back"}
          </Link>
          <div className="text-center pt-10">
            <p className="text-base text-white font-medium mb-2">{isTr ? "En az 2 araç seç" : "Select at least 2 cars"}</p>
            <p className="text-sm text-[#6B7280] mb-6">{isTr ? "Garajdan araç seçerek karşılaştırma yap." : "Select cars from your garage."}</p>
            <Link href={`/${locale}/garage`} className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-semibold text-sm">
              {isTr ? "Garaja Dön" : "Go to Garage"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeRows = getActiveRows(cars);
  const equipList = getEquipmentList(cars);
  const cheapest = winner(cars, "price", "min");
  const strongest = winner(cars, "horsepower", "max");
  const economical = winner(cars, "combined_fuel_consumption", "min");
  const lowestKm = winner(cars, "mileage_km", "min");

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back */}
        <Link href={`/${locale}/garage`} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> {isTr ? "Garaja dön" : "Back"}
        </Link>

        <h1 className="text-2xl font-bold text-white font-display mb-2">{isTr ? "Karşılaştırma" : "Compare"}</h1>
        <p className="text-sm text-[#6B7280] mb-8">{cars.map((c) => `${c.brand} ${c.model}`).join(" vs ")}</p>

        {/* Insight cards — only show if data exists */}
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
          <InsightCard icon={<Gauge className="w-5 h-5" />} title={isTr ? "En Düşük KM" : "Lowest Mileage"}
            winnerName={lowestKm ? `${lowestKm.brand} ${lowestKm.model}` : null}
            detail={lowestKm?.mileage_km != null ? `${fmt(lowestKm.mileage_km)} km` : "—"} />
        </div>

        {/* Comparison table — dynamic rows */}
        {activeRows.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
              {isTr ? "Teknik Detaylar" : "Specs"}
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-10">
              {/* Header */}
              <div className="grid border-b border-white/[0.06] bg-white/[0.03]"
                style={{ gridTemplateColumns: `120px repeat(${cars.length}, 1fr)` }}>
                <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]" />
                {cars.map((c) => (
                  <div key={c.id} className="px-3 py-3 text-sm font-semibold text-white truncate text-center">
                    <span className="block truncate">{c.brand}</span>
                    <span className="block truncate text-xs text-[#9CA3AF] font-normal">{c.model}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {activeRows.map((row) => (
                <div key={row.key} className="grid border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  style={{ gridTemplateColumns: `120px repeat(${cars.length}, 1fr)` }}>
                  <div className="px-3 py-3 text-sm text-[#9CA3AF] flex items-center gap-2">
                    <span className="text-[#6B7280]">{row.icon}</span>
                    {row.label}
                  </div>
                  {cars.map((c) => {
                    const val = c[row.key];
                    const display = val != null && val !== "" && val !== 0
                      ? (typeof val === "number" ? fmt(val) : String(val)) + (row.suffix || "")
                      : "—";
                    return (
                      <div key={c.id} className="px-3 py-3 text-sm text-white tabular-nums text-center font-medium">
                        {display}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Equipment comparison */}
        {equipList.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
              {isTr ? "Donanım" : "Equipment"}
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="grid border-b border-white/[0.06] bg-white/[0.03]"
                style={{ gridTemplateColumns: `140px repeat(${cars.length}, 1fr)` }}>
                <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  {isTr ? "Özellik" : "Feature"}
                </div>
                {cars.map((c) => (
                  <div key={c.id} className="px-3 py-3 text-sm font-semibold text-white truncate text-center">
                    {c.brand}
                  </div>
                ))}
              </div>
              {equipList.map((eq) => (
                <div key={eq} className="grid border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  style={{ gridTemplateColumns: `140px repeat(${cars.length}, 1fr)` }}>
                  <div className="px-3 py-2.5 text-sm text-[#9CA3AF]">{EQUIP_LABELS[eq] || eq}</div>
                  {cars.map((c) => {
                    const has = c.equipment?.split(",").map((s) => s.trim()).includes(eq);
                    return (
                      <div key={c.id} className="px-3 py-2.5 text-center">
                        {has ? (
                          <span className="inline-block w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold leading-6">✓</span>
                        ) : (
                          <span className="text-[#475569]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
