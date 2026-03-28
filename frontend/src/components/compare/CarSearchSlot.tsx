"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { fetchGarageCars, type GarageCar } from "@/lib/araba-iq-client";

interface Props {
  value: GarageCar | null;
  onSelect: (car: GarageCar) => void;
  onClear: () => void;
  placeholder?: string;
  slotIndex: number;
}

function formatPrice(price: number | null): string {
  if (price == null) return "";
  return new Intl.NumberFormat("tr-TR").format(price) + " ₺";
}

export function CarSearchSlot({ value, onSelect, onClear, placeholder, slotIndex }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetchGarageCars({ search: q, limit: 8, offset: 0 });
      setResults(res.items);
      setOpen(res.items.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (car: GarageCar) => {
    onSelect(car);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-primary-500/30 bg-primary-500/[0.06] px-4 py-3.5">
        <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center text-primary-400 text-sm font-bold shrink-0">
          {slotIndex + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-white truncate">
            {value.brand} {value.model}
          </p>
          <p className="text-xs text-[#9CA3AF] truncate">
            {value.year}
            {value.fuel_type && ` · ${value.fuel_type}`}
            {value.price != null && ` · ${formatPrice(value.price)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-lg text-[#6B7280] hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <span className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-[#6B7280]">
            {slotIndex + 1}
          </span>
        </div>
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary-400" />
        ) : (
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder || "Araç ara..."}
          className="w-full rounded-xl border-2 border-white/[0.06] bg-white/[0.03] pl-12 pr-10 py-3.5 text-[15px] text-white placeholder:text-[#475569] focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/15 focus:outline-none transition-all hover:border-white/[0.12]"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1.5 rounded-xl bg-[#111827] border border-white/[0.08] shadow-2xl shadow-black/50 max-h-[320px] overflow-y-auto">
          {results.map((car) => (
            <button
              key={car.id}
              type="button"
              onClick={() => handleSelect(car)}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs font-bold text-[#9CA3AF] shrink-0">
                {car.brand.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {car.brand} {car.model}
                  {car.variant && <span className="text-[#6B7280] font-normal"> {car.variant}</span>}
                </p>
                <p className="text-xs text-[#6B7280] truncate">
                  {car.year}
                  {car.fuel_type && ` · ${car.fuel_type}`}
                  {car.transmission && ` · ${car.transmission}`}
                  {car.horsepower && ` · ${car.horsepower} HP`}
                </p>
              </div>
              {car.price != null && (
                <span className="text-sm font-semibold text-white tabular-nums whitespace-nowrap shrink-0">
                  {formatPrice(car.price)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
