"use client";
import { CRYPTO_PALETTES, SKIN_TONES } from "@/components/character/constants";

interface PalettePickerProps {
  paletteName: string;
  onPaletteChange: (name: string) => void;
  skinTone: string;
  onSkinToneChange: (hex: string) => void;
}

export default function PalettePicker({ paletteName, onPaletteChange, skinTone, onSkinToneChange }: PalettePickerProps) {
  return (
    <div className="space-y-6">
      {/* Palettes */}
      <div>
        <div className="text-sm font-semibold mb-2">Color Palette</div>
        <div className="space-y-2">
          {Object.entries(CRYPTO_PALETTES).map(([name, colors]) => (
            <button
              key={name}
              onClick={() => onPaletteChange(name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                paletteName === name
                  ? "border-indigo-500 bg-indigo-500/20"
                  : "border-slate-600 hover:border-slate-500"
              }`}
              aria-pressed={paletteName === name}
            >
              <span>{name}</span>
              <span className="flex gap-1">
                {colors.map((c) => (
                  <span key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Skin tones */}
      <div>
        <div className="text-sm font-semibold mb-2">Skin Tone</div>
        <div className="grid grid-cols-8 gap-2">
          {SKIN_TONES.map((c) => (
            <button
              key={c}
              onClick={() => onSkinToneChange(c)}
              className={`h-8 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                skinTone === c ? "border-green-500" : "border-slate-600 hover:border-slate-500"
              }`}
              title={c}
              aria-label={`Skin tone ${c}`}
              aria-pressed={skinTone === c}
            >
              <span className="block w-full h-full rounded" style={{ backgroundColor: c }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


