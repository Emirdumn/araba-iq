"use client";

import { GarageForm } from "@/components/garage/GarageForm";
import { useGarageStore } from "@/stores/garage-store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditCarPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "tr";
  const carId = params?.id as string;
  
  const { cars } = useGarageStore();
  const [mounted, setMounted] = useState(false);
  
  const existingCar = cars.find((c) => c.id === carId);

  useEffect(() => {
    setMounted(true);
    if (mounted && !existingCar) {
      router.push(`/${locale}/garage`);
    }
  }, [mounted, existingCar, router, locale]);

  if (!mounted || !existingCar) return <div className="min-h-screen pt-24 pb-32" />;

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white font-display">
          {locale === "tr" ? "Aracı Düzenle" : "Edit Car"}
        </h1>
        <p className="text-[#9CA3AF] mt-2 text-sm">
          {existingCar.brand} {existingCar.model}
        </p>
      </div>
      <GarageForm locale={locale} existingCar={existingCar} />
    </div>
  );
}
