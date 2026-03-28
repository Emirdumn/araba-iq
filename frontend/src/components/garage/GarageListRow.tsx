"use client";

import type { GarageCar } from "@/lib/araba-iq-client";
import { MoreVertical, Pencil, Trash2, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  car: GarageCar;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatPrice(price: number | null): string {
  if (price == null) return "";
  return new Intl.NumberFormat("tr-TR").format(price) + " ₺";
}

function brandInitial(brand: string): string {
  return brand.charAt(0).toUpperCase();
}

export function GarageListRow({ car, selected, onToggleSelect, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
        selected
          ? "bg-primary-500/[0.08] border border-primary-500/30"
          : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]"
      }`}
      onClick={onToggleSelect}
    >
      {/* Brand initial circle */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
          selected
            ? "bg-primary-500/20 text-primary-400"
            : "bg-white/[0.06] text-[#9CA3AF]"
        }`}
      >
        {selected ? <Check className="w-4 h-4" /> : brandInitial(car.brand)}
      </div>

      {/* Car info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-white truncate">
          {car.brand} {car.model}
          {car.variant && <span className="text-[#6B7280] font-normal"> {car.variant}</span>}
        </p>
        <p className="text-xs text-[#6B7280] mt-0.5 truncate">
          {car.year}
          {car.fuel_type && <> · {car.fuel_type}</>}
          {car.transmission && <> · {car.transmission}</>}
          {car.horsepower && <> · {car.horsepower} HP</>}
        </p>
      </div>

      {/* Price */}
      {car.price != null && (
        <p className="text-sm font-semibold text-white tabular-nums whitespace-nowrap hidden sm:block">
          {formatPrice(car.price)}
        </p>
      )}

      {/* 3-dot menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1.5 rounded-lg text-[#6B7280] hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 bg-[#111827] rounded-xl shadow-2xl shadow-black/50 border border-white/[0.08] min-w-[130px] z-30">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); setMenuOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-[#E5E7EB] hover:bg-white/[0.06] flex items-center gap-2.5"
            >
              <Pencil className="w-3.5 h-3.5 text-[#9CA3AF]" /> Düzenle
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Sil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
