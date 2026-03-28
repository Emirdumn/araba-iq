"use client";

import { useGarageStore, type GarageCar } from "@/stores/garage-store";
import { formatTryPrice } from "@/lib/format-scores";
import { MoreHorizontal, Edit, Trash, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  car: GarageCar;
  locale: string;
}

export function GarageListRow({ car, locale }: Props) {
  const { selectedIds, toggleSelection, removeCar } = useGarageStore();
  const isSelected = selectedIds.includes(car.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => toggleSelection(car.id);

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all duration-300",
        isSelected
          ? "border-primary-500/50 bg-primary-500/[0.04] shadow-glow-sm"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]"
      )}
    >
      <div
        className="flex items-center gap-4 flex-1 cursor-pointer"
        onClick={handleToggle}
      >
        {/* Checkbox / Avatar area */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg transition-all duration-300",
              isSelected
                ? "bg-primary-500 text-white"
                : "bg-white/[0.06] text-[#9CA3AF] group-hover:bg-white/[0.1] group-hover:text-white"
            )}
          >
            {isSelected ? <Check className="w-6 h-6" /> : car.brand.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-bold text-[#E5E7EB] truncate">
              {car.brand} {car.model}
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/[0.06] text-[#9CA3AF]">
              {car.year}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-[#9CA3AF] truncate">
            <span className="font-mono text-primary-400 font-semibold">
              {formatTryPrice(car.price, locale)}
            </span>
            <span className="text-white/[0.1]">•</span>
            <span>{car.package_version || car.fuel}</span>
            <span className="text-white/[0.1] hidden sm:inline">•</span>
            <span className="hidden sm:inline">{car.km.toLocaleString(locale)} km</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 ml-4 relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-2 rounded-lg hover:bg-white/[0.08] text-[#6B7280] hover:text-[#E5E7EB] transition-colors"
          aria-label="Options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#111827] border border-white/[0.08] shadow-glass p-1.5 z-50 animate-in">
            <Link
              href={`/${locale}/garage/${car.id}/edit`}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#E5E7EB] hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 text-[#9CA3AF]" />
              Düzenle
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeCar(car.id);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
            >
              <Trash className="w-4 h-4 text-red-400/80" />
              Sil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
