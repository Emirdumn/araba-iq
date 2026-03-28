"use client";

import type { ExcludedCandidate } from "@/types/araba-iq-recommendation";
import type { ArabaIqRecommendationMessages } from "@/lib/araba-iq-messages";

interface Props {
  excluded: ExcludedCandidate[];
  t: ArabaIqRecommendationMessages;
}

export function RecommendationDebugPanel({ excluded, t }: Props) {
  if (excluded.length === 0) return null;

  return (
    <section className="rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/[0.04] p-4">
      <h3 className="text-sm font-bold text-violet-300 mb-2">{t.debugExcludedTitle}</h3>
      <ul className="space-y-2 text-sm">
        {excluded.map((e) => (
          <li key={e.car_id} className="rounded-lg bg-white/[0.03] p-2 border border-violet-500/15">
            <span className="font-mono text-violet-400">#{e.car_id}</span>{" "}
            <span className="text-[#E5E7EB]">{e.car_name}</span>
            <p className="text-xs text-violet-300/70 mt-1">{e.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
