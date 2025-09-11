"use client";
import { useState } from "react";
import CharacterPreview from "@/components/character/CharacterPreview";
import AvatarPreview from "@/components/character/AvatarPreview";
import GenderSelector from "@/components/character/GenderSelector";
import PalettePicker from "@/components/character/PalettePicker";
import { CRYPTO_PALETTES, SKIN_TONES } from "@/components/character/constants";

type Gender = "male" | "female" | "nonbinary";

interface CustomizationPanelProps {
  initialGender?: Gender;
  initialPalette?: string;
  initialSkinTone?: string;
  initialFlags?: { mustache?: boolean; lipstick?: boolean; glasses?: boolean };
  onSave?: (data: { gender: Gender; palette: string; skinTone: string }) => void;
  onClose?: () => void;
}

// Palettes and tones now imported from constants

export default function CustomizationPanel({
  initialGender = "male",
  initialPalette = "DeFi Blue",
  initialSkinTone = SKIN_TONES[2],
  initialFlags,
  onSave,
  onClose,
}: CustomizationPanelProps) {
  const [gender, setGender] = useState<Gender>(initialGender);
  const [paletteName, setPaletteName] = useState<string>(initialPalette);
  const [skinTone, setSkinTone] = useState<string>(initialSkinTone);
  const [flags, setFlags] = useState({
    mustache: initialFlags?.mustache ?? (initialGender === "nonbinary" ? true : false),
    lipstick: initialFlags?.lipstick ?? (initialGender === "nonbinary" ? true : false),
    glasses: initialFlags?.glasses ?? false,
  });

  const primaryColor = CRYPTO_PALETTES[paletteName]?.[0] || "#00D4FF";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-4xl mx-4 rounded-lg bg-slate-900 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold">Customize Character</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Previews */}
          <div className="p-6 flex items-center justify-center">
            <div className="space-y-6">
              <AvatarPreview gender={gender} primaryColor={primaryColor} skinTone={skinTone} flags={flags} />
              <CharacterPreview gender={gender} primaryColor={primaryColor} skinTone={skinTone} />
              <div className="text-sm opacity-80 text-center">
                <div>{gender.toUpperCase()} • {paletteName} • Skin {SKIN_TONES.indexOf(skinTone) + 1}</div>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="p-6 space-y-6 border-t md:border-t-0 md:border-l border-slate-700">
            {/* Gender */}
            <div>
              <div className="text-sm font-semibold mb-2">Gender</div>
              <GenderSelector value={gender} onChange={setGender} />
            </div>

            {/* Palettes & Skin Tones */}
            <PalettePicker
              paletteName={paletteName}
              onPaletteChange={setPaletteName}
              skinTone={skinTone}
              onSkinToneChange={setSkinTone}
            />

            {/* Face Flags */}
            <div>
              <div className="text-sm font-semibold mb-2">Face Features</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFlags((f) => ({ ...f, mustache: !f.mustache }))}
                  aria-pressed={flags.mustache}
                  className={`px-3 py-2 rounded border text-sm ${flags.mustache ? "border-green-500 bg-green-500/20" : "border-slate-600 hover:border-slate-500"}`}
                >
                  Mustache
                </button>
                <button
                  onClick={() => setFlags((f) => ({ ...f, lipstick: !f.lipstick }))}
                  aria-pressed={flags.lipstick}
                  className={`px-3 py-2 rounded border text-sm ${flags.lipstick ? "border-pink-500 bg-pink-500/20" : "border-slate-600 hover:border-slate-500"}`}
                >
                  Lipstick
                </button>
                <button
                  onClick={() => setFlags((f) => ({ ...f, glasses: !f.glasses }))}
                  aria-pressed={flags.glasses}
                  className={`px-3 py-2 rounded border text-sm ${flags.glasses ? "border-cyan-500 bg-cyan-500/20" : "border-slate-600 hover:border-slate-500"}`}
                >
                  Glasses
                </button>
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


