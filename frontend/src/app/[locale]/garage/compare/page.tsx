"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Fuel, Banknote, Wrench } from "lucide-react";
import { useGarageStore } from "@/stores/garage";
import type { GarageCar } from "@/lib/araba-iq-client";

function fmt(val: number | null): string {
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
  winner: string | null;
  detail: string;
}

function InsightCard({ icon, title, winner: w, detail }: InsightProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0 text-primary-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#6B7280] uppercase tracking-wider font-medium">{title}</p>
        <p className="text-sm font-semibold text-white mt-0.5 truncate">{w || "—"}</p>
        <p className="text-xs text-[#6B7280] mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

const SPEC_ROWS: Array<{ label: string; key: keyof GarageCar; suffix?: string }> = [
  { label: "Fiyat", key: "price", suffix: " ₺" },
  { label: "Yıl", key: "year" },
  { label: "Yakıt", key: "fuel_type" },
  { label: "Vites", key: "transmission" },
  { label: "Kasa", key: "body_type" },
  { label: "Motor Gücü", key: "horsepower", suffix: " HP" },
  { label: "Tüketim", key: "combined_fuel_consumption", suffix: " L/100km" },
  { label: "Bagaj", key: "luggage_capacity", suffix: " L" },
];

export default function GarageComparePage() {
  const params = useParams();
  const router = useRouter();
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
        <div className="max-w-lg mx-auto px-4 text-center pt-20">
          <p className="text-base text-white font-medium mb-2">
            {isTr ? "En az 2 araç seç" : "Select at least 2 cars"}
          </p>
          <p className="text-sm text-[#6B7280] mb-6">
            {isTr ? "Garajdan araç seçerek karşılaştırma yap." : "Select cars from your garage to compare."}
          </p>
          <Link
            href={`/${locale}/garage`}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-semibold text-sm"
          >
            {isTr ? "Garaja Dön" : "Go to Garage"}
          </Link>
        </div>
      </div>
    );
  }

  const cheapest = winner(cars, "price", "min");
  const strongest = winner(cars, "horsepower", "max");
  const economical = winner(cars, "combined_fuel_consumption", "min");

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back */}
        <Link
          href={`/${locale}/garage`}
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isTr ? "Garaja dön" : "Back"}
        </Link>

        <h1 className="text-2xl font-bold text-white font-display mb-2">
          {isTr ? "Karşılaştırma" : "Compare"}
        </h1>
        <p className="text-sm text-[#6B7280] mb-8">
          {cars.map((c) => `${c.brand} ${c.model}`).join(" vs ")}
        </p>

        {/* Insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <InsightCard
            icon={<Banknote className="w-4 h-4" />}
            title={isTr ? "En Uygun" : "Best Price"}
            winner={cheapest ? `${cheapest.brand} ${cheapest.model}` : null}
            detail={cheapest?.price != null ? `${fmt(cheapest.price)} ₺` : "—"}
          />
          <InsightCard
            icon={<Trophy className="w-4 h-4" />}
            title={isTr ? "En Güçlü" : "Most Power"}
            winner={strongest ? `${strongest.brand} ${strongest.model}` : null}
            detail={strongest?.horsepower != null ? `${strongest.horsepower} HP` : "—"}
          />
          <InsightCard
            icon={<Fuel className="w-4 h-4" />}
            title={isTr ? "En Ekonomik" : "Best Economy"}
            winner={economical ? `${economical.brand} ${economical.model}` : null}
            detail={economical?.combined_fuel_consumption != null ? `${economical.combined_fuel_consumption} L/100km` : "—"}
          />
        </div>

        {/* Comparison table */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Car name header */}
          <div className="grid border-b border-white/[0.06] bg-white/[0.03]" style={{ gridTemplateColumns: `140px repeat(${cars.length}, 1fr)` }}>
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              {isTr ? "Özellik" : "Spec"}
            </div>
            {cars.map((c) => (
              <div key={c.id} className="px-4 py-3 text-sm font-semibold text-white truncate">
                {c.brand} {c.model}
              </div>
            ))}
          </div>

          {/* Spec rows */}
          {SPEC_ROWS.map((row) => (
            <div
              key={row.key}
              className="grid border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              style={{ gridTemplateColumns: `140px repeat(${cars.length}, 1fr)` }}
            >
              <div className="px-4 py-3 text-sm text-[#9CA3AF]">{row.label}</div>
              {cars.map((c) => {
                const val = c[row.key];
                const display = val != null
                  ? (typeof val === "number" ? fmt(val) : String(val)) + (row.suffix || "")
                  : "—";
                return (
                  <div key={c.id} className="px-4 py-3 text-sm text-white tabular-nums">
                    {display}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
