"use client";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function PrioritySlider({ label, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#0d1117]/80">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 accent-[#2563eb] rounded-lg appearance-none bg-[#e5e7eb] disabled:opacity-50"
      />
    </div>
  );
}
