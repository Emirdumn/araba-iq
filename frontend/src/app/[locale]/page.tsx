import Link from "next/link";
import { ArrowRight, BarChart3, GitCompare, ListPlus } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const isTR = locale === "tr";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background glows */}
      <div className="hero-glow bg-blue-500 top-[-20%] left-[20%] animate-glow-pulse" />
      <div className="hero-glow bg-purple-600 top-[-10%] right-[15%] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="hero-glow bg-indigo-500 bottom-[5%] left-[40%] w-[400px] h-[400px] animate-glow-pulse" style={{ animationDelay: "1s" }} />

      {/* Radial top gradient */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-4xl text-center space-y-8 px-6 pt-24 pb-16">
        {/* Badge */}
        <div className="opacity-0 animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            ArabaIQ Garage
          </span>
        </div>

        {/* Headline */}
        <h1 className="opacity-0 animate-slide-up font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
          <span className="gradient-text">
            {isTR ? "Aracını ekle. Kararını netleştir." : "Add your cars. Decide with clarity."}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="opacity-0 animate-slide-up-delay text-lg sm:text-xl text-[#9CA3AF] leading-relaxed max-w-2xl mx-auto">
          {isTR 
            ? "Pazar değil; veriye dayalı karşılaştırma ve karar destek aracı. Araçlarını garaja ekle, kolayca karşılaştır ve senin için en iyisini bul." 
            : "Not a marketplace — a structured comparison and decision-support tool. Add your cars to the garage, compare easily, and find the best fit."}
        </p>

        {/* CTA Buttons */}
        <div className="opacity-0 animate-fade-in-delay flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link
            href={`/${locale}/garage/add`}
            className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-white font-semibold text-base"
          >
            <ListPlus className="w-5 h-5" />
            {isTR ? "İlk Aracını Ekle" : "Add Your First Car"}
          </Link>
          <Link
            href={`/${locale}/garage`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-sm px-8 py-4 text-[#E5E7EB] font-semibold text-base hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300"
          >
            {isTR ? "Garajıma Git" : "Go to Garage"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Steps/Features */}
        <div className="opacity-0 animate-fade-in-delay pt-12 grid sm:grid-cols-3 gap-6 text-sm text-[#9CA3AF] text-left">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4">
              <span className="font-display font-bold text-primary-400">1</span>
            </div>
            <h3 className="text-white font-semibold mb-1">{isTR ? "Aracını Ekle" : "Add a Car"}</h3>
            <p className="text-[#6B7280]">{isTR ? "Fiyat, kilometre ve donanım bilgilerini basitçe gir." : "Easily enter price, mileage, and features."}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="w-10 h-10 rounded-lg bg-accent-indigo/10 flex items-center justify-center mb-4">
              <span className="font-display font-bold text-accent-indigo">2</span>
            </div>
            <h3 className="text-white font-semibold mb-1">{isTR ? "Seçim Yap" : "Select"}</h3>
            <p className="text-[#6B7280]">{isTR ? "Garajından karşılaştırmak istediğin araçları işaretle." : "Select the cars you want to compare from your garage."}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center mb-4">
              <span className="font-display font-bold text-accent-purple">3</span>
            </div>
            <h3 className="text-white font-semibold mb-1">{isTR ? "Karşılaştır" : "Compare"}</h3>
            <p className="text-[#6B7280]">{isTR ? "Yan yana tablo ve akıllı özetlerle net karar ver." : "Make clear decisions with side-by-side tables and smart summaries."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
