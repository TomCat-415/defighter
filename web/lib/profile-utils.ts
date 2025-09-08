import { PublicKey } from "@solana/web3.js";

// Class display names
export const CLASS_NAMES = {
  shitposter: "Shitposter",
  builder: "Builder", 
  vc: "VC Chad"
};

// Class-specific power display
export function getClassSpecificPowerDisplay(
  fighterClass: string,
  powerLevel: number
): { label: string; value: string } {
  switch (fighterClass.toLowerCase()) {
    case "shitposter":
      return {
        label: "Degen Score",
        value: `${(powerLevel / 100).toFixed(1)}/10`
      };
    case "builder":
      return {
        label: "Deploy Power", 
        value: `${Math.round(powerLevel / 10)}%`
      };
    case "vc":
      return {
        label: "Chad Energy",
        value: `${(powerLevel / 100).toFixed(1)}/10`
      };
    default:
      return {
        label: "Power Level",
        value: `${powerLevel}`
      };
  }
}

// Calculate upgrade cost (client-side preview)
export function calculateUpgradeCost(
  currentLevel: number,
  upgradeC0: number,
  upgradePBps: number
): number {
  const nextLevel = currentLevel + 1;
  if (upgradePBps === 10000) {
    return upgradeC0 * nextLevel;
  } else {
    // Simple approximation
    return Math.floor(upgradeC0 * Math.pow(1 + upgradePBps / 10000, currentLevel));
  }
}

// Calculate total power level from abilities
export function calculatePowerLevel(
  abilities: number[],
  baseConfig?: any
): number {
  if (!baseConfig) return 0;
  
  // Simple calculation based on levels - can be made more sophisticated later
  const totalLevels = abilities.reduce((sum, level) => sum + level, 0);
  return Math.floor(baseConfig.base + (baseConfig.linear_a || 2) * totalLevels);
}

// Format address for display
export function formatAddress(address: PublicKey | string, length = 4): string {
  const addr = typeof address === 'string' ? address : address.toBase58();
  return `${addr.slice(0, length)}...${addr.slice(-length)}`;
}

// Copy to clipboard with toast feedback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}