"use client";
import { useEffect, useRef } from "react";
import type { Gender } from "@/components/character/constants";

interface CharacterPreviewProps {
  gender: Gender;
  primaryColor: string; // From selected crypto palette
  skinTone: string;     // Hex color for skin
  scale?: number;       // Canvas upscaling factor (default 8)
}

// Simple placeholder pixel figure (32x32) to establish the pixel aesthetic.
// This is intentionally minimal; sprite layering will be added later.
export default function CharacterPreview({
  gender,
  primaryColor,
  skinTone,
  scale = 8,
}: CharacterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure crisp pixels
    (ctx as any).imageSmoothingEnabled = false;

    // Logical size 32x32, then scaled via CSS
    canvas.width = 32;
    canvas.height = 32;

    // Clear
    ctx.clearRect(0, 0, 32, 32);

    // Background transparent

    // Draw a simple chibi avatar based on gender for silhouette variety
    // Head
    ctx.fillStyle = skinTone;
    ctx.fillRect(12, 4, 8, 8);

    // Body
    ctx.fillStyle = primaryColor;
    ctx.fillRect(11, 12, 10, 8);

    // Legs
    ctx.fillStyle = "#333";
    ctx.fillRect(11, 20, 4, 8);
    ctx.fillRect(17, 20, 4, 8);

    // Arms (slight gender-based offset)
    ctx.fillStyle = skinTone;
    if (gender === "female") {
      ctx.fillRect(9, 12, 2, 6);
      ctx.fillRect(21, 12, 2, 6);
    } else if (gender === "nonbinary") {
      ctx.fillRect(9, 12, 2, 7);
      ctx.fillRect(21, 12, 2, 7);
    } else {
      ctx.fillRect(9, 12, 2, 8);
      ctx.fillRect(21, 12, 2, 8);
    }

    // Simple hair band as accent using primaryColor shade
    ctx.fillStyle = "#000";
    ctx.fillRect(12, 6, 8, 1);
  }, [gender, primaryColor, skinTone]);

  const cssSize = 32 * (scale || 8);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{
          width: cssSize,
          height: cssSize,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}


