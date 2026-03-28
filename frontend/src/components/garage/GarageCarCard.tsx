"use client";

import type { GarageCar } from "@/lib/araba-iq-client";
import { Check, GitCompare, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  car: GarageCar;
  inCompare: boolean;
  onToggleCompare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  locale: string;
}

function formatPrice(price: number | null, locale: string): string {
  if (price == null) return "—";
  const loc = locale === "tr" ? "tr-TR" : "en-US";
  return new Intl.NumberFormat(loc, { style: "decimal" }).format(price) + " TL";
}

function getCarBadges(car: GarageCar): Array<{ label: string; color: string }> {
  const badges: Array<{ label: string; color: string }> = [];
  if (car.combined_fuel_consumption != null && car.combined_fuel_consumption < 6)
    badges.push({ label: "Ekonomik", color: "emerald" });
  if (car.body_type && /suv|crossover/i.test(car.body_type) && car.luggage_capacity && car.luggage_capacity > 450)
    badges.push({ label: "Aile", color: "blue" });
  if (car.horsepower != null && car.horsepower > 200)
    badges.push({ label: "Performans", color: "orange" });
  if (car.horsepower != null && car.horsepower <= 200 && car.price != null && car.price < 1_500_000)
    badges.push({ label: "İyi Fiyat", color: "green" });
  return badges;
}

const badgeColors: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export function GarageCarCard({ car, inCompare, onToggleCompare, onEdit, onDelete, locale }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const badges = getCarBadges(car);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <article
      className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-2px] ${
        inCompare
          ? "border-primary-500/50 bg-gradient-to-b from-primary-500/[0.08] to-[#111827] shadow-glow-sm ring-1 ring-primary-500/30"
          : "border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-[#0B1120] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header: name + menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white leading-snug truncate">
              {car.brand} {car.model}
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {car.variant && <span>{car.variant} · </span>}
              {car.year} · {car.fuel_type || "—"} · {car.transmission || "—"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {car.is_favorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#6B7280] hover:text-white transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 bg-[#111827] rounded-xl shadow-xl shadow-black/40 border border-white/[0.08] min-w-[120px] z-20">
                  <button
                    type="button"
                    onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-[#E5E7EB] hover:bg-white/[0.06] flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div>
          <span className="text-2xl font-bold text-white tabular-nums">
            {formatPrice(car.price, locale)}
          </span>
          {car.mileage_km != null && (
            <span className="text-xs text-[#6B7280] ml-2">
              {car.mileage_km.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} km
            </span>
          )}
        </div>

        {/* Quick specs row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-2 text-center">
            <div className="text-sm font-semibold text-primary-300 tabular-nums">{car.horsepower ?? "—"}</div>
            <div className="text-[10px] text-[#6B7280]">HP</div>
          </div>
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-2 text-center">
            <div className="text-sm font-semibold text-primary-300 tabular-nums">{car.combined_fuel_consumption ?? "—"}</div>
            <div className="text-[10px] text-[#6B7280]">L/100km</div>
          </div>
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-2 text-center">
            <div className="text-sm font-semibold text-primary-300 tabular-nums">{car.luggage_capacity ?? "—"}</div>
            <div className="text-[10px] text-[#6B7280]">L bagaj</div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColors[b.color] || badgeColors.blue}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Compare button */}
        <button
          type="button"
          onClick={onToggleCompare}
          className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
            inCompare
              ? "btn-gradient text-white"
              : "border border-white/[0.1] bg-white/[0.04] text-[#E5E7EB] hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300"
          }`}
        >
          {inCompare ? <Check className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
          {inCompare ? "Seçildi" : "Karşılaştır"}
        </button>
      </div>
    </article>
  );
}
