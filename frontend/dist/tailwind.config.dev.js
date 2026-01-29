"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/** @type {import('tailwindcss').Config} */
var _default = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/typography')]
};
exports["default"] = _default;
//# sourceMappingURL=tailwind.config.dev.js.map
