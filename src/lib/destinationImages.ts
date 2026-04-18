// Destination hero images (Unsplash). Shared between the itinerary page,
// the history page, and shared-trip OG metadata so link previews are on-brand.

export const DEST_IMAGES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5",
  lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200",
  marrakech: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017",
  "buenos aires": "https://images.unsplash.com/photo-1612294037637-ec328d0e075e",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c",
  prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
  "rio de janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047",
  vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af",
};

export const FALLBACK_IMG_ID = "photo-1488646953014-85cb44e25828";

/** Normalize a destination string and look up the Unsplash hero image id. */
export function heroImageFor(
  destination: string,
  { width = 1200, height = 630, q = 80 }: { width?: number; height?: number; q?: number } = {}
): string {
  const key = destination.trim().toLowerCase();
  // Try exact match, then first-city match for multi-city strings like "Paris → Rome".
  const firstStop = key.split(/→|->|,/)[0]?.trim() ?? key;
  const base = DEST_IMAGES[key] ?? DEST_IMAGES[firstStop] ??
    `https://images.unsplash.com/${FALLBACK_IMG_ID}`;
  return `${base}?w=${width}&h=${height}&fit=crop&q=${q}`;
}
