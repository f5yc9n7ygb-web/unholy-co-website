import type { Config } from 'tailwindcss'

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: "#C9C9C9",      // soft grey tone for text highlights
        blood: "#B00020",     // main brand red
        ash: "#2A2A2A",       // background black-grey
        offwhite: "#F6F6F6",  // near-white text
      },
      boxShadow: {
        unholy: "0 30px 80px rgba(176,0,32,0.35)",  // matches red-glow & globals.css
      },
      backgroundImage: {
        obsidian:
          "radial-gradient(1200px 600px at 50% 0%, rgba(176,0,32,0.22), rgba(0,0,0,0) 60%)",
      },
      container: {
        center: true,
        padding: "1rem",
      },
      fontFamily: {
        // Optional if you’re planning brand typography (Playfair Display, Cinzel, etc.)
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config