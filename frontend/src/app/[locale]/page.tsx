import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const data = (await import(`@/i18n/messages/${locale}.json`)).default;
  const h = data.home;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-2xl text-center space-y-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">ArabaIQ</p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#0d1117] leading-tight whitespace-pre-line">
          {h.hero_title}
        </h1>
        <p className="text-lg text-[#0d1117]/70 leading-relaxed">{h.hero_subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href={`/${locale}/recommendations`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-8 py-4 text-white font-semibold hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-[#2563eb]/25"
          >
            {h.hero_cta_primary}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/compare`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#2563eb] bg-white px-8 py-4 text-[#2563eb] font-semibold hover:bg-[#2563eb]/5 transition-colors"
          >
            {h.hero_cta_secondary}
          </Link>
        </div>
      </div>
    </div>
  );
}
