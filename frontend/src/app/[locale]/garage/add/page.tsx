"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createGarageCar } from "@/lib/araba-iq-client";

const EQUIPMENT_OPTIONS = [
  "apple_carplay", "android_auto", "adaptive_cruise_control", "lane_keep_assist",
  "blind_spot_warning", "sunroof", "panoramic_roof", "rear_camera",
  "head_up_display", "automatic_park_assistant", "led_headlights",
];

const EQUIPMENT_LABELS: Record<string, string> = {
  apple_carplay: "Apple CarPlay",
  android_auto: "Android Auto",
  adaptive_cruise_control: "Adaptif Cruise",
  lane_keep_assist: "Şerit Takip",
  blind_spot_warning: "Kör Nokta",
  sunroof: "Sunroof",
  panoramic_roof: "Panoramik Tavan",
  rear_camera: "Geri Kamera",
  head_up_display: "Head-up Display",
  automatic_park_assistant: "Otopark",
  led_headlights: "LED Far",
};

interface FormData {
  brand: string;
  model: string;
  variant: string;
  year: string;
  price: string;
  mileage_km: string;
  listing_url: string;
  fuel_type: string;
  transmission: string;
  body_type: string;
  segment: string;
  horsepower: string;
  engine_cc: string;
  combined_fuel_consumption: string;
  luggage_capacity: string;
  notes: string;
  equipment: string[];
}

const initialForm: FormData = {
  brand: "", model: "", variant: "", year: "2024", price: "", mileage_km: "",
  listing_url: "", fuel_type: "", transmission: "", body_type: "", segment: "",
  horsepower: "", engine_cc: "", combined_fuel_consumption: "", luggage_capacity: "",
  notes: "", equipment: [],
};

