# Project Rules & Feature Persistence

## PWA (Progressive Web App)
- **Manifest**: Located at `/public/manifest.json`. Defines the app name, icons, and standalone display mode.
- **Service Worker**: Located at `/public/sw.js`. Essential for PWA installation functionality.
- **Icon Strategy**: Use `/media/favicon.png` for all PWA icons and app logo. Ensure high resolution in manifest (up to 512x512).
- **Installation Logic**:
  - The app must show an install prompt (panel) on mobile and desktop.
  - An "Instalar App" button should always be visible in the Header if not installed.
  - If the user skips installation, the prompt should reappear after a few seconds or on next visit.

## Notifications & Access Control
- **Access Restricted**: All core media content (Gallery) is locked until the user enables native browser notifications.
- **Notification Prompting**:
  - Automatically ask for notification permission on first load.
  - If denied or dismissed, show the "Acesso Restrito" modal every 10 seconds.
  - The "Ativar Notificações" button must trigger the native `Notification.requestPermission()` call.
- **Ad-Layer Integration**: The site uses ExoClick integration (`pn_idzone`) and requires notification permission to unlock content, which aligns with push-ad mechanisms.

## SEO & Metadata
- **SEO Rules**: Maintain high-intent keywords in `title` and `description`.
- **Social Cards**: Keep Open Graph (OG) and Twitter Card tags updated with `/media/favicon.png`.
- **Search Presence**: Ensure `robots.txt` and `sitemap.xml` are present in `/public`.
- **Semantic HTML**: Always use `alt` tags on images and `aria-label` or `title` on video elements.

## Media Handling
- **Favicon Exclusion**: Images named `favicon` (png/jpg) must be EXCLUDED from the main gallery display. This is handled both in `server.ts` (API filter) and `src/components/Gallery.tsx` (frontend filter).
- **Dynamic Loading**: Media is loaded from `/public/media/` and indexed via `/public/media/media.json` or the backend API.

## UI / UX
- **Header**: Contains the Logo (`favicon.png`), App Name ("Galeria Exclusiva"), PWA Install Status, and Theme Toggle.
- **Transitions**: Use `motion/react` for all modals, panels, and entrance animations.
- **Layout**: Dark theme is preferred by default for exclusivity, but a toggle is provided.
