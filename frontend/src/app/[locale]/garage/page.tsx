"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Car, Loader2, ArrowRight } from "lucide-react";
import { useGarageStore, MAX_COMPARE } from "@/stores/garage";
import { GarageListRow } from "@/components/garage/GarageListRow";

export default function GaragePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "tr";
  const isTr = locale === "tr";

  const cars = useGarageStore((s) => s.cars);
  const loading = useGarageStore((s) => s.loading);
  const load = useGarageStore((s) => s.load);
  const removeCar = useGarageStore((s) => s.removeCar);
  const toggleSelect = useGarageStore((s) => s.toggleSelect);
  const isSelected = useGarageStore((s) => s.isSelected);
  const selectedIds = useGarageStore((s) => s.selectedIds);
  const clearSelection = useGarageStore((s) => s.clearSelection);

  useEffect(() => { load(); }, [load]);

  const count = selectedIds.size;

  return (
    <div className="min-h-screen pt-20 pb-32">
      <div className="max-w-xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">
              {isTr ? "Garajım" : "My Garage"}
            </h1>
            {cars.length > 0 && (
              <p className="text-sm text-[#6B7280] mt-0.5">
                {cars.length} {isTr ? "araç" : (cars.length === 1 ? "car" : "cars")}
              </p>
            )}
          </div>
          <Link
            href={`/${locale}/garage/add`}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-white font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            {isTr ? "Ekle" : "Add"}
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && cars.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-6 py-20 text-center">
            <Car className="w-10 h-10 text-[#475569] mx-auto mb-4" />
            <p className="text-base font-medium text-white mb-1">
              {isTr ? "Henüz araç yok" : "No cars yet"}
            </p>
            <p className="text-sm text-[#6B7280] mb-6 max-w-xs mx-auto">
              {isTr
                ? "İlk aracı ekleyerek karşılaştırmaya başla."
                : "Add your first car to start comparing."}
            </p>
            <Link
              href={`/${locale}/garage/add`}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              {isTr ? "Araç Ekle" : "Add Car"}
            </Link>
          </div>
        )}

        {/* Car list */}
        {!loading && cars.length > 0 && (
          <div className="space-y-2">
            {cars.map((car) => (
              <GarageListRow
                key={car.id}
                car={car}
                selected={isSelected(car.id)}
                onToggleSelect={() => toggleSelect(car.id)}
                onEdit={() => router.push(`/${locale}/garage/edit/${car.id}`)}
                onDelete={() => removeCar(car.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#111827]/95 backdrop-blur-xl px-5 py-3.5 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-[#6B7280] hover:text-white transition-colors underline underline-offset-2"
              >
                {isTr ? "Temizle" : "Clear"}
              </button>
              <span className="text-sm text-white font-medium tabular-nums">
                {count} / {MAX_COMPARE}
              </span>
            </div>
            <Link
              href={`/${locale}/garage/compare`}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                count >= 2
                  ? "btn-gradient text-white"
                  : "bg-white/[0.06] text-[#6B7280] pointer-events-none"
              }`}
            >
              {count >= 2
                ? (isTr ? "Karşılaştır" : "Compare")
                : (isTr ? "En az 2 seç" : "Select 2+")}
              {count >= 2 && <ArrowRight className="w-4 h-4" />}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