export default function AddCarPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "tr";
  const [form, setForm] = useState<FormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  const toggleEquip = (slug: string) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(slug)
        ? f.equipment.filter((s) => s !== slug)
        : [...f.equipment, slug],
    }));
  };

  const handleSubmit = async () => {
    if (!form.brand.trim() || !form.model.trim()) {
      setError(locale === "tr" ? "Marka ve model zorunludur." : "Brand and model are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createGarageCar({
        brand: form.brand.trim(),
        model: form.model.trim(),
        variant: form.variant.trim() || null,
        year: Number(form.year) || 2024,
        price: form.price ? Number(form.price) : null,
        mileage_km: form.mileage_km ? Number(form.mileage_km) : null,
        listing_url: form.listing_url.trim() || null,
        fuel_type: form.fuel_type || null,
        transmission: form.transmission || null,
        body_type: form.body_type || null,
        segment: form.segment || null,
        horsepower: form.horsepower ? Number(form.horsepower) : null,
        engine_cc: form.engine_cc ? Number(form.engine_cc) : null,
        combined_fuel_consumption: form.combined_fuel_consumption ? Number(form.combined_fuel_consumption) : null,
        luggage_capacity: form.luggage_capacity ? Number(form.luggage_capacity) : null,
        equipment: form.equipment.length > 0 ? form.equipment.join(",") : null,
        notes: form.notes.trim() || null,
        is_favorite: false,
      });
      router.push(`/${locale}/garage`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[#E5E7EB] placeholder:text-[#475569] focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all hover:border-white/[0.15]";
  const labelCls = "text-[#9CA3AF] text-sm";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-extrabold text-white font-display mb-2">
          {locale === "tr" ? "Araç Ekle" : "Add Car"}
        </h1>
        <p className="text-sm text-[#9CA3AF] mb-8">
          {locale === "tr" ? "Bilgileri doldur, garajına kaydet." : "Fill in the details and save to your garage."}
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Basics */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {locale === "tr" ? "Temel Bilgiler" : "Basic Info"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Marka *" : "Brand *"}</span>
                <input value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="BMW, Toyota..." className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Model *" : "Model *"}</span>
                <input value={form.model} onChange={(e) => set({ model: e.target.value })} placeholder="320i, Corolla..." className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Paket / Versiyon" : "Variant / Trim"}</span>
                <input value={form.variant} onChange={(e) => set({ variant: e.target.value })} placeholder="Sport Line, Elegance..." className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Yıl" : "Year"}</span>
                <input type="number" value={form.year} onChange={(e) => set({ year: e.target.value })} className={inputCls} />
              </label>
            </div>
          </section>

          {/* Price & Status */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {locale === "tr" ? "Fiyat & Durum" : "Price & Status"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Fiyat (TL)" : "Price (TRY)"}</span>
                <input type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="1450000" className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>KM</span>
                <input type="number" value={form.mileage_km} onChange={(e) => set({ mileage_km: e.target.value })} placeholder="0" className={inputCls} />
              </label>
              <label className="block sm:col-span-2"><span className={labelCls}>{locale === "tr" ? "İlan Linki" : "Listing URL"}</span>
                <input value={form.listing_url} onChange={(e) => set({ listing_url: e.target.value })} placeholder="https://..." className={inputCls} />
              </label>
            </div>
          </section>

          {/* Technical */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {locale === "tr" ? "Teknik" : "Technical"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Yakıt" : "Fuel"}</span>
                <select value={form.fuel_type} onChange={(e) => set({ fuel_type: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  <option value="Benzin">Benzin</option>
                  <option value="Dizel">Dizel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Elektrik">Elektrik</option>
                  <option value="LPG">LPG</option>
                </select>
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Vites" : "Transmission"}</span>
                <select value={form.transmission} onChange={(e) => set({ transmission: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  <option value="Otomatik">Otomatik</option>
                  <option value="Manuel">Manuel</option>
                  <option value="Yarı Otomatik">Yarı Otomatik</option>
                </select>
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Kasa" : "Body"}</span>
                <select value={form.body_type} onChange={(e) => set({ body_type: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Crossover">Crossover</option>
                  <option value="Station Wagon">Station Wagon</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Cabrio">Cabrio</option>
                  <option value="MPV">MPV</option>
                  <option value="Pick-up">Pick-up</option>
                </select>
              </label>
              <label className="block"><span className={labelCls}>Segment</span>
                <select value={form.segment} onChange={(e) => set({ segment: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  <option value="A">A</option><option value="B">B</option>
                  <option value="C">C</option><option value="D">D</option>
                  <option value="E">E</option><option value="F">F</option>
                  <option value="C-SUV">C-SUV</option><option value="D-SUV">D-SUV</option>
                </select>
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Motor Gücü (HP)" : "HP"}</span>
                <input type="number" value={form.horsepower} onChange={(e) => set({ horsepower: e.target.value })} className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Motor Hacmi (cc)" : "Engine (cc)"}</span>
                <input type="number" value={form.engine_cc} onChange={(e) => set({ engine_cc: e.target.value })} className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Tüketim (L/100km)" : "Consumption (L/100km)"}</span>
                <input type="number" step="0.1" value={form.combined_fuel_consumption} onChange={(e) => set({ combined_fuel_consumption: e.target.value })} className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Bagaj (L)" : "Trunk (L)"}</span>
                <input type="number" value={form.luggage_capacity} onChange={(e) => set({ luggage_capacity: e.target.value })} className={inputCls} />
              </label>
            </div>
          </section>

          {/* Equipment */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {locale === "tr" ? "Donanım" : "Equipment"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((slug) => {
                const on = form.equipment.includes(slug);
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleEquip(slug)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      on
                        ? "border-primary-500/40 bg-primary-500/15 text-primary-300"
                        : "border-white/[0.08] text-[#9CA3AF] hover:border-white/[0.15] hover:text-white"
                    }`}
                  >
                    {EQUIPMENT_LABELS[slug] || slug}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {locale === "tr" ? "Notlar" : "Notes"}
            </h2>
            <textarea
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              rows={3}
              placeholder={locale === "tr" ? "Kendi notlarınız..." : "Your notes..."}
              className={inputCls + " resize-none"}
            />
          </section>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/garage`)}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-[#E5E7EB] font-semibold hover:bg-white/[0.08] text-sm transition-all"
            >
              {locale === "tr" ? "İptal" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-[2] btn-gradient rounded-xl py-3 text-white font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2 text-sm"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {locale === "tr" ? "Kaydediliyor..." : "Saving..."}</> : (locale === "tr" ? "Kaydet" : "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
