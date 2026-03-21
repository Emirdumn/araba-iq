"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, X, ArrowLeft } from "lucide-react";
import { postCompare } from "@/lib/araba-iq-client";
import type { CarCompareResponse } from "@/lib/araba-iq-client";
import { useCompareCarsStore, MAX_COMPARE } from "@/stores/compare-cars";
import { getArabaIqMessages } from "@/lib/araba-iq-messages";
import { humanizeArabaIqError } from "@/lib/humanize-araba-iq-error";
import { buildCompareHighlights } from "@/lib/compare-highlights";
import { formatCellValue } from "@/lib/format-scores";
import { interpolate } from "@/lib/interpolate";
import {
  equipmentRowHasDifference,
  countUniqueEquipmentAdvantages,
  uniqueEquipmentCategories,
  type EquipmentRow,
} from "@/lib/compare-equipment";
import {
  technicalBalancedLeader,
  performancePowerLeader,
  marketPriceLeader,
  equipmentRichLeader,
  type TabLeaderResult,
} from "@/lib/compare-tab-leaders";

type CompareTab = "summary" | "technical" | "performance" | "market" | "equipment";

function TabLeaderBox({ t, leader }: { t: ReturnType<typeof getArabaIqMessages>["compare"]; leader: TabLeaderResult }) {
  return (
    <div className="mb-4 rounded-xl border border-[#2563eb]/35 bg-gradient-to-br from-[#2563eb]/10 to-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb]">{t.tabLeaderWhoAhead}</p>
      <p className="text-sm font-semibold text-[#0d1117] mt-1">{leader.headline}</p>
      <p className="text-base font-bold text-[#2563eb] mt-0.5 leading-snug">{leader.leaderShortName}</p>
      <p className="text-xs text-[#0d1117]/70 mt-1">{leader.detail}</p>
    </div>
  );
}

