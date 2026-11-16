/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Calibrated non-pure black and non-pure white (Human visual ergonomics, zero halation vibration)
        white: '#FAFAFA',
        black: '#1A1A1A',
        // DAY THEME: "Warm Off-White & Sepia Archive" (Low blue-light daylight atmosphere)
        paper: {
          bg: '#F5F5F5',                   // Warm off-white daylight canvas
          canvas: '#F5F5F5',
          ambient: '#F2EFE9',              // Ambient room light blend
          card: '#F4EFE2',                 // Soft Warm Sepia / Archival Paper
          cardElevated: '#FAFAFA',         // Subtle raised controls (calibrated off-white)
          well: '#EAE4D5',                 // Warm Sand sunken bay
          input: '#FAFAFA',                // Precision engraved bezel input
          border: '#D8D0BE',               // Warm stone border
          borderHover: '#B45309',          // Warm amber border hover
          borderWell: '#D8D0BE',
          ink: '#2F2F2F',                  // Dark Charcoal Gray primary text
          body: '#2F2F2F',                 // Clear, calm primary reading body
          secondary: '#524F48',            // Warm Graphite secondary
          muted: '#78736A',                // Soft stone muted text
          accent: '#B45309',               // Warm Amber-Gold
          accentHover: '#92400E',
          link: '#B45309',                 // Links
          btnBg: '#2F2F2F',                // Primary button charcoal
          btnText: '#F5F5F5',
          btnHover: '#1A1A1A',
          champagne: '#B45309',            // Warm Gold highlight
          jade: '#15803D',                 // Deep Botanical Green
          green: '#15803D',
        },
        // NIGHT THEME: "Matte Charcoal & Low-Blue-Light Phosphor" (Zero cool navy/cyan glare)
        night: {
          bg: '#121212',                   // True Neutral Matte Dark Gray
          canvas: '#121212',
          card: '#1A1A1A',                 // Soft Calibrated Charcoal
          cardElevated: '#22211E',         // Warm Dark Umber-Gray
          well: '#181715',                 // Sunken warm instrument bay
          input: '#1A1A1A',
          border: '#2E2D29',               // Subtle neutral borders
          borderHover: '#FACC15',
          borderWell: '#2E2D29',
          text: '#E8E5DE',                 // Soft Warm Off-White / Light Gray typography
          body: '#D6D3CB',                 // Warm reading typography
          secondary: '#A6A29A',            // Warm Stone Gray secondary
          muted: '#807C74',                // Secondary captions/hints
          accent: '#FACC15',               // Warm Luminosity Yellow
          accentHover: '#EAB308',
          link: '#FACC15',
          btnBg: '#FACC15',
          btnText: '#121212',
          btnHover: '#EAB308',
          emerald: '#4ADE80',              // Luminosity-Peak Phosphor Green
          amber: '#FACC15',                // Warm Luminosity Yellow
          red: '#FB923C',                  // Warm Soft Orange (Zero fatiguing pure red)
          cyan: '#4ADE80',                 // Shifted from cool blue to Phosphor Green
          champagne: '#FACC15',
          jade: '#4ADE80',
          phosphor: '#4ADE80',
          yellow: '#FACC15',
          orange: '#FB923C',
        },
        // Status Palettes (Low blue-light, zero fatiguing pure red)
        emerald: {
          50: 'rgba(74, 222, 128, 0.08)',
          100: 'rgba(74, 222, 128, 0.15)',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
        },
        amber: {
          50: 'rgba(250, 204, 21, 0.08)',
          100: 'rgba(250, 204, 21, 0.15)',
          400: '#FACC15',
          500: '#EAB308',
          600: '#D97706',
          700: '#B45309',
        },
        rose: {
          50: 'rgba(251, 146, 60, 0.08)',
          100: 'rgba(251, 146, 60, 0.15)',
          400: '#FB923C',                  // Warm Soft Orange (Low blue-light, zero red-on-dark halation)
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        red: {
          50: 'rgba(251, 146, 60, 0.08)',
          100: 'rgba(251, 146, 60, 0.15)',
          400: '#FB923C',                  // Calibrated Warm Soft Orange instead of fatiguing #EF4444
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        // Shift cool cyan toward warm low-blue phosphor green
        cyan: {
          50: 'rgba(74, 222, 128, 0.08)',
          100: 'rgba(74, 222, 128, 0.15)',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        }
      },
      boxShadow: {
        'paper-card': 'inset 0 1px 0 #FAFAFA, 0 8px 20px -6px rgba(47, 47, 47, 0.06), 0 2px 6px -1px rgba(47, 47, 47, 0.04)',
        'paper-card-hover': 'inset 0 1px 0 #FAFAFA, 0 14px 28px -8px rgba(47, 47, 47, 0.10), 0 4px 10px -2px rgba(47, 47, 47, 0.05)',
        'paper-well': 'inset 0 2px 4px rgba(47, 47, 47, 0.06), 0 1px 0 #FAFAFA',
        'night-card': 'inset 0 1px 0 rgba(232, 229, 222, 0.08), 0 12px 30px -8px rgba(18, 18, 18, 0.65)',
        'night-card-hover': 'inset 0 1px 0 rgba(232, 229, 222, 0.14), 0 18px 36px -10px rgba(18, 18, 18, 0.85)',
        'night-well': 'inset 0 3px 8px rgba(18, 18, 18, 0.75), 0 1px 0 rgba(250, 204, 21, 0.06)',
        'glow-emerald': '0 0 18px rgba(74, 222, 128, 0.35)',
        'glow-cyan': '0 0 18px rgba(74, 222, 128, 0.35)',
        'glow-solar': '0 0 18px rgba(250, 204, 21, 0.35)',
        'glow-crimson': '0 0 18px rgba(251, 146, 60, 0.35)',
        'hardware-btn': 'inset 0 1px 0 rgba(250, 250, 250, 0.35), 0 3px 0 rgba(47, 47, 47, 0.15), 0 4px 10px rgba(47, 47, 47, 0.08)',
        'hardware-btn-night': 'inset 0 1px 0 rgba(232, 229, 222, 0.15), 0 3px 0 rgba(18, 18, 18, 0.55), 0 5px 12px rgba(18, 18, 18, 0.40)',
      }
    },
  },
  corePlugins: {
    container: false,
  },
  plugins: [],
}
