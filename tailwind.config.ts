import type { Config } from "tailwindcss";

export default {
  darkMode: ['[data-theme="dark"]'], // Updated to target data-theme attribute for dark mode
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: { // Nouvelle couleur pour les messages de succès
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // New Android-inspired colors
        'android-surface-container': 'hsl(var(--android-surface-container))',
        'android-on-surface-variant': 'hsl(var(--android-on-surface-variant))',
        'android-on-surface-light': 'hsl(var(--android-on-surface-light))',
        'android-accent-blue': 'hsl(var(--android-accent-blue))',
        'android-accent-red': 'hsl(var(--android-accent-red))',
        'android-accent-pink': 'hsl(var(--android-accent-pink))',
        'android-accent-purple': 'hsl(var(--android-accent-purple))',
        'android-accent-orange': 'hsl(var(--android-accent-orange))',
      },
      borderRadius: {
        lg: "0.5rem", // Keep default for general large radius
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "card-lg": "28px", // Nouveau rayon de bordure pour les cartes
        "android-tile": "1.75rem", // 28px for Android-like tiles
      },
      boxShadow: {
        "card-shadow": "0 4px 12px rgba(0, 0, 0, 0.08)", // Nouvelle ombre pour les cartes
        "android-shadow": "0px 4px 15px rgba(0, 0, 0, 0.15)", // Android-like shadow
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'], // Pile de polices système
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        "background-pan": {
          "0%": { backgroundPosition: "0% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "bounce-slow": { // Nouvelle keyframe
          "0%, 100%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(-10px)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
        "wiggle-horizontal": { // Nouvelle keyframe pour l'animation de glissement
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(5px)" },
          "75%": { transform: "translateX(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        blob: "blob 7s infinite",
        "background-pan": "background-pan 3s linear infinite",
        "bounce-slow": "bounce-slow 2s infinite", // Nouvelle animation
        "wiggle-horizontal": "wiggle-horizontal 2s ease-in-out infinite", // Nouvelle animation
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;