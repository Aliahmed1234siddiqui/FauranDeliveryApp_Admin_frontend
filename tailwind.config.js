/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Furan brand palette - pulled from the consumer app (dark green header,
        // amber "10 MIN DROP" accent) and adapted for a data-dense ops tool.
        brand: {
          DEFAULT: "#0F6E56",
          dark: "#0B3D2E",
          darker: "#082A20",
          light: "#E4F3EE",
        },
        accent: {
          DEFAULT: "#F2A93B",
          dark: "#D97B0A",
          light: "#FDF1DE",
        },
        surface: {
          DEFAULT: "#F6F8F6",
          card: "#FFFFFF",
          border: "#E4E7E2",
        },
        ink: {
          DEFAULT: "#16231D",
          muted: "#5B6B62",
          faint: "#8B978F",
        },
        status: {
          success: "#1B8A5A",
          successBg: "#E7F5EE",
          warning: "#D97B0A",
          warningBg: "#FDF1DE",
          danger: "#C0392B",
          dangerBg: "#FBEAE8",
          info: "#2563A6",
          infoBg: "#E9F1FA",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 35, 29, 0.06), 0 1px 3px rgba(16, 35, 29, 0.08)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
