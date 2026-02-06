"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _vite = require("vite");

var _pluginReact = _interopRequireDefault(require("@vitejs/plugin-react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// https://vitejs.dev/config/
var _default = (0, _vite.defineConfig)({
  plugins: [(0, _pluginReact["default"])()],
  server: {
    host: true // Allows access from outside the container (needed for Railway)

  },
  preview: {
    host: true,
    // Binds to 0.0.0.0
    port: 8080,
    // Matches your Railway setting
    allowedHosts: true // <--- THIS FIXES YOUR ERROR. It allows any domain to access the site.

  }
}); // Force rebuild 1


exports["default"] = _default;
//# sourceMappingURL=vite.config.dev.js.map
