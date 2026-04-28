"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PALETTE_PRESETS,
  PALETTE_STORAGE_KEY,
  type PaletteVars,
  type StoredPalette,
  getPresetById,
  randomAccentLightTheme,
  varsToCssBlock,
} from "@/lib/palette-presets";
import { cn } from "@/lib/utils";

const VAR_KEYS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--hero-highlight",
  "--surface-inverse",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
] as const;

function applyVars(vars: PaletteVars) {
  const root = document.documentElement;
  for (const key of VAR_KEYS) {
    const v = vars[key];
    if (v !== undefined) root.style.setProperty(key, v);
  }
}

function clearAppliedVars() {
  const root = document.documentElement;
  for (const key of VAR_KEYS) {
    root.style.removeProperty(key);
  }
}

function readStored(): StoredPalette | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPalette;
  } catch {
    return null;
  }
}

function writeStored(data: StoredPalette | null) {
  if (typeof window === "undefined") return;
  if (data === null) localStorage.removeItem(PALETTE_STORAGE_KEY);
  else localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(data));
}

export function PaletteLab() {
  const initialStored = readStored();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(() => {
    if (!initialStored) return "stylesheet";
    if (initialStored.mode === "preset") return initialStored.id;
    return "custom";
  });
  const [customLabel, setCustomLabel] = useState<string | null>(() =>
    initialStored?.mode === "custom" ? "Saved" : null,
  );
  const [copied, setCopied] = useState(false);

  const applyPreset = useCallback((id: string) => {
    const preset = getPresetById(id);
    if (!preset) return;
    applyVars(preset.light);
    setActiveId(id);
    setCustomLabel(null);
    writeStored({ mode: "preset", id });
  }, []);

  const applyRandom = useCallback(() => {
    const vars = randomAccentLightTheme();
    applyVars(vars);
    setActiveId("custom");
    setCustomLabel("Random");
    writeStored({ mode: "custom", vars });
  }, []);

  const resetToStylesheet = useCallback(() => {
    clearAppliedVars();
    setActiveId("stylesheet");
    setCustomLabel(null);
    writeStored(null);
  }, []);

  const copyCss = useCallback(async () => {
    let vars: PaletteVars;
    if (activeId === "stylesheet") return;
    if (activeId === "custom") {
      const s = readStored();
      if (s?.mode === "custom") vars = s.vars;
      else return;
    } else {
      const p = getPresetById(activeId);
      if (!p) return;
      vars = p.light;
    }
    const text = varsToCssBlock(vars);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [activeId]);

  useEffect(() => {
    const stored = readStored();
    if (!stored) return;
    if (stored.mode === "preset") {
      const preset = getPresetById(stored.id);
      if (preset) {
        applyVars(preset.light);
      }
    } else {
      applyVars(stored.vars);
    }
  }, []);

  const status = useMemo(() => {
    if (activeId === "stylesheet") return "Using globals.css defaults";
    if (activeId === "custom") return customLabel ?? "Custom";
    return getPresetById(activeId)?.label ?? activeId;
  }, [activeId, customLabel]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[100] flex max-w-[min(100vw-2rem,20rem)] flex-col gap-2 font-mono text-xs",
        "md:bottom-6 md:right-6",
      )}
    >
      {open ? (
        <div
          id="palette-lab-panel"
          className="flex flex-col gap-3 border-4 border-foreground bg-background p-3 shadow-[4px_4px_0_0] shadow-foreground/25"
        >
          <div className="flex items-start justify-between gap-2 border-b-2 border-foreground pb-2">
            <div>
              <p className="font-heading text-sm font-extrabold uppercase tracking-tight">
                Palette lab
              </p>
              <p className="mt-1 text-[0.65rem] leading-snug text-muted-foreground">
                Live theme on <code className="text-foreground">:root</code>.
                Copy CSS when you like a combo, then paste into{" "}
                <code className="text-foreground">globals.css</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 border-2 border-foreground bg-muted px-2 py-1 font-mono-label text-[0.65rem] font-bold uppercase text-foreground hover:bg-foreground hover:text-background"
              aria-label="Close palette lab"
            >
              ×
            </button>
          </div>

          <p className="text-[0.65rem] text-muted-foreground">
            Active: <span className="font-semibold text-foreground">{status}</span>
          </p>

          <div className="flex flex-wrap gap-1.5">
            {PALETTE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.description}
                onClick={() => applyPreset(p.id)}
                className={cn(
                  "border-2 border-foreground px-2 py-1.5 font-mono-label text-[0.65rem] font-bold uppercase tracking-wide",
                  activeId === p.id && activeId !== "custom"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background hover:bg-muted",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={applyRandom}
              className="border-2 border-foreground bg-muted px-2 py-1.5 font-mono-label text-[0.65rem] font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"
            >
              Random accent
            </button>
            <button
              type="button"
              onClick={resetToStylesheet}
              className="border-2 border-dashed border-foreground px-2 py-1.5 font-mono-label text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground hover:border-solid hover:text-foreground"
            >
              Reset CSS
            </button>
            <button
              type="button"
              onClick={() => void copyCss()}
              disabled={activeId === "stylesheet"}
              className="border-2 border-foreground px-2 py-1.5 font-mono-label text-[0.65rem] font-bold uppercase tracking-wide disabled:opacity-40"
            >
              {copied ? "Copied" : "Copy :root"}
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="self-end border-4 border-foreground bg-accent px-3 py-2 font-mono-label text-[0.7rem] font-extrabold uppercase tracking-wider text-accent-foreground shadow-[3px_3px_0_0] shadow-foreground/30 hover:opacity-90"
        aria-expanded={open}
        aria-controls="palette-lab-panel"
      >
        {open ? "Close" : "Palette"}
      </button>
    </div>
  );
}
