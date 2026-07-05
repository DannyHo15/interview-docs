# 📦 5 — Native Build & Deploy (Expo, EAS, OTA, Multi-env)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp. Gắn với TypingAstro (RN 0.79, Expo 53, EAS multi-env dev/staging/prod).

---

## 1. Expo managed workflow vs bare workflow (và "prebuild") là gì? 🔥

**Ngắn:** Managed = chỉ code JS, không đụng native (nền `ios/` `android/`). Bare = có sẵn native folders, tự build bằng Xcode/Gradle. Hiện đại: **CNG (Continuous Native Generation)** + `npx expo prebuild` sinh native trên demand.

| Tiêu chí | Managed (CNG) | Bare / classic |
|---|---|---|
| `ios/`, `android/` | Không commit, sinh khi build | Có, tự maintain |
| Native module | Qua config plugin | Tự link, sửa native |
| Upgrade RN | Đổi version + prebuild lại | Manual migration painful |
| Flexibility | Thấp–trung | Cao |

**Đào sâu:**
- Expo SDK 53+ mặc định CNG: `app.json` + `app.config.ts` là source of truth → `eas build` chạy `prebuild` tự động.
- Có thể `npx expo prebuild` ra local để debug native, nhưng không nên commit nếu không cần sửa native tay.
- Khi cần custom native beyond config plugin → chuyển sang "prebuild + commit native" (giống bare nhưng仍有 Expo tooling).

**Gotcha:** `expo prebuild --clean` sẽ XÓA `ios/`/`android/` và tạo lại — mất mọi sửa native tay không có trong config plugin.

**Follow-up:** Khi nào bạn cần Dev Build? → Khi app có native module ngoài Expo SDK (vd: `react-native-iap`, `react-native-keychain`, custom biometric) → SDK Expo Go không chạy được → cần EAS Dev Client.

---

## 2. EAS Build / EAS Update / EAS Submit khác nhau thế nào? 🔥

**Ngắn:** **Build** = build binary (apk/aab/ipa) trên cloud. **Update** = push JS bundle + asset OTA. **Submit** = đẩy binary lên App Store / Play Store.

| Tool | Output | Khi nào dùng |
|---|---|---|
| `eas build` | `.apk`/`.aab`/`.ipa` | Đổi native, release version mới |
| `eas update` | JS bundle mới | Sửa bug JS, đổi text/UI, không đụng native |
| `eas submit` | Binary lên store | Sau khi build xong, release chính thức |
| `eas build --profile development` | Dev client (Expo Dev) | Dev với native module |

**Đào sâu:**
- EAS Build chạy trên macOS cloud workers (free tier giới hạn build/tháng).
- `eas.json` định nghĩa `profiles`: `development`, `preview`, `production` — mỗi profile control env vars, build type, distribution, credentials.
- EAS Submit dùng API App Store Connect + Google Play Publishing, tự quản lý credentials (có thể lưu trên cloud hoặc local).

**Gotcha:** Phân biệt `eas build --profile preview` (internal distribution `.apk`/TestFlight) vs `production` (store). Sai profile = build ra binary không cài được cho đúng audience.

**Follow-up:** Build iOS cần Apple Developer Account ($99/năm) + signing credentials. EAS có thể auto-provision (`credentials.json` hoặc "let EAS manage").

```jsonc
// eas.json (TypingAstro)
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "env": { "APP_ENV": "dev" } },
    "staging":     { "distribution": "internal", "env": { "APP_ENV": "staging" } },
    "production":  { "distribution": "store", "autoIncrement": true, "env": { "APP_ENV": "prod" } }
  }
}
```

---

## 3. OTA update — cái gì update được, cái gì KHÔNG? 🔥

**Ngắn:** OTA (EAS Update / CodePush) chỉ update **JS bundle + JS-side assets** (ảnh, font). **KHÔNG** update được: native code, native modules, `AndroidManifest.xml`, `Info.plist` (đa số), app icon, splash screen native.

| Update được (JS only) | Không (cần new binary) |
|---|---|
| Logic app, component | Thêm/xóa native dependency |
| Text, màu, layout | Đổi permission, app icon |
| Asset JS bundle (require) | SDK upgrade, RN version |
| Sửa bug TypeScript/JS | Đổi app permissions |

**Đào sâu:**
- EAS Update: dùng `expo-updates` library, channel + branch map tới update. Mỗi `eas update --branch production` push bundle lên server.
- CodePush (Microsoft): giải pháp cũ hơn, vẫn dùng được bare workflow nhưng RN 0.74+ MS đã ngừng maintain chính thức.
- Rollback: revert commit + push lại update, hoặc client tự fallback về bundled JS nếu update fail.

