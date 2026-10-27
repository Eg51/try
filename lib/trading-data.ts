export const COMMODITIES: Record<string, any> = {
  CHR: { name: 'Charcoal', unit: 'bag', base: 42.50, region: 'Enugu', color: '#3f3f46' },
  BLF: { name: 'Bitterleaf', unit: 'bundle', base: 18.20, region: 'Onitsha', color: '#16a34a' },
  SCN: { name: 'Scrap iron', unit: 'tonne', base: 285.00, region: 'Kano', color: '#78716c' },
  ENO: { name: 'Condemned oil', unit: 'barrel', base: 62.40, region: 'P/H', color: '#1e293b' },
  PLM: { name: 'Palm oil', unit: 'litre', base: 2.85, region: 'Benin', color: '#ea580c' },
};

export const PAIRS = [
  { id: 'CHR-BLF', a: 'CHR', b: 'BLF', rate: 2.33 },
  { id: 'SCN-ENO', a: 'SCN', b: 'ENO', rate: 4.57 },
  { id: 'PLM-GRI', a: 'PLM', b: 'GRI', rate: 1.97 },
];