"use client";

import type { RecommendationItem } from "@/types/araba-iq-recommendation";
import type { ArabaIqRecommendationMessages } from "@/lib/araba-iq-messages";
import { formatScore, formatTryPrice } from "@/lib/format-scores";
import { GitCompare, Check } from "lucide-react";

interface Props {
  item: RecommendationItem;
  includeDebug: boolean;
  inCompare: boolean;
  onToggleCompare: () => void;
  t: ArabaIqRecommendationMessages;
  locale: string;
}

export function RecommendationResultCard({
  item,
  includeDebug,
  inCompare,
  onToggleCompare,
  t,
  locale,
}: Props) {
  const loc = locale === "tr" ? "tr-TR" : "en-US";

  return (
    <article
      className={`rounded-2xl border bg-gradient-to-b from-white to-[#f9fafb] p-0 shadow-md overflow-hidden flex flex-col transition-shadow ${
        inCompare
          ? "border-[#2563eb] ring-2 ring-[#2563eb]/50 ring-offset-2 ring-offset-[#f4f5f7] shadow-lg"
          : "border-[#d1d5db]/60"
      }`}
    >
      <div className="bg-[#2563eb]/8 border-b border-[#2563eb]/15 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#2563eb] mb-2">{t.rankingLabel}</p>
        <p className="text-sm text-[#0d1117] leading-relaxed font-medium">{item.ranking_reason}</p>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#0d1117] leading-snug pr-2">{item.car_name}</h3>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0d1117]/40">{t.cardOverall}</span>
            <span className="text-3xl font-bold text-[#2563eb] tabular-nums leading-none">
              {formatScore(item.overall_score, loc)}
            </span>
            <span className="text-[10px] text-[#0d1117]/40 mt-1">{t.scoreOutOf100}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#f4f5f7] border border-[#d1d5db]/40 px-2 py-3 text-center">
            <div className="text-base font-semibold text-[#1e40af] tabular-nums">{formatScore(item.fit_score, loc)}</div>
            <div className="text-[10px] font-medium text-[#0d1117]/50 mt-0.5">{t.cardFit}</div>
          </div>
          <div className="rounded-xl bg-[#f4f5f7] border border-[#d1d5db]/40 px-2 py-3 text-center">
            <div className="text-base font-semibold text-[#1e40af] tabular-nums">{formatScore(item.feature_match_score, loc)}</div>
            <div className="text-[10px] font-medium text-[#0d1117]/50 mt-0.5">{t.cardFeatures}</div>
          </div>
          <div className="rounded-xl bg-[#f4f5f7] border border-[#d1d5db]/40 px-2 py-3 text-center">
            <div className="text-base font-semibold text-[#1e40af] tabular-nums">{formatScore(item.market_score, loc)}</div>
            <div className="text-[10px] font-medium text-[#0d1117]/50 mt-0.5">{t.cardMarket}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#2563eb]/8 text-[#0d1117] px-2.5 py-1 font-medium">
            {t.requiredMatches}: {item.matched_required_count}
          </span>
          <span className="rounded-full bg-amber-100/80 text-amber-950 px-2.5 py-1 font-medium">
            {t.preferredMatches}: {item.matched_preferred_count}
          </span>
        </div>

        <div className="rounded-xl bg-[#f9fafb] border border-[#d1d5db]/40 p-3">
          <p className="text-xs font-semibold text-[#2563eb] mb-1">{t.priceSummary}</p>
          {item.price_summary.avg_price != null ? (
            <p className="text-[#0d1117] font-mono text-sm">
              ~{formatTryPrice(item.price_summary.avg_price, locale)} · n={item.price_summary.sample_size}
            </p>
          ) : (
            <p className="text-[#0d1117]/70 text-sm">{t.noAverage}</p>
          )}
          <p className="mt-2 text-xs text-[#0d1117]/75 leading-relaxed">{item.price_summary.price_comment}</p>
        </div>

        {item.reasons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#2563eb] mb-2">{t.reasons}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.reasons.map((r, i) => (
                <span
                  key={i}
                  className="inline-block max-w-full rounded-lg border border-[#2563eb]/20 bg-white px-2.5 py-1.5 text-xs text-[#0d1117] leading-snug"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.cautions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-900 mb-2">{t.cautions}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.cautions.map((c, i) => (
                <span
                  key={i}
                  className="inline-block max-w-full rounded-lg border border-amber-300/60 bg-amber-50/90 px-2.5 py-1.5 text-xs text-amber-950 leading-snug"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {includeDebug && item.candidate_filter_reason && (
          <p className="text-xs font-mono text-[#0d1117]/60 border-t border-dashed border-[#d1d5db]/60 pt-2">
            <span className="text-[#2563eb]">{t.debugNote}:</span> {item.candidate_filter_reason}
          </p>
        )}

        <button
          type="button"
          onClick={onToggleCompare}
          className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            inCompare
              ? "bg-[#2563eb] text-white shadow-md ring-2 ring-white/25"
              : "bg-white border-2 border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/5"
          }`}
        >
          {inCompare ? <Check className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
          {inCompare ? t.inCompare : t.addCompare}
        </button>
      </div>
    </article>
  );
}