**Gotcha:** Khi update thay đổi thứ **vi phạm App Store policy** (vd: thêm IAP mới) — App Review có thể từ chối dù chỉ OTA. Apple cho OTA sửa bug, KHÔNG cho thay đổi tính năng core / monetization materially.

**Follow-up:** Cấu hình `expo-updates` để kiểm tra update khi nào? → `checkAutomatically: ON_LOAD` (mở app), `ON_ERROR_RETURN` (chỉ khi bundled fail), hoặc manual `Updates.checkForUpdateAsync()`.

```ts
// Update thủ công với rollback safety
import * as Updates from 'expo-updates';
async function checkOTA() {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    Updates.reloadAsync(); // restart với bundle mới
  }
}
```

---

## 4. Cấu hình multi-environment (dev/staging/prod) trong Expo như thế nào? 🔥

**Ngắn:** Dùng `app.config.ts` (dynamic config) + `EAS_BUILD_PROFILE` / custom env var để đổi `appName`, `bundleId`, `icon`, API URL cho từng môi trường.

| Profile | bundleId | appName | Icon | API |
|---|---|---|---|---|
| dev | `com.typingastro.dev` | "TypingAstro Dev" | icon-dev | api-dev |
| staging | `com.typingastro.staging` | "TypingAstro Stg" | icon-stg | api-stg |
| prod | `com.typingastro` | "TypingAstro" | icon | api-prod |

**Đào sâu:**
- `app.config.ts` đọc `process.env.EAS_BUILD_PROFILE` (hoặc `EXPO_PUBLIC_*`) để return object khác nhau:
  - Đổi `ios.bundleIdentifier`, `android.package` → cài song song 3 app trên 1 điện thoại.
  - Đổi `name` + `icon` để phân biệt thị giác.
  - Đổi `extra.apiUrl`, `sentryDsn`, `firebaseConfig` cho từng env.
- `EXPO_PUBLIC_*` (Expo SDK 49+) expose ra JS runtime via `process.env` — dùng cho biến public (API URL). **KHÔNG** dùng cho secret (API key private) → secret để server-side.
- Channel EAS Update: mỗi env có channel riêng (`production`, `staging`) để OTA không nhầm env.

**Gotcha:** Sai bundleId giữa env = không cài đè được app đã có, hoặc push notification / IAP nhận nhầm config. BundleId **phải khớp** với App Store Connect / Play Console record.

**Follow-up:** Làm sao test production build trên điện thoại? → Build profile `preview` với `distribution: internal` (AdHoc) — gần prod nhưng cài trực tiếp, không qua review.

```ts
// app.config.ts (TypingAstro)
export default ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE ?? 'dev';
  const envs = {
    dev:     { bundle: 'com.typingastro.dev',  name: 'TypingAstro Dev',  apiUrl: 'https://api-dev.x.com',  icon: './icon-dev.png' },
    staging: { bundle: 'com.typingastro.stg',  name: 'TypingAstro Stg',  apiUrl: 'https://api-stg.x.com',  icon: './icon-stg.png' },
    prod:    { bundle: 'com.typingastro',       name: 'TypingAstro',       apiUrl: 'https://api.x.com',       icon: './icon.png' },
  }[profile];
  return {
    ...config,
    name: envs.name,
    ios: { ...config.ios, bundleIdentifier: envs.bundle },
    android: { ...config.android, package: envs.bundle },
    icon: envs.icon,
    extra: { apiUrl: envs.apiUrl, eas: { projectId: '...' } },
  };
};
```

---

## 5. Khi nào cần Development Build (dev client) vs Expo Go?

**Ngắn:** Expo Go = app pre-built của Expo, chạy JS của bạn nhưng **chỉ** với SDK module. Dev Build = build app của bạn với native deps → chạy được `react-native-iap`, biometric, custom native.

| | Expo Go | Dev Build |
|---|---|---|
| Tốc độ start | Nhanh (qr scan) | Phải build lần đầu |
| Native module | Hạn chế (SDK only) | Full |
| Debug | OK | OK + native debug |
| Phù hợp | UI prototype thuần JS | App thật với native deps |

**Đào sâu:**
- TypingAstro dùng `react-native-iap`, biometric, Firebase — **bắt buộc** Dev Build, không chạy được Expo Go.
- `eas build --profile development` (with `developmentClient: true`) sinh ra `.app`/`.apk` có `expo-dev-client` → mở được Deep Link `exp+...://` như Expo Go nhưng có native của bạn.
- Local: `npx expo start --dev-client` thay vì `--go`.

**Gotcha:** Expo Go SDK 53 chỉ support RN 0.79. Nếu downgrade/upgrade mismatch → app crash. Còn Dev Build thì bundle tự ship RN version riêng.

**Follow-up:** Dev Build có OTA update được không? → Có, với `expo-updates` config đúng channel.

---

## 6. App versioning trong RN/Expo — `version` vs `buildNumber` vs runtimeVersion?

