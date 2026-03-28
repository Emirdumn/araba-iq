"use client";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function PrioritySlider({ label, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#9CA3AF]">{label}</span>
        <span className="font-mono tabular-nums text-primary-400">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none bg-white/[0.08] accent-primary-500 disabled:opacity-50 cursor-pointer"
      />
    </div>
  );
}
