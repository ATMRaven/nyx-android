# Nyx — Android shell

Native Android wrapper for the Nyx roleplay app. The web client itself is served
by the Cloudflare Worker at **https://nyx-app.atmr.workers.dev** (D1 + B2 +
VoxFlow voice); this repo only contains the container: a Capacitor 8 WebView
pointed at that URL, the launcher icon/splash, and the release pipeline.

Everything the shell adds is either native glue (back button, keyboard, share
sheet, keep-awake, status bar) or lives in the web client's `js/native.js`, which
ships with the Worker — so **web changes reach installed APKs instantly**. Only
container changes need a new APK.

## Install

Download the APK from the [latest release](https://github.com/ATMRaven/nyx-android/releases/latest)
and open it on the phone (allow "install unknown apps" for the browser/Files app).

- Package `com.atmr.nyx` · minSdk 24 · targetSdk 36
- Release signing cert SHA-256 `4c:54:08:0a:00:d5:e4:06:fa:29:ea:d6:a0:82:75:b1:99:b3:08:50:5a:d8:b4:e3:35:17:62:61:c2:17:56:7e`
  — the keystore lives offline at `nyx/mobile/android/app/release.keystore`.
  **Lose it and updates can only be installed by uninstalling first.**

## Release

```bash
npm run release:android 1.0.2     # bumps package.json, tags, pushes, watches CI
```

CI (`.github/workflows/android-release.yml`) needs repo secrets
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD` and publishes `nyx-<version>.apk` + `latest.json`.

The app checks `releases/latest/download/latest.json` once a day on launch and
offers the APK through the system browser when a newer `version` exists.

## What the shell does

| Area | Behaviour |
|---|---|
| Boot | Dark splash → remote app; if the Worker is unreachable, `offline.html` with retry |
| Back gesture | closes sheet → leaves chat → exits app |
| Keyboard | native resize + thread re-pinned to the bottom |
| Voice | WebView allows gapless part playback, screen stays awake while speaking |
| Files | character cards and scene images go through the Android share sheet (no storage permission) |
| Media | `navigator.mediaSession` metadata (title/artist on the lock screen) |
| Backup | Android cloud backup disabled — the session cookie stays on the device |

## Local build (needs JDK 21 + Android SDK 36)

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleRelease -PversionName=1.0.0 -PversionCode=10000
```