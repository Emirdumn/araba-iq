"use client";

import { useGarageStore, type GarageCar } from "@/stores/garage-store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";

const COMMON_FEATURES = [
  "Sunroof",
  "Apple CarPlay",
  "Android Auto",
  "Kör Nokta Uyarı",
  "Şerit Takip",
  "Adaptif Hız Sabitleyici",
  "Geri Görüş Kamerası",
  "Deri Koltuk",
  "Isıtmalı Koltuk",
  "Otomatik Park",
];

interface Props {
  locale: string;
  existingCar?: GarageCar;
}

export function GarageForm({ locale, existingCar }: Props) {
  const router = useRouter();
  const { addCar, updateCar } = useGarageStore();
  const isTR = locale === "tr";

  const [formData, setFormData] = useState<Omit<GarageCar, "id">>({
    brand: "",
    model: "",
    package_version: "",
    year: new Date().getFullYear(),
    price: 0,
    fuel: "Benzin",
    gear: "Otomatik",
    km: 0,
    body_type: "Sedan",
    engine_power: 0,
    consumption: 0,
    luggage: 0,
    features: [],
    notes: "",
  });

  useEffect(() => {
    if (existingCar) {
      setFormData({
        brand: existingCar.brand,
        model: existingCar.model,
        package_version: existingCar.package_version,
        year: existingCar.year,
        price: existingCar.price,
        fuel: existingCar.fuel,
        gear: existingCar.gear,
        km: existingCar.km,
        body_type: existingCar.body_type,
        engine_power: existingCar.engine_power,
        consumption: existingCar.consumption,
        luggage: existingCar.luggage,
        features: existingCar.features,
        notes: existingCar.notes,
      });
    }
  }, [existingCar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingCar) {
      updateCar(existingCar.id, formData);
    } else {
      addCar(formData);
    }
    router.push(`/${locale}/garage`);
  };

  const toggleFeature = (feat: string) => {
    setFormData((prev) => {
      const isSelected = prev.features.includes(feat);
      return {
        ...prev,
        features: isSelected
          ? prev.features.filter((f) => f !== feat)
          : [...prev.features, feat],
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/${locale}/garage`}
          className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isTR ? "Garaja Dön" : "Back to Garage"}
        </Link>
        <button
          type="submit"
          className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
        >
          <Save className="w-4 h-4" />
          {isTR ? "Kaydet" : "Save"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Section 1: Kimlik */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-5">{isTR ? "Temel Bilgiler" : "Basic Info"}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={isTR ? "Marka" : "Brand"}
              placeholder="Örn: Toyota"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
            />
            <Input
              label="Model"
              placeholder="Örn: Corolla"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
            <Input
              label={isTR ? "Paket / Versiyon" : "Trim / Version"}
              placeholder="Örn: 1.8 Hybrid Dream"
              value={formData.package_version}
              onChange={(e) => setFormData({ ...formData, package_version: e.target.value })}
            />
            <Input
              label={isTR ? "Yıl" : "Year"}
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              required
            />
          </div>
        </div>

        {/* Section 2: Fiyat ve Kullanım */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-5">{isTR ? "Fiyat & Kullanım" : "Price & Usage"}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={isTR ? "Fiyat (TL)" : "Price (TRY)"}
              type="number"
              value={formData.price || ""}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
            />
            <Input
              label="Kilometre"
              type="number"
              value={formData.km || ""}
              onChange={(e) => setFormData({ ...formData, km: Number(e.target.value) })}
            />
            
            <div className="w-full">
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">
                {isTR ? "Yakıt" : "Fuel"}
              </label>
              <select
                value={formData.fuel}
                onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#E5E7EB] focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none"
              >
                <option value="Benzin">Benzin</option>
                <option value="Dizel">Dizel</option>
                <option value="Hibrit">Hibrit</option>
                <option value="Elektrik">Elektrik</option>
              </select>
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">
                {isTR ? "Vites" : "Transmission"}
              </label>
              <select
                value={formData.gear}
                onChange={(e) => setFormData({ ...formData, gear: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#E5E7EB] focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none"
              >
                <option value="Otomatik">Otomatik</option>
                <option value="Yarı Otomatik">Yarı Otomatik</option>
                <option value="Manuel">Manuel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Performans */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-5">{isTR ? "Boyut & Performans" : "Size & Performance"}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={isTR ? "Motor Gücü (Beygir/HP)" : "Engine Power (HP)"}
              type="number"
              value={formData.engine_power || ""}
              onChange={(e) => setFormData({ ...formData, engine_power: Number(e.target.value) })}
            />
            <Input
              label={isTR ? "Ort. Tüketim (L/100km)" : "Avg. Consumption (L/100km)"}
              type="number"
              step="0.1"
              value={formData.consumption || ""}
              onChange={(e) => setFormData({ ...formData, consumption: Number(e.target.value) })}
            />
            <Input
              label={isTR ? "Bagaj Hacmi (Litre)" : "Luggage Capacity (L)"}
              type="number"
              value={formData.luggage || ""}
              onChange={(e) => setFormData({ ...formData, luggage: Number(e.target.value) })}
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">
                {isTR ? "Kasa Tipi" : "Body Type"}
              </label>
              <select
                value={formData.body_type}
                onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[#E5E7EB] focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none"
              >
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="SUV">SUV</option>
                <option value="Station Wagon">Station Wagon</option>
                <option value="Coupe">Coupe</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Donanımlar */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-2">{isTR ? "Öne Çıkan Donanımlar" : "Key Features"}</h2>
          <p className="text-xs text-[#6B7280] mb-4">
            {isTR ? "Karşılaştırmada görmek istediğiniz donanımları seçin." : "Select features you want to compare."}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_FEATURES.map((feat) => {
              const on = formData.features.includes(feat);
              return (
                <button
                  key={feat}
                  type="button"
                  onClick={() => toggleFeature(feat)}
                  className={`rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                    on
                      ? "border-primary-500/40 bg-primary-500/15 text-primary-300 font-medium shadow-glow-sm"
                      : "border-white/[0.08] text-[#9CA3AF] hover:border-white/[0.15] hover:text-white"
                  }`}
                >
                  {feat}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Section 5: Notlar */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{isTR ? "Notlar & Link" : "Notes & Link"}</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={isTR ? "İlan linki, hasar durumu, ekstra notlarınız..." : "Ad link, damage history, extra notes..."}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[#E5E7EB] focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 h-32 resize-none"
          />
        </div>

      </div>
      
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="btn-gradient w-full sm:w-auto items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-base"
        >
          {isTR ? "Aracı Kaydet" : "Save Car"}
        </button>
      </div>
    </form>
  );
}