**Ngắn:** 3 khái niệm tách bạch:
- `version` (semantic, vd `1.2.3`) → version user-facing, store.
- `ios.buildNumber` / `android.versionCode` → integer tăng mỗi lần upload store.
- `runtimeVersion` (expo-updates) → "version của native layer", quyết định OTA compatible hay không.

**Đào sâu:**
- Mỗi lần submit store phải tăng `buildNumber` (iOS) và `versionCode` (Android) — bằng `autoIncrement: true` trong EAS.
- `runtimeVersion` policy:
  - `nativeVersion` (mặc định) = match RN/native → OTA chỉ chạy nếu cùng native version.
  - `fingerprint` = hash của native config → tự đổi khi native đổi.
  - `appVersion` = match app version (rất loose, ít dùng).
- Sai runtimeVersion = OTA download về nhưng không reload vì mismatch native.

**Gotcha:** Bump app version (1.0 → 1.1) nhưng native không đổi → nếu runtimeVersion policy = nativeVersion thì OTA vẫn chạy vì native y hệt. Nếu đổi native → bump runtimeVersion → user chưa update binary sẽ KHÔNG nhận OTA mới (đúng behavior, tránh crash).

**Follow-up:** Làm sao rollback OTA khi đã publish? → `eas update --revert` (channel) hoặc push commit cũ lên branch tương ứng.

---

## 7. Khi nào cần prebuild / native module? TurboModules / Codegen là gì?

**Ngắn:** Prebuild cần khi: thêm library có native code ngoài Expo SDK, hoặc config plugin không đủ. **TurboModules** = kiến trúc module mới (New Architecture) JS↔native gọi đồng bộ, type-safe qua **Codegen** (sinh C++/ObjC/Java từ TS spec).

**Đào sâu:**
- Native module cũ (Bridge) = async, JSON serialize, bottleneck.
- TurboModule (Fabric cho UI) = JSI (JavaScript Interface), gọi trực tiếp C++/native, sync, type-safe.
- Codegen: định nghĩa spec bằng Flow/TS → tool sinh native boilerplate → developer chỉ implement logic.
- RN 0.79 + New Architecture opt-in qua `app.json`: `"newArchEnabled": true`.

**Gotcha:** Bật New Architecture nhưng lib cũ chưa support → build fail hoặc runtime crash. Phải check từng dependency có "New Architecture compatible" không.

**Follow-up:** `react-native-iap` support New Arch chưa? → Kiểm tra changelog repo; đa số lib lớn đã migrate RN 0.74+.

---

## 8. Code signing (iOS & Android) cơ bản như thế nào?

**Ngắn:** Cả 2 đều cần crypto cert để verify app chưa bị modify và phát hành bởi developer đúng.

| | iOS | Android |
|---|---|---|
| Cert | Apple Distribution Certificate + Provisioning Profile | Keystore (.jks/.keystore) |
| Định danh | Bundle ID + Team ID | Package name + SHA-1 |
| Store | App Store Connect upload | Play Console upload (.aab signed) |
| Renew | Hết hạn sau 1 năm | Keystore tự giữ, không expire |

**Đào sâu:**
- iOS: Certificate (chứng thực dev) + Provisioning Profile (map cert ↔ device/bundle). EAS auto-manage credentials qua `eas credentials`.
- Android: Upload keystore (do bạn giữ) + Play App Signing (Google giữ signing key production, bạn chỉ ký upload).
- Mất keystore Android = không update được app (cùng package) → PHẢI backup.

**Gotcha:** iOS Distribution Certificate dùng chung cho nhiều app, nhưng Provisioning Profile riêng mỗi app. Sai profile = build thành công nhưng cài lên device fail "Untrusted Developer".

**Follow-up:** EAS lưu credentials ở đâu? → Cloud (Expo server) hoặc local `credentials.json`. Production nên dùng cloud + 2FA.

---

## 9. Build flavors / schemes (Android) và Schemes (iOS)?

**Ngắn:** Build nhiều biến thể từ cùng codebase: dev / staging / prod (hoặc free / paid). Android = `productFlavors` (Gradle), iOS = `xcconfig` + schemes (Xcode).

| | Android | iOS |
|---|---|---|
| Định nghĩa | `flavorDimensions` + `productFlavors` trong `android/app/build.gradle` | Schemes + configurations trong Xcode |
| ApplicationId | `applicationIdSuffix ".dev"` | bundleId khác per scheme |
| Resource | `src/dev/res` | xcconfig variable |

