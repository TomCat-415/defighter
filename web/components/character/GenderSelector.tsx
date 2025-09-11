"use client";
import { Gender } from "@/components/character/constants";

interface GenderSelectorProps {
  value: Gender;
  onChange: (g: Gender) => void;
}

export default function GenderSelector({ value, onChange }: GenderSelectorProps) {
  const items: { key: Gender; label: string }[] = [
    { key: "male", label: "Male" },
    { key: "female", label: "Female" },
    { key: "nonbinary", label: "Non-binary" },
  ];

  return (
    <div role="tablist" aria-label="Gender" className="grid grid-cols-3 gap-2">
      {items.map((it, idx) => (
        <button
          key={it.key}
          role="tab"
          aria-selected={value === it.key}
          tabIndex={value === it.key ? 0 : -1}
          onClick={() => onChange(it.key)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              const next = items[(idx + 1) % items.length].key;
              onChange(next);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              const prev = items[(idx - 1 + items.length) % items.length].key;
              onChange(prev);
            }
          }}
          className={`px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
            value === it.key
              ? "border-pink-500 bg-pink-500/20"
              : "border-slate-600 hover:border-slate-500"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}


