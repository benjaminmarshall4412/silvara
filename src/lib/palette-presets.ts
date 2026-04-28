/** CSS custom properties applied to `document.documentElement` (light theme). */

export type PaletteVars = Record<string, string>;

export type PalettePreset = {
  id: string;
  label: string;
  description?: string;
  light: PaletteVars;
};

const paper = {
  "--background": "oklch(0.965 0.012 95)",
  "--card": "oklch(0.99 0.008 95)",
  "--popover": "oklch(0.99 0.008 95)",
  "--secondary": "oklch(0.91 0.02 95)",
  "--muted": "oklch(0.91 0.018 95)",
  "--sidebar": "oklch(0.95 0.015 95)",
  "--sidebar-accent": "oklch(0.91 0.018 95)",
} satisfies PaletteVars;

function ink(hue: number, chroma = 0.04, L = 0.22): string {
  return `oklch(${L} ${chroma} ${hue})`;
}

function chartsForAccent(
  accent: string,
  hue: number,
): Pick<
  PaletteVars,
  "--chart-1" | "--chart-2" | "--chart-3" | "--chart-4" | "--chart-5"
> {
  return {
    "--chart-1": accent,
    "--chart-2": `oklch(0.45 0.09 ${hue})`,
    "--chart-3": `oklch(0.38 0.07 ${hue})`,
    "--chart-4": `oklch(0.3 0.055 ${hue})`,
    "--chart-5": `oklch(0.24 0.04 ${hue})`,
  };
}

/** Dark panels (rotation, scenarios, footer) — same hue family as accent, not ink-only. */
function surfaceInverse(accentHue: number): string {
  return `oklch(0.175 0.052 ${accentHue})`;
}

function lightBase(
  fgHue: number,
  accent: string,
  accentHue: number,
  mutedFg = "oklch(0.4 0.035 265)",
): PaletteVars {
  const fg = ink(fgHue, 0.045, 0.22);
  return {
    ...paper,
    "--surface-inverse": surfaceInverse(accentHue),
    "--foreground": fg,
    "--card-foreground": fg,
    "--popover-foreground": fg,
    "--primary": fg,
    "--primary-foreground": "oklch(0.98 0.01 95)",
    "--secondary-foreground": fg,
    "--muted-foreground": mutedFg,
    "--accent": accent,
    "--accent-foreground": "oklch(0.99 0.01 95)",
    "--destructive": "oklch(0.5 0.2 25)",
    "--border": fg,
    "--input": fg,
    "--ring": accent,
    "--sidebar-foreground": fg,
    "--sidebar-primary": fg,
    "--sidebar-primary-foreground": "oklch(0.98 0.01 95)",
    "--sidebar-accent-foreground": fg,
    "--sidebar-border": fg,
    "--sidebar-ring": accent,
    "--hero-highlight": accent,
    ...chartsForAccent(accent, accentHue),
  };
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Black ink, cream paper",
    light: {
      ...paper,
      "--foreground": "oklch(0.14 0 0)",
      "--card-foreground": "oklch(0.14 0 0)",
      "--popover-foreground": "oklch(0.14 0 0)",
      "--primary": "oklch(0.14 0 0)",
      "--primary-foreground": "oklch(0.99 0 0)",
      "--secondary-foreground": "oklch(0.14 0 0)",
      "--muted-foreground": "oklch(0.46 0 0)",
      "--accent": "oklch(0.14 0 0)",
      "--accent-foreground": "oklch(0.99 0 0)",
      "--destructive": "oklch(0.48 0.16 25)",
      "--border": "oklch(0.14 0 0)",
      "--input": "oklch(0.14 0 0)",
      "--ring": "oklch(0.14 0 0)",
      "--chart-1": "oklch(0.28 0 0)",
      "--chart-2": "oklch(0.4 0 0)",
      "--chart-3": "oklch(0.52 0 0)",
      "--chart-4": "oklch(0.64 0 0)",
      "--chart-5": "oklch(0.76 0 0)",
      "--sidebar-foreground": "oklch(0.14 0 0)",
      "--sidebar-primary": "oklch(0.14 0 0)",
      "--sidebar-primary-foreground": "oklch(0.99 0 0)",
      "--sidebar-accent-foreground": "oklch(0.14 0 0)",
      "--sidebar-border": "oklch(0.14 0 0)",
      "--sidebar-ring": "oklch(0.14 0 0)",
      "--hero-highlight": "oklch(0.98 0.01 95)",
      "--surface-inverse": "oklch(0.14 0 0)",
    },
  },
  {
    id: "coral-navy",
    label: "Coral + navy",
    description: "Original warm direction",
    light: lightBase(265, "oklch(0.58 0.19 45)", 45),
  },
  {
    id: "teal",
    label: "Teal",
    description: "Cool silver-tech",
    light: lightBase(
      250,
      "oklch(0.52 0.13 195)",
      195,
      "oklch(0.42 0.04 200)",
    ),
  },
  {
    id: "volt",
    label: "Volt",
    description: "Lime punch",
    light: lightBase(80, "oklch(0.72 0.2 145)", 145, "oklch(0.38 0.06 145)"),
  },
  {
    id: "violet",
    label: "Violet",
    description: "Electric purple",
    light: lightBase(265, "oklch(0.55 0.17 295)", 295),
  },
  {
    id: "rust",
    label: "Rust",
    description: "Burnt clay",
    light: lightBase(40, "oklch(0.52 0.14 35)", 35),
  },
  {
    id: "slate-rose",
    label: "Slate rose",
    description: "Dusty ink + rose CTA",
    light: lightBase(265, "oklch(0.55 0.12 15)", 15),
  },
];

export const PALETTE_STORAGE_KEY = "silversocks-palette-v1";

export type StoredPalette =
  | { mode: "preset"; id: string }
  | { mode: "custom"; vars: PaletteVars };

/** Random saturated accent; navy ink (hue 265) stays readable on paper. */
export function randomAccentLightTheme(): PaletteVars {
  const hue = Math.round(Math.random() * 360);
  const chroma = 0.12 + Math.random() * 0.09;
  const L = 0.52 + Math.random() * 0.12;
  const accent = `oklch(${L.toFixed(2)} ${chroma.toFixed(2)} ${hue})`;
  const base = lightBase(265, accent, hue, `oklch(0.42 0.04 ${hue})`);
  const hero =
    L >= 0.48 ? accent : "oklch(0.98 0.01 95)";
  return { ...base, "--hero-highlight": hero };
}

export function getPresetById(id: string): PalettePreset | undefined {
  return PALETTE_PRESETS.find((p) => p.id === id);
}

export function varsToCssBlock(vars: PaletteVars): string {
  const lines = Object.entries(vars)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${k}: ${v};`);
  return `:root {\n${lines.join("\n")}\n}`;
}
