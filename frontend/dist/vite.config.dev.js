"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _vite = require("vite");

var _pluginReact = _interopRequireDefault(require("@vitejs/plugin-react"));

var _vitePluginPwa = require("vite-plugin-pwa");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = (0, _vite.defineConfig)({
  plugins: [(0, _pluginReact["default"])(), (0, _vitePluginPwa.VitePWA)({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'logo.png', 'robots.txt'],
    manifest: {
      name: 'AICourseHubPro',
      short_name: 'AICourseHub',
      description: 'Master AI for Your Career — elite online learning for HR, Operations, Business, Development & Marketing professionals.',
      theme_color: '#dc2626',
      background_color: '#000000',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [{
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png'
      }, {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png'
      }, {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png'
      }, {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png'
      }, {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png'
      }, {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      }, {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png'
      }, {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }, {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }],
      screenshots: [{
        src: '/icons/screenshot-mobile.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'AICourseHubPro on mobile'
      }, {
        src: '/icons/screenshot-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'AICourseHubPro on desktop'
      }],
      categories: ['education', 'productivity'],
      lang: 'en'
    },
    workbox: {
      // Cache the app shell and static assets
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      // Network-first for API calls — never serve stale data
      runtimeCaching: [{
        urlPattern: /^https:\/\/api\.aicoursehubpro\.com\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5
          },
          networkTimeoutSeconds: 10
        }
      }, // Cache course images/assets
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30
          }
        }
      }]
    },
    devOptions: {
      enabled: false // Don't run service worker in dev mode

    }
  })],
  server: {
    host: true
  },
  preview: {
    host: true,
    port: 8080,
    allowedHosts: true
  }
}); // Force rebuild 1


exports["default"] = _default;
//# sourceMappingURL=vite.config.dev.js.map
