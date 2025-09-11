"use client";
import { useState } from "react";
import CharacterPreview from "@/components/character/CharacterPreview";

type Gender = "male" | "female" | "nonbinary";

interface CustomizationPanelProps {
  initialGender?: Gender;
  initialPalette?: string;
  initialSkinTone?: string;
  onSave?: (data: { gender: Gender; palette: string; skinTone: string }) => void;
  onClose?: () => void;
}

const CRYPTO_PALETTES: Record<string, string[]> = {
  "DeFi Blue": ["#00D4FF", "#0099CC", "#006699"],
  "Meme Green": ["#00FF88", "#00CC66", "#009944"],
  "Bull Gold": ["#FFD700", "#FFAA00", "#CC8800"],
  "Bear Red": ["#FF4444", "#CC2222", "#990000"],
  "Phantom Purple": ["#AB9FF2", "#8A7FE8", "#6959DE"],
};

const SKIN_TONES = [
  "#F1D3C2",
  "#E2B7A2",
  "#C89478",
  "#A96F4E",
  "#7D4E34",
  "#5C3A2A",
  "#3E2921",
  "#2A1D18",
];

export default function CustomizationPanel({
  initialGender = "male",
  initialPalette = "DeFi Blue",
  initialSkinTone = SKIN_TONES[2],
  onSave,
  onClose,
}: CustomizationPanelProps) {
  const [gender, setGender] = useState<Gender>(initialGender);
  const [paletteName, setPaletteName] = useState<string>(initialPalette);
  const [skinTone, setSkinTone] = useState<string>(initialSkinTone);

  const primaryColor = CRYPTO_PALETTES[paletteName]?.[0] || "#00D4FF";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-4xl mx-4 rounded-lg bg-slate-900 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold">Customize Character</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Preview */}
          <div className="p-6 flex items-center justify-center">
            <div>
              <CharacterPreview gender={gender} primaryColor={primaryColor} skinTone={skinTone} />
              <div className="mt-4 text-sm opacity-80 text-center">
                <div>{gender.toUpperCase()} • {paletteName} • Skin {SKIN_TONES.indexOf(skinTone) + 1}</div>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="p-6 space-y-6 border-t md:border-t-0 md:border-l border-slate-700">
            {/* Gender */}
            <div>
              <div className="text-sm font-semibold mb-2">Gender</div>
              <div className="grid grid-cols-3 gap-2">
                {(["male", "female", "nonbinary"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-3 py-2 rounded border text-sm ${
                      gender === g
                        ? "border-pink-500 bg-pink-500/20"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                    aria-pressed={gender === g}
                  >
                    {g === "male" ? "Male" : g === "female" ? "Female" : "Non-binary"}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette */}
            <div>
              <div className="text-sm font-semibold mb-2">Color Palette</div>
              <div className="space-y-2">
                {Object.entries(CRYPTO_PALETTES).map(([name, colors]) => (
                  <button
                    key={name}
                    onClick={() => setPaletteName(name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm ${
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
                    onClick={() => setSkinTone(c)}
                    className={`h-8 rounded border ${
                      skinTone === c ? "border-green-500" : "border-slate-600 hover:border-slate-500"
                    }`}
                    title={c}
                    aria-label={`Skin tone ${c}`}
                  >
                    <span className="block w-full h-full rounded" style={{ backgroundColor: c }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Simple randomize for MVP
                const genders: Gender[] = ["male", "female", "nonbinary"];
                const names = Object.keys(CRYPTO_PALETTES);
                const randG = genders[Math.floor(Math.random() * genders.length)];
                const randP = names[Math.floor(Math.random() * names.length)];
                const randS = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
                setGender(randG);
                setPaletteName(randP);
                setSkinTone(randS);
              }}
              className="px-3 py-2 rounded border border-slate-600 hover:border-slate-500 text-sm"
            >
              Randomize
            </button>
            <button
              onClick={() => {
                setGender(initialGender);
                setPaletteName(initialPalette);
                setSkinTone(initialSkinTone);
              }}
              className="px-3 py-2 rounded border border-slate-600 hover:border-slate-500 text-sm"
            >
              Reset
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600">
              Cancel
            </button>
            <button
              onClick={() => onSave?.({ gender, palette: paletteName, skinTone })}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


