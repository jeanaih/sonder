# Implementation Plan: Sonder Dashboard & Mobile Bridge

This plan outlines the immediate technical steps to finalize the dashboard and prepare for mobile (APK) wrapping.

## Phase 1: Finishing Dashboard Core

### [MODIFY] [app.js](file:///c:/Users/jeana/Desktop/psyc/public/js/app.js)
1.  **Localization Engine**:
    *   Create a `translations` object with [en](file:///c:/Users/jeana/Desktop/psyc/server.js#57-66) and `ph` keys.
    *   Update all hardcoded DOM text using a [t(key)](file:///c:/Users/jeana/Desktop/psyc/server.js#1034-1036) helper function.
    *   Wire up the `#language-select` to update the user preference in Firestore and reload the UI.
2.  **Mood Donut Component**:
    *   Create a function `updateMoodDonut(monthEntries)` to calculate the distribution of the 5 main moods.
    *   Render these as a semi-circle CSS donut or SVG in the Calendar tab.
3.  **Dynamic Activities**:
    *   Finish the `renderActivities` function to allow users to add/remove custom activity names and emojis.

## Phase 2: Mobile Infrastructure (Capacitor)

### [NEW] [capacitor.config.ts](file:///c:/Users/jeana/Desktop/psyc/capacitor.config.ts)
*   Define the app ID `com.sonder.app` and app name `Sonder`.
*   Set the `webDir` to `public`.

### [MODIFY] [config.js](file:///c:/Users/jeana/Desktop/psyc/public/js/config.js)
*   Update the `API_URL` to point to the live server (Render/Railway) while keeping the dev fallback.

## Phase 3: Native Features (To be Detailed)

> [!IMPORTANT]
> Once Phase 1 and 2 are done, we will focus on the **Native Google Auth** and **Local Notifications** using Capacitor plugins.

## Verification Plan

### Automated Tests
*   Verify localization switch updates all visible text without page refresh.
*   Verify `socket.io` connection to the remote server.

### Manual Verification
*   Test mobile touch-friendliness on Chrome DevTools (Mobile View).
*   Mock a Capacitor environment to test local notification scheduling.
