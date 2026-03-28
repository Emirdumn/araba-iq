import Link from "next/link";
import { ArrowRight, Plus, GitCompare } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const isTr = locale === "tr";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background glows */}
      <div className="hero-glow bg-blue-500 top-[-20%] left-[20%] animate-glow-pulse" />
      <div className="hero-glow bg-purple-600 top-[-10%] right-[15%] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="hero-glow bg-indigo-500 bottom-[5%] left-[40%] w-[400px] h-[400px] animate-glow-pulse" style={{ animationDelay: "1s" }} />

      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-2xl text-center space-y-8 px-6 pt-24 pb-16">
        <div className="opacity-0 animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            ArabaIQ
          </span>
        </div>

        <h1 className="opacity-0 animate-slide-up font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
          <span className="gradient-text">
            {isTr ? "Aracını\nAkıllıca Seç" : "Choose Your\nCar Wisely"}
          </span>
        </h1>

        <p className="opacity-0 animate-slide-up-delay text-lg text-[#9CA3AF] leading-relaxed max-w-md mx-auto">
          {isTr
            ? "Araçları ekle, yan yana karşılaştır, doğru kararı ver."
            : "Add cars, compare side by side, make the right call."}
        </p>

        <div className="opacity-0 animate-fade-in-delay flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href={`/${locale}/garage`}
            className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-white font-semibold text-base"
          >
            {isTr ? "Garaja Git" : "Open Garage"}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/garage/add`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-[#E5E7EB] font-semibold text-base hover:bg-white/[0.07] hover:border-white/[0.18] transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            {isTr ? "Araç Ekle" : "Add Car"}
          </Link>
        </div>

        {/* How it works — 3 steps */}
        <div className="opacity-0 animate-fade-in-delay pt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { n: "01", icon: <Plus className="w-4 h-4" />, t: isTr ? "Araç Ekle" : "Add Cars" },
            { n: "02", icon: <GitCompare className="w-4 h-4" />, t: isTr ? "Seç" : "Select" },
            { n: "03", icon: <ArrowRight className="w-4 h-4" />, t: isTr ? "Karşılaştır" : "Compare" },
          ].map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#6B7280] mx-auto mb-2">
                {step.icon}
              </div>
              <p className="text-xs font-mono text-primary-400/50">{step.n}</p>
              <p className="text-sm text-[#9CA3AF] font-medium">{step.t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
