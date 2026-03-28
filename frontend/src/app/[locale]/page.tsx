import Link from "next/link";
import { ArrowRight, BarChart3, GitCompare, Shield } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const data = (await import(`@/i18n/messages/${locale}.json`)).default;
  const h = data.home;

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

      <div className="relative z-10 max-w-3xl text-center space-y-8 px-6 pt-24 pb-16">
        {/* Badge */}
        <div className="opacity-0 animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            ArabaIQ
          </span>
        </div>

        {/* Headline */}
        <h1 className="opacity-0 animate-slide-up font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
          <span className="gradient-text">{h.hero_title}</span>
        </h1>

        {/* Subtitle */}
        <p className="opacity-0 animate-slide-up-delay text-lg sm:text-xl text-[#9CA3AF] leading-relaxed max-w-xl mx-auto">
          {h.hero_subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="opacity-0 animate-fade-in-delay flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href={`/${locale}/recommendations`}
            className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-white font-semibold text-base"
          >
            {h.hero_cta_primary}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/compare`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-sm px-8 py-4 text-[#E5E7EB] font-semibold text-base hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300"
          >
            {h.hero_cta_secondary}
          </Link>
        </div>

        {/* Feature pills */}
        <div className="opacity-0 animate-fade-in-delay pt-8 flex flex-wrap justify-center gap-6 text-sm text-[#6B7280]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-400" />
            <span>{locale === "tr" ? "Veriye dayalı skorlama" : "Data-driven scoring"}</span>
          </div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-accent-indigo" />
            <span>{locale === "tr" ? "Yan yana karşılaştırma" : "Side-by-side comparison"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-purple" />
            <span>{locale === "tr" ? "Piyasa analizi" : "Market analysis"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
