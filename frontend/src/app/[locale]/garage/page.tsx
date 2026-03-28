"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Car, Loader2 } from "lucide-react";
import { fetchGarageCars, deleteGarageCar, type GarageCar } from "@/lib/araba-iq-client";
import { GarageCarCard } from "@/components/garage/GarageCarCard";
import { useCompareCarsStore } from "@/stores/compare-cars";

export default function GaragePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(true);

  const garageCompareIds = useCompareCarsStore((s) => s.ids);
  const toggleCompare = useCompareCarsStore((s) => s.toggle);
  const hasCompare = useCompareCarsStore((s) => s.has);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGarageCars();
      setCars(data);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteGarageCar(id);
      setCars((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silent */ }
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              {locale === "tr" ? "Benim Arabalarım" : "My Cars"}
            </h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              {locale === "tr"
                ? `${cars.length} araç kayıtlı`
                : `${cars.length} car${cars.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>
          <Link
            href={`/${locale}/garage/add`}
            className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-white font-semibold text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            {locale === "tr" ? "Araç Ekle" : "Add Car"}
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        )}

        {/* Empty state */}
        {!loading && cars.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-16 text-center">
            <Car className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
            <p className="text-lg font-semibold text-white mb-2">
              {locale === "tr" ? "Henüz araç eklemediniz" : "No cars yet"}
            </p>
            <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
              {locale === "tr"
                ? "İlk aracınızı ekleyerek karşılaştırmaya başlayın."
                : "Add your first car to start comparing."}
            </p>
            <Link
              href={`/${locale}/garage/add`}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              {locale === "tr" ? "İlk Aracı Ekle" : "Add First Car"}
            </Link>
          </div>
        )}

        {/* Car grid */}
        {!loading && cars.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <GarageCarCard
                key={car.id}
                car={car}
                inCompare={hasCompare(car.id)}
                onToggleCompare={() => toggleCompare(car.id)}
                onEdit={() => window.location.href = `/${locale}/garage/edit/${car.id}`}
                onDelete={() => handleDelete(car.id)}
                locale={locale}
              />
            ))}
            {/* Ghost add card */}
            <Link
              href={`/${locale}/garage/add`}
              className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] flex flex-col items-center justify-center py-12 hover:border-primary-500/30 hover:bg-primary-500/[0.04] transition-all duration-300 group min-h-[280px]"
            >
              <Plus className="w-8 h-8 text-[#6B7280] group-hover:text-primary-400 transition-colors mb-2" />
              <span className="text-sm text-[#6B7280] group-hover:text-primary-400 font-medium transition-colors">
                {locale === "tr" ? "Yeni araç ekle" : "Add new car"}
              </span>
            </Link>
          </div>
        )}

        {/* Sticky compare tray */}
        {garageCompareIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
            <div className="max-w-4xl mx-auto rounded-2xl border border-primary-500/30 bg-[#0B1120]/95 backdrop-blur-xl px-5 py-4 shadow-2xl shadow-black/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-400">
                  {locale === "tr" ? "Karşılaştırma" : "Compare"}
                </p>
                <p className="text-sm text-white font-semibold tabular-nums mt-0.5">
                  {garageCompareIds.length} / 4 {locale === "tr" ? "araç seçili" : "cars selected"}
                </p>
              </div>
              <Link
                href={`/${locale}/compare`}
                className={`inline-flex items-center justify-center rounded-xl text-center font-semibold transition-all duration-300 shrink-0 px-6 py-3 text-sm ${
                  garageCompareIds.length >= 2
                    ? "btn-gradient text-white"
                    : "border border-white/[0.1] bg-white/[0.04] text-[#6B7280] pointer-events-none"
                }`}
              >
                {garageCompareIds.length >= 2
                  ? (locale === "tr" ? "Karşılaştır" : "Compare")
                  : (locale === "tr" ? "En az 2 araç seç" : "Select at least 2")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
