"use client";

import {
  RECOMMENDATION_PRESETS,
  applyPreset,
  summarizePresetDiff,
  presetCardTitle,
  presetCardDescription,
  type PresetApplyMeta,
  type RecommendationPreset,
} from "@/lib/recommendation-presets";
import type { RecommendationFormState } from "@/types/araba-iq-recommendation";
import type { ArabaIqRecommendationMessages } from "@/lib/araba-iq-messages";

interface Props {
  current: RecommendationFormState;
  t: ArabaIqRecommendationMessages;
  onApply: (next: RecommendationFormState, meta: PresetApplyMeta) => void;
  disabled?: boolean;
}

export function RecommendationPresetBar({ current, t, onApply, disabled }: Props) {
  const apply = (preset: RecommendationPreset) => {
    const next = applyPreset(current, preset);
    const diff = summarizePresetDiff(current, next, preset, t);
    onApply(next, { preset, ...diff });
  };

  return (
    <div className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-3">{t.presetsTitle}</p>
      <div className="flex flex-wrap gap-2">
        {RECOMMENDATION_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            title={presetCardDescription(t, p.id)}
            onClick={() => apply(p)}
            className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm font-medium text-[#E5E7EB] border border-white/[0.08] hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-200 disabled:opacity-50"
          >
            {presetCardTitle(t, p.id)}
          </button>
        ))}
      </div>
    </div>
  );
}
