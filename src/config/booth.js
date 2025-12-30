// Keep aligned with frontend TABLES (do not change frontend)
export const TABLES = [
  { id: 17, category: "craft", x: 15, y: 18, width: 5, height: 8, price: 350 },
  { id: 16, category: "craft", x: 22, y: 18, width: 5, height: 8, price: 200 },
  { id: 15, category: "craft", x: 29, y: 18, width: 5, height: 8, price: 200 },
  { id: 14, category: "craft", x: 36, y: 18, width: 5, height: 8, price: 200 },

  { id: 13, category: "clothing", x: 61, y: 18, width: 5, height: 8, price: 200 },
  { id: 12, category: "clothing", x: 68, y: 18, width: 5, height: 8, price: 200 },
  { id: 11, category: "clothing", x: 75, y: 18, width: 5, height: 8, price: 200 },
  { id: 10, category: "clothing", x: 82, y: 18, width: 5, height: 8, price: 350 },

  { id: 18, category: "food", x: 4.5, y: 20, width: 5, height: 8, price: 350 },
  { id: 19, category: "food", x: 4.5, y: 36, width: 5, height: 8, price: 200 },
  { id: 20, category: "food", x: 4.5, y: 48, width: 5, height: 8, price: 200 },
  { id: 21, category: "food", x: 4.5, y: 60, width: 5, height: 8, price: 200 },
  { id: 22, category: "food", x: 4.5, y: 72, width: 5, height: 8, price: 200 },

  { id: 9, category: "clothing", x: 92, y: 25, width: 5, height: 8, price: 350 },
  { id: 8, category: "clothing", x: 92, y: 37, width: 5, height: 8, price: 200 },
  { id: 7, category: "clothing", x: 92, y: 49, width: 5, height: 8, price: 200 },
  { id: 6, category: "clothing", x: 92, y: 61, width: 5, height: 8, price: 200 },
  { id: 5, category: "clothing", x: 92, y: 73, width: 5, height: 8, price: 200 },

  { id: 29, category: "craft", x: 16, y: 33, width: 5, height: 8, price: 350 },
  { id: 30, category: "craft", x: 25, y: 32, width: 5, height: 8, price: 350 },
  { id: 28, category: "craft", x: 16, y: 46, width: 5, height: 8, price: 200 },
  { id: 31, category: "craft", x: 27, y: 45, width: 5, height: 8, price: 200 },
  { id: 27, category: "craft", x: 16, y: 60, width: 5, height: 8, price: 350 },
  { id: 32, category: "craft", x: 25, y: 59, width: 5, height: 8, price: 350 },

  { id: 35, category: "clothing", x: 70, y: 33, width: 5, height: 8, price: 350 },
  { id: 36, category: "jewelry", x: 80, y: 32, width: 5, height: 8, price: 350 },
  { id: 34, category: "clothing", x: 70, y: 46, width: 5, height: 8, price: 200 },
  { id: 37, category: "jewelry", x: 80, y: 45, width: 5, height: 8, price: 200 },
  { id: 33, category: "clothing", x: 70, y: 60, width: 5, height: 8, price: 350 },
  { id: 38, category: "jewelry", x: 80, y: 59, width: 5, height: 8, price: 350 },

  { id: 23, category: "food", x: 10, y: 78, width: 5, height: 8, price: 200 },
  { id: 24, category: "food", x: 16, y: 78, width: 5, height: 8, price: 200 },
  { id: 25, category: "food", x: 23, y: 78, width: 5, height: 8, price: 400 },

  { id: 26, category: "craft", x: 35, y: 78, width: 5, height: 8, price: 250 },

  { id: 1, category: "craft", x: 58, y: 78, width: 5, height: 8, price: 250 },

  { id: 2, category: "jewelry", x: 72, y: 78, width: 5, height: 8, price: 400 },
  { id: 3, category: "jewelry", x: 79, y: 78, width: 5, height: 8, price: 200 },
  { id: 4, category: "jewelry", x: 85, y: 78, width: 5, height: 8, price: 200 },
];

const VENDOR_TO_TABLE_CATEGORY = {
  "Food Vendor": "food",
  "Clothing Vendor": "clothing",
  "Jewelry Vendor": "jewelry",
  "Craft Booth": "craft",
  // "Henna Booth": ??? -> not in TABLES, so we will reject by default
};

export function getBoothMeta(boothNumber, vendorCategory) {
  const boothId = Number(boothNumber);
  if (Number.isNaN(boothId)) return null;

  const t = TABLES.find((x) => x.id === boothId);
  if (!t) return null;

  const expected = VENDOR_TO_TABLE_CATEGORY[vendorCategory];
  if (!expected) {
    return { error: "CATEGORY_NOT_SUPPORTED", booth: t };
  }

  if (t.category !== expected) {
    return { error: "CATEGORY_MISMATCH", booth: t, expected, got: t.category };
  }

  return {
    boothNumber: String(t.id),
    boothTableCategory: t.category,
    boothPrice: Number(t.price),
    booth: t,
  };
}
