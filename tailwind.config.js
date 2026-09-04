/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",        // Keep — warm amber/saffron, stays as civic identity color  
        primaryLight: "#FFF7ED",   // Very light amber tint — used for active backgrounds
        primaryMid: "#FFEDD5",     // Warm amber wash
        background: "#F5F0EB",     // Warm off-white (like warm cream / stone-100 equivalent)
        surface: "#FDFAF7",        // Slightly warmer pure surface — card bg
        surfaceAlt: "#EDE8E3",     // Slightly darker warm surface for contrast sections
        cardBorder: "#E8E0D8",     // Warm gray border
        success: "#16A34A",        // Rich forest green
        successLight: "#DCFCE7",   // Light green tint
        warning: "#D97706",        // Deep amber warning
        warningLight: "#FEF3C7",   // Light amber tint
        danger: "#DC2626",         // Strong red
        dangerLight: "#FEE2E2",    // Light red tint
        textDark: "#1C1917",       // Near-black warm text (stone-900)
        textBody: "#44403C",       // Body text warm dark brown (stone-700)
        textMuted: "#A8A29E",      // Muted helper text (stone-400)
        textLight: "#FAFAF9",      // Light text for dark bg areas
        infoBlue: "#2563EB",       // For assigned/in-progress states
        infoBlueLight: "#DBEAFE",  // Light blue tint
      }
    },
  },
  plugins: [],
}
