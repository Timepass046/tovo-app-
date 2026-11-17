# Tovo — Capacitor Android Studio & APK Build Guide

This guide details how to run Tovo locally, sync Capacitor assets, and build a Debug or Release **Android APK** from Android Studio or the command line.

---

## 1. Prerequisites

- **Node.js**: v20+ and **npm** v9+
- **Android Studio**: Latest version with:
  - **Android SDK Platform 37** (`compileSdk` / `targetSdk` 37, `minSdk` 24)
  - **Android SDK Build-Tools** and **Android SDK Platform-Tools (ADB)**
  - **AGP 9.2.0** and **Gradle 9.2.1** (configured in `android/gradle/libs.versions.toml` and `android/gradle/wrapper/gradle-wrapper.properties`)
- **Java Development Kit (JDK)**: JDK 21 (bundled with Android Studio as JetBrains Runtime)

---

## 2. Export & Sync Web Assets

Before opening Android Studio or running Gradle (and every time web code or `.env` changes):

```bash
# 1. Install JavaScript dependencies
npm install

# 2. Build production web assets into dist/
npm run build

# 3. Sync web assets and Capacitor plugins into android/
npx cap sync android
```

---

## 3. Build an APK

### Option A: Android Studio (GUI)
1. Open the `android/` directory in Android Studio (`File → Open → <repo>/android`).
2. Confirm **Settings → Build, Execution, Deployment → Build Tools → Gradle** uses **Gradle JDK 21**.
3. Wait for **Sync Project with Gradle Files** to complete.
4. Build an APK:
   - Debug APK: **Build → Generate App Bundles or APKs → Build APK(s)**
   - Signed Release APK: **Build → Generate Signed App Bundle / APK → APK** (select or create your `.jks` keystore).

### Option B: Command Line (Gradle Wrapper)
From the project root:

```bash
cd android
./gradlew assembleDebug
```
*(On Windows: `gradlew.bat assembleDebug`)*

Generated Debug APK location:
`android/app/build/outputs/apk/debug/app-debug.apk`

For a Release APK (after configuring signing in Android Studio or `signingConfigs`):
```bash
./gradlew assembleRelease
```

---

## 4. Install onto a Physical Android Device

1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect via USB and verify device detection:
   ```bash
   adb devices
   ```
3. Install the Debug APK:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 5. Backend API & Firebase Notes for Native APK

- **Backend API Base URL**: On native Android (`https://localhost`), `/api/*` requests automatically target `VITE_API_BASE_URL` (falling back to the deployed Tovo Cloud Run backend). To override the backend URL at build time, set `VITE_API_BASE_URL="https://your-backend-url"` in `.env` before running `npm run build && npx cap sync android`.
- **Native Google Sign-In (Android)**:
  Tovo uses `@capacitor-firebase/authentication` with `skipNativeAuth: true` on Android to launch native Google Sign-In (Credential Manager) and bridge the resulting Google ID token into the single Firebase JS Auth session via `signInWithCredential`.
  Before building an APK for testing or release, complete these Firebase Console & Android steps:
  1. **Obtain your APK signing certificate fingerprints** (never guess or copy from another machine):
     - Debug & local release keystores:
       ```bash
       cd android && ./gradlew signingReport
       ```
     - Or inspect a specific `.jks` keystore directly:
       ```bash
       keytool -list -v -keystore /path/to/your-release.jks -alias your-key-alias
       ```
     - If distributing via Google Play, also copy the **App signing key certificate** SHA-1 and SHA-256 from **Google Play Console → Setup → App signing**.
  2. **Register the Android app in Firebase Console** (Project ID: `studio-9305902895-3f549`):
     - Go to **Project Settings → Your apps → Add app → Android**.
     - Enter Android package name: `com.tovoapp.productivity`.
     - Add your **SHA-1** and **SHA-256** fingerprints (debug, release, and Play App Signing if applicable).
  3. **Verify Google Sign-In & Web OAuth Client in Firebase Console**:
     - Ensure **Authentication → Sign-in method → Google** is enabled.
     - Confirm the Web SDK configuration uses Web Client ID `824104372265-gmuni2h2uqh9kat9h71p05mqqvu3kcdc.apps.googleusercontent.com` (from `firebase-applet-config.json`), and that Google Cloud Console OAuth credentials include the Android OAuth client created by Firebase for `com.tovoapp.productivity`.
  4. **Place `google-services.json` in `android/app/`**:
     - Download `google-services.json` from Firebase Console after adding your SHA-1/SHA-256 fingerprints.
     - Save it to `android/app/google-services.json` (excluded from Git; do not commit production config files containing sensitive settings if restricted, or manage per environment).
     - `android/app/build.gradle.kts` automatically applies `com.google.gms.google-services` when `android/app/google-services.json` exists, populating `R.string.default_web_client_id` required by native Google Sign-In.
  5. **Rebuild & Sync**:
     ```bash
     npm run build && npx cap sync android
     ```
- **Email/Password Authentication**:
  - Works on both Web and Android WebView, and email verification checks remain strictly enforced (`isEmailVerified`).

