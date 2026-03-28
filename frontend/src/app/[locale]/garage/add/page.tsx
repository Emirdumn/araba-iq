"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useGarageStore } from "@/stores/garage";

const EQUIPMENT = [
  { slug: "apple_carplay", label: "Apple CarPlay" },
  { slug: "android_auto", label: "Android Auto" },
  { slug: "rear_camera", label: "Geri Kamera" },
  { slug: "sunroof", label: "Sunroof" },
  { slug: "panoramic_roof", label: "Panoramik Tavan" },
  { slug: "adaptive_cruise_control", label: "Adaptif Cruise" },
  { slug: "lane_keep_assist", label: "Şerit Takip" },
  { slug: "blind_spot_warning", label: "Kör Nokta" },
  { slug: "head_up_display", label: "Head-up Display" },
  { slug: "led_headlights", label: "LED Far" },
];

export default function AddCarPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "tr";
  const isTr = locale === "tr";
  const addCar = useGarageStore((s) => s.addCar);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("2024");
  const [price, setPrice] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [horsepower, setHorsepower] = useState("");
  const [consumption, setConsumption] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEquip = (slug: string) =>
    setEquipment((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );

  const handleSave = async () => {
    if (!brand.trim() || !model.trim()) {
      setError(isTr ? "Marka ve model zorunlu." : "Brand and model required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addCar({
        brand: brand.trim(),
        model: model.trim(),
        variant: variant.trim() || null,
        year: Number(year) || 2024,
        price: price ? Number(price) : null,
        fuel_type: fuelType || null,
        transmission: transmission || null,
        body_type: bodyType || null,
        horsepower: horsepower ? Number(horsepower) : null,
        combined_fuel_consumption: consumption ? Number(consumption) : null,
        equipment: equipment.length > 0 ? equipment.join(",") : null,
        notes: notes.trim() || null,
        mileage_km: null,
        listing_url: null,
        segment: null,
        engine_cc: null,
        luggage_capacity: null,
        is_favorite: false,
      });
      router.push(`/${locale}/garage`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[15px] text-white placeholder:text-[#475569] focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 focus:outline-none transition-all hover:border-white/[0.12]";

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4">
        {/* Back */}
        <Link
          href={`/${locale}/garage`}
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isTr ? "Garaja dön" : "Back to garage"}
        </Link>

        <h1 className="text-2xl font-bold text-white font-display mb-8">
          {isTr ? "Araç Ekle" : "Add Car"}
        </h1>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Group 1: Identity */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
              {isTr ? "Araç Bilgisi" : "Car Identity"}
            </h2>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={isTr ? "Marka (BMW, Toyota...)" : "Brand"} className={inputCls} />
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={isTr ? "Model (320i, Corolla...)" : "Model"} className={inputCls} />
            <input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder={isTr ? "Paket (opsiyonel)" : "Trim (optional)"} className={inputCls} />
            <div className="flex gap-3">
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Yıl" className={inputCls + " flex-1"} />
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={isTr ? "Fiyat (₺)" : "Price (₺)"} className={inputCls + " flex-[2]"} />
            </div>
          </section>

          {/* Group 2: Specs */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
              {isTr ? "Teknik" : "Specs"}
            </h2>
            <div className="flex gap-3">
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={inputCls + " flex-1"}>
                <option value="">{isTr ? "Yakıt" : "Fuel"}</option>
                <option value="Benzin">Benzin</option>
                <option value="Dizel">Dizel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Elektrik">Elektrik</option>
              </select>
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={inputCls + " flex-1"}>
                <option value="">{isTr ? "Vites" : "Gear"}</option>
                <option value="Otomatik">Otomatik</option>
                <option value="Manuel">Manuel</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className={inputCls + " flex-1"}>
                <option value="">{isTr ? "Kasa" : "Body"}</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Crossover">Crossover</option>
                <option value="Station Wagon">Station Wagon</option>
              </select>
              <input type="number" value={horsepower} onChange={(e) => setHorsepower(e.target.value)} placeholder="HP" className={inputCls + " flex-1"} />
            </div>
            <input type="number" step="0.1" value={consumption} onChange={(e) => setConsumption(e.target.value)} placeholder={isTr ? "Tüketim (L/100km)" : "L/100km"} className={inputCls} />
          </section>

          {/* Group 3: Equipment chips */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
              {isTr ? "Donanım" : "Equipment"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((eq) => {
                const on = equipment.includes(eq.slug);
                return (
                  <button
                    key={eq.slug}
                    type="button"
                    onClick={() => toggleEquip(eq.slug)}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                      on
                        ? "bg-primary-500/15 text-primary-300 border border-primary-500/30"
                        : "bg-white/[0.03] text-[#9CA3AF] border border-white/[0.06] hover:border-white/[0.12] hover:text-white"
                    }`}
                  >
                    {eq.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={isTr ? "Notlar (opsiyonel)" : "Notes (optional)"}
            className={inputCls + " resize-none"}
          />

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-gradient rounded-xl py-4 text-white font-semibold text-base inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {isTr ? "Kaydediliyor..." : "Saving..."}</>
            ) : (
              <><Save className="w-4 h-4" /> {isTr ? "Garaja Kaydet" : "Save to Garage"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
