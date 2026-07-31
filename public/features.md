I have a Next.js website for my brand "MamaFarm". I want to convert it into a fully installable PWA (Progressive Web App).

Please implement all required PWA assets, configuration, and metadata.

Brand Icon Requirements:

- Create app icons using only the circular farmer illustration from my existing logo.
- Remove all text:
  - "MamaFarm" name
  - tagline
  - any extra wording
- Keep only the farmer illustration.
- Keep the green leaves on the left and right side of the circular farmer illustration.
- The icon must look premium, clean, and suitable for a food/agriculture brand.
- Use a square format.
- Size: 512x512 PNG.
- Background can be:
  - transparent, OR
  - natural farm green (#2E7D32)
- Farmer illustration must be perfectly centered.
- Maintain enough padding so it works properly as:
  - Windows desktop shortcut icon
  - Windows Start Menu icon
  - Windows taskbar icon
  - Android app launcher icon
  - Chrome "Install App" icon
  - Apple home screen icon

Generate and place these files:

public/
├── favicon.ico
├── manifest.json
└── icons/
├── icon-192.png
├── icon-512.png
├── maskable-512.png
└── apple-touch-icon.png

Icon specifications:

1. icon-192.png

- 192x192 PNG
- Normal app icon
- Center farmer illustration

2. icon-512.png

- 512x512 PNG
- Main PWA icon
- Center farmer illustration

3. maskable-512.png

- 512x512 PNG
- Android adaptive icon compatible
- Keep farmer illustration inside the safe zone (approximately center 70%)
- Add green background padding
- No clipping when Android applies masks

4. apple-touch-icon.png

- 180x180 PNG
- Optimized for iOS home screen
- Green background with centered farmer illustration

5. favicon.ico

- Generate favicon from the same farmer illustration
- Compatible with browsers and desktop shortcuts

Create/update:

public/manifest.json

with:

{
"name": "MamaFarm",
"short_name": "MamaFarm",
"description": "Pure Ingredients. True Goodness.",
"start_url": "/",
"scope": "/",
"display": "standalone",
"orientation": "portrait",
"theme_color": "#2E7D32",
"background_color": "#FFFFFF",
"icons": [
{
"src": "/icons/icon-192.png",
"sizes": "192x192",
"type": "image/png"
},
{
"src": "/icons/icon-512.png",
"sizes": "512x512",
"type": "image/png"
},
{
"src": "/icons/maskable-512.png",
"sizes": "512x512",
"type": "image/png",
"purpose": "maskable"
}
]
}

Next.js PWA Configuration:

Install:
npm install next-pwa

Configure next-pwa in next.config.js:

- Enable service worker generation
- Output service worker into /public
- Register service worker automatically
- Enable skipWaiting
- Disable PWA only during development

Use:

const withPWA = require("next-pwa")({
dest: "public",
register: true,
skipWaiting: true,
disable: process.env.NODE_ENV === "development"
});

Update app/layout.tsx metadata:

Add:

- manifest: "/manifest.json"
- favicon.ico
- apple-touch-icon
- appleWebApp configuration
- applicationName: "MamaFarm"

Add viewport:

themeColor:
"#2E7D32"

Verify:

- PWA install prompt appears in Chrome
- Lighthouse PWA checks pass
- Icons load correctly
- Manifest is valid
- Service worker registers successfully
- App can be installed on Windows, Android, and iOS

Do not create any text logo icon.
Use only the farmer illustration symbol.
Keep the final design minimal, premium, organic, and trustworthy.
