"use client";
import { useEffect, useRef } from "react";
import type { Gender } from "@/components/character/constants";

interface AvatarPreviewProps {
  gender: Gender;
  primaryColor: string; // palette primary; used for border/collar
  skinTone: string;
  flags?: {
    mustache?: boolean;
    lipstick?: boolean;
    glasses?: boolean;
  };
  scale?: number; // default 6 for 64x64 -> 384px
}

// Head/shoulders avatar preview focused on facial features.
export default function AvatarPreview({
  gender,
  primaryColor,
  skinTone,
  flags,
  scale = 6,
}: AvatarPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    (ctx as any).imageSmoothingEnabled = false;

    // Logical 64x64
    canvas.width = 64;
    canvas.height = 64;

    ctx.clearRect(0, 0, 64, 64);

    // Border/frame uses primaryColor
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 64, 64);
    // Inner background derived from primaryColor darkness
    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(2, 2, 60, 60);

    // Head (centered)
    ctx.fillStyle = skinTone;
    ctx.fillRect(20, 12, 24, 22);

    // Neck
    ctx.fillRect(28, 34, 8, 4);

    // Torso (collar/shirt) uses primaryColor as well
    ctx.fillStyle = primaryColor;
    ctx.fillRect(18, 38, 28, 10);

    // Hair silhouette differs slightly by gender (simple)
    ctx.fillStyle = "#111";
    if (gender === "female") {
      ctx.fillRect(18, 10, 28, 6);
      ctx.fillRect(16, 16, 4, 16);
      ctx.fillRect(44, 16, 4, 16);
    } else if (gender === "nonbinary") {
      ctx.fillRect(20, 10, 24, 6);
      ctx.fillRect(18, 16, 2, 12);
      ctx.fillRect(44, 16, 2, 12);
    } else {
      ctx.fillRect(22, 10, 20, 6);
    }

    // Eyes
    ctx.fillStyle = "#0b1f2a";
    ctx.fillRect(26, 22, 4, 3);
    ctx.fillRect(36, 22, 4, 3);

    // Glasses overlay
    if (flags?.glasses) {
      ctx.fillStyle = "#0a3a3f";
      ctx.fillRect(24, 20, 8, 6);
      ctx.fillRect(36, 20, 8, 6);
      ctx.fillRect(32, 22, 4, 2);
    }

    // Mouth (default)
    ctx.fillStyle = "#2a1e18";
    ctx.fillRect(31, 28, 2, 1);
    ctx.fillRect(30, 29, 4, 1);

    // Mustache
    if (flags?.mustache) {
      ctx.fillStyle = "#1b1b1b";
      ctx.fillRect(28, 30, 8, 2);
    }

    // Lipstick
    if (flags?.lipstick) {
      ctx.fillStyle = "#b12a5b";
      ctx.fillRect(30, 31, 4, 1);
    }
  }, [gender, primaryColor, skinTone, flags?.glasses, flags?.mustache, flags?.lipstick]);

  const cssSize = 64 * (scale || 6);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: cssSize, height: cssSize, imageRendering: "pixelated" }}
      />
    </div>
  );
}


