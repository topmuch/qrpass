---
Task ID: 1
Agent: main
Task: Create PassHajj Manager PWA - Offline-First Application

Work Log:
- Installed localforage and html5-qrcode packages
- Updated manifest.json for PassHajj Manager PWA (theme_color: #f4b400, standalone mode, portrait)
- Updated service worker with offline-first Cache-First strategy for assets, Network-First for API
- Created beep sound files (green=880Hz, blue=660Hz, red=330Hz) for scan feedback
- Created TypeScript types (passhajj-types.ts): TripData, PilgrimData, BagData, ScanRecord, IncidentRecord, ZoneType, SyncStatus, AppView
- Created Zustand store (passhajj-store.ts) with localforage persistence, scan management, sync queue, flash card
- Created API route /api/leader/trips/verify - OTP verification with mock data (1234, 5678, 9999)
- Created API route /api/leader/trips/sync - offline scan sync endpoint
- Created LoginScreen component with OTP input, offline fallback, demo codes
- Created SyncManager component with online/offline/syncing indicators, auto-sync on reconnect
- Created QRScanner component with html5-qrcode camera, manual input fallback, test buttons
- Created Dashboard component with zone selector, pilgrim/bag counters, scanner, flash card
- Created ListView component with search, filters (all/present/missing/bags), status badges
- Created IncidentsView component with type selection, form, incident journal
- Integrated all components in page.tsx with dynamic imports (no SSR)
- Fixed React hooks ordering in ListView.tsx
- Verified all functionality with agent-browser: login, scan, zone selector, list, incidents

Stage Summary:
- Complete PWA with offline-first architecture
- All 6 deliverables implemented: manifest.json, service-worker.js, App.tsx (page.tsx), LoginScreen.tsx, ScannerScreen.tsx (QRScanner.tsx), SyncManager.ts
- Verified working: OTP login, QR scanning (identity + baggage + out-of-group), zone selector, counters, list filters, incidents, sync manager
- Sound feedback: beep-green.mp3 (pilgrim), beep-blue.mp3 (baggage), beep-red.mp3 (error)
- Design system: Yellow #f4b400 theme, white cards, large readable typography, wide touch targets
