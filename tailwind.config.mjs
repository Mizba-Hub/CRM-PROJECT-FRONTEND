import typography from "@tailwindcss/typography";
import lineClamp from "@tailwindcss/line-clamp";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [typography, lineClamp],
};
