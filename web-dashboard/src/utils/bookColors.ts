export interface BookClothColor {
  id: string;
  name: string;
  hex: string;
  spineHex: string;
  foilColor: string;
  textLight: boolean;
}

export const BOOK_CLOTH_COLORS: BookClothColor[] = [
  {
    id: 'crimson',
    name: 'Crimson Leather',
    hex: '#8B1E2F',
    spineHex: '#6B1422',
    foilColor: '#FBBF24',
    textLight: true
  },
  {
    id: 'navy',
    name: 'Royal Navy',
    hex: '#1E3A8A',
    spineHex: '#172554',
    foilColor: '#FDE047',
    textLight: true
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    hex: '#165B40',
    spineHex: '#0D3D2B',
    foilColor: '#FCD34D',
    textLight: true
  },
  {
    id: 'ochre',
    name: 'Ochre Gold',
    hex: '#B45309',
    spineHex: '#78350F',
    foilColor: '#FEF3C7',
    textLight: true
  },
  {
    id: 'terracotta',
    name: 'Burnt Terracotta',
    hex: '#9A3412',
    spineHex: '#7C2D12',
    foilColor: '#FFEDD5',
    textLight: true
  },
  {
    id: 'teal',
    name: 'Teal Cloth',
    hex: '#0F766E',
    spineHex: '#134E4A',
    foilColor: '#CCFBF1',
    textLight: true
  },
  {
    id: 'charcoal',
    name: 'Charcoal Slate',
    hex: '#334155',
    spineHex: '#1E293B',
    foilColor: '#E2E8F0',
    textLight: true
  },
  {
    id: 'copper',
    name: 'Copper',
    hex: '#92400E',
    spineHex: '#713F12',
    foilColor: '#FDE68A',
    textLight: true
  },
  {
    id: 'olive',
    name: 'Olive',
    hex: '#4D5620',
    spineHex: '#363E14',
    foilColor: '#ECFCCB',
    textLight: true
  },
  {
    id: 'espresso',
    name: 'Espresso',
    hex: '#382218',
    spineHex: '#25150E',
    foilColor: '#E7E5E4',
    textLight: true
  }
];

export function getBookClothColor(colorHexOrId?: string): BookClothColor {
  if (!colorHexOrId) return BOOK_CLOTH_COLORS[0];
  const found = BOOK_CLOTH_COLORS.find(
    c => c.id === colorHexOrId.toLowerCase() || c.hex.toLowerCase() === colorHexOrId.toLowerCase()
  );
  if (found) return found;

  // Fallback: derive spine and foil from given hex
  return {
    id: 'custom',
    name: 'Custom Hardcover',
    hex: colorHexOrId,
    spineHex: colorHexOrId,
    foilColor: '#F59E0B',
    textLight: true
  };
}
