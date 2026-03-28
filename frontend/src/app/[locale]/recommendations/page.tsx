"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";
import { postRecommendations, fetchSegments } from "@/lib/araba-iq-client";
import {
  defaultRecommendationFormState,
  formStateToRequestBody,
  type RecommendationFormState,
  type RecommendationResponse,
} from "@/types/araba-iq-recommendation";
import type { SegmentItem } from "@/types/araba-iq-recommendation";
import { RecommendationForm } from "@/components/recommendations/RecommendationForm";
import { RecommendationResultCard } from "@/components/recommendations/RecommendationResultCard";
import { RecommendationDebugPanel } from "@/components/recommendations/RecommendationDebugPanel";
import { RecommendationSkeleton } from "@/components/recommendations/RecommendationSkeleton";
import { useCompareCarsStore, MAX_COMPARE } from "@/stores/compare-cars";
import { getArabaIqMessages } from "@/lib/araba-iq-messages";
import { humanizeArabaIqError } from "@/lib/humanize-araba-iq-error";
import { interpolate } from "@/lib/interpolate";
import { presetCardTitle, type PresetApplyMeta } from "@/lib/recommendation-presets";

export default function RecommendationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "tr";
  const ai = getArabaIqMessages(locale);
  const t = ai.recommendations;

  const [form, setForm] = useState<RecommendationFormState>(defaultRecommendationFormState);
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [compareHint, setCompareHint] = useState<string | null>(null);
  const [presetBanner, setPresetBanner] = useState<(PresetApplyMeta & { label: string }) | null>(null);

  const ids = useCompareCarsStore((s) => s.ids);
  const toggleCompare = useCompareCarsStore((s) => s.toggle);
  const hasCompare = useCompareCarsStore((s) => s.has);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const segs = await fetchSegments();
        if (!cancelled) setSegments(segs);
      } catch {
        if (!cancelled) setSegments([]);
      } finally {
        if (!cancelled) setSegmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = useCallback(() => {
    setForm(defaultRecommendationFormState());
    setPresetBanner(null);
    setData(null);
    setError(null);
    setCompareHint(null);
  }, []);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setCompareHint(null);
    try {
      const res = await postRecommendations(formStateToRequestBody(form));
      setData(res);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "API error";
      setError(humanizeArabaIqError(raw, ai.errors));
    } finally {
      setLoading(false);
    }
  }, [form, ai.errors]);

  const onToggleCard = useCallback(
    (carId: number) => {
      setCompareHint(null);
      const r = toggleCompare(carId);
      if (!r.ok && r.message) setCompareHint(r.message);
    },
    [toggleCompare],
  );

  const onPresetApply = useCallback(
    (next: RecommendationFormState, meta: PresetApplyMeta) => {
      setForm(next);
      const rec = getArabaIqMessages(locale).recommendations;
      setPresetBanner({
        ...meta,
        label: presetCardTitle(rec, meta.preset.id),
      });
    },
    [locale],
  );

  const emptyRaiseBudget = useCallback(() => {
    setForm((f) => ({ ...f, budget_max: Math.round(f.budget_max * 1.25) }));
  }, []);
  const emptyStrictOff = useCallback(() => {
    setForm((f) => ({ ...f, strict_required: false }));
  }, []);
  const emptyReduceFeatures = useCallback(() => {
    setForm((f) => {
      if (f.required_features.length > 0) {
        return { ...f, required_features: f.required_features.slice(0, -1) };
      }
      if (f.preferred_features.length > 0) {
        return { ...f, preferred_features: f.preferred_features.slice(0, -1) };
      }
      return f;
    });
  }, []);
  const emptyClearSegments = useCallback(() => {
    setForm((f) => ({ ...f, segment_ids: [] }));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/[0.06] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {t.badge}
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">{t.title}</h1>
          <p className="mt-2 text-[#9CA3AF] max-w-2xl text-sm leading-relaxed">{t.subtitle}</p>
        </header>

        {ids.length > 0 && (
          <div className="sticky top-[72px] z-30 mb-6 flex flex-col gap-3 rounded-xl border border-primary-500/30 bg-[#0B1120]/95 backdrop-blur-xl px-4 py-3 shadow-lg shadow-black/20 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-400">{t.compareTray}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{t.compareTraySubtitle}</p>
              <p className="text-sm font-semibold text-white mt-1 tabular-nums">
                {ids.length}/{MAX_COMPARE}
              </p>
            </div>
            <Link
              href={`/${locale}/compare`}
              className={`inline-flex items-center justify-center rounded-xl text-center font-semibold transition-all duration-300 shrink-0 ${
                ids.length >= 2
                  ? "btn-gradient text-white px-6 py-3 text-base"
                  : ids.length === 1
                    ? "border border-primary-500/40 text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 px-4 py-2.5 text-sm"
                    : "bg-white/[0.04] text-[#6B7280] pointer-events-none px-4 py-2.5 text-sm"
              }`}
            >
              {ids.length >= 2
                ? t.openCompareReady
                : interpolate(t.openCompareProgress, { current: ids.length, max: MAX_COMPARE })}
            </Link>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            {presetBanner && (
              <div className="mb-4 rounded-xl border border-primary-500/25 bg-primary-500/[0.06] p-4 relative pr-10">
                <button
                  type="button"
                  onClick={() => setPresetBanner(null)}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/[0.08] text-[#6B7280]"
                  aria-label={t.presetCloseBanner}
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-400">{t.presetAppliedTitle}</p>
                <p className="text-sm font-semibold text-white mt-1">{presetBanner.label}</p>
                <p className="text-xs text-[#9CA3AF] mt-2">
                  {presetBanner.budgetPreserved
                    ? interpolate(t.presetBudgetKept, {
                        amount: presetBanner.budgetAmount.toLocaleString(locale === "tr" ? "tr-TR" : "en-US"),
                      })
                    : t.presetBudgetChanged}
                </p>
                {presetBanner.lines.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-white mt-3">{t.presetChangedFields}</p>
                    <ul className="mt-1 text-xs text-[#9CA3AF] list-disc pl-4 space-y-0.5">
                      {presetBanner.lines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <RecommendationForm
              value={form}
              onChange={setForm}
              segments={segments}
              segmentsLoading={segmentsLoading}
              t={t}
              onPresetApply={onPresetApply}
              disabled={loading}
            />
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-[#E5E7EB] font-semibold hover:bg-white/[0.08] hover:border-white/[0.15] disabled:opacity-50 text-sm transition-all duration-200"
              >
                {t.resetForm}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="flex-[2] btn-gradient rounded-xl py-3.5 text-white font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.submitLoading}
                  </>
                ) : (
                  t.submit
                )}
              </button>
            </div>
          </div>

          <div>
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                <p className="text-sm text-[#6B7280] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.scoringWait}
                </p>
                <RecommendationSkeleton />
              </div>
            )}

            {!loading && data && (
              <>
                <div className="mb-4 text-sm text-[#9CA3AF] font-mono">
                  {interpolate(t.statsLine, { total: data.total_candidates, returned: data.returned_count })}
                </div>

                {data.total_candidates === 0 && data.results.length === 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-8 mb-4">
                    <p className="font-semibold text-white mb-2">{t.emptyNoCandidatesTitle}</p>
                    <p className="text-sm text-[#9CA3AF] leading-relaxed">{t.emptyNoCandidatesBody}</p>
                    <p className="text-xs font-semibold text-[#9CA3AF] mt-5 mb-2">{t.emptyQuickActions}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { action: emptyRaiseBudget, label: t.emptyActionRaiseBudget },
                        { action: emptyStrictOff, label: t.emptyActionStrictOff },
                        { action: emptyReduceFeatures, label: t.emptyActionReduceFeatures },
                        { action: emptyClearSegments, label: t.emptyActionClearSegments },
                      ].map(({ action, label }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={action}
                          className="rounded-full border border-primary-500/30 bg-primary-500/[0.06] px-3 py-1.5 text-xs font-semibold text-primary-300 hover:bg-primary-500/15 transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {data.results.length === 0 && data.total_candidates > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-6 text-sm text-amber-200 mb-4">
                    <p className="font-semibold mb-1">{t.emptyPartialTitle}</p>
                    <p>{t.emptyPartialBody}</p>
                  </div>
                )}

                {compareHint && (
                  <p className="mb-3 text-sm text-amber-300 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg px-3 py-2">{compareHint}</p>
                )}

                <div className="grid gap-5 md:grid-cols-1 xl:grid-cols-2">
                  {data.results.map((item) => (
                    <RecommendationResultCard
                      key={item.car_id}
                      item={item}
                      includeDebug={form.include_debug}
                      inCompare={hasCompare(item.car_id)}
                      onToggleCompare={() => onToggleCard(item.car_id)}
                      t={t}
                      locale={locale}
                    />
                  ))}
                </div>

                {form.include_debug && data.excluded_candidates && data.excluded_candidates.length > 0 && (
                  <div className="mt-6">
                    <RecommendationDebugPanel excluded={data.excluded_candidates} t={t} />
                  </div>
                )}
              </>
            )}

            {!loading && !data && !error && (
              <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-12 text-center">
                <p className="text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">{t.initialHint}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