**Đào sâu:**
- Expo prebuild có thể sinh flavors tự động qua config plugin hoặc custom `build.gradle`.
- Đặt `applicationIdSuffix` để cài nhiều biến thể song song trên 1 máy.
- Firebase config: mỗi flavor một `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) trong folder tương ứng.

**Gotcha:** Quên đổi AdMob/AppsFlyer/Firebase config per flavor → analytics nhầm env, IAP test key lọt prod.

**Follow-up:** TypingAstro dùng 3 env × 2 platform = 6 Firebase project? → Có thể tách hẳn hoặc share project với multiple app. Tuần tự recommend tách prod khỏi dev/staging.

---

## 10. Giảm app size (APK/AAB/IPA) — các kỹ thuật?

**Ngắn:** Kỹ thuật chính: enable Hermes, R8/ProGuard (Android), strip unused arch (ABI splits), tree-shake asset, optimize image, dùng `.aab` (Play Store split tự).

| Kỹ thuật | Tiết kiệm | Platform |
|---|---|---|
| Hermes engine | 10–30% JS bundle | Cả hai |
| R8/Proguard | 10–20% native | Android |
| ABI splits / app bundle | 30–50% (1 arch thay vì 4) | Android |
| Optimize image (webp, svgo) | lớn nếu nhiều ảnh | Cả hai |
| Remove unused locales | 1–5MB | Cả hai |

**Đào sâu:**
- AAB (Android App Bundle) → Play Store tự ship chỉ ABI/density phù hợp cho từng device → user tải ít hơn 30–50% so với universal APK.
- iOS: App Thinning (Bitcode deprecated, vẫn có slicing theo arch/density).
- Hermes: precompile JS → bytecode, nhanh start + nhỏ hơn.
- Bỏ emoji font / unused font, lazy-load screen.

**Gotcha:** Đóng gói file lớn trong asset (video HD) = IPA/APK phình. Đẩy lên CDN / streaming khi có thể.

**Follow-up:** Đo size thực tế của TypingAstro? → `eas build` log có size; Android `Analyze APK` trong Android Studio; iOS `App Store Connect` hiển thị download size per device.

---

## 11. Hermes, R8/ProGuard, 16KB page size alignment là gì? 🔥

**Ngắn:**
- **Hermes** = JS engine tối ưu cho RN, precompile bytecode, ít memory, start nhanh.
- **R8/ProGuard** = code shrinking/obfuscation cho Android (rename, xóa code unused).
- **16KB page size alignment** (Android 15+) = ELF binary phải align 16KB để chạy trên device kernel 16KB; từ Android 15 nhiều device mới require.

**Đào sâu:**
- Hermes mặc định ON từ RN 0.70+; `app.json` `"jsEngine": "hermes"`.
- R8 shrink: `minifyEnabled true` + `proguard-rules.pro` keep rule cho reflection (class JNI, model Gson). Sai rule = runtime crash `ClassNotFoundException`.
- 16KB alignment: native `.so` phải compile với `-Wl,-z,max-page-size=16384`. Android Studio Ladybug+ auto-align. Check bằng `zipalign -P 16`.

**Gotcha:** Bật R8 mà không giữ rule cho `react-native-iap`, SDK reflection → crash khi gọi purchase. Phải có `-keep` rule hoặc `@Keep` annotation.

**Gotcha 16KB:** Android 15 device (Pixel 9+) chạy kernel 16KB → app với native `.so` cũ không align sẽ **không start**. Expo SDK 53+ đã align; lib cũ cần rebuild.

**Follow-up:** Làm sao verify app support 16KB? → Build, unzip APK, chạy `zipalign -c -p 16 ...` hoặc check `ANDROID_16K_PAGE_SIZE_SUPPORTED` flag.

```gradle
// android/app/build.gradle — R8 + Hermes
android {
  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
// app.json
{ "expo": { "jsEngine": "hermes" } }
```

---

## 12. CI/CD cho RN app — setup EAS trên GitHub Actions?

**Ngắn:** Dùng `eas-cli` + secret `EXPO_TOKEN` để build/submit từ CI. Trigger on tag → build prod → submit store.

**Đào sâu:**
- Workflow: push tag `v1.2.3` → Job build production → EAS Submit auto → Slack notify.
- Cache `node_modules`, `~/.expo` để nhanh.
- Pre-submit check: `eas-cli` không validate app metadata; dùng `fastlane` nếu cần metadata automation.
- Channel EAS Update: CI push OTA cho branch `main` (staging), tag (production).

**Gotcha:** `EXPO_TOKEN` leak = ai cũng build được app của bạn → set secret + rotate thường. EAS credentials cloud 2FA.

**Follow-up:** Parallel build iOS+Android? → `eas build --platform all` chạy song song 2 worker → nhanh hơn 2x.

```yaml
# .github/workflows/release.yml
on: { push: { tags: ['v*'] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install -g eas-cli
      - run: eas build --platform all --profile production --non-interactive
        env: { EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }} }
      - run: eas submit --platform all --non-interactive
        env: { EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }} }
```

---

🔗 [Quay lại README react-native](./index.md)
