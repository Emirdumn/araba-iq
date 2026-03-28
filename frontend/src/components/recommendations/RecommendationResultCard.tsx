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
      className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-2px] ${
        inCompare
          ? "border-primary-500/50 bg-gradient-to-b from-primary-500/[0.08] to-[#111827] shadow-glow-sm ring-1 ring-primary-500/30"
          : "border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-[#0B1120] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      <div className="bg-primary-500/[0.06] border-b border-primary-500/10 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-2">{t.rankingLabel}</p>
        <p className="text-sm text-[#E5E7EB] leading-relaxed font-medium">{item.ranking_reason}</p>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white leading-snug pr-2">{item.car_name}</h3>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">{t.cardOverall}</span>
            <span className="text-3xl font-bold gradient-text tabular-nums leading-none">
              {formatScore(item.overall_score, loc)}
            </span>
            <span className="text-[10px] text-[#6B7280] mt-1">{t.scoreOutOf100}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2 py-3 text-center">
            <div className="text-base font-semibold text-primary-300 tabular-nums">{formatScore(item.fit_score, loc)}</div>
            <div className="text-[10px] font-medium text-[#6B7280] mt-0.5">{t.cardFit}</div>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2 py-3 text-center">
            <div className="text-base font-semibold text-primary-300 tabular-nums">{formatScore(item.feature_match_score, loc)}</div>
            <div className="text-[10px] font-medium text-[#6B7280] mt-0.5">{t.cardFeatures}</div>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2 py-3 text-center">
            <div className="text-base font-semibold text-primary-300 tabular-nums">{formatScore(item.market_score, loc)}</div>
            <div className="text-[10px] font-medium text-[#6B7280] mt-0.5">{t.cardMarket}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-primary-500/10 text-primary-300 px-2.5 py-1 font-medium border border-primary-500/20">
            {t.requiredMatches}: {item.matched_required_count}
          </span>
          <span className="rounded-full bg-amber-500/10 text-amber-300 px-2.5 py-1 font-medium border border-amber-500/20">
            {t.preferredMatches}: {item.matched_preferred_count}
          </span>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <p className="text-xs font-semibold text-primary-400 mb-1">{t.priceSummary}</p>
          {item.price_summary.avg_price != null ? (
            <p className="text-[#E5E7EB] font-mono text-sm">
              ~{formatTryPrice(item.price_summary.avg_price, locale)} · n={item.price_summary.sample_size}
            </p>
          ) : (
            <p className="text-[#6B7280] text-sm">{t.noAverage}</p>
          )}
          <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed">{item.price_summary.price_comment}</p>
        </div>

        {item.reasons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-primary-400 mb-2">{t.reasons}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.reasons.map((r, i) => (
                <span
                  key={i}
                  className="inline-block max-w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[#E5E7EB] leading-snug"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.cautions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-400 mb-2">{t.cautions}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.cautions.map((c, i) => (
                <span
                  key={i}
                  className="inline-block max-w-full rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-xs text-amber-200 leading-snug"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {includeDebug && item.candidate_filter_reason && (
          <p className="text-xs font-mono text-[#6B7280] border-t border-dashed border-white/[0.06] pt-2">
            <span className="text-primary-400">{t.debugNote}:</span> {item.candidate_filter_reason}
          </p>
        )}

        <button
          type="button"
          onClick={onToggleCompare}
          className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
            inCompare
              ? "btn-gradient text-white"
              : "border border-white/[0.1] bg-white/[0.04] text-[#E5E7EB] hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300"
          }`}
        >
          {inCompare ? <Check className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
          {inCompare ? t.inCompare : t.addCompare}
        </button>
      </div>
    </article>
  );
}
