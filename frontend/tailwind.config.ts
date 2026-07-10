import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "hsl(var(--paper))",
        surface: "hsl(var(--surface))",
        ink: "hsl(var(--ink))",
        "ink-muted": "hsl(var(--ink-muted))",
        border: "hsl(var(--border))",

        neutral: {
          50: "hsl(var(--neutral-50))",
          100: "hsl(var(--neutral-100))",
          200: "hsl(var(--neutral-200))",
          300: "hsl(var(--neutral-300))",
          400: "hsl(var(--neutral-400))",
          500: "hsl(var(--neutral-500))",
          600: "hsl(var(--neutral-600))",
          700: "hsl(var(--neutral-700))",
          800: "hsl(var(--neutral-800))",
          900: "hsl(var(--neutral-900))",
        },

        primary: {
          DEFAULT: "hsl(var(--navy))",
          hover: "hsl(var(--navy)/0.9)",
          foreground: "#ffffff",
        },
        navy: {
          DEFAULT: "hsl(var(--navy))",
          elevated: "hsl(var(--navy-elevated))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        severity: {
          critical: "hsl(var(--severity-critical))",
          "critical-bg": "hsl(var(--severity-critical-bg))",
          high: "hsl(var(--severity-high))",
          "high-bg": "hsl(var(--severity-high-bg))",
          medium: "hsl(var(--severity-medium))",
          "medium-bg": "hsl(var(--severity-medium-bg))",
          low: "hsl(var(--severity-low))",
          "low-bg": "hsl(var(--severity-low-bg))",
        },
        status: {
          "pending-bg": "hsl(var(--status-pending-bg))",
          "pending-text": "hsl(var(--status-pending-text))",
          "assigned-bg": "hsl(var(--status-assigned-bg))",
          "assigned-text": "hsl(var(--status-assigned-text))",
          "progress-bg": "hsl(var(--status-progress-bg))",
          "progress-text": "hsl(var(--status-progress-text))",
          "approved-bg": "hsl(var(--status-approved-bg))",
          "approved-text": "hsl(var(--status-approved-text))",
          "verified-bg": "hsl(var(--status-verified-bg))",
          "verified-text": "hsl(var(--status-verified-text))",
          "completed-bg": "hsl(var(--status-completed-bg))",
          "completed-text": "hsl(var(--status-completed-text))",
          "rejected-bg": "hsl(var(--status-rejected-bg))",
          "rejected-text": "hsl(var(--status-rejected-text))",
        },
        success: {
          DEFAULT: "hsl(var(--status-completed-text))",
          bg: "hsl(var(--status-completed-bg))",
        },
        warning: {
          DEFAULT: "hsl(var(--status-progress-text))",
          bg: "hsl(var(--status-progress-bg))",
        },
        info: {
          DEFAULT: "hsl(var(--accent))",
          bg: "hsl(var(--status-approved-bg))",
        },
        danger: {
          DEFAULT: "hsl(var(--severity-critical))",
          bg: "hsl(var(--severity-critical-bg))",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Mono'", "monospace"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      fontSize: {
        // Type scale - each pairs with an intentional line-height,
        // not Tailwind's defaults, to keep vertical rhythm consistent
        // across dense tables and forms.
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "20px" }],
        md: ["15px", { lineHeight: "22px" }],
        lg: ["18px", { lineHeight: "26px" }],
        xl: ["22px", { lineHeight: "30px" }],
        "2xl": ["28px", { lineHeight: "36px" }],
      },
      borderRadius: {
        sm: "4px",  // inputs, badges, checkboxes
        md: "6px",  // buttons, small cards
        lg: "8px",  // cards, modals, panels
      },
      boxShadow: {
        // Deliberately subtle - enterprise dashboards signal elevation
        // with borders first, shadow second. No glow, no neumorphism.
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        md: "0 2px 8px 0 rgb(0 0 0 / 0.06)",
        lg: "0 4px 16px 0 rgb(0 0 0 / 0.08)",
      },
      spacing: {
        // Explicit 8pt-grid steps beyond Tailwind's default scale,
        // named so intent is clear at call sites.
        4.5: "18px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
