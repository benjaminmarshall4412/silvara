export const SOCK_COLORS = ["black", "white"] as const;
export type SockColor = (typeof SOCK_COLORS)[number];

export const DEFAULT_SOCK_COLOR: SockColor = "black";

export const SOCK_COLOR_LABEL: Record<SockColor, string> = {
  black: "Black marl",
  white: "White marl",
};

export function isSockColor(value: unknown): value is SockColor {
  return (
    typeof value === "string" &&
    (SOCK_COLORS as readonly string[]).includes(value)
  );
}
