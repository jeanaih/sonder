# Sonder Project Tasks

## Phase 1: Dashboard Core Completion [/]
(Priority: #1 - Dapat itong unahin para 100% solid na ang features bago natin ito i-build sa APK. Mas madaling mag-debug sa browser.)
- [x] **Project Scoping**: Define the roadmap for mobile transition
- [x] **Localization Engine**: Implement dictionary-based translation (English/Filipino)
- [x] **Mood Donut Data**: Connect Calendar donut chart to actual mood frequency data
- [x] **Custom Activities**: Build the Emoji Picker and dynamic activity management
- [x] **Reminders UI & DB**: Ensure reminder time and status are correctly synced to Firestore

## Phase 2: Server Migration & Deployment [ ]
(Priority: #2 - Kapag 100% na ang UI, i-deploy na sa Render/Railway para ma-access na ang API ng kahit anong device.)
- [ ] **Environment Setup**: Move secrets (Firebase Admin) to [.env](file:///c:/Users/jeana/Desktop/psyc/.env) variables
- [ ] **Backend Deployment**: Deploy [server.js](file:///c:/Users/jeana/Desktop/psyc/server.js) to Render or Railway
- [ ] **Frontend Bridge**: Update [config.js](file:///c:/Users/jeana/Desktop/psyc/public/js/config.js) to point to the production API URL

## Phase 3: Mobile Conversion (Capacitor Setup) [ ]
(Priority: #3 - Oras na para maging tunay na App. Isasama na natin ang lahat ng files sa loob ng Android project.)
- [ ] **Capacitor Setup**: Initialize `@capacitor/core` and `@capacitor/cli`
- [ ] **Android Platform**: Add Android project folder using `npx cap add android`
- [ ] **Asset Bundling**: Optimize all scripts and assets for local APK bundling

## Phase 4: Native Mobile Features [ ]
(Priority: #4 - Dito na natin ikakabit ang local notifications at native login. Hindi ito matatest nang maayos kung wala pang mobile build.)
- [ ] **Local Notifications**: Implement `@capacitor/local-notifications` for reminders and goals
- [ ] **Native Auth**: Setup Google/FB Native login (SHA-1 fingerprinting)
- [ ] **PIN Lock**: Build a secure 4-digit overlay for app privacy

## Phase 5: PWA & Offline Support [ ]
- [ ] **Manifest/Icons**: Finalize `manifest.json` and high-res icon set
- [ ] **Caching Strategy**: Implement robust Service Worker caching

## Phase 6: Final Release [ ]
- [ ] **Build Release APK**: Generate signed APK for distribution
- [ ] **UI/UX Polish**: 60fps animation audit and mobile touch-target optimization
