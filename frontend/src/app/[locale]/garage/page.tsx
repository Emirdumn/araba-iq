"use client";

import { useGarageStore } from "@/stores/garage-store";
import { GarageListRow } from "@/components/garage/GarageListRow";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, ArrowRight, CarFront } from "lucide-react";
import { useEffect, useState } from "react";

export default function GaragePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  const { cars, selectedIds, clearSelection } = useGarageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen pt-24 pb-32" />;
  }

  const isTR = locale === "tr";

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              {isTR ? "Garajım" : "My Garage"}
            </h1>
            <p className="text-[#9CA3AF] mt-1 text-sm">
              {isTR
                ? "Araç ekleyin ve karşılaştırmak için seçin."
                : "Add cars and select them to compare."}
            </p>
          </div>
          <Link
            href={`/${locale}/garage/add`}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors text-[#E5E7EB]"
            aria-label={isTR ? "Araç Ekle" : "Add Car"}
          >
            <Plus className="w-5 h-5" />
          </Link>
        </header>

        {cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border border-dashed border-white/[0.1] bg-white/[0.02] text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6">
              <CarFront className="w-8 h-8 text-[#6B7280]" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              {isTR ? "Garajınız boş" : "Your garage is empty"}
            </h2>
            <p className="text-[#9CA3AF] text-sm mb-8 max-w-sm">
              {isTR
                ? "Karşılaştırmak istediğiniz araçları manuel olarak ekleyebilirsiniz."
                : "You can manually add the cars you want to compare."}
            </p>
            <Link
              href={`/${locale}/garage/add`}
              className="btn-gradient inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
            >
              <Plus className="w-5 h-5" />
              {isTR ? "İlk Aracını Ekle" : "Add Your First Car"}
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {cars.map((car) => (
              <GarageListRow key={car.id} car={car} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Compare */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4 animate-slide-up">
          <div className="max-w-xl mx-auto rounded-2xl border border-white/[0.1] bg-[#111827]/90 backdrop-blur-xl p-4 shadow-glass flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-400">
                {isTR ? "Seçilenler" : "Selected"}
              </span>
              <span className="text-sm font-medium text-white mt-0.5">
                {selectedIds.length} {isTR ? "araç" : "cars"} (Max 4)
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
              >
                {isTR ? "Temizle" : "Clear"}
              </button>
              <Link
                href={`/${locale}/garage/compare`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  selectedIds.length >= 2
                    ? "bg-primary-600 text-white hover:bg-primary-500 shadow-glow-sm"
                    : "bg-white/[0.06] text-[#6B7280] pointer-events-none"
                }`}
              >
                {isTR ? "Karşılaştır" : "Compare"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