export default function CompareClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "tr";
  const ai = getArabaIqMessages(locale);
  const t = ai.compare;

  const ids = useCompareCarsStore((s) => s.ids);
  const remove = useCompareCarsStore((s) => s.remove);
  const clear = useCompareCarsStore((s) => s.clear);
  const replaceAll = useCompareCarsStore((s) => s.replaceAll);

  const [tab, setTab] = useState<CompareTab>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CarCompareResponse | null>(null);
  const [equipmentOnlyDiff, setEquipmentOnlyDiff] = useState(false);
  const [equipmentCategory, setEquipmentCategory] = useState<string>("");

  useEffect(() => {
    const raw = searchParams.get("ids");
    if (!raw) return;
    const parsed = raw
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (parsed.length >= 2) replaceAll(parsed);
  }, [searchParams, replaceAll]);

  const runCompare = useCallback(async () => {
    if (ids.length < 2) {
      setResult(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await postCompare(ids.slice(0, MAX_COMPARE));
      setResult(res);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "err";
      setError(humanizeArabaIqError(raw, ai.errors));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [ids, ai.errors]);

  useEffect(() => {
    if (ids.length >= 2) runCompare();
    else {
      setResult(null);
      setError(null);
    }
  }, [ids, runCompare]);

  const tabs: { id: CompareTab; label: string }[] = [
    { id: "summary", label: t.tabSummary },
    { id: "technical", label: t.tabTechnical },
    { id: "performance", label: t.tabPerformance },
    { id: "market", label: t.tabMarket },
    { id: "equipment", label: t.tabEquipment },
  ];

  const highlights =
    result && result.cars.length >= 2
      ? buildCompareHighlights(
          result,
          {
            fuel: t.highlightFuel,
            luggage: t.highlightLuggage,
            priceLow: t.highlightPrice,
            equipment: t.highlightEquipment,
          },
          locale,
        )
      : [];

  const equipment = result?.equipment_comparison as
    | {
        rows?: EquipmentRow[];
        truthy_counts_by_variant_id?: Record<string, number>;
      }
    | undefined;

  const carIds = useMemo(() => (result ? result.cars.map((c) => c.car_variant_id) : []), [result]);

  const equipmentRows: EquipmentRow[] = useMemo(() => {
    const rows = equipment?.rows;
    if (!rows?.length) return [];
    return rows;
  }, [equipment?.rows]);

  const equipmentAdvantageCount = useMemo(
    () => (equipmentRows.length && carIds.length >= 2 ? countUniqueEquipmentAdvantages(equipmentRows, carIds) : 0),
    [equipmentRows, carIds],
  );

  const equipmentCategories = useMemo(() => uniqueEquipmentCategories(equipmentRows), [equipmentRows]);

  const filteredEquipmentRows = useMemo(() => {
    let rows = equipmentRows;
    if (equipmentCategory) rows = rows.filter((row) => row.category === equipmentCategory);
    if (equipmentOnlyDiff) rows = rows.filter((row) => equipmentRowHasDifference(row, carIds));
    return rows;
  }, [equipmentRows, equipmentCategory, equipmentOnlyDiff, carIds]);

  const techLeader = useMemo(
    () => (result && result.cars.length >= 2 ? technicalBalancedLeader(result, t) : null),
    [result, t],
  );
  const perfLeader = useMemo(
    () => (result && result.cars.length >= 2 ? performancePowerLeader(result, t, locale) : null),
    [result, t, locale],
  );
  const marketLeader = useMemo(
    () => (result && result.cars.length >= 2 ? marketPriceLeader(result, t, locale) : null),
    [result, t, locale],
  );
  const equipLeader = useMemo(
    () => (result && result.cars.length >= 2 ? equipmentRichLeader(result, t, locale) : null),
    [result, t, locale],
  );

  const renderPivot = (data: Record<string, Record<string, unknown>>, leader: TabLeaderResult | null) => {
    if (!result) return null;
    const keys = Object.keys(data);
    return (
      <>
        {leader && <TabLeaderBox t={t} leader={leader} />}
        <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-[#d1d5db]/30 bg-white shadow-sm max-w-full touch-pan-x">
          <table className="min-w-[280px] w-full text-sm">
            <thead>
              <tr className="border-b border-[#d1d5db]/30 bg-[#f4f5f7]/60">
                <th className="text-left p-2.5 min-h-[2.75rem] align-middle font-semibold text-[#0d1117] sticky left-0 bg-[#f4f5f7]/95 z-10 shadow-[2px_0_6px_-2px_rgba(45,58,42,0.08)]">
                  {t.field}
                </th>
                {result.cars.map((c) => (
                  <th
                    key={c.car_variant_id}
                    className="text-left p-2.5 min-h-[2.75rem] align-middle font-semibold text-[#0d1117] min-w-[112px] max-w-[200px]"
                  >
                    <span className="line-clamp-2">{c.brand}</span> <span className="line-clamp-2">{c.model}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key} className="border-b border-[#d1d5db]/15 hover:bg-[#f9fafb]/80">
                  <td className="p-2.5 min-h-[2.75rem] align-middle text-[#0d1117]/85 font-medium sticky left-0 bg-white/98 z-10 shadow-[2px_0_6px_-2px_rgba(45,58,42,0.06)]">
                    {key}
                  </td>
                  {result.cars.map((c) => {
                    const row = data[key];
                    const v = row?.[String(c.car_variant_id)];
                    return (
                      <td key={c.car_variant_id} className="p-2.5 min-h-[2.75rem] align-middle text-[#0d1117] break-words">
                        {formatCellValue(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <Link
          href={`/${locale}/recommendations`}
          className="inline-flex items-center gap-1 text-sm text-[#2563eb] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <h1 className="text-3xl font-extrabold text-[#0d1117] font-display mb-2">{t.title}</h1>
        <p className="text-sm text-[#0d1117]/70 mb-6">
          {interpolate(t.subtitle, { max: MAX_COMPARE })}
        </p>

        <div className="rounded-xl border border-[#d1d5db]/40 bg-white/90 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {ids.length === 0 && <span className="text-sm text-[#0d1117]/60">{t.noSelection}</span>}
            {ids.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] pl-3 pr-1 py-1 text-sm font-mono text-[#0d1117]"
              >
                #{id}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="rounded-full p-1 hover:bg-[#2563eb]/20"
                  aria-label={t.removeChipAria}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={clear} className="text-xs text-[#0d1117]/60 hover:text-[#0d1117] underline">
            {t.clear}
          </button>
        </div>

        {ids.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 mb-6 space-y-2">
            <p>{t.needTwo}</p>
            <Link href={`/${locale}/recommendations`} className="inline-block font-semibold text-[#2563eb] hover:underline">
              {t.needTwoCta}
            </Link>
          </div>
        )}

        {ids.length === 1 && (
          <div className="rounded-xl border-2 border-[#2563eb]/40 bg-[#2563eb]/5 px-4 py-4 mb-6">
            <p className="font-semibold text-[#0d1117]">{t.oneCarTitle}</p>
            <p className="text-sm text-[#0d1117]/80 mt-1">{t.oneCarBody}</p>
            <Link href={`/${locale}/recommendations`} className="inline-block mt-3 text-sm font-semibold text-[#2563eb] hover:underline">
              {t.needTwoCta}
            </Link>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[#0d1117] mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.loading}
          </div>
        )}

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 mb-6">{error}</div>}

        {result && !loading && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-6 border-b border-[#d1d5db]/40 pb-1 overflow-x-auto">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors shrink-0 ${
                    tab === id ? "bg-white text-[#2563eb] border border-b-0 border-[#d1d5db]/40 shadow-sm" : "text-[#0d1117]/60 hover:text-[#0d1117]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "summary" && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-lg font-semibold text-[#0d1117] mb-3">{t.summaryNarrative}</h2>
                  <ul className="space-y-3">
                    {result.summary_comments.map((line, i) => (
                      <li key={i} className="flex gap-3 text-sm text-[#0d1117]/90 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2563eb]/20 text-[#2563eb] text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {highlights.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-[#0d1117] mb-3">{t.summaryHighlights}</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {highlights.map((h) => (
                        <div key={h.areaKey} className="rounded-xl border border-[#2563eb]/25 bg-white p-4 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#2563eb] mb-1">{h.label}</p>
                          <p className="text-base font-semibold text-[#0d1117]">{h.leaderShortName}</p>
                          <p className="text-xs text-[#0d1117]/65 mt-1">{h.detail}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h2 className="text-lg font-semibold text-[#0d1117] mb-3">{t.cars}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.cars.map((c) => (
                      <div key={c.car_variant_id} className="rounded-xl border border-[#d1d5db]/40 bg-white p-4">
                        <h3 className="font-semibold text-[#0d1117]">{c.display_name}</h3>
                        <p className="text-xs text-[#0d1117]/60 mt-1">
                          {c.segment} · {c.year}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {tab === "technical" && renderPivot(result.technical_comparison as Record<string, Record<string, unknown>>, techLeader)}
            {tab === "performance" && renderPivot(result.performance_comparison as Record<string, Record<string, unknown>>, perfLeader)}
            {tab === "market" && renderPivot(result.market_comparison as Record<string, Record<string, unknown>>, marketLeader)}

            {tab === "equipment" && result && equipment?.rows && (
              <div className="space-y-4 min-w-0">
                <p className="text-sm font-medium text-[#0d1117]">
                  {interpolate(t.equipmentSummary, { cars: result.cars.length, advantages: equipmentAdvantageCount })}
                </p>

                {equipLeader && <TabLeaderBox t={t} leader={equipLeader} />}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between rounded-xl border border-[#d1d5db]/30 bg-white/80 px-4 py-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[#0d1117] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={equipmentOnlyDiff}
                      onChange={(e) => setEquipmentOnlyDiff(e.target.checked)}
                      className="rounded border-[#d1d5db] text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    {t.equipmentOnlyDiff}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#0d1117]/60">{t.equipmentCategoryLabel}</span>
                    <select
                      value={equipmentCategory}
                      onChange={(e) => setEquipmentCategory(e.target.value)}
                      className="text-sm rounded-lg border border-[#d1d5db]/60 bg-white px-3 py-2 text-[#0d1117] min-w-[10rem]"
                    >
                      <option value="">{t.equipmentCategoryAll}</option>
                      {equipmentCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-[#d1d5db]/30 bg-white shadow-sm max-w-full touch-pan-x">
                  <table className="min-w-[320px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#d1d5db]/30 bg-[#f4f5f7]/60">
                        <th className="text-left p-2.5 min-h-[2.75rem] align-middle font-semibold text-[#0d1117] sticky left-0 bg-[#f4f5f7]/95 z-10 shadow-[2px_0_6px_-2px_rgba(45,58,42,0.08)]">
                          {t.equipmentCategory}
                        </th>
                        <th className="text-left p-2.5 min-h-[2.75rem] align-middle font-semibold text-[#0d1117] min-w-[120px]">
                          {t.equipmentFeature}
                        </th>
                        {result.cars.map((c) => (
                          <th key={c.car_variant_id} className="text-center p-2.5 min-h-[2.75rem] align-middle font-semibold text-[#0d1117] min-w-[96px]">
                            <span className="line-clamp-2">{c.brand}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEquipmentRows.length === 0 ? (
                        <tr>
                          <td colSpan={2 + result.cars.length} className="p-6 text-center text-sm text-[#0d1117]/60">
                            {t.equipmentEmptyFiltered}
                          </td>
                        </tr>
                      ) : (
                        filteredEquipmentRows.map((row, idx) => (
                          <tr key={`${row.category}-${row.feature}-${idx}`} className="border-b border-[#d1d5db]/15 hover:bg-[#f9fafb]/80">
                            <td className="p-2.5 min-h-[2.75rem] align-middle text-xs text-[#0d1117]/75 sticky left-0 bg-white/98 z-10 shadow-[2px_0_6px_-2px_rgba(45,58,42,0.06)]">
                              {row.category}
                            </td>
                            <td className="p-2.5 min-h-[2.75rem] align-middle text-[#0d1117] font-medium">{row.feature}</td>
                            {result.cars.map((c) => {
                              const v = row.by_variant_id[String(c.car_variant_id)];
                              const yes = v === true;
                              const no = v === false;
                              return (
                                <td key={c.car_variant_id} className="p-2.5 min-h-[2.75rem] align-middle text-center">
                                  {yes ? (
                                    <span className="inline-flex rounded-full bg-[#2563eb]/15 text-[#2563eb] px-2 py-1 text-xs font-semibold leading-none">
                                      {t.yes}
                                    </span>
                                  ) : no ? (
                                    <span className="inline-flex rounded-full bg-gray-100 text-gray-600 px-2 py-1 text-xs leading-none">
                                      {t.no}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                      {equipment.truthy_counts_by_variant_id && (
                        <tr className="bg-[#2563eb]/10 font-semibold border-t-2 border-[#2563eb]/30">
                          <td className="p-2.5 sticky left-0 bg-[#eff6ff] z-10 shadow-[2px_0_6px_-2px_rgba(45,58,42,0.06)]" colSpan={2}>
                            {t.truthyCount}
                          </td>
                          {result.cars.map((c) => (
                            <td key={c.car_variant_id} className="p-2.5 text-center tabular-nums text-[#0d1117] align-middle">
                              {equipment.truthy_counts_by_variant_id?.[String(c.car_variant_id)] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
