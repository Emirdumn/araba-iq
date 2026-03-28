"use client";

import { useGarageStore, type GarageCar } from "@/stores/garage-store";
import { formatTryPrice } from "@/lib/format-scores";
import { ArrowLeft, Check, Minus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GarageComparePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "tr";
  const isTR = locale === "tr";

  const { cars, selectedIds } = useGarageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && selectedIds.length < 2) {
      router.push(`/${locale}/garage`);
    }
  }, [mounted, selectedIds, router, locale]);

  if (!mounted || selectedIds.length < 2) {
    return <div className="min-h-screen pt-24 pb-32" />;
  }

  const selectedCars = selectedIds.map((id) => cars.find((c) => c.id === id)).filter(Boolean) as GarageCar[];

  // Basic insights logic
  const sortedByPrice = [...selectedCars].sort((a, b) => a.price - b.price);
  const sortedByPower = [...selectedCars].sort((a, b) => b.engine_power - a.engine_power);
  const sortedByConsumption = [...selectedCars].filter(c => c.consumption > 0).sort((a, b) => a.consumption - b.consumption);

  const cheapest = sortedByPrice[0];
  const mostPowerful = sortedByPower[0];
  const mostEconomical = sortedByConsumption[0] || selectedCars[0];

  const allFeatures = Array.from(new Set(selectedCars.flatMap((c) => c.features))).sort();

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/${locale}/garage`}
          className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isTR ? "Garaja Dön" : "Back to Garage"}
        </Link>

        <h1 className="text-3xl font-extrabold text-white font-display mb-8">
          {isTR ? "Karşılaştırma Sonucu" : "Comparison Result"}
        </h1>

        {/* Insight Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              {isTR ? "En Uygun Fiyat" : "Best Price"}
            </p>
            <h3 className="text-lg font-bold text-white mb-0.5">
              {cheapest.brand} {cheapest.model}
            </h3>
            <p className="text-sm font-mono text-[#9CA3AF]">
              {formatTryPrice(cheapest.price, locale)}
            </p>
          </div>
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
              {isTR ? "En Güçlü" : "Most Powerful"}
            </p>
            <h3 className="text-lg font-bold text-white mb-0.5">
              {mostPowerful.brand} {mostPowerful.model}
            </h3>
            <p className="text-sm font-mono text-[#9CA3AF]">
              {mostPowerful.engine_power ? `${mostPowerful.engine_power} HP` : "Bilinmiyor"}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              {isTR ? "En Ekonomik" : "Most Economical"}
            </p>
            <h3 className="text-lg font-bold text-white mb-0.5">
              {mostEconomical.brand} {mostEconomical.model}
            </h3>
            <p className="text-sm font-mono text-[#9CA3AF]">
              {mostEconomical.consumption ? `${mostEconomical.consumption} L/100km` : "Bilinmiyor"}
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] shadow-glass">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.04]">
                <th className="p-4 font-semibold text-[#9CA3AF] w-1/4 sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">
                  {isTR ? "Özellik" : "Feature"}
                </th>
                {selectedCars.map((car) => (
                  <th key={car.id} className="p-4 font-bold text-white">
                    {car.brand} <br />
                    <span className="text-[#9CA3AF] font-normal">{car.model}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">{isTR ? "Fiyat" : "Price"}</td>
                {selectedCars.map((car) => (
                  <td key={`price-${car.id}`} className="p-4 font-mono text-primary-400 font-semibold">
                    {formatTryPrice(car.price, locale)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">{isTR ? "Yıl" : "Year"}</td>
                {selectedCars.map((car) => (
                  <td key={`year-${car.id}`} className="p-4">{car.year}</td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">{isTR ? "Kilometre" : "Mileage"}</td>
                {selectedCars.map((car) => (
                  <td key={`km-${car.id}`} className="p-4">{car.km.toLocaleString(locale)} km</td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">{isTR ? "Motor & Güç" : "Engine"}</td>
                {selectedCars.map((car) => (
                  <td key={`engine-${car.id}`} className="p-4">{car.engine_power ? `${car.engine_power} HP` : "-"}</td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">{isTR ? "Yakıt" : "Fuel"}</td>
                {selectedCars.map((car) => (
                  <td key={`fuel-${car.id}`} className="p-4">{car.fuel}</td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">{isTR ? "Vites" : "Transmission"}</td>
                {selectedCars.map((car) => (
                  <td key={`gear-${car.id}`} className="p-4">{car.gear}</td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">{isTR ? "Tüketim (Ort)" : "Avg Consumption"}</td>
                {selectedCars.map((car) => (
                  <td key={`cons-${car.id}`} className="p-4">{car.consumption ? `${car.consumption} L` : "-"}</td>
                ))}
              </tr>

              {/* Features section */}
              {allFeatures.length > 0 && (
                <tr className="bg-white/[0.04]">
                  <td colSpan={selectedCars.length + 1} className="p-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF] sticky left-0">
                    {isTR ? "Donanımlar" : "Features"}
                  </td>
                </tr>
              )}
              {allFeatures.map((feat) => (
                <tr key={feat} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium text-[#E5E7EB] sticky left-0 bg-[#0B1120] z-10 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.5)]">
                    {feat}
                  </td>
                  {selectedCars.map((car) => {
                    const hasFeat = car.features.includes(feat);
                    return (
                      <td key={`${feat}-${car.id}`} className="p-4">
                        {hasFeat ? (
                          <Check className="w-5 h-5 text-primary-400" />
                        ) : (
                          <Minus className="w-5 h-5 text-white/[0.1]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
