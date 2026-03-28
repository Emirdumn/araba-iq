"use client";

import { GarageForm } from "@/components/garage/GarageForm";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AddCarPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-screen pt-24 pb-32" />;

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white font-display">
          {locale === "tr" ? "Yeni Araç Ekle" : "Add New Car"}
        </h1>
        <p className="text-[#9CA3AF] mt-2 text-sm">
          {locale === "tr"
            ? "Karşılaştırmak istediğiniz aracı detaylı olarak girin."
            : "Enter the details of the car you want to compare."}
        </p>
      </div>
      <GarageForm locale={locale} />
    </div>
  );
}
