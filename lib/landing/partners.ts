/**
 * Organizations revealed by the lighthouse beam on the landing page.
 *
 * `x` / `y` are viewport percentages (0–100). Keep them away from the
 * centre of the screen (where the lighthouse + wordmark live) and from the
 * very top edge (header).
 *
 * TODO: replace with the actual partners Manara works with.
 */
export type LandingPartner = {
  name: string;
  /** Short descriptor shown under the name, e.g. city or type. */
  meta?: string;
  x: number;
  y: number;
};

export const LANDING_PARTNERS: LandingPartner[] = [
  { name: "Mada Masr", meta: "cairo", x: 14, y: 18 },
  { name: "Daraj", meta: "beirut", x: 36, y: 12 },
  { name: "Megaphone", meta: "beirut", x: 63, y: 14 },
  { name: "7iber", meta: "amman", x: 85, y: 20 },
  { name: "Inkyfada", meta: "tunis", x: 90, y: 40 },
  { name: "Raseef22", meta: "beirut", x: 80, y: 62 },
  { name: "SMEX", meta: "digital rights", x: 88, y: 84 },
  { name: "Legal Agenda", meta: "beirut", x: 64, y: 90 },
  { name: "Kohl Journal", meta: "feminist research", x: 34, y: 90 },
  { name: "Al-Manshour", meta: "independent press", x: 11, y: 84 },
  { name: "Beirut Today", meta: "beirut", x: 18, y: 62 },
  { name: "Siraj", meta: "investigations", x: 9, y: 40 },
  { name: "Enab Baladi", meta: "syria", x: 24, y: 32 },
  { name: "Lebanese Center for Human Rights", meta: "ngo", x: 74, y: 32 },
];
