"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchGarageCars, updateGarageCar, type GarageCar } from "@/lib/araba-iq-client";

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

function carToForm(car: GarageCar): FormData {
  return {
    brand: car.brand,
    model: car.model,
    variant: car.variant || "",
    year: String(car.year),
    price: car.price != null ? String(car.price) : "",
    mileage_km: car.mileage_km != null ? String(car.mileage_km) : "",
    listing_url: car.listing_url || "",
    fuel_type: car.fuel_type || "",
    transmission: car.transmission || "",
    body_type: car.body_type || "",
    segment: car.segment || "",
    horsepower: car.horsepower != null ? String(car.horsepower) : "",
    engine_cc: car.engine_cc != null ? String(car.engine_cc) : "",
    combined_fuel_consumption: car.combined_fuel_consumption != null ? String(car.combined_fuel_consumption) : "",
    luggage_capacity: car.luggage_capacity != null ? String(car.luggage_capacity) : "",
    notes: car.notes || "",
    equipment: car.equipment ? car.equipment.split(",").filter(Boolean) : [],
  };
}

export default function EditCarPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "tr";
  const carId = Number(params?.id);

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCar = useCallback(async () => {
    try {
      const cars = await fetchGarageCars();
      const car = cars.find((c) => c.id === carId);
      if (car) setForm(carToForm(car));
      else setError("Car not found");
    } catch {
      setError("Failed to load car");
    } finally {
      setLoading(false);
    }
  }, [carId]);

  useEffect(() => { loadCar(); }, [loadCar]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center">
        <p className="text-red-400">{error || "Car not found"}</p>
      </div>
    );
  }

  const set = (patch: Partial<FormData>) => setForm((f) => f ? { ...f, ...patch } : f);

  const toggleEquip = (slug: string) => {
    setForm((f) => f ? {
      ...f,
      equipment: f.equipment.includes(slug)
        ? f.equipment.filter((s) => s !== slug)
        : [...f.equipment, slug],
    } : f);
  };

  const handleSubmit = async () => {
    if (!form.brand.trim() || !form.model.trim()) {
      setError(locale === "tr" ? "Marka ve model zorunludur." : "Brand and model are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateGarageCar(carId, {
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
          {locale === "tr" ? "Araç Düzenle" : "Edit Car"}
        </h1>
        <p className="text-sm text-[#9CA3AF] mb-8">
          {form.brand} {form.model} — {form.year}
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{locale === "tr" ? "Temel Bilgiler" : "Basic Info"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Marka *" : "Brand *"}</span>
                <input value={form.brand} onChange={(e) => set({ brand: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className={labelCls}>Model *</span>
                <input value={form.model} onChange={(e) => set({ model: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Paket" : "Variant"}</span>
                <input value={form.variant} onChange={(e) => set({ variant: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Yıl" : "Year"}</span>
                <input type="number" value={form.year} onChange={(e) => set({ year: e.target.value })} className={inputCls} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{locale === "tr" ? "Fiyat & Durum" : "Price & Status"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Fiyat (TL)" : "Price"}</span>
                <input type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className={labelCls}>KM</span>
                <input type="number" value={form.mileage_km} onChange={(e) => set({ mileage_km: e.target.value })} className={inputCls} /></label>
              <label className="block sm:col-span-2"><span className={labelCls}>{locale === "tr" ? "İlan Linki" : "URL"}</span>
                <input value={form.listing_url} onChange={(e) => set({ listing_url: e.target.value })} className={inputCls} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{locale === "tr" ? "Teknik" : "Technical"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Yakıt" : "Fuel"}</span>
                <select value={form.fuel_type} onChange={(e) => set({ fuel_type: e.target.value })} className={inputCls}>
                  <option value="">—</option><option value="Benzin">Benzin</option><option value="Dizel">Dizel</option>
                  <option value="Hybrid">Hybrid</option><option value="Elektrik">Elektrik</option><option value="LPG">LPG</option>
                </select></label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Vites" : "Transmission"}</span>
                <select value={form.transmission} onChange={(e) => set({ transmission: e.target.value })} className={inputCls}>
                  <option value="">—</option><option value="Otomatik">Otomatik</option><option value="Manuel">Manuel</option>
                  <option value="Yarı Otomatik">Yarı Otomatik</option>
                </select></label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Kasa" : "Body"}</span>
                <select value={form.body_type} onChange={(e) => set({ body_type: e.target.value })} className={inputCls}>
                  <option value="">—</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option><option value="Crossover">Crossover</option>
                  <option value="Station Wagon">Station Wagon</option><option value="Coupe">Coupe</option>
                </select></label>
              <label className="block"><span className={labelCls}>Segment</span>
                <select value={form.segment} onChange={(e) => set({ segment: e.target.value })} className={inputCls}>
                  <option value="">—</option><option value="A">A</option><option value="B">B</option>
                  <option value="C">C</option><option value="D">D</option><option value="E">E</option>
                  <option value="C-SUV">C-SUV</option><option value="D-SUV">D-SUV</option>
                </select></label>
              <label className="block"><span className={labelCls}>HP</span>
                <input type="number" value={form.horsepower} onChange={(e) => set({ horsepower: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className={labelCls}>cc</span>
                <input type="number" value={form.engine_cc} onChange={(e) => set({ engine_cc: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className={labelCls}>L/100km</span>
                <input type="number" step="0.1" value={form.combined_fuel_consumption} onChange={(e) => set({ combined_fuel_consumption: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className={labelCls}>{locale === "tr" ? "Bagaj (L)" : "Trunk (L)"}</span>
                <input type="number" value={form.luggage_capacity} onChange={(e) => set({ luggage_capacity: e.target.value })} className={inputCls} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{locale === "tr" ? "Donanım" : "Equipment"}</h2>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((slug) => {
                const on = form.equipment.includes(slug);
                return (
                  <button key={slug} type="button" onClick={() => toggleEquip(slug)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      on ? "border-primary-500/40 bg-primary-500/15 text-primary-300" : "border-white/[0.08] text-[#9CA3AF] hover:border-white/[0.15] hover:text-white"
                    }`}>{EQUIPMENT_LABELS[slug] || slug}</button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{locale === "tr" ? "Notlar" : "Notes"}</h2>
            <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3}
              placeholder={locale === "tr" ? "Kendi notlarınız..." : "Your notes..."} className={inputCls + " resize-none"} />
          </section>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push(`/${locale}/garage`)}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-[#E5E7EB] font-semibold hover:bg-white/[0.08] text-sm transition-all">
              {locale === "tr" ? "İptal" : "Cancel"}</button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex-[2] btn-gradient rounded-xl py-3 text-white font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2 text-sm">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {locale === "tr" ? "Kaydediliyor..." : "Saving..."}</> : (locale === "tr" ? "Güncelle" : "Update")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
